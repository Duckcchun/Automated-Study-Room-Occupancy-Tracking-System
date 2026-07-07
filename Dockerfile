FROM node:20-alpine AS web-base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS web-runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=web-base /app/package.json ./package.json
COPY --from=web-base /app/package-lock.json ./package-lock.json
COPY --from=web-base /app/.next ./.next
COPY --from=web-base /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
