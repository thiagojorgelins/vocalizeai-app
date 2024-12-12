import React, { useState } from "react";
import {
  View,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Text,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function UploadScreen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setFileUri(selectedFile.uri);
        setFileName(selectedFile.name);
        console.log("Arquivo selecionado:", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        });
      }
    } catch (error) {
      console.error("Erro ao selecionar o arquivo:", error);
      Alert.alert("Erro", "Ocorreu um erro ao selecionar o arquivo.");
    }
  }

  async function handleUpload() {
    if (!fileUri || !fileName) {
      Alert.alert("Erro", "Nenhum arquivo selecionado para enviar.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        type: "audio/*",
        name: fileName,
      } as any);

      console.log("Enviando arquivo para a API...");

      const response = await fetch(
        "http://192.168.100.66:8000/classify-upload/",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("Status da resposta:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Resposta da API:", data);
        setResult(JSON.stringify(data.classification, null, 2));
      } else {
        const errorText = await response.text();
        console.error("Erro na resposta da API:", errorText);
        throw new Error(`Erro na API: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      Alert.alert(
        "Erro",
        "Não foi possível enviar o arquivo. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetSelection() {
    setFileUri(null);
    setFileName(null);
    setResult(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload de Áudio</Text>

      <View style={styles.buttonContainer}>
        <Button
          title={fileUri ? "Selecionar Outro Arquivo" : "Selecionar Arquivo"}
          onPress={handlePickFile}
        />
      </View>

      {fileUri && fileName && (
        <>
          <Text style={styles.fileName}>Arquivo selecionado: {fileName}</Text>
          <View style={styles.buttonContainer}>
            <Button title="Enviar e Classificar" onPress={handleUpload} />
            <Button
              title="Cancelar Seleção"
              onPress={resetSelection}
              color="#f44336"
            />
          </View>
        </>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processando arquivo...</Text>
        </View>
      )}

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultText}>Resultado da Classificação:</Text>
          <Text style={styles.resultLabel}>{result}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 30,
  },
  buttonContainer: {
    marginVertical: 10,
    width: "80%",
  },
  fileName: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  result: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: "#1DB954",
    textAlign: "center",
  },
});
