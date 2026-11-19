import mongoose from 'mongoose';
import { DEFAULT_GROUP_RULES } from '../config/default-group-rules.js';

const PartySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  groupJid: { type: String, required: true, index: true },
  leaderJid: { type: String, required: true },
  leaderName: { type: String, default: 'Petualang' },
  members: { type: [mongoose.Schema.Types.Mixed], default: [] },
  raid: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const GuildSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  groupJid: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  leaderJid: { type: String, required: true },
  members: { type: [mongoose.Schema.Types.Mixed], default: [] },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  fortressLevel: { type: Number, default: 1 },
  seasonPoints: { type: Number, default: 0 },
  seasonKey: { type: String, default: '' },
  warsWon: { type: Number, default: 0 },
  warsLost: { type: Number, default: 0 },
  missionClaims: { type: [mongoose.Schema.Types.Mixed], default: [] },
  memberContributions: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

const AssetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  category: { type: String, default: 'Lainnya', trim: true },
  addedBy: { type: String, default: '' },
  views: { type: Number, default: 0 },
}, { timestamps: true });
AssetSchema.index({ title: 'text', category: 'text' });

const UserSchema = new mongoose.Schema({
  jid: { type: String, unique: true, required: true },
  game: { type: mongoose.Schema.Types.Mixed, default: () => ({ started: false }) },
  activity: { messages: { type: Number, default: 0 }, xp: { type: Number, default: 0 }, level: { type: Number, default: 1 }, coins: { type: Number, default: 0 }, dailyMissions: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }, inventory: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }, dailyBonus: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }, transactions: { type: [mongoose.Schema.Types.Mixed], default: [] } },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const GroupSchema = new mongoose.Schema({
  jid: { type: String, unique: true, required: true },
  rules: { type: String, default: DEFAULT_GROUP_RULES },
  antiLink: { type: Boolean, default: true },
  antiSpam: { type: Boolean, default: true },
  antiToxic: { type: Boolean, default: false },
  blockedWords: { type: [String], default: [] },
  welcomeEnabled: { type: Boolean, default: true },
  welcomeMessage: { type: String, default: '' },
  goodbyeEnabled: { type: Boolean, default: false },
  goodbyeMessage: { type: String, default: '' },
}, { timestamps: true });

const FavoriteSchema = new mongoose.Schema({
  jid: { type: String, required: true, index: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
}, { timestamps: true });
FavoriteSchema.index({ jid: 1, assetId: 1 }, { unique: true });

const AssetAccessSchema = new mongoose.Schema({
  jid: { type: String, required: true, index: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  reporterJid: { type: String, required: true },
  reporterName: { type: String, default: 'Anggota', maxlength: 50 },
  targetJid: { type: String, default: '' },
  targetName: { type: String, default: '' },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, default: 'open', index: true },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  resolution: { type: String, default: '', maxlength: 240 },
}, { timestamps: true });
ReportSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
ReportSchema.index({ groupJid: 1, reporterJid: 1, createdAt: -1 });

const TicketSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  userJid: { type: String, required: true, index: true },
  userName: { type: String, default: 'Anggota', maxlength: 50 },
  subject: { type: String, required: true, maxlength: 180 },
  category: { type: String, default: 'general', maxlength: 40 },
  messages: [{ senderJid: String, text: { type: String, maxlength: 1200 }, createdAt: { type: Date, default: Date.now } }],
  status: { type: String, default: 'open', index: true },
  lastRepliedAt: { type: Date, default: null },
  closedBy: { type: String, default: '' },
  closedAt: { type: Date, default: null },
}, { timestamps: true });
TicketSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
TicketSchema.index({ userJid: 1, status: 1, createdAt: -1 });
TicketSchema.index({ userJid: 1, createdAt: -1 });

const ModerationLogSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  userJid: { type: String, default: '' },
  action: { type: String, required: true },
  reason: { type: String, default: '' },
  details: { type: String, default: '' },
}, { timestamps: true });

const WarningSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  targetJid: { type: String, required: true, index: true },
  adminJid: { type: String, required: true },
  reason: { type: String, default: 'Tidak dicantumkan' },
}, { timestamps: true });

// Private, short-lived WhatsApp design-brief drafts. TTL is also checked in application code.
const DesignBriefSessionSchema = new mongoose.Schema({
  chatJid: { type: String, required: true },
  userJid: { type: String, required: true },
  step: { type: Number, required: true, min: 0, max: 6, default: 0 },
  answers: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
DesignBriefSessionSchema.index({ chatJid: 1, userJid: 1 }, { unique: true });
DesignBriefSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CritiqueSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  submitterJid: { type: String, required: true },
  imageHash: { type: String, required: true },
  ratings: [{
    userJid: String,
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });


const AccessListSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  enabled: { type: Boolean, default: true },
  groups: { type: [String], default: [] },
  contacts: { type: [String], default: [] },
  groupProfiles: { type: mongoose.Schema.Types.Mixed, default: {} },
  contactProfiles: { type: mongoose.Schema.Types.Mixed, default: {} },
  revision: { type: Number, default: 0 },
}, { timestamps: true, collection: 'access_lists' });
const AccessList = mongoose.models.AccessList || mongoose.model('AccessList', AccessListSchema);

const Party = mongoose.models.Party || mongoose.model('Party', PartySchema);
const Guild = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);

const GuildWarSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  challengerGuildId: { type: mongoose.Schema.Types.ObjectId, required: true },
  challengerName: { type: String, required: true },
  defenderGuildId: { type: mongoose.Schema.Types.ObjectId, required: true },
  defenderName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'finished', 'claimed', 'expired'], default: 'pending', index: true },
  challengerScore: { type: Number, default: 0 },
  defenderScore: { type: Number, default: 0 },
  attacks: { type: [mongoose.Schema.Types.Mixed], default: [] },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
}, { timestamps: true });
GuildWarSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
const GuildWar = mongoose.models.GuildWar || mongoose.model('GuildWar', GuildWarSchema);

const MarketListingSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  sellerJid: { type: String, required: true, index: true },
  sellerName: { type: String, default: 'Petualang' },
  itemName: { type: String, required: true },
  price: { type: Number, required: true, min: 1, max: 1000000 },
  status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active', index: true },
  buyerJid: { type: String, default: '' },
}, { timestamps: true });
MarketListingSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
const MarketListing = mongoose.models.MarketListing || mongoose.model('MarketListing', MarketListingSchema);

const WorldBossSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Naga Astral' },
  emoji: { type: String, default: '🐉' },
  hp: { type: Number, default: 0 },
  maxHp: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'defeated', 'expired'], default: 'active', index: true },
  endsAt: { type: Date, default: null },
  contributions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  rewardClaims: { type: [String], default: [] },
  cycle: { type: Number, default: 0 },
}, { timestamps: true });
const WorldBoss = mongoose.models.WorldBoss || mongoose.model('WorldBoss', WorldBossSchema);

const TerritorySchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  territoryKey: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  ownerGuildId: { type: String, default: '' },
  ownerGuildName: { type: String, default: '' },
  claimedAt: { type: Date, default: null },
  cooldownUntil: { type: Date, default: null },
  totalConquests: { type: Number, default: 0 },
}, { timestamps: true });
TerritorySchema.index({ groupJid: 1, territoryKey: 1 }, { unique: true });
const Territory = mongoose.models.Territory || mongoose.model('Territory', TerritorySchema);

const CommunityProfileSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, index: true },
  userJid: { type: String, required: true, index: true },
  displayName: { type: String, default: 'Anggota', maxlength: 60 },
  visible: { type: Boolean, default: false, index: true },
  mentorOptIn: { type: Boolean, default: false },
  mentorTopics: { type: [String], default: [] },
  learnerOptIn: { type: Boolean, default: false },
  seekingTopics: { type: [String], default: [] },
  intro: { type: String, default: '', maxlength: 200 },
  consentAt: { type: Date, default: null },
}, { timestamps: true });
CommunityProfileSchema.index({ groupJid: 1, userJid: 1 }, { unique: true });
CommunityProfileSchema.index({ groupJid: 1, visible: 1, mentorOptIn: 1, mentorTopics: 1, updatedAt: -1 });
const CommunityProfile = mongoose.models.CommunityProfile
  || mongoose.model('CommunityProfile', CommunityProfileSchema);

const CommunityCollaboratorSchema = new mongoose.Schema({
  userJid: { type: String, required: true },
  userName: { type: String, default: 'Anggota', maxlength: 60 },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const CommunityCollaborationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  ownerJid: { type: String, required: true, index: true },
  ownerName: { type: String, default: 'Anggota', maxlength: 60 },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
  brief: { type: String, required: true, trim: true, minlength: 15, maxlength: 300 },
  skillsNeeded: { type: [String], default: [] },
  slots: { type: Number, required: true, min: 2, max: 5, default: 3 },
  collaborators: { type: [CommunityCollaboratorSchema], default: [] },
  status: { type: String, default: 'open', index: true },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: '' },
}, { timestamps: true });
CommunityCollaborationSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
CommunityCollaborationSchema.index({ groupJid: 1, ownerJid: 1, status: 1 });
const CommunityCollaboration = mongoose.models.CommunityCollaboration
  || mongoose.model('CommunityCollaboration', CommunityCollaborationSchema);

const LearningFeedbackSchema = new mongoose.Schema({
  reviewerJid: { type: String, required: true },
  reviewerName: { type: String, default: 'Anggota', maxlength: 60 },
  score: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true, maxlength: 400 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const LearningSubmissionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  challengeKey: { type: String, required: true, index: true },
  challengeMode: { type: String, enum: ['harian', 'mingguan', 'battle'], default: 'harian' },
  challengeDate: { type: String, required: true },
  challengeCategory: { type: String, default: 'all', index: true },
  challengeTitle: { type: String, required: true, maxlength: 160 },
  userJid: { type: String, required: true, index: true },
  userName: { type: String, default: 'Anggota', maxlength: 60 },
  title: { type: String, required: true, maxlength: 100 },
  workUrl: { type: String, default: '', maxlength: 500 },
  sourceMessageId: { type: String, default: '', maxlength: 160 },
  reflection: { type: String, default: '', maxlength: 400 },
  feedback: { type: [LearningFeedbackSchema], default: [] },
  status: { type: String, enum: ['active', 'hidden'], default: 'active', index: true },
  moderationNote: { type: String, default: '', maxlength: 240 },
  moderatedBy: { type: String, default: '' },
  moderatedAt: { type: Date, default: null },
}, { timestamps: true });
LearningSubmissionSchema.index({ groupJid: 1, challengeKey: 1, status: 1, updatedAt: -1 });
LearningSubmissionSchema.index({ groupJid: 1, challengeKey: 1, userJid: 1 }, { unique: true });
const LearningSubmission = mongoose.models.LearningSubmission
  || mongoose.model('LearningSubmission', LearningSubmissionSchema);

const DesignBattleSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: 'Admin grup', maxlength: 60 },
  title: { type: String, required: true, maxlength: 80 },
  brief: { type: String, required: true, maxlength: 500 },
  category: { type: String, required: true, enum: ['poster', 'branding', 'ui', 'social', 'packaging', 'illustration', 'typography', 'photography'] },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null, index: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  closedBy: { type: String, default: '' },
  closedAt: { type: Date, default: null },
}, { timestamps: true });
DesignBattleSchema.index({ groupJid: 1 }, { name: 'groupJid_1_open_unique', unique: true, partialFilterExpression: { status: 'open' } });
DesignBattleSchema.index({ groupJid: 1, status: 1, endsAt: 1 });
const DesignBattle = mongoose.models.DesignBattle
  || mongoose.model('DesignBattle', DesignBattleSchema);

const DesignSeasonRoundSchema = new mongoose.Schema({
  code: { type: String, required: true, maxlength: 12, uppercase: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  brief: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, required: true, enum: ['poster', 'branding', 'ui', 'social', 'packaging', 'illustration', 'typography', 'photography'] },
  durationHours: { type: Number, required: true, min: 1, max: 168 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'open', 'closed'], default: 'pending' },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: '' },
}, { _id: false });

const DesignSeasonSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: 'Admin grup', maxlength: 60 },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
  brief: { type: String, required: true, trim: true, minlength: 20, maxlength: 500 },
  category: { type: String, required: true, enum: ['poster', 'branding', 'ui', 'social', 'packaging', 'illustration', 'typography', 'photography'] },
  status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], default: 'draft', index: true },
  rounds: { type: [DesignSeasonRoundSchema], default: [] },
  activeRoundCode: { type: String, default: '' },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: '' },
}, { timestamps: true });
DesignSeasonSchema.index({ groupJid: 1 }, { name: 'groupJid_1_active_unique', unique: true, partialFilterExpression: { status: 'active' } });
DesignSeasonSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
const DesignSeason = mongoose.models.DesignSeason || mongoose.model('DesignSeason', DesignSeasonSchema);

const DesignSeasonFeedbackSchema = new mongoose.Schema({
  reviewerJid: { type: String, required: true },
  reviewerName: { type: String, default: 'Anggota', maxlength: 60 },
  score: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true, maxlength: 400 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });
const DesignSeasonSubmissionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  seasonCode: { type: String, required: true, index: true },
  roundCode: { type: String, required: true, index: true },
  roundTitle: { type: String, required: true, maxlength: 80 },
  userJid: { type: String, required: true, index: true },
  userName: { type: String, default: 'Anggota', maxlength: 60 },
  title: { type: String, required: true, maxlength: 100 },
  workUrl: { type: String, default: '', maxlength: 500 },
  sourceMessageId: { type: String, default: '', maxlength: 160 },
  reflection: { type: String, default: '', maxlength: 400 },
  feedback: { type: [DesignSeasonFeedbackSchema], default: [] },
  status: { type: String, enum: ['active', 'hidden'], default: 'active', index: true },
  moderationNote: { type: String, default: '', maxlength: 240 },
  moderatedBy: { type: String, default: '' },
  moderatedAt: { type: Date, default: null },
}, { timestamps: true });
DesignSeasonSubmissionSchema.index({ groupJid: 1, seasonCode: 1, roundCode: 1, userJid: 1 }, { name: 'groupJid_1_seasonCode_1_roundCode_1_userJid_1', unique: true });
DesignSeasonSubmissionSchema.index({ groupJid: 1, seasonCode: 1, roundCode: 1, status: 1, updatedAt: -1 }, { name: 'groupJid_1_seasonCode_1_roundCode_1_status_1_updatedAt_-1' });
const DesignSeasonSubmission = mongoose.models.DesignSeasonSubmission
  || mongoose.model('DesignSeasonSubmission', DesignSeasonSubmissionSchema);

const CreativeAssetSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  ownerJid: { type: String, required: true, index: true },
  ownerName: { type: String, default: 'Anggota', maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  sourceUrl: { type: String, required: true, maxlength: 500 },
  license: { type: String, required: true, maxlength: 80 },
  attribution: { type: String, default: '', maxlength: 240 },
  tags: { type: [String], default: [] },
  visibility: { type: String, enum: ['private', 'group'], default: 'private', index: true },
  status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active', index: true },
  moderationNote: { type: String, default: '', maxlength: 240 },
  moderatedBy: { type: String, default: '' },
  moderatedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });
CreativeAssetSchema.index({ groupJid: 1, code: 1 }, { name: 'groupJid_1_code_1', unique: true });
CreativeAssetSchema.index({ groupJid: 1, visibility: 1, status: 1, category: 1, updatedAt: -1 }, { name: 'groupJid_1_visibility_1_status_1_category_1_updatedAt_-1' });
CreativeAssetSchema.index({ groupJid: 1, ownerJid: 1, status: 1, updatedAt: -1 }, { name: 'groupJid_1_ownerJid_1_status_1_updatedAt_-1' });
const CreativeAsset = mongoose.models.CreativeAsset || mongoose.model('CreativeAsset', CreativeAssetSchema);

const LearningCohortFacilitatorSchema = new mongoose.Schema({
  userJid: { type: String, required: true },
  displayName: { type: String, default: 'Fasilitator', maxlength: 60 },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const LearningCohortMemberSchema = new mongoose.Schema({
  userJid: { type: String, required: true },
  displayName: { type: String, default: 'Anggota', maxlength: 60 },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const LearningCohortMilestoneSchema = new mongoose.Schema({
  code: { type: String, required: true, maxlength: 8 },
  title: { type: String, required: true, maxlength: 80 },
  description: { type: String, required: true, maxlength: 300 },
  dueAt: { type: Date, default: null },
  dueDay: { type: Number, required: true, min: 1, max: 84 },
  order: { type: Number, required: true, min: 1, max: 12 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { _id: false });

const LearningCohortSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
  description: { type: String, required: true, trim: true, minlength: 15, maxlength: 400 },
  weeks: { type: Number, required: true, min: 1, max: 12 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null, index: true },
  status: { type: String, enum: ['open', 'active', 'completed', 'cancelled'], default: 'open', index: true },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: 'Admin grup', maxlength: 60 },
  facilitators: { type: [LearningCohortFacilitatorSchema], default: [] },
  members: { type: [LearningCohortMemberSchema], default: [] },
  milestones: { type: [LearningCohortMilestoneSchema], default: [] },
  startedAt: { type: Date, default: null },
  startedBy: { type: String, default: '' },
  completedAt: { type: Date, default: null },
  closedBy: { type: String, default: '' },
}, { timestamps: true });
LearningCohortSchema.index({ groupJid: 1, status: 1, createdAt: -1 });
LearningCohortSchema.index({ groupJid: 1, code: 1 }, { unique: true });
const LearningCohort = mongoose.models.LearningCohort || mongoose.model('LearningCohort', LearningCohortSchema);

const LearningCohortCheckinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  groupJid: { type: String, required: true, index: true },
  cohortCode: { type: String, required: true, index: true },
  milestoneCode: { type: String, required: true, maxlength: 8 },
  userJid: { type: String, required: true, index: true },
  userName: { type: String, default: 'Anggota', maxlength: 60 },
  note: { type: String, required: true, maxlength: 300 },
  workUrl: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['submitted', 'approved', 'revision'], default: 'submitted', index: true },
  reviewerJid: { type: String, default: '' },
  reviewerNote: { type: String, default: '', maxlength: 300 },
  reviewedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
LearningCohortCheckinSchema.index({ groupJid: 1, cohortCode: 1, milestoneCode: 1, userJid: 1 }, { unique: true });
LearningCohortCheckinSchema.index({ groupJid: 1, cohortCode: 1, status: 1, updatedAt: -1 });
const LearningCohortCheckin = mongoose.models.LearningCohortCheckin
  || mongoose.model('LearningCohortCheckin', LearningCohortCheckinSchema);

const Critique = mongoose.models.Critique || mongoose.model('Critique', CritiqueSchema);

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);
const AssetAccess = mongoose.models.AssetAccess || mongoose.model('AssetAccess', AssetAccessSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
const Warning = mongoose.models.Warning || mongoose.model('Warning', WarningSchema);
const DesignBriefSession = mongoose.models.DesignBriefSession
  || mongoose.model('DesignBriefSession', DesignBriefSessionSchema);
const ModerationLog = mongoose.models.ModerationLog || mongoose.model('ModerationLog', ModerationLogSchema);

export {
  PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AccessListSchema,
  AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, DesignBriefSessionSchema, CritiqueSchema,
  GuildWarSchema, MarketListingSchema, WorldBossSchema, TerritorySchema, LearningSubmissionSchema,
  CommunityProfileSchema, CommunityCollaborationSchema, DesignBattleSchema,
  DesignSeasonSchema, DesignSeasonSubmissionSchema, CreativeAssetSchema,
  LearningCohortSchema, LearningCohortCheckinSchema,
  Party, Guild, GuildWar, MarketListing, WorldBoss, Territory, Asset, User, Group, AccessList,
  CommunityProfile, CommunityCollaboration, DesignBattle, DesignSeason, DesignSeasonSubmission, CreativeAsset, LearningCohort, LearningCohortCheckin,
  Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, Critique, LearningSubmission, DesignBriefSession,
};
