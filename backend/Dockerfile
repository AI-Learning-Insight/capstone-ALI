# backend/Dockerfile
FROM node:20-alpine

# Direktori kerja di dalam container
WORKDIR /usr/src/app

# Copy dulu file package untuk caching layer npm install
COPY package*.json ./

# Install dependencies (termasuk devDependencies, karena kita butuh knex CLI)
RUN npm install

# Copy semua source code backend
COPY . .

# Expose port Hapi (diambil dari env PORT, default 8080)
EXPOSE 8080

# Command default (untuk development)
# Jalankan migrasi lalu start server (seeding opsional dijalankan manual jika perlu)
CMD ["sh", "-c", "npm run migrate:latest && npm run dev"]
