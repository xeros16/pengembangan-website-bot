import { DesignerProfile, PortfolioItem, PortfolioSiteContent, DesignerSignupRequest } from './models.js';
import { startPublicPortfolioServer } from './server.js';
function query(value) { return {select(){return this},sort(){return this},skip(){return this},limit(){return this},lean:async()=>value,exec:async()=>value}; }
DesignerProfile.countDocuments=async()=>0;
DesignerProfile.find=()=>query([]);
DesignerProfile.aggregate=async()=>[];
PortfolioItem.find=()=>query([]);
PortfolioItem.countDocuments=async()=>0;
PortfolioSiteContent.findOne=()=>query(null);
DesignerSignupRequest.countDocuments=async()=>0;
process.env.PORTFOLIO_WEB_PORT='3105';
process.env.PORTFOLIO_WEB_HOST='127.0.0.1';
startPublicPortfolioServer();
