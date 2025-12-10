FROM node:20-alpine
WORKDIR /usr/src/app

# salin deps dari folder backend
COPY backend/package*.json ./
RUN npm ci

# salin seluruh kode backend (termasuk migrations chat)
COPY backend/. .

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
