const express = require('express');
const router = express.Router();
const { addProduct, removeProduct, getStockInfo, getProductNameByBarcode, getEntryTracking, getOutTracking, login } = require('../controllers/productController');

// Ürün ekleme
router.post('/urunEkle', addProduct);

// Ürün çıkarma
router.post('/urunCikar', removeProduct);

// Stok bilgisi alma
router.get('/StokBilgisi', getStockInfo);

router.post('/getProductNameByBarcode', getProductNameByBarcode);

router.get('/Giris', getEntryTracking);

router.get('/Cikis', getOutTracking);

router.post('/Login', login);

module.exports = router;