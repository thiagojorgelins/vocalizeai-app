import { Audio } from "expo-av";
import React from "react";
import { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";

export default function AudioRecorderScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingFileUri, setRecordingFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert(
          "Permissão Negada",
          "É necessário acesso ao microfone para gravar áudio."
        );
      }
    } catch (err) {
      console.error("Erro ao iniciar gravação", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingFileUri(uri);
      setRecording(null);
    } catch (error) {
      console.error("Erro ao parar gravação", error);
    }
  }

  async function handleUpload() {
    if (!recordingFileUri) {
      Alert.alert("Erro", "Nenhuma gravação encontrada para enviar.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: recordingFileUri,
        type: "audio/m4a",
        name: `${Date.now() + Math.ceil(Math.random() * 1000)}.m4a`,
      });

      const response = await fetch(
        "http://192.168.100.66:8000/classify-upload/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(JSON.stringify(data.classification, null, 2));
      } else {
        const errorText = await response.text();
        console.error("Erro na resposta da API:", errorText);
        Alert.alert("Erro", "Falha ao enviar a gravação para classificação.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível enviar a gravação.");
    } finally {
      setLoading(false);
    }
  }

  function resetRecording() {
    setRecordingFileUri(null);
    setResult(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.recordButtonContainer}>
        <Button
          title={isRecording ? "Parar Gravação" : "Iniciar Gravação"}
          onPress={isRecording ? stopRecording : startRecording}
        />
      </View>
      {isRecording && <Text style={styles.label}>Gravando...</Text>}
      {recordingFileUri && (
        <>
          <View style={styles.buttonContainer}>
            <Button title="Enviar e Classificar" onPress={handleUpload} />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Gravar Novamente"
              onPress={resetRecording}
              color="#f44336"
            />
          </View>
        </>
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
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
    justifyContent: "center",
  },
  recordButtonContainer: {
    marginVertical: 20,
    width: "80%",
  },
  buttonContainer: {
    marginVertical: 10,
    width: "80%",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  result: {
    marginTop: 20,
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
