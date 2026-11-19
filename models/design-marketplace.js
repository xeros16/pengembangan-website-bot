import mongoose from 'mongoose';

const DesignerProfileSchema = new mongoose.Schema({
  designerId: { type: String, required: true, unique: true, index: true },
  ownerJid: { type: String, required: true, unique: true, index: true },
  contactJid: { type: String, default: '' }, // Internal account-link identity; never expose publicly.
  publicWhatsApp: { type: String, default: '', maxlength: 15, match: /^$|^\d{8,15}$/ },
  contactPhone: { type: String, default: '', maxlength: 15, match: /^$|^\d{8,15}$/ }, // Website alias; kept in sync with publicWhatsApp.
  slug: { type: String, trim: true, lowercase: true },
  avatarUrl: { type: String, default: '', maxlength: 500 },
  avatarPath: { type: String, default: '', maxlength: 500 },
  category: { type: String, default: '', maxlength: 80 },
  experience: { type: String, default: '', maxlength: 120 },
  location: { type: String, default: '', maxlength: 100 },
  behance: { type: String, default: '', maxlength: 200 },
  dribbble: { type: String, default: '', maxlength: 200 },
  website: { type: String, default: '', maxlength: 200 },
  language: { type: String, enum: ['id', 'en'], default: 'id', index: true },
  softwareSkills: { type: String, default: '', maxlength: 300 },
  isVerified: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  watermarkEnabled: { type: Boolean, default: false },

  membershipGroupJid: { type: String, required: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  bio: { type: String, default: '', maxlength: 600 },
  specialties: { type: [String], default: [] },
  priceMin: { type: Number, default: 0, min: 0, max: 100000000 }, // Legacy field retained; not displayed or used by the portfolio directory.
  priceMax: { type: Number, default: 0, min: 0, max: 100000000 }, // Legacy field retained; not displayed or used by the portfolio directory.
  instagram: { type: String, default: '', maxlength: 120 },
  acceptsOrders: { type: Boolean, default: false, index: true }, // Legacy website project-room availability flag; not a payment/order system.
  availabilityPublic: { type: Boolean, default: false }, // Optional public display of date/status only; calendar notes remain private.
  whatsappPushEnabled: { type: Boolean, default: false }, // Explicit opt-in; off by default.
  whatsappPushJid: { type: String, default: '' }, // Private destination captured only when the owner opts in.
  whatsappPushEnabledAt: { type: Date, default: null }, // Only notifications created after this timestamp are eligible for push.
  whatsappPushQuietHoursEnabled: { type: Boolean, default: true },
  whatsappPushQuietHoursStart: { type: String, default: '22:00' },
  whatsappPushQuietHoursEnd: { type: String, default: '08:00' },
  isPublic: { type: Boolean, default: true, index: true },
  tagline: { type: String, default: '', maxlength: 140 },
  practiceStatement: { type: String, default: '', maxlength: 600 },
  approach: { type: String, default: '', maxlength: 500 },
  idealProjects: { type: String, default: '', maxlength: 400 },
  profileLayout: { type: String, enum: ['editorial', 'minimal', 'gallery'], default: 'editorial' },
  seoTitle: { type: String, default: '', maxlength: 100 },
  seoDescription: { type: String, default: '', maxlength: 300 },
  seoImage: { type: String, default: '', maxlength: 500 },
}, { timestamps: true, strict: false });
DesignerProfileSchema.index({ isPublic: 1, isFeatured: -1 });
DesignerProfileSchema.index({ isPublic: 1, createdAt: -1, displayName: 1 });
DesignerProfileSchema.index({ isPublic: 1, priceMin: 1, displayName: 1 });

const PortfolioItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  ownerJid: { type: String, default: '', index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60, index: true },
  styles: { type: [String], default: [] },
  description: { type: String, default: '', maxlength: 800 },
  priceFrom: { type: Number, default: 0, min: 0, max: 100000000 }, // Legacy field retained for existing portfolio records; not shown in v5.91.
  featured: { type: Boolean, default: false, index: true },
  sourceType: { type: String, enum: ['personal', 'client', 'practice'], default: 'personal' },
  imagePath: { type: String, required: true },
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  moderationReason: { type: String, default: '', maxlength: 300 },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  galleryPaths: { type: [String], default: [] },
  projectRole: { type: String, default: '', maxlength: 120 },
  challenge: { type: String, default: '', maxlength: 1200 },
  solution: { type: String, default: '', maxlength: 1600 },
  outcome: { type: String, default: '', maxlength: 1200 },
  toolsUsed: { type: String, default: '', maxlength: 240 },
  projectDuration: { type: String, default: '', maxlength: 80 },
  projectClient: { type: String, default: '', maxlength: 100 },
  projectIndustry: { type: String, default: '', maxlength: 80 },
  projectYear: { type: String, default: '', maxlength: 4 },
  projectScope: { type: String, default: '', maxlength: 320 },
  resultHighlight: { type: String, default: '', maxlength: 320 },
  seoTitle: { type: String, default: '', maxlength: 100 },
  seoDescription: { type: String, default: '', maxlength: 240 },
}, { timestamps: true, strict: false });
PortfolioItemSchema.index({ moderationStatus: 1, category: 1, createdAt: -1 });
PortfolioItemSchema.index({ designerId: 1, moderationStatus: 1, featured: -1, createdAt: -1 });
PortfolioItemSchema.index({ ownerJid: 1, createdAt: -1 });

export const DesignerProfile = mongoose.models.DesignerProfile
  || mongoose.model('DesignerProfile', DesignerProfileSchema);
export const PortfolioItem = mongoose.models.PortfolioItem
  || mongoose.model('PortfolioItem', PortfolioItemSchema);



const DesignerNotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  type: { type: String, default: 'system', maxlength: 40 },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, default: '', maxlength: 500 },
  readAt: { type: Date, default: null },
  // New records enter the push outbox. Delivery is skipped unless the owner opted in.
  whatsappDeliveryStatus: { type: String, enum: ['pending', 'processing', 'sent', 'failed', 'skipped'], default: 'pending', index: true },
  whatsappAttempts: { type: Number, default: 0 },
  whatsappNextAttemptAt: { type: Date, default: Date.now },
  whatsappLeaseUntil: { type: Date, default: null },
  whatsappLeaseToken: { type: String, default: '' },
  whatsappDeliveredAt: { type: Date, default: null },
  whatsappLastError: { type: String, default: '', maxlength: 240 },
}, { collection: 'designernotifications', timestamps: true });
DesignerNotificationSchema.index({ designerId: 1, readAt: 1, createdAt: -1 });
DesignerNotificationSchema.index({ whatsappDeliveryStatus: 1, whatsappNextAttemptAt: 1, createdAt: 1 });
export const DesignerNotification = mongoose.models.DesignerNotification
  || mongoose.model('DesignerNotification', DesignerNotificationSchema);

const MarketplaceFavoriteSchema = new mongoose.Schema({
  userJid: { type: String, required: true, index: true },
  designerId: { type: String, required: true, index: true },
}, { timestamps: true });
MarketplaceFavoriteSchema.index({ userJid: 1, designerId: 1 }, { unique: true });

const MarketplaceReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  reporterJid: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['designer', 'portfolio'], required: true },
  targetId: { type: String, required: true, index: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
  resolutionNote: { type: String, default: '', maxlength: 500 },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });
MarketplaceReportSchema.index({ status: 1, createdAt: 1 });

export const MarketplaceFavorite = mongoose.models.MarketplaceFavorite
  || mongoose.model('MarketplaceFavorite', MarketplaceFavoriteSchema);
export const MarketplaceReport = mongoose.models.MarketplaceReport
  || mongoose.model('MarketplaceReport', MarketplaceReportSchema);


// LEGACY ARCHIVE ONLY (pre-v5.91): retained to preserve historical MongoDB records.
// Active bot commands do not create, read, or update requests, offers, reviews, services,
// payment ledgers, or disputes. The current bot marketplace is portfolio/contact discovery only.
const DesignRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true },
  ownerJid: { type: String, required: true, index: true },
  groupJid: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60, index: true },
  description: { type: String, required: true, maxlength: 1000 },
  budget: { type: Number, default: 0, min: 0, max: 100000000 },
  deadline: { type: String, default: '', maxlength: 80 },
  status: { type: String, enum: ['open', 'closed', 'awarded', 'in_progress', 'pending_review', 'delivered', 'revision', 'completed'], default: 'open', index: true },
  acceptedOfferId: { type: String, default: '' },
  deliveryNote: { type: String, default: '', maxlength: 1000 },
  deliveryProofPath: { type: String, default: '' },
  deliverySubmittedAt: { type: Date, default: null },
  deliveryReviewedBy: { type: String, default: '' },
  deliveryReviewedAt: { type: Date, default: null },
  deliveryReviewNote: { type: String, default: '', maxlength: 500 },
  deliveredAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });
DesignRequestSchema.index({ status: 1, category: 1, createdAt: -1 });
DesignRequestSchema.index({ ownerJid: 1, createdAt: -1 });

const DesignOfferSchema = new mongoose.Schema({
  offerId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, index: true },
  designerId: { type: String, required: true, index: true },
  designerJid: { type: String, required: true, index: true },
  message: { type: String, required: true, maxlength: 700 },
  status: { type: String, enum: ['sent', 'accepted', 'declined', 'withdrawn'], default: 'sent', index: true },
}, { timestamps: true });
DesignOfferSchema.index({ requestId: 1, designerId: 1 }, { unique: true });

export const DesignRequest = mongoose.models.DesignRequest
  || mongoose.model('DesignRequest', DesignRequestSchema);
export const DesignOffer = mongoose.models.DesignOffer
  || mongoose.model('DesignOffer', DesignOfferSchema);


const DesignReviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  designerJid: { type: String, required: true, index: true },
  clientJid: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });
DesignReviewSchema.index({ designerId: 1, createdAt: -1 });

export const DesignReview = mongoose.models.DesignReview
  || mongoose.model('DesignReview', DesignReviewSchema);


const DesignServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  ownerJid: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60, index: true },
  description: { type: String, required: true, maxlength: 700 },
  packageName: { type: String, enum: ['BASIC', 'PRO', 'EXCLUSIVE'], default: 'BASIC' },
  price: { type: Number, required: true, min: 0, max: 100000000 },
  revisionCount: { type: Number, default: 1, min: 0, max: 20 },
  deliveryDays: { type: Number, required: true, min: 1, max: 365 },
  isActive: { type: Boolean, default: true, index: true },
}, { collection: 'designservices', timestamps: true, strict: false });
DesignServiceSchema.index({ designerId: 1, isActive: 1, createdAt: -1 });
export const DesignService = mongoose.models.DesignService
  || mongoose.model('DesignService', DesignServiceSchema);


const MarketplaceActivitySchema = new mongoose.Schema({
  requestId: { type: String, required: true, index: true },
  actorJid: { type: String, required: true, index: true },
  action: { type: String, required: true, maxlength: 60 },
  fromStatus: { type: String, default: '' },
  toStatus: { type: String, default: '' },
  note: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });
MarketplaceActivitySchema.index({ requestId: 1, createdAt: -1 });
export const MarketplaceActivity = mongoose.models.MarketplaceActivity
  || mongoose.model('MarketplaceActivity', MarketplaceActivitySchema);

const MarketplaceDisputeSchema = new mongoose.Schema({
  disputeId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, index: true },
  openedBy: { type: String, required: true, index: true },
  clientJid: { type: String, required: true, index: true },
  designerJid: { type: String, required: true, index: true },
  reason: { type: String, required: true, maxlength: 700 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  resolution: { type: String, default: '', maxlength: 40 },
  resolutionNote: { type: String, default: '', maxlength: 700 },
  resolvedBy: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });
MarketplaceDisputeSchema.index({ requestId: 1, status: 1, createdAt: -1 });
export const MarketplaceDispute = mongoose.models.MarketplaceDispute
  || mongoose.model('MarketplaceDispute', MarketplaceDisputeSchema);



const MarketplacePaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, index: true },
  payerJid: { type: String, required: true, index: true },
  payeeJid: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 1, max: 100000000 },
  method: { type: String, required: true, maxlength: 60 },
  reference: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });
MarketplacePaymentSchema.index({ requestId: 1, createdAt: -1 });
MarketplacePaymentSchema.index({ payerJid: 1, status: 1, createdAt: -1 });
export const MarketplacePayment = mongoose.models.MarketplacePayment
  || mongoose.model('MarketplacePayment', MarketplacePaymentSchema);


// Shared website/WhatsApp Designer Studio credentials and website-first signup handoff.
const DesignerDashboardAuthSchema = new mongoose.Schema({
  designerId: { type: String, required: true, unique: true, index: true },
  email: { type: String, lowercase: true, trim: true, sparse: true, unique: true, index: true },
  passwordHash: String, setupTokenHash: String, setupTokenExpiresAt: Date,
  emailVerified: { type: Boolean, default: false }, emailVerifyTokenHash: String, emailVerifyExpiresAt: Date,
  passwordResetTokenHash: String, passwordResetExpiresAt: Date,
  otpHash: String, otpExpiresAt: Date, otpAttempts: { type: Number, default: 0 },
}, { collection: 'designerdashboardauth', strict: false, timestamps: true });
export const DesignerDashboardAuth = mongoose.models.DesignerDashboardAuth
  || mongoose.model('DesignerDashboardAuth', DesignerDashboardAuthSchema);

const DesignerSignupRequestSchema = new mongoose.Schema({
  signupId: { type: String, required: true, unique: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  phoneE164: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true, maxlength: 80 },
  bio: { type: String, default: '', maxlength: 600 },
  specialties: { type: [String], default: [] },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  linkedDesignerId: { type: String, default: '' },
}, { collection: 'designersignuprequests', timestamps: true });
DesignerSignupRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
export const DesignerSignupRequest = mongoose.models.DesignerSignupRequest
  || mongoose.model('DesignerSignupRequest', DesignerSignupRequestSchema);
