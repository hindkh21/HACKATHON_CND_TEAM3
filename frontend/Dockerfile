# Frontend multi-stage build for Vite + React
FROM node:18-alpine AS build
WORKDIR /app

# Declare build arguments
ARG VITE_WS_URL
ARG VITE_API_URL
ARG VITE_OVH_LLM_API_KEY
ARG VITE_OVH_LLM_ENDPOINT
ARG VITE_OVH_LLM_MODEL

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# If no lockfile is present, `npm ci` fails. Use `npm install` which works without a lockfile.
RUN npm install --legacy-peer-deps --silent

# Copy sources and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
