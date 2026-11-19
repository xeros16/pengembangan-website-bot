import mongoose from 'mongoose';

// Collection names intentionally match the WhatsApp bot models.
const profileSchema = new mongoose.Schema({
  designerId: String, ownerJid: String, contactJid: String, membershipGroupJid: String, displayName: String, slug: { type: String, trim: true, lowercase: true }, bio: String, specialties: [String],
  experience: String, location: String, avatarUrl: String, avatarPath: { type: String, default: '' }, priceMin: Number, priceMax: Number, instagram: String, publicWhatsApp: { type: String, default: '', maxlength: 15 },
  whatsappPushEnabled: { type: Boolean, default: false }, whatsappPushJid: { type: String, default: '' }, whatsappPushEnabledAt: { type: Date, default: null },
  whatsappPushQuietHoursEnabled: { type: Boolean, default: true }, whatsappPushQuietHoursStart: { type: String, default: '22:00' }, whatsappPushQuietHoursEnd: { type: String, default: '08:00' },
  behance: String, dribbble: String, website: String, language: String, softwareSkills: String,
  tagline: { type: String, maxlength: 140 }, practiceStatement: { type: String, maxlength: 600 },
  approach: { type: String, maxlength: 500 }, idealProjects: { type: String, maxlength: 400 },
  profileLayout: { type: String, enum: ['editorial','minimal','gallery'], default: 'editorial' },
  seoTitle: { type: String, maxlength: 100 }, seoDescription: { type: String, maxlength: 300 }, seoImage: { type: String, maxlength: 500 },
  isVerified: Boolean, isFeatured: Boolean, acceptsOrders: Boolean, availabilityPublic: { type: Boolean, default: false }, isPublic: Boolean, contactPhone: String,
}, { collection: 'designerprofiles', strict: false });
profileSchema.index({ isPublic: 1, isFeatured: -1, isVerified: -1, displayName: 1 });
profileSchema.index({ isPublic: 1, createdAt: -1, displayName: 1 });
profileSchema.index({ isPublic: 1, priceMin: 1, displayName: 1 });
profileSchema.index({ slug: 1 }, { unique: true, sparse: true });
const portfolioSchema = new mongoose.Schema({
  itemId: String, designerId: String, title: String, category: String, styles: [String], description: String,
  priceFrom: Number, featured: Boolean, imagePath: String, galleryPaths: [String], moderationStatus: String,
  projectClient: { type: String, maxlength: 100 }, projectIndustry: { type: String, maxlength: 80 },
  projectYear: { type: String, maxlength: 4 }, projectScope: { type: String, maxlength: 320 },
  resultHighlight: { type: String, maxlength: 320 }, seoTitle: { type: String, maxlength: 100 },
  seoDescription: { type: String, maxlength: 240 },
}, { collection: 'portfolioitems', strict: false });
portfolioSchema.index({ designerId: 1, moderationStatus: 1, featured: -1, createdAt: -1 });
portfolioSchema.index({ itemId: 1, moderationStatus: 1 }, { unique: true, sparse: true });
const serviceSchema = new mongoose.Schema({
  serviceId: String, designerId: String, title: String, category: String, description: String,
  packageName: String, price: Number, revisionCount: Number, deliveryDays: Number, isActive: Boolean,
}, { collection: 'designservices', strict: false });
serviceSchema.index({ designerId: 1, isActive: 1, price: 1 });
const analyticsSchema = new mongoose.Schema({
  designerId: { type: String, unique: true }, profileViews: { type: Number, default: 0 },
  portfolioViews: { type: Number, default: 0 }, contactClicks: { type: Number, default: 0 },
  serviceViews: { type: Number, default: 0 }, daily: [{ date: String, views: Number, contacts: Number, portfolioViews: Number }], lastViewedAt: Date,
}, { collection: 'designeranalytics', strict: false, timestamps: true });

export const DesignerProfile = mongoose.models.DesignerProfile || mongoose.model('DesignerProfile', profileSchema);
export const PortfolioItem = mongoose.models.PortfolioItem || mongoose.model('PortfolioItem', portfolioSchema);
export const DesignService = mongoose.models.DesignService || mongoose.model('DesignService', serviceSchema);
export const DesignerAnalytics = mongoose.models.DesignerAnalytics || mongoose.model('DesignerAnalytics', analyticsSchema);

const dashboardAuthSchema = new mongoose.Schema({
  designerId: { type: String, required: true, unique: true, index: true },
  email: { type: String, lowercase: true, trim: true, sparse: true, unique: true, index: true },
  passwordHash: String, setupTokenHash: String, setupTokenExpiresAt: Date,
  emailVerified: { type: Boolean, default: false }, emailVerifyTokenHash: String, emailVerifyExpiresAt: Date,
  passwordResetTokenHash: String, passwordResetExpiresAt: Date,
  otpHash: String, otpExpiresAt: Date, otpAttempts: { type: Number, default: 0 },
}, { collection: 'designerdashboardauth', strict: false, timestamps: true });
export const DesignerDashboardAuth = mongoose.models.DesignerDashboardAuth
  || mongoose.model('DesignerDashboardAuth', dashboardAuthSchema);


const dashboardSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  csrf: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { collection: 'designerdashboardsessions', timestamps: true });
export const DesignerDashboardSession = mongoose.models.DesignerDashboardSession
  || mongoose.model('DesignerDashboardSession', dashboardSessionSchema);

const portfolioCollectionSchema = new mongoose.Schema({
  collectionId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  itemIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: false },
}, { collection: 'portfoliocollections', timestamps: true });
portfolioCollectionSchema.index({ designerId: 1, isPublic: 1, createdAt: -1 });
export const PortfolioCollection = mongoose.models.PortfolioCollection
  || mongoose.model('PortfolioCollection', portfolioCollectionSchema);

const testimonialSchema = new mongoose.Schema({
  testimonialId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  clientName: { type: String, required: true, maxlength: 80 },
  project: { type: String, default: '', maxlength: 100 },
  message: { type: String, required: true, maxlength: 700 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  isPublished: { type: Boolean, default: false },
  verificationTokenHash: String, verificationExpiresAt: Date, emailVerified: { type: Boolean, default: false }, reviewerEmailHash: { type: String }, moderatedAt: Date, moderatedBy: String,
}, { collection: 'designertestimonials', timestamps: true });
testimonialSchema.index({ designerId: 1, isPublished: 1, createdAt: -1 });
testimonialSchema.index({ designerId: 1, reviewerEmailHash: 1 }, { unique: true, partialFilterExpression: { reviewerEmailHash: { $gt: '' } } });
export const DesignerTestimonial = mongoose.models.DesignerTestimonial
  || mongoose.model('DesignerTestimonial', testimonialSchema);


const leadSchema = new mongoose.Schema({
  leadId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true },
  clientName: { type: String, required: true, maxlength: 80 },
  email: { type: String, default: '', maxlength: 254 },
  whatsapp: { type: String, default: '', maxlength: 20 },
  brief: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['new','contacted','qualified','won','closed'], default: 'new', index: true },
  source: { type: String, default: 'portfolio' },
}, { collection: 'designerleads', timestamps: true });
leadSchema.index({ designerId: 1, createdAt: -1 });
export const DesignerLead = mongoose.models.DesignerLead || mongoose.model('DesignerLead', leadSchema);

const availabilitySchema = new mongoose.Schema({
  designerId: { type: String, required: true, index: true }, date: { type: String, required: true },
  status: { type: String, enum: ['available','busy','unavailable'], default: 'available' }, note: { type: String, maxlength: 160, default: '' },
}, { collection: 'designeravailability', timestamps: true });
availabilitySchema.index({ designerId: 1, date: 1 }, { unique: true });
export const DesignerAvailability = mongoose.models.DesignerAvailability || mongoose.model('DesignerAvailability', availabilitySchema);

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  designerId: { type: String, required: true, index: true }, type: { type: String, default: 'system' },
  title: { type: String, required: true, maxlength: 120 }, message: { type: String, default: '', maxlength: 500 }, readAt: Date,
  whatsappDeliveryStatus: { type: String, enum: ['pending', 'processing', 'sent', 'failed', 'skipped'], default: 'pending', index: true },
  whatsappAttempts: { type: Number, default: 0 },
  whatsappNextAttemptAt: { type: Date, default: Date.now },
  whatsappLeaseUntil: { type: Date, default: null },
  whatsappLeaseToken: { type: String, default: '' },
  whatsappDeliveredAt: { type: Date, default: null },
  whatsappLastError: { type: String, default: '', maxlength: 240 },
}, { collection: 'designernotifications', timestamps: true });
notificationSchema.index({ designerId: 1, createdAt: -1 });
notificationSchema.index({ whatsappDeliveryStatus: 1, whatsappNextAttemptAt: 1, createdAt: 1 });
export const DesignerNotification = mongoose.models.DesignerNotification || mongoose.model('DesignerNotification', notificationSchema);

const siteContentSchema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, value: { type: mongoose.Schema.Types.Mixed, default: {} }, updatedBy: String }, { collection: 'portfoliositecontent', timestamps: true });
export const PortfolioSiteContent = mongoose.models.PortfolioSiteContent || mongoose.model('PortfolioSiteContent', siteContentSchema);

// Privacy-conscious aggregate events for Owner growth reporting. Do not store IPs,
// emails, phone numbers, free-text searches, or full query strings in this collection.
const siteAnalyticsEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true, enum: ['page_view','project_view','campaign_click','category_click','search','contact_click','lead_submit'] },
  path: { type: String, default: '', maxlength: 160 },
  designerId: { type: String, default: '', maxlength: 48 },
  itemId: { type: String, default: '', maxlength: 48 },
  category: { type: String, default: '', maxlength: 60 },
  campaignId: { type: String, default: '', maxlength: 32 },
}, { collection: 'portfoliositeanalyticsevents', timestamps: true, strict: true });
siteAnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
siteAnalyticsEventSchema.index({ eventType: 1, campaignId: 1, createdAt: -1 });
siteAnalyticsEventSchema.index({ eventType: 1, category: 1, createdAt: -1 });
siteAnalyticsEventSchema.index({ eventType: 1, designerId: 1, createdAt: -1, itemId: 1 });
export const SiteAnalyticsEvent = mongoose.models.SiteAnalyticsEvent
  || mongoose.model('SiteAnalyticsEvent', siteAnalyticsEventSchema);


const designerSignupRequestSchema = new mongoose.Schema({
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
}, { collection: 'designersignuprequests', strict: false, timestamps: true });
designerSignupRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
export const DesignerSignupRequest = mongoose.models.DesignerSignupRequest
  || mongoose.model('DesignerSignupRequest', designerSignupRequestSchema);


const clientMoodboardSchema = new mongoose.Schema({
  boardId: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  designerIds: { type: [String], default: [] },
  itemIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true, index: true },
  editTokenHash: { type: String, required: true },
  viewCount: { type: Number, default: 0 },
}, { collection: 'clientmoodboards', timestamps: true });
clientMoodboardSchema.index({ isPublic: 1, createdAt: -1 });
export const ClientMoodboard = mongoose.models.ClientMoodboard
  || mongoose.model('ClientMoodboard', clientMoodboardSchema);


const clientProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true, index: true },
  leadId: { type: String, required: true, index: true },
  designerId: { type: String, required: true, index: true },
  clientName: { type: String, required: true, maxlength: 80 },
  email: { type: String, default: '', lowercase: true, trim: true, maxlength: 254 },
  whatsapp: { type: String, default: '', maxlength: 20 },
  title: { type: String, required: true, maxlength: 120 },
  brief: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['brief_received','discovery','in_progress','review','completed','cancelled'], default: 'brief_received', index: true },
  accessTokenHash: { type: String, default: '', index: true },
  accessTokenExpiresAt: Date,
  accessTokenUsedAt: Date,
  clientAccessRevokedAt: { type: Date, default: null },
  clientAccessRevokedBy: { type: String, default: '' },
  lastActivityAt: { type: Date, default: Date.now },
}, { collection: 'clientprojects', timestamps: true, strict: true });
clientProjectSchema.index({ designerId: 1, createdAt: -1 });
clientProjectSchema.index({ email: 1, createdAt: -1 });
export const ClientProject = mongoose.models.ClientProject || mongoose.model('ClientProject', clientProjectSchema);

const clientProjectSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, required: true, index: true },
  csrf: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { collection: 'clientprojectsessions', timestamps: true });
export const ClientProjectSession = mongoose.models.ClientProjectSession
  || mongoose.model('ClientProjectSession', clientProjectSessionSchema);

const projectUpdateSchema = new mongoose.Schema({
  updateId: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, required: true, index: true },
  authorRole: { type: String, enum: ['system','designer','client'], required: true },
  authorName: { type: String, required: true, maxlength: 80 },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, default: '', maxlength: 24 },
}, { collection: 'clientprojectupdates', timestamps: true });
projectUpdateSchema.index({ projectId: 1, createdAt: 1 });
export const ClientProjectUpdate = mongoose.models.ClientProjectUpdate
  || mongoose.model('ClientProjectUpdate', projectUpdateSchema);

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, maxlength: 254 },
  topic: { type: String, default: 'general', maxlength: 40 },
  subject: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 3000 },
  status: { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open', index: true },
  source: { type: String, default: 'website' },
}, { collection: 'portfoliosupporttickets', timestamps: true });
supportTicketSchema.index({ status: 1, createdAt: -1 });
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
