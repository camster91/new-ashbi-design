FROM node:22-alpine AS gateway
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && mkdir /data && chown node:node /data
COPY server ./server
COPY src/lib/enquiry.ts ./src/lib/enquiry.ts
COPY src/data/commerce-project-slugs.ts ./src/data/commerce-project-slugs.ts
COPY src/lib/editorial-assets.ts ./src/lib/editorial-assets.ts
COPY src/data/editorial-assets.json ./src/data/editorial-assets.json
COPY src/lib/content.ts ./src/lib/content.ts
COPY src/data/home-content.json ./src/data/home-content.json
COPY src/data/editorial-content.json ./src/data/editorial-content.json
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
USER node
EXPOSE 3000
CMD ["node", "--experimental-strip-types", "server/index.mjs"]

# Optional private layout-builder image. Do not enable on a shared gateway without review.
FROM gateway AS cms-preview
COPY src ./src
COPY public ./public
COPY ops ./ops
COPY astro.config.mjs tsconfig.json ./
ENV CONTENT_PREVIEW_SOURCE_ROOT=/app

# Preserve editor-only behavior for existing builds without an explicit target.
FROM gateway AS default
