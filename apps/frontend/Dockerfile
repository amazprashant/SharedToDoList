FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_API_BASE_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
RUN npm install --workspaces --include-workspace-root
RUN npm run build -w packages/shared
RUN npm run build -w apps/frontend

FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
