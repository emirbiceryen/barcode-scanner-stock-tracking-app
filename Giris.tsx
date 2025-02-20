import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';

// API'den dönen verinin yapısını tanımlayın
interface Record {
  tarih: string;
  barcode: string;
  productName: string;
  quantity: number;
  batch_no: string;
  kullanici: string;  // batch_no ekledik
}

const Giris = ({ onBack }: { onBack: () => void }) => {
  const [data, setData] = useState<Record[]>([]); // Veritabanından alınan veriler

  // Veritabanındaki girisler_takip tablosundan verileri çekme
  const fetchGirisData = async () => {
    try {
      const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/Giris'); // API endpointini güncelleyin

      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData.data); // API'den gelen veriyi state'e kaydediyoruz
      } else {
        Alert.alert('Hata', 'Veri alınamadı.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    }
  };

  useEffect(() => {
    fetchGirisData(); // Sayfa açıldığında verileri çekmek için
  }, []);

  // Tabloyu render etme
  const renderItem = ({ item }: { item: Record }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.tarih}</Text>
      <Text style={styles.tableCell}>{item.barcode}</Text>
      <Text style={styles.tableCell}>{item.productName}</Text>
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{item.batch_no}</Text>
      <Text style={styles.tableCell}>{item.kullanici}</Text> 
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Takip Verileri</Text>

      {/* Geri Butonu */}
      <Button title="Geri" onPress={onBack} color="#FF0000" />

      {/* Tablo Başlıkları */}
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.headerCell]}>Tarih</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Barkod</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Ürün Adı</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Miktar</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Batch No</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Kullanıcı</Text>
      </View>

      {/* Tablo Verileri */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.barcode}  // barcode kullanılarak her satır için benzersiz bir key
        ListEmptyComponent={<Text>Veri bulunamadı.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    paddingHorizontal: 5,
  },
  headerCell: {
    fontWeight: 'bold',  // Başlık hücrelerini kalın yapıyoruz
    backgroundColor: '#e0e0e0',  // Başlık hücrelerine arka plan rengi veriyoruz
  },
});

export default Giris;
