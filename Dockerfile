FROM node:24-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Use legacy peer deps to handle dependency conflicts and disable npm update notice
RUN npm ci --omit=dev --legacy-peer-deps --no-fund --quiet --no-audit

# Rebuild the source code only when needed
FROM node:24-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (like canvas) and TeXLive for document generation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    # TeXLive for document processing (installed once in builder stage)
    texlive-full \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Verify LaTeX installation works during build
RUN echo '\documentclass{article}\usepackage{xcolor}\usepackage{amsmath}\begin{document}\textcolor{blue}{LaTeX Works!} $E=mc^2$\end{document}' > /tmp/test.tex && \
    xelatex -output-directory=/tmp /tmp/test.tex && \
    pdflatex -output-directory=/tmp /tmp/test.tex && \
    lualatex -output-directory=/tmp /tmp/test.tex && \
    rm -rf /tmp/*

COPY package.json package-lock.json* ./
# Install all dependencies including dev dependencies for build
RUN npm ci --legacy-peer-deps --no-fund --quiet --no-audit
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BASE_URL=https://gppalanpur.ac.in

RUN npm run build

# Production image, copy all the files and run next
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies (Chromium for Puppeteer, pandoc for document conversion)
# TeXLive moved to builder stage to avoid duplicate 2.5GB installation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    pandoc \
    # Essential fonts for better typography  
    ttf-liberation \
    ttf-dejavu \
    font-noto \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy content directory for markdown files
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# Copy scripts directory for database seeding
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy TypeScript config for seeding scripts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Copy source directory for seeding script imports
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Copy ALL node_modules (including dev dependencies) for seeding scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create tmp directory for file conversions and set permissions
RUN mkdir -p /app/tmp && chown nextjs:nodejs /app/tmp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
