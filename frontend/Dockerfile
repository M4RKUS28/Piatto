# ----- Build Stage -----
# Baut die Vite/React-Anwendung
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ----- Production Stage -----
# Verwendet ein schlankes Nginx-Image, um die gebauten Dateien auszuliefern
FROM nginx:1.29-alpine
# Cloud Run erwartet, dass der Container auf dem Port lauscht, der in der PORT-Umgebungsvariable angegeben ist.
# Nginx wird standardmäßig so konfiguriert, dass er auf 8080 lauscht.
COPY --from=builder /app/dist /usr/share/nginx/html
# Kopiere unsere benutzerdefinierte Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

