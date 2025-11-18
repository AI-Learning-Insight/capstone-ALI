# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Copy seluruh source frontend
COPY . .

# Vite default pakai port 5173
EXPOSE 5173

# Jalankan Vite dev server, perlu --host 0.0.0.0 supaya bisa diakses dari host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
