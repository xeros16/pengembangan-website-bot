import mongoose from 'mongoose';

// Read-only bridge models. Website remains the system of record for these collections.
const portfolioCollectionSchema = new mongoose.Schema({
  collectionId: String, designerId: { type: String, index: true }, isPublic: Boolean,
}, { collection: 'portfoliocollections', strict: false });

const designerTestimonialSchema = new mongoose.Schema({
  testimonialId: String, designerId: { type: String, index: true },
  isPublished: Boolean, emailVerified: Boolean,
}, { collection: 'designertestimonials', strict: false });

const designerLeadSchema = new mongoose.Schema({
  leadId: String, designerId: { type: String, index: true }, status: String,
}, { collection: 'designerleads', strict: false });

const designerAvailabilitySchema = new mongoose.Schema({
  designerId: { type: String, index: true }, date: String, status: String,
}, { collection: 'designeravailability', strict: false });

const clientProjectSchema = new mongoose.Schema({
  projectId: String, leadId: String, designerId: { type: String, index: true },
  status: String, lastActivityAt: Date,
}, { collection: 'clientprojects', strict: false });

export const PortfolioCollection = mongoose.models.PortfolioCollection
  || mongoose.model('PortfolioCollection', portfolioCollectionSchema);
export const DesignerTestimonial = mongoose.models.DesignerTestimonial
  || mongoose.model('DesignerTestimonial', designerTestimonialSchema);
export const DesignerLead = mongoose.models.DesignerLead
  || mongoose.model('DesignerLead', designerLeadSchema);
export const DesignerAvailability = mongoose.models.DesignerAvailability
  || mongoose.model('DesignerAvailability', designerAvailabilitySchema);
export const ClientProject = mongoose.models.ClientProject
  || mongoose.model('ClientProject', clientProjectSchema);
