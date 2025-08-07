# Gunakan image Node.js 20 sebagai base image.
# Alpine adalah versi yang lebih ringan dan efisien.
FROM node:20-alpine

# Set direktori kerja di dalam container.
# Semua perintah selanjutnya akan dieksekusi di dalam direktori ini.
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json ke direktori kerja.
# Langkah ini dilakukan lebih awal agar layer npm install bisa di-cache.
# Jika file-file ini tidak berubah, Docker tidak perlu menginstal ulang.
COPY package*.json ./

# Instal semua dependensi Node.js.
# Perintah --omit=dev akan mengabaikan dependensi yang hanya dibutuhkan untuk pengembangan.
RUN npm install --omit=dev

# Salin seluruh kode aplikasi Anda ke direktori kerja.
# Ini termasuk file-file server, konfigurasi, dsb.
COPY . .

# Beri tahu Docker bahwa container akan mendengarkan di port 3000.
# Anda bisa mengubah ini sesuai port yang digunakan aplikasi Anda.
EXPOSE 3000

# Perintah yang akan dijalankan saat container dimulai.
# Contoh ini menggunakan npm start, pastikan Anda memiliki skrip "start" di package.json.
CMD [ "npm", "start" ]
