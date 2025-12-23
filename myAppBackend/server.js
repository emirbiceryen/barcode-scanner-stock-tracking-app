const express = require('express');
const cors = require('cors');
const sql = require("mssql");
const productRoutes = require('./routes/productRoutes'); // Route dosyasını içeri aktarıyoruz
const app = express();

// Middleware'ler
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));  // CORS ayarlarını ekliyoruz
app.use(express.json());  // JSON formatında gelen veriyi çözümlemek için

// API Routes
app.use('/api', productRoutes);  // /api prefix'i ile productRoutes'ı bağladık

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda çalışıyor`);

});