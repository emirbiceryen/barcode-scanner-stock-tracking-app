import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './HomeScreen';

const IndexScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // TOKEN'ı da AsyncStorage'a kaydet
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('username', username);
        
        setIsLoggedIn(true);
      } else {
        Alert.alert('Giriş Başarısız', data.message || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (error) {
      console.error('Hata:', error);
      Alert.alert('Hata', 'Giriş sırasında bir sorun oluştu.');
    }
  };

  if (isLoggedIn) {
    return <HomeScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Masterpan Giriş</Text>

      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Giriş Yap" onPress={handleLogin} color="#4caf50" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

export default IndexScreen;