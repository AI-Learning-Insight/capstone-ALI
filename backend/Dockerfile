FROM node:20-alpine

WORKDIR /usr/src/app

# Copy file package (build context sudah di-set ke ./backend)
COPY package*.json ./

# Install dependencies pakai lockfile
RUN npm ci

# Copy semua source code backend
COPY . .

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
