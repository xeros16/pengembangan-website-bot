const BUDGET_PRESETS = Object.freeze({
  any: { min: 0, max: 0 },
  'under-500k': { min: 0, max: 500_000 },
  '500k-1.5m': { min: 500_000, max: 1_500_000 },
  '1.5m-5m': { min: 1_500_000, max: 5_000_000 },
  'above-5m': { min: 5_000_000, max: 0 },
});

function safeNumber(value, fallback = 0, maximum = 100_000_000) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(maximum, Math.floor(parsed)));
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('id-ID');
}

export function parseBudgetPreset(value) {
  const key = String(value || 'any').trim();
  const preset = BUDGET_PRESETS[key] || BUDGET_PRESETS.any;
  return { budget: BUDGET_PRESETS[key] ? key : 'any', min: preset.min, max: preset.max };
}

export function hasDesignerMatchCriteria(criteria = {}) {
  return Boolean(
    String(criteria.q || '').trim() || String(criteria.category || '').trim() ||
    String(criteria.skill || '').trim() || String(criteria.location || '').trim() ||
    safeNumber(criteria.min) || safeNumber(criteria.max),
  );
}

export function scoreDesignerFit(profile = {}, criteria = {}) {
  const reasons = [];
  let score = 0;
  const category = normalize(criteria.category);
  const profileCategory = normalize(profile.category);
  if (category && profileCategory) {
    if (profileCategory === category) { score += 40; reasons.push('Bidang utama cocok'); }
    else if (profileCategory.includes(category) || category.includes(profileCategory)) { score += 28; reasons.push('Bidang berkaitan'); }
  }

  const skill = normalize(criteria.skill);
  const specialties = (Array.isArray(profile.specialties) ? profile.specialties : [profile.specialties])
    .map(normalize).filter(Boolean);
  if (skill && specialties.some(value => value.includes(skill) || skill.includes(value))) {
    score += 35;
    reasons.push('Spesialisasi cocok');
  }

  const location = normalize(criteria.location);
  const profileLocation = normalize(profile.location);
  if (location && profileLocation && profileLocation.includes(location)) {
    score += 15;
    reasons.push('Lokasi sesuai');
  }

  const min = safeNumber(criteria.min);
  const max = safeNumber(criteria.max);
  if (min || max) {
    const priceMin = safeNumber(profile.priceMin);
    const rawPriceMax = safeNumber(profile.priceMax);
    const priceMax = rawPriceMax || priceMin;
    const hasAdvertisedPrice = priceMin > 0 || rawPriceMax > 0;
    const overlaps = hasAdvertisedPrice && (!max || priceMin <= max) && (!min || priceMax >= min);
    if (overlaps) { score += 10; reasons.push('Rentang anggaran cocok'); }
  }

  const q = normalize(criteria.q);
  if (q) {
    const haystack = [profile.displayName, profile.bio, profile.location, ...specialties].map(normalize).join(' ');
    if (haystack.includes(q)) { score += 15; reasons.push('Kata kunci relevan'); }
  }

  return { score, reasons };
}

export function buildDesignerFitPipeline(filter, criteria = {}, skip = 0, limit = 24, escapeRegex = value => value) {
  const category = String(criteria.category || '').trim().slice(0, 60);
  const skill = String(criteria.skill || '').trim().slice(0, 50);
  const location = String(criteria.location || '').trim().slice(0, 60);
  const q = String(criteria.q || '').trim().slice(0, 80);
  const min = safeNumber(criteria.min);
  const max = safeNumber(criteria.max);
  const categoryRegex = category ? escapeRegex(category) : null;
  const skillRegex = skill ? escapeRegex(skill) : null;
  const locationRegex = location ? escapeRegex(location) : null;
  const queryRegex = q ? escapeRegex(q) : null;

  const specialtiesText = {
    $reduce: {
      input: { $ifNull: ['$specialties', []] },
      initialValue: '',
      in: { $concat: ['$$value', ' ', { $ifNull: ['$$this', ''] }] },
    },
  };
  const regexMatch = (input, regex) => ({ $regexMatch: { input, regex, options: 'i' } });
  const categoryExact = category ? { $eq: [{ $toLower: { $ifNull: ['$category', ''] } }, category.toLowerCase()] } : false;
  const categoryPartial = category ? regexMatch({ $ifNull: ['$category', ''] }, categoryRegex) : false;
  const skillMatch = skill ? regexMatch(specialtiesText, skillRegex) : false;
  const locationMatch = location ? regexMatch({ $ifNull: ['$location', ''] }, locationRegex) : false;
  const queryHaystack = { $concat: [
    { $ifNull: ['$displayName', ''] }, ' ',
    { $ifNull: ['$bio', ''] }, ' ',
    { $ifNull: ['$location', ''] }, ' ',
    specialtiesText,
  ] };
  const queryMatch = queryRegex ? regexMatch(queryHaystack, queryRegex) : false;

  const priceMin = { $ifNull: ['$priceMin', 0] };
  const priceMax = { $cond: [
    { $gt: [{ $ifNull: ['$priceMax', 0] }, 0] },
    '$priceMax',
    { $ifNull: ['$priceMin', 0] },
  ] };
  const hasAdvertisedPrice = { $or: [{ $gt: [priceMin, 0] }, { $gt: [{ $ifNull: ['$priceMax', 0] }, 0] }] };
  const budgetOverlap = (min || max) ? { $and: [
    hasAdvertisedPrice,
    ...(max ? [{ $lte: [priceMin, max] }] : []),
    ...(min ? [{ $gte: [priceMax, min] }] : []),
  ] } : false;

  const scoreParts = [
    ...(category ? [{ $cond: [categoryExact, 40, { $cond: [categoryPartial, 28, 0] }] }] : []),
    ...(skill ? [{ $cond: [skillMatch, 35, 0] }] : []),
    ...(location ? [{ $cond: [locationMatch, 15, 0] }] : []),
    ...((min || max) ? [{ $cond: [budgetOverlap, 10, 0] }] : []),
    ...(q ? [{ $cond: [queryMatch, 15, 0] }] : []),
  ];
  const reasonParts = [
    ...(category ? [{ $cond: [categoryExact, 'Bidang utama cocok', { $cond: [categoryPartial, 'Bidang berkaitan', null] }] }] : []),
    ...(skill ? [{ $cond: [skillMatch, 'Spesialisasi cocok', null] }] : []),
    ...(location ? [{ $cond: [locationMatch, 'Lokasi sesuai', null] }] : []),
    ...((min || max) ? [{ $cond: [budgetOverlap, 'Rentang anggaran cocok', null] }] : []),
    ...(q ? [{ $cond: [queryMatch, 'Kata kunci relevan', null] }] : []),
  ];

  return [
    { $match: filter },
    { $addFields: {
      _designerFitScore: scoreParts.length ? { $add: scoreParts } : 0,
      _designerFitSignals: reasonParts,
    } },
    { $addFields: {
      _fitReasons: { $filter: { input: '$_designerFitSignals', as: 'reason', cond: { $ne: ['$$reason', null] } } },
    } },
    { $sort: { _designerFitScore: -1, createdAt: -1, displayName: 1, _id: 1 } },
    { $skip: Math.max(0, Math.floor(Number(skip) || 0)) },
    { $limit: Math.max(1, Math.min(100, Math.floor(Number(limit) || 24))) },
    { $project: { _designerFitScore: 0, _designerFitSignals: 0 } },
  ];
}
