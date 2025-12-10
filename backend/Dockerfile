# backend/Dockerfile
FROM node:20-alpine

# Direktori kerja di dalam container
WORKDIR /usr/src/app

# Copy file package (build context sudah di-set ke ./backend)
COPY package*.json ./

# Install 
RUN npm Install

# Copy semua source code backend
COPY . .

# Mode default produksi; override di docker-compose bila perlu
ENV NODE_ENV=production

# Expose port Hapi (diambil dari env PORT, default 8080)
EXPOSE 8080

# Command default: jalankan server (migrasi dijalankan via postdeploy/job)
CMD ["npm", "start"]
