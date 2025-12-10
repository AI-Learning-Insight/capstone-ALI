FROM node:20-alpine

WORKDIR /usr/src/app

# Pastikan kedua file ini ada di /backend lalu di-copy
COPY package.json package-lock.json ./

# Install dependencies pakai lockfile
RUN npm ci

# Copy semua source code backend
COPY . .

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
