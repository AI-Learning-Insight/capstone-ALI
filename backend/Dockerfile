# backend/Dockerfile
FROM node:20-alpine

# Direktori kerja di dalam container
WORKDIR /usr/src/app

# Copy dulu file package untuk caching layer npm install
COPY package*.json ./

# Install dependencies (devDependencies tetap disertakan agar perintah migrasi/knex tersedia)
RUN npm ci

# Copy semua source code backend
COPY . .

# Mode default produksi; override di docker-compose bila perlu
ENV NODE_ENV=production

# Expose port Hapi (diambil dari env PORT, default 8080)
EXPOSE 8080

# Command default: jalankan server (migrasi dijalankan via postdeploy/job)
CMD ["npm", "start"]
