import { hasDesignerMatchCriteria, parseBudgetPreset } from './matchmaking-utils.js';

export const DIRECTORY_PAGE_SIZE = 24;
export const DIRECTORY_SORTS = Object.freeze(['featured', 'relevance', 'fit', 'newest', 'name', 'price-low', 'price-high']);

function boundedInteger(value, fallback = 0, maximum = 100_000_000) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(maximum, Math.floor(parsed)));
}

export function parseDirectoryFilters(searchParams) {
  const q = String(searchParams.get('q') || '').trim().slice(0, 80);
  const rawSort = String(searchParams.get('sort') || '').trim();
  const rawBudget = String(searchParams.get('budget') || 'any').trim().slice(0, 32);
  const budgetPreset = parseBudgetPreset(rawBudget);
  const min = searchParams.has('min') ? boundedInteger(searchParams.get('min')) : budgetPreset.min;
  const max = searchParams.has('max') ? boundedInteger(searchParams.get('max')) : budgetPreset.max;
  const rawPage = Number.parseInt(String(searchParams.get('page') || '1'), 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.min(100_000, rawPage)) : 1;
  const criteria = {
    q,
    skill: String(searchParams.get('skill') || '').trim().slice(0, 50),
    category: String(searchParams.get('category') || '').trim().slice(0, 60),
    location: String(searchParams.get('location') || '').trim().slice(0, 60),
    min,
    max,
  };
  const hasMatchCriteria = hasDesignerMatchCriteria(criteria);
  const requestedSort = rawSort === 'fit' && !hasMatchCriteria ? 'featured' : rawSort;
  const sort = requestedSort === 'relevance' && !q ? 'featured' : (DIRECTORY_SORTS.includes(requestedSort) ? requestedSort : (q ? 'relevance' : 'featured'));
  return {
    ...criteria,
    budget: budgetPreset.budget,
    hasMatchCriteria,
    verifiedOnly: searchParams.get('verified') === '1',
    featuredOnly: searchParams.get('featured') === '1',
    acceptingOnly: searchParams.get('available') === '1',
    min,
    max,
    budgetInvalid: Boolean(min && max && min > max),
    sort,
    page,
  };
}

export function buildDirectoryMongoFilter(filters, escapeRegex = value => value) {
  const filter = { isPublic: true };
  if (filters.verifiedOnly) filter.isVerified = true;
  if (filters.featuredOnly) filter.isFeatured = true;
  if (filters.acceptingOnly) filter.acceptsOrders = true;
  if (filters.skill) filter.specialties = { $regex: escapeRegex(filters.skill), $options: 'i' };
  if (filters.category) filter.category = { $regex: escapeRegex(filters.category), $options: 'i' };
  if (filters.location) filter.location = { $regex: escapeRegex(filters.location), $options: 'i' };
  if (filters.q) {
    filter.$or = [
      { displayName: { $regex: escapeRegex(filters.q), $options: 'i' } },
      { bio: { $regex: escapeRegex(filters.q), $options: 'i' } },
      { specialties: { $regex: escapeRegex(filters.q), $options: 'i' } },
      { location: { $regex: escapeRegex(filters.q), $options: 'i' } },
    ];
  }
  if (filters.budgetInvalid) {
    filter._id = { $exists: false };
  } else if (filters.min || filters.max) {
    const overlap = [];
    // A designer's advertised range overlaps the requested budget when
    // designer.min <= requested.max AND designer.max >= requested.min.
    // Legacy profiles without priceMax are treated as a single-price point.
    if (filters.max) overlap.push({ $lte: [{ $ifNull: ['$priceMin', 0] }, filters.max] });
    if (filters.min) {
      const effectivePriceMax = {
        $cond: [
          { $gt: [{ $ifNull: ['$priceMax', 0] }, 0] },
          '$priceMax',
          { $ifNull: ['$priceMin', 0] },
        ],
      };
      overlap.push({ $gte: [effectivePriceMax, filters.min] });
    }
    filter.$expr = overlap.length === 1 ? overlap[0] : { $and: overlap };
  }
  return filter;
}

export function buildDirectorySort(sort) {
  const sortMap = {
    featured: { isFeatured: -1, isVerified: -1, displayName: 1 },
    newest: { createdAt: -1, displayName: 1 },
    name: { displayName: 1 },
    'price-low': { priceMin: 1, displayName: 1 },
    'price-high': { priceMin: -1, displayName: 1 },
  };
  return { ...(sortMap[sort] || sortMap.featured), _id: 1 };
}

export function buildDirectoryRelevancePipeline(filter, query, skip, limit, escapeRegex = value => value) {
  const q = String(query || '').trim().slice(0, 80);
  if (!q) return [{ $match: filter }, { $sort: buildDirectorySort('featured') }, { $skip: skip }, { $limit: limit }];
  const regex = escapeRegex(q);
  const specialtiesText = {
    $reduce: {
      input: { $ifNull: ['$specialties', []] },
      initialValue: '',
      in: { $concat: ['$$value', ' ', { $ifNull: ['$$this', ''] }] },
    },
  };
  const matchRegex = input => ({ $regexMatch: { input, regex, options: 'i' } });
  return [
    { $match: filter },
    { $addFields: { _directoryRelevance: { $add: [
      { $cond: [{ $eq: [{ $toLower: { $ifNull: ['$displayName', ''] } }, q.toLowerCase()] }, 100, 0] },
      { $cond: [matchRegex({ $ifNull: ['$displayName', ''] }), 45, 0] },
      { $cond: [matchRegex(specialtiesText), 30, 0] },
      { $cond: [matchRegex({ $ifNull: ['$bio', ''] }), 15, 0] },
      { $cond: [matchRegex({ $ifNull: ['$location', ''] }), 5, 0] },
    ] } } },
    { $sort: { _directoryRelevance: -1, isFeatured: -1, isVerified: -1, createdAt: -1, displayName: 1, _id: 1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _directoryRelevance: 0 } },
  ];
}

export function getDirectoryPagination(requestedPage, total, pageSize = DIRECTORY_PAGE_SIZE) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeSize = Math.max(1, Math.floor(Number(pageSize) || DIRECTORY_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const page = Math.max(1, Math.min(totalPages, Math.floor(Number(requestedPage) || 1)));
  const start = safeTotal ? ((page - 1) * safeSize) + 1 : 0;
  const end = Math.min(safeTotal, page * safeSize);
  const firstPage = Math.max(1, page - 2);
  const lastPage = Math.min(totalPages, page + 2);
  return {
    page,
    pageSize: safeSize,
    total: safeTotal,
    totalPages,
    skip: (page - 1) * safeSize,
    start,
    end,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    pages: Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index),
  };
}

export function buildDirectoryPageUrl(searchParams, page) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete('page');
  else params.set('page', String(page));
  const query = params.toString();
  return `/discover${query ? `?${query}` : ''}`;
}
