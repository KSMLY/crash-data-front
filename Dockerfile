FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist/crash-data-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
