# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Accept build args from docker-compose and export as env vars for CRA
ARG REACT_APP_API_BASE
ARG REACT_APP_WS_URL
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY public ./public
COPY src ./src
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
