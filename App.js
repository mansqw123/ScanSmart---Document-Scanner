// App.js
import React, { useState } from 'react';
import { View, Text, Button, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Permissions from 'expo-permissions';
import * as Media from 'expo-media-library';

import * as TesseractOcr from 'tesseract.js';

export default function App() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      extractText(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted === false) {
      alert("Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      extractText(result.assets[0].uri);
    }
  };

  const extractText = async (imgUri) => {
    setText('Extracting...');
    try {
      const worker = await TesseractOcr.createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(imgUri);
      setText(data.text);
      await worker.terminate();
    } catch (err) {
      setText("Error extracting text");
      console.error(err);
    }
  };

  const createPDF = async () => {
    const html = `<html><body><pre>${text}</pre></body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📄 ScanSmart - Text Extractor</Text>
      <View style={styles.buttonContainer}>
        <Button title="📸 Take Photo" onPress={takePhoto} />
        <Button title="🖼️ Pick from Gallery" onPress={pickImage} />
      </View>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Text style={styles.resultLabel}>Extracted Text:</Text>
      <ScrollView style={styles.textBox}>
        <Text>{text}</Text>
      </ScrollView>
      <TouchableOpacity style={styles.pdfButton} onPress={createPDF}>
        <Text style={styles.pdfButtonText}>📄 Save as PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  image: { width: '100%', height: 250, marginBottom: 20 },
  resultLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  textBox: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, minHeight: 150, marginVertical: 10 },
  pdfButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  pdfButtonText: { color: '#fff', fontSize: 16 },
});
