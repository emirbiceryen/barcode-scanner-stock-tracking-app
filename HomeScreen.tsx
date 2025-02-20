import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import UrunEkle from '../app/urunEkle'; // Ürün Ekle ekranını import edin
import UrunCikar from '../app/urunCikar'; // Ürün Çıkar ekranını import edin
import StokBilgisi from '../app/StokBilgisi'; // Stok Bilgisi ekranını import edin

const HomeScreen = () => {
  // Ekran geçişleri için state
  const [currentScreen, setCurrentScreen] = useState<'HomeScreen' | 'urunEkle' | 'urunCikar' | 'StokBilgisi'>('HomeScreen');

  // Ekranlar arasında geçiş fonksiyonları
  const goToHome = () => setCurrentScreen('HomeScreen');
  const goToUrunEkle = () => setCurrentScreen('urunEkle');
  const goToUrunCikar = () => setCurrentScreen('urunCikar');
  const goToStokBilgisi = () => setCurrentScreen('StokBilgisi');

  // Ekranlar
  if (currentScreen === 'urunEkle') {
    return <UrunEkle onBack={goToHome} username={''} />;
  }
  if (currentScreen === 'urunCikar') {
    return <UrunCikar onBack={goToHome} username={''} />;
  }
  if (currentScreen === 'StokBilgisi') {
    return <StokBilgisi onBack={goToHome} />;
  }

  // Ana ekran
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Masterpan</Text>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Ürün Ekle"
            onPress={goToUrunEkle} // Ürün Ekle ekranına geçiş
            color="#f44336"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Ürün Çıkar"
            onPress={goToUrunCikar} // Ürün Çıkar ekranına geçiş
            color="#4caf50" // Yeşil buton rengi
          />
        </View>
      </View>

      {/* Alt Buton */}
      <View style={styles.buttonWrapper}>
        <Button
          title="Stok Bilgisi"
          onPress={goToStokBilgisi} // Stok Bilgisi ekranına geçiş
          color="#2196f3" // Mavi buton rengi
        />
      </View>
    </View>
  );
};

// Stil
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Arka plan rengi
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#b71c1c', // Koyu kırmızı başlık rengi
    marginBottom: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  buttonWrapper: {
    width: '45%', // Butonların genişliği
  },
  bottomButtonWrapper: {
    marginTop: 40,
    width: '100%', // Alt buton tam genişlikte
  },
});

export default HomeScreen;
