import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
import Giris from './Giris'; // Giris.tsx dosyasını import ediyoruz
import Cikis from './Cikis'; // Cikis.tsx dosyasını import ediyoruz

interface Record {
  barcode: string;
  productName: string;
  quantity: number;
  batch_no: string;
}

const StokBilgisi = ({ onBack }: { onBack: () => void }) => {
  const [data, setData] = useState<Record[]>([]); // Veritabanından alınan veriler
  const [currentScreen, setCurrentScreen] = useState<'stokBilgisi' | 'giris' | 'cikis'>('stokBilgisi'); // Ekran geçişi için state

  // API'den stok bilgilerini çekme
  const fetchTableData = async () => {
    try {
      const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/StokBilgisi'); // API URL
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData.data); // Veriyi al
      } else {
        Alert.alert('Hata', 'Stok bilgisi alınamadı.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    }
  };

  useEffect(() => {
    fetchTableData(); // Sayfa yüklendiğinde veriyi çek
  }, []);

  // Tablodaki verileri gösterme
  const renderItem = ({ item }: { item: Record }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.barcode}</Text>
      <Text style={styles.tableCell}>{item.productName}</Text>
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{item.batch_no}</Text>
    </View>
  );

  // Ekran değiştirme
  const goToGiris = () => setCurrentScreen('giris');
  const goToCikis = () => setCurrentScreen('cikis');
  const goToStokBilgisi = () => setCurrentScreen('stokBilgisi');

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <Button title="Geri" onPress={onBack} color="#FF0000" />

      {currentScreen === 'stokBilgisi' ? (
        <>
          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            <Button
              title="Giriş Takip"
              onPress={goToGiris} // Giriş Takip butonuna basıldığında Giris ekranına geçiş yapar
              color="#4CAF50"
            />
            <Button
              title="Çıkış Takip"
              onPress={goToCikis} // Çıkış Takip butonuna basıldığında Cikis ekranına geçiş yapar
              color="#2196F3"
            />
          </View>

          {/* Tablo Başlıkları */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell]}>Barcode</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Product Name</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Quantity</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Batch No</Text>
          </View>

          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.barcode} // Unique key olarak barcode kullanıyoruz
            ListEmptyComponent={<Text>Tablo boş veya veri yok.</Text>}
          />
        </>
      ) : currentScreen === 'giris' ? (
        <Giris onBack={goToStokBilgisi} />
      ) : (
        <Cikis onBack={goToStokBilgisi} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 5, // Hücreler arasında boşluk
    textAlign: 'center', // Veriyi ortalama
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: '#f2f2f2', // Başlıkları ayırmak için arka plan rengi
    paddingVertical: 10, // Başlık hücresinin dikeyde daha fazla boşluk alması için
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2', // Başlık için arka plan rengi
    marginBottom: 5, // Başlık ile veri arasına boşluk ekler
  },
});

export default StokBilgisi;
