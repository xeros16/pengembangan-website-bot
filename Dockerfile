FROM node:22-bookworm-slim
WORKDIR /app/portfolio-website
COPY portfolio-website/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
WORKDIR /app
COPY --chown=node:node . .
RUN mkdir -p /app/uploads/portfolio && chown -R node:node /app/uploads
USER node
ENV NODE_ENV=production PORTFOLIO_WEB_HOST=0.0.0.0 PORTFOLIO_WEB_PORT=3080
EXPOSE 3080
CMD ["node", "portfolio-website/server.js"]
