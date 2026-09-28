FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && mkdir /data && chown node:node /data
COPY server ./server
COPY src/lib/enquiry.ts ./src/lib/enquiry.ts
COPY src/lib/editorial-assets.ts ./src/lib/editorial-assets.ts
COPY src/data/editorial-assets.json ./src/data/editorial-assets.json
COPY src/lib/content.ts ./src/lib/content.ts
COPY src/data/home-content.json ./src/data/home-content.json
COPY src/data/editorial-content.json ./src/data/editorial-content.json
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
USER node
EXPOSE 3000
CMD ["node", "--experimental-strip-types", "server/index.mjs"]
