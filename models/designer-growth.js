import mongoose from 'mongoose';

const DesignerAnalyticsSchema = new mongoose.Schema({
  designerId: { type: String, required: true, unique: true, index: true },
  profileViews: { type: Number, default: 0, min: 0 },
  portfolioViews: { type: Number, default: 0, min: 0 },
  contactClicks: { type: Number, default: 0, min: 0 },
  serviceViews: { type: Number, default: 0, min: 0 },
  daily: [{
    date: { type: String, required: true },
    views: { type: Number, default: 0 },
    contacts: { type: Number, default: 0 },
    portfolioViews: { type: Number, default: 0 },
    serviceViews: { type: Number, default: 0 },
  }],
  lastViewedAt: { type: Date, default: null },
}, { timestamps: true, strict: false });

export const DesignerAnalytics = mongoose.models.DesignerAnalytics
  || mongoose.model('DesignerAnalytics', DesignerAnalyticsSchema);
