import ConfirmationModal from "@/components/ConfirmationModal";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";

import Select from "@/components/Select";
import { Vocalizacao } from "@/types/Vocalizacao";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import ButtonCustom from "../../components/Button";

export default function HomeScreen() {
  const router = useRouter();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingFileUri, setRecordingFileUri] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showVocalizationModal, setShowVocalizationModal] = useState(false);
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [selectedVocalizationId, setSelectedVocalizationId] = useState<number | null>(null);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => {
      if (granted) {
        Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: true,
        });
      }
    });
  }, []);

  async function fetchVocalizations() {
    setLoadingVocalizations(true);
    try {
      const vocalizations = await getVocalizacoes()
      setVocalizations(vocalizations);

      if (!selectedVocalizationId && vocalizations.length > 0) {
        setSelectedVocalizationId(vocalizations[0].id);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar as vocalizações",
        type: "danger",
      })
    } finally {
      setLoadingVocalizations(false);
    }
  }
  
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  async function handleRecordingStart() {
    const { granted } = await Audio.getPermissionsAsync();

    if (!granted) {
      showMessage({
        message: "Permissão Negada",
        description: "Não há permissão para gravar áudio",
        type: "danger",
      });
      return;
    }

    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsPaused(false);
      startTimer();
    } catch (error) {
      showMessage({
        message: "Erro ao gravar",
        description: "Não foi possível iniciar a gravação do áudio",
        type: "danger",
      });
    }
  }

  async function handleRecordingStop() {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const fileUri = recording.getURI();
        setRecordingFileUri(fileUri);
        setRecording(null);
        stopTimer();
        setIsPaused(true);
      }
    } catch (error) {
      showMessage({
        message: "Erro ao pausar",
        description: "Não foi possível parar a gravação do áudio",
        type: "danger",
      });
    }
  }

  const handleMainButton = () => {
    if (recording) {
      handleRecordingStop();
    } else {
      handleRecordingStart();
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    setRecordingFileUri(null);
    setRecordingTime(0);
    setIsPaused(false);
  };


  const openVocalizationModal = async () => {
    if (vocalizations.length === 0) {
      await fetchVocalizations();
    }
    setShowVocalizationModal(true);
  };

  const closeVocalizationModal = () => {
    setShowVocalizationModal(false);
  };

  const handleSaveAudio = async () => {
    if (!selectedVocalizationId) {
      showMessage({
        message: "Vocalização não selecionada",
        description: "Por favor, selecione uma vocalização.",
        type: "warning",
      })
      return;
    }
    if (!recordingFileUri) {
      showMessage({
        message: "Nenhuma gravação",
        description: "Não foi encontrada gravação para salvar.",
        type: "warning",
      });
      return;
    }

    try {
      const filename = `recording_${Date.now()}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({
        from: recordingFileUri,
        to: newUri,
      });

      const existingRecordings = await AsyncStorage.getItem("recordings");
      const recordings = existingRecordings
        ? JSON.parse(existingRecordings)
        : [];

      recordings.push({
        uri: newUri,
        timestamp: Date.now(),
        duration: recordingTime,
        vocalizationId: selectedVocalizationId,
        vocalizationName: vocalizations.find(
          v => v.id === selectedVocalizationId
        )?.nome,
        status: "pending",
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));

      setRecordingFileUri(null);
      setRecordingTime(0);
      setIsPaused(false);
      setShowVocalizationModal(false);

      router.push("/audios");
    } catch (error) {
      showMessage({
        message: "Erro ao salvar",
        description: "Não foi possível salvar o áudio",
        type: "danger",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(recordingTime)}</Text>

      <View style={styles.controlContainer}>
        {isPaused && (
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={() => setShowDiscardModal(true)}
              style={[styles.button, styles.discardButton]}
            >
              <MaterialIcons name="close" size={48} color="white" />
            </Pressable>
            <Text style={styles.boldText}>Descartar</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPressIn={handleMainButton}>
            <MaterialIcons
              name={recording ? "pause" : isPaused ? "play-arrow" : "mic"}
              size={48}
              color="white"
            />
          </Pressable>
          <Text style={styles.boldText}>
            {recording
              ? "Pausar a gravação"
              : isPaused
              ? "Continuar"
              : "Toque para iniciar a gravação"}
          </Text>
        </View>

        {isPaused && (
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={openVocalizationModal}
              style={[styles.button, styles.saveButton]}
            >
              <MaterialIcons name="save" size={48} color="white" />
            </Pressable>
            <Text style={styles.boldText}>Salvar</Text>
          </View>
        )}
      </View>

      <ConfirmationModal
        visible={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={handleDiscard}
        message="Tem certeza que deseja descartar a gravação?"
      />

      <Modal
        visible={showVocalizationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVocalizationModal}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Vocalização</Text>

            {loadingVocalizations ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Select
                label="Vocalização"
                selectedValue={selectedVocalizationId?.toString() || ""}
                onValueChange={(itemValue) =>
                  setSelectedVocalizationId(Number(itemValue))
                }
                options={vocalizations.map((voc) => ({
                  label: voc.nome,
                  value: voc.id.toString(),
                }))}
                style={{ width: "100%" }}
              />
            )}

            <View style={styles.buttonRow}>
              <ButtonCustom title="Salvar" onPress={handleSaveAudio} style={{ width: "45%"}}/>
              <ButtonCustom title="Fechar" onPress={closeVocalizationModal} color="red" style={{ width: "45%"}}/>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    height: 40,
    paddingHorizontal: 8,
    width: 100,
    textAlign: "center",
  },
  timer: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 54,
  },
  controlContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  buttonContainer: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#ff0000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  discardButton: {
    backgroundColor: "gray",
  },
  saveButton: {
    backgroundColor: "green",
  },
  boldText: {
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
