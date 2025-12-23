const sql = require("mssql");
const config = require('../config/dbconfig');
const jwt = require('jsonwebtoken');

// Ürün ekleme fonksiyonu
exports.addProduct = async (req, res) => {
    const { barcode, productName, quantity, batchNo } = req.body;
    const token = req.headers['authorization']?.split(' ')[1];

    console.log("Token: ", token); // Token'i kontrol etmek için loglama

    // Token kontrolü
    if (!token) {
        return res.status(401).json({ message: 'Kullanıcı girişi gerekli. Token eksik.' });
    }

    try {
        // Token doğrulama
        const decoded = jwt.verify(token, 'yourSecretKey'); // Secret key ile doğrulama
        const username = decoded?.username;  // Token'dan kullanıcı adını alıyoruz

        if (!username) {
            return res.status(401).json({ message: 'Kullanıcı adı doğrulanamadı. Lütfen yeniden giriş yapın.' });
        }

        // Veritabanı bağlantısı
        const pool = await sql.connect(config);

        // Zorunlu alanlar kontrolü
        if (!barcode || !productName || !quantity || !batchNo) {
            return res.status(400).json({ message: 'Barkod, ürün adı, miktar ve batch numarası zorunludur.' });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        // Ürün daha önce var mı kontrol et
        const result = await pool.request()
            .input('barcode', sql.BigInt, barcode)
            .input('productName', sql.NVarChar, productName)
            .input('batchNo', sql.NVarChar, batchNo)
            .query('SELECT quantity FROM urunEkle WHERE barcode = @barcode AND productName = @productName AND batch_no = @batchNo');

        if (result.recordset.length > 0) {
            // Ürün var, miktarı güncelle
            const currentQuantity = result.recordset[0].quantity;
            const newQuantity = currentQuantity + parseFloat(quantity);

            await pool.request()
                .input('barcode', sql.BigInt, barcode)
                .input('productName', sql.NVarChar, productName)
                .input('batchNo', sql.NVarChar, batchNo)
                .input('newQuantity', sql.Float, newQuantity)
                .query('UPDATE urunEkle SET quantity = @newQuantity WHERE barcode = @barcode AND productName = @productName AND batch_no = @batchNo');

            await pool.request()
                .input('tarih', sql.Date, currentDate)
                .input('barcode', sql.BigInt, barcode)
                .input('productName', sql.NVarChar, productName)
                .input('batchNo', sql.NVarChar, batchNo)
                .input('quantity', sql.Float, parseFloat(quantity))
                .input('username', sql.NVarChar, username)
                .query(`
                    INSERT INTO girisler_takip (tarih, barcode, productName, quantity, batch_no, kullanici) 
                    VALUES (@tarih, @barcode, @productName, @quantity, @batchNo, @username)
                `);

            return res.status(200).json({ message: 'Ürün miktarı başarıyla güncellendi ve girişler_takip tablosuna kaydedildi.' });
        } else {
            // Ürün yok, yeni ürün ekle
            await pool.request()
                .input('barcode', sql.BigInt, barcode)
                .input('productName', sql.NVarChar, productName)
                .input('batchNo', sql.NVarChar, batchNo)
                .input('quantity', sql.Float, parseFloat(quantity))
                .query('INSERT INTO urunEkle (barcode, productName, quantity, batch_no) VALUES (@barcode, @productName, @quantity, @batchNo)');

            await pool.request()
                .input('tarih', sql.Date, currentDate)
                .input('barcode', sql.BigInt, barcode)
                .input('productName', sql.NVarChar, productName)
                .input('batchNo', sql.NVarChar, batchNo)
                .input('quantity', sql.Float, parseFloat(quantity))
                .input('username', sql.NVarChar, username)
                .query(`
                    INSERT INTO girisler_takip (tarih, barcode, productName, quantity, batch_no, kullanici) 
                    VALUES (@tarih, @barcode, @productName, @quantity, @batchNo, @username)
                `);

            return res.status(201).json({ message: 'Ürün başarıyla eklendi ve girişler_takip tablosuna kaydedildi.' });
        }
    } catch (error) {
        console.error("HATA: ", error);
        res.status(500).json({ message: 'Ürün eklenirken bir hata oluştu.', error: error.message });
    }
};


exports.getProductNameByBarcode = async (req, res) => {
    const { barcode } = req.body;

    try {
        const pool = await sql.connect(config);

        // Parametre kontrolü
        if (!barcode) {
            return res.status(400).json({ message: 'Barkod zorunludur.' });
        }

        // Barkod ile ürünü bul
        const result = await pool.request()
            .input('barcode', sql.BigInt, barcode)
            .query('SELECT productName FROM urunEkle WHERE barcode = @barcode');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Barkod ile eşleşen ürün bulunamadı.' });
        }

        // Ürün adını döndür
        const productName = result.recordset[0].productName;
        return res.status(200).json({ productName });
    } catch (error) {
        console.error("HATA: ", error);
        res.status(500).json({ message: 'Ürün adı alınırken bir hata oluştu.', error: error.message });
    }
};



// Ürün çıkarma (stok düşürme) fonksiyonu
exports.removeProduct = async (req, res) => {
    const { barcode, quantity, batchNo } = req.body;
    const token = req.headers['authorization']?.split(' ')[1];

    // Token kontrolü için daha güvenli bir yaklaşım
    if (!token) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Kullanıcı girişi gerekli. Token eksik.' 
        });
    }

    try {
        // Token doğrulama için daha güvenli bir kontrol
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
        const username = decoded?.username;

        if (!username) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Kullanıcı adı doğrulanamadı.' 
            });
        }

        // Parametrelerin validate edilmesi
        if (!barcode || !quantity || !batchNo) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Barkod, miktar ve batch no zorunludur.' 
            });
        }

        const pool = await sql.connect(config);
        const currentDate = new Date().toISOString().split('T')[0];

        // Veritabanı işlemleri için tek bir transaction içinde yapılması
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Barkod ile ürünü bul ve mevcut miktarı al
            const result = await transaction.request()
                .input('barcode', sql.BigInt, barcode)
                .query('SELECT quantity, productName FROM urunEkle WHERE barcode = @barcode');

            if (result.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ 
                    status: 'error',
                    message: 'Barkod ile eşleşen ürün bulunamadı.' 
                });
            }

            const currentQuantity = result.recordset[0].quantity;
            const productName = result.recordset[0].productName;

            // Mevcut miktardan çıkarılacak miktarın fazla olup olmadığını kontrol et
            if (currentQuantity < parseFloat(quantity)) {
                await transaction.rollback();
                return res.status(400).json({ 
                    status: 'error',
                    message: 'Yeterli stok yok.' 
                });
            }

            // Stoktan düşürme işlemi
            const newQuantity = currentQuantity - parseFloat(quantity);

            await transaction.request()
                .input('barcode', sql.BigInt, barcode)
                .input('newQuantity', sql.Float, newQuantity)
                .query('UPDATE urunEkle SET quantity = @newQuantity WHERE barcode = @barcode');

            // Çıkışlar tablosuna kaydet
            await transaction.request()
                .input('tarih', sql.Date, currentDate)
                .input('barcode', sql.BigInt, barcode)
                .input('productName', sql.NVarChar, productName)
                .input('quantity', sql.Float, parseFloat(quantity))
                .input('batch_no', sql.NVarChar, batchNo)
                .input('kullanici', sql.NVarChar, username)
                .query(`
                    INSERT INTO cikislar_takip (tarih, barcode, productName, quantity, batch_no, kullanici) 
                    VALUES (@tarih, @barcode, @productName, @quantity, @batch_no, @kullanici)
                `);

            // Transaction'ı commit et
            await transaction.commit();

            res.status(200).json({ 
                status: 'success',
                message: 'Ürün başarıyla çıkarıldı ve cikislar_takip tablosuna kaydedildi.',
                data: {
                    barcode,
                    quantity: parseFloat(quantity),
                    remainingQuantity: newQuantity
                }
            });

        } catch (transactionError) {
            // Transaction sırasında bir hata olursa rollback yap
            await transaction.rollback();
            throw transactionError;
        }

    } catch (error) {
        console.error("HATA: ", error);
        
        // Hata türüne göre daha detaylı hata mesajları
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Geçersiz token.' 
            });
        }

        res.status(500).json({ 
            status: 'error',
            message: 'Ürün çıkarma işlemi sırasında bir hata oluştu.', 
            error: error.message 
        });
    }
};




// Stok bilgisi alma fonksiyonu
exports.getStockInfo = async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // Sadece ilgili kolonları alıyoruz
        const result = await pool.request().query('SELECT barcode, productName, quantity, batch_no FROM urunEkle');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Veritabanında stok bilgisi bulunamadı.' });
        }

        // Tüm kayıtları döndürüyoruz
        res.status(200).json({
            message: 'Stok bilgileri başarıyla alındı.',
            data: result.recordset
        });
    } catch (error) {
        console.error("Hata: ", error);
        res.status(500).json({ message: 'Stok bilgisi alınamadı.', error: error.message });
    }
};

exports.getEntryTracking = async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // 'girisler_takip' tablosundaki tüm kayıtları getir
        const result = await pool.request().query('SELECT tarih, barcode, productName, quantity, batch_no, kullanici FROM girisler_takip');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Giriş takip verisi bulunamadı.' });
        }

        // Tüm giriş takip kayıtlarını döndür
        res.status(200).json({
            message: 'Giriş takip bilgileri başarıyla alındı.',
            data: result.recordset
        });
    } catch (error) {
        console.error("Hata: ", error);
        res.status(500).json({ message: 'Giriş takip bilgisi alınamadı.', error: error.message });
    }
};

exports.getOutTracking = async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // 'cikislar_takip' tablosundaki tüm kayıtları getir
        const result = await pool.request()
            .query('SELECT tarih, barcode, productName, quantity, batch_no, kullanici FROM cikislar_takip'); // batch_no da dahil edildi

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Çıkış takip verisi bulunamadı.' });
        }

        // Tüm çıkış takip kayıtlarını döndür
        res.status(200).json({
            message: 'Çıkış takip bilgileri başarıyla alındı.',
            data: result.recordset
        });
    } catch (error) {
        console.error("Hata: ", error);
        res.status(500).json({ message: 'Çıkış takip bilgisi alınamadı.', error: error.message });
    }
};
exports.login = async (req, res) => {
    const { user_name, password } = req.body; // Kullanıcı adı ve şifreyi al

    try {
        // Veritabanına bağlan
        const pool = await sql.connect(config);

        // Gerekli alanlar boşsa hata döndür
        if (!user_name || !password) {
            return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre zorunludur.' });
        }

        // Kullanıcıyı sorgula
        const result = await pool
            .request()
            .input('user_name', sql.NVarChar, user_name)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM users WHERE user_name = @user_name AND password = @password');

        if (result.recordset.length > 0) {
            // Kullanıcı bulundu, JWT token oluştur
            const token = jwt.sign(
                { username: user_name }, // Payload
                'yourSecretKey',        // Gizli anahtar
                { expiresIn: '1h' }     // Token geçerlilik süresi (1 saat)
            );

            // Token ve kullanıcı bilgileriyle cevap döndür
            return res.status(200).json({
                success: true,
                message: 'Giriş başarılı.',
                token: token,
                user: {
                    user_name: result.recordset[0].user_name, // Kullanıcı adı
                },
            });
        } else {
            // Kullanıcı bulunamadı
            return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' });
        }
    } catch (error) {
        console.error('Login Hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};