FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
RUN npm install --workspaces --include-workspace-root
RUN npm run build -w packages/shared
RUN npm run build -w apps/backend

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
COPY --from=build /app/packages/shared/dist ./node_modules/@shared-todo/shared/dist
COPY --from=build /app/packages/shared/package.json ./node_modules/@shared-todo/shared/package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]
