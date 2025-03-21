import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import VocalizationSelect from "@/components/VocalizationSelect";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import BackgroundAudioRecorder from "@/utils/BackgroundAudioRecorder";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Button,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function HomeScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showVocalizationModal, setShowVocalizationModal] = useState(false);
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [selectedVocalizationId, setSelectedVocalizationId] = useState<
    number | null
  >(null);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const [outputFile, setOutputFile] = useState<string | null>(null);
  const [elapsedTimeBeforePause, setElapsedTimeBeforePause] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const timeUpdateListenerRef = useRef<Function | null>(null);
  const statusChangeListenerRef = useRef<Function | null>(null);
  const recordingCompleteListenerRef = useRef<Function | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const setup = async () => {
      await setupApp();
      setupRecordingListeners();
    };

    setup();
    return () => {
      cleanup();
    };
  }, []);

  const setupApp = async () => {
    await requestPermissions();
    setupAppStateListener();
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ]);

        if (
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          showMessage({
            message: "Permissão Negada",
            description: "Permissão para gravar áudio não concedida",
            type: "danger",
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const setupRecordingListeners = () => {
    // Listener para atualizações de tempo
    timeUpdateListenerRef.current =
      BackgroundAudioRecorder.addTimeUpdateListener((time: number) => {
        setRecordingTime(time);
      });

    // Listener para mudanças de status (gravando, pausado)
    statusChangeListenerRef.current =
      BackgroundAudioRecorder.addStatusChangeListener((status: any) => {
        setIsRecording(status.isRecording);
        setIsPaused(status.isPaused);
        setOutputFile(status.outputFile);
      });

    // Listener para quando a gravação for concluída
    recordingCompleteListenerRef.current =
      BackgroundAudioRecorder.addRecordingCompleteListener((data: any) => {
        setOutputFile(data.outputFile);
        setRecordingTime(data.duration);
      });
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  };

  const cleanup = () => {
    // Limpar os listeners quando o componente for desmontado
    if (timeUpdateListenerRef.current) {
      (timeUpdateListenerRef.current as Function)();
      timeUpdateListenerRef.current = null;
    }

    if (statusChangeListenerRef.current) {
      (statusChangeListenerRef.current as Function)();
      statusChangeListenerRef.current = null;
    }

    if (recordingCompleteListenerRef.current) {
      (recordingCompleteListenerRef.current as Function)();
      recordingCompleteListenerRef.current = null;
    }

    // Notificar o usuário se houver uma gravação ativa
    if (isRecording) {
      showMessage({
        message: "Gravação em andamento",
        description: "A gravação continuará em segundo plano.",
        type: "info",
      });
    }
  };

  const startRecording = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.startRecording(elapsedTimeBeforePause);
      setIsRecording(true);
      setIsPaused(false);
    } catch (error: any) {
      showMessage({
        message: "Erro ao gravar",
        description:
          error.message || "Não foi possível iniciar a gravação do áudio",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseRecording = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.pauseRecording();
      setIsPaused(true);
      setElapsedTimeBeforePause(recordingTime);
    } catch (error: any) {
      showMessage({
        message: "Erro ao pausar",
        description:
          error.message || "Não foi possível pausar a gravação do áudio",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resumeRecording = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.resumeRecording();
      setIsPaused(false);
    } catch (error: any) {
      showMessage({
        message: "Erro ao retomar",
        description:
          error.message || "Não foi possível retomar a gravação do áudio",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.stopRecording();
      // O estado será atualizado através dos listeners
    } catch (error: any) {
      showMessage({
        message: "Erro ao parar",
        description:
          error.message || "Não foi possível parar a gravação do áudio",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = async () => {
    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.forceStopService();

      if (outputFile) {
        try {
          await FileSystem.deleteAsync(outputFile);
          console.log("Arquivo excluído com sucesso:", outputFile);
        } catch (error) {
          console.error("Erro ao excluir arquivo:", error);
        }
      }

      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);
      setShowDiscardModal(false);

      showMessage({
        message: "Gravação descartada",
        description: "A gravação foi descartada com sucesso.",
        type: "info",
      });
    } catch (error) {
      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);

      showMessage({
        message: "Erro",
        description: "Não foi possível descartar a gravação completamente.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchVocalizations() {
    setLoadingVocalizations(true);
    try {
      const vocalizations = await getVocalizacoes();
      setVocalizations(vocalizations);

      if (!selectedVocalizationId && vocalizations.length > 0) {
        setSelectedVocalizationId(vocalizations[0].id);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar os rótulos de vocalizações",
        type: "danger",
      });
    } finally {
      setLoadingVocalizations(false);
    }
  }

  const handleRecordPress = async () => {
    if (isLoading) return;

    if (isRecording && !isPaused) {
      await pauseRecording();
    } else if (isRecording && isPaused) {
      await resumeRecording();
    } else {
      await startRecording();
    }
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

  const validateAudioFile = async (filePath: string) => {
    try {
      console.log("Validando arquivo de áudio:", filePath);

      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (!fileInfo.exists) {
        console.error("O arquivo não existe:", filePath);
        return {
          valid: false,
          message: "O arquivo de áudio não foi encontrado",
        };
      }

      if (fileInfo.size === 0) {
        console.error("O arquivo está vazio:", filePath);
        return {
          valid: false,
          message: "O arquivo de áudio está vazio ou corrompido",
        };
      }

      console.log("Tamanho do arquivo:", fileInfo.size, "bytes");

      // Tentar carregar o áudio para verificar se pode ser reproduzido
      try {
        const properUri = filePath.startsWith("file://")
          ? filePath
          : `file://${filePath}`;
        const { sound } = await Audio.Sound.createAsync(
          { uri: properUri },
          { shouldPlay: false }
        );

        // Se chegou aqui, o arquivo provavelmente é válido
        await sound.unloadAsync();

        return {
          valid: true,
          message: "Arquivo de áudio validado com sucesso",
        };
      } catch (audioError) {
        console.error("Erro ao validar áudio:", audioError);
        return {
          valid: false,
          message: "O arquivo de áudio não pôde ser carregado para reprodução",
        };
      }
    } catch (error) {
      console.error("Erro na validação:", error);
      return {
        valid: false,
        message: "Erro ao validar o arquivo de áudio",
      };
    }
  };

  const handleSaveAudio = async () => {
    if (!selectedVocalizationId) {
      showMessage({
        message: "Rótulo não selecionado",
        description: "Por favor, selecione um rótulo de vocalização.",
        type: "warning",
      });
      return;
    }

    if (!outputFile) {
      showMessage({
        message: "Nenhuma gravação",
        description: "Não foi encontrada gravação para salvar.",
        type: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Normalize file path - ensure it has file:// prefix
      const normalizedPath = outputFile.startsWith("file://")
        ? outputFile
        : `file://${outputFile}`;

      // Check if file exists and is valid
      const fileInfo = await FileSystem.getInfoAsync(normalizedPath);
      console.log("Informações do arquivo:", fileInfo);

      if (!fileInfo.exists || fileInfo.size === 0) {
        showMessage({
          message: "Erro",
          description: "O arquivo de áudio está vazio ou não foi encontrado",
          type: "danger",
        });
        setIsLoading(false);
        return;
      }

      // Wait for file system to properly close the file
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate a new unique filename
      const timestamp = Date.now();
      const filename = `recording_${timestamp}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${filename}`;

      console.log(`Copiando de ${normalizedPath} para ${newUri}`);

      // Force stop recording service to ensure file is closed
      await BackgroundAudioRecorder.forceStopService();

      // Copy with correct paths
      await FileSystem.copyAsync({
        from: normalizedPath,
        to: newUri,
      });

      // Verify the new file
      const newFileInfo = await FileSystem.getInfoAsync(newUri);
      if (!newFileInfo.exists || newFileInfo.size === 0) {
        throw new Error("O arquivo copiado está vazio ou não foi encontrado");
      }

      console.log(
        `Arquivo copiado com sucesso. Tamanho: ${newFileInfo.size} bytes`
      );

      const existingRecordings = await AsyncStorage.getItem("recordings");
      const recordings = existingRecordings
        ? JSON.parse(existingRecordings)
        : [];

      recordings.push({
        uri: newUri,
        timestamp: timestamp,
        duration: recordingTime,
        vocalizationId: selectedVocalizationId,
        vocalizationName: vocalizations.find(
          (v) => v.id === selectedVocalizationId
        )?.nome,
        status: "pending",
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));

      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);
      setShowVocalizationModal(false);

      router.push("/audios");

      showMessage({
        message: "Sucesso",
        description: "Gravação salva com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao salvar áudio:", error);
      showMessage({
        message: "Erro ao salvar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerSection}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Tempo de Gravação</Text>
          <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
          {isRecording && !isPaused && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Gravando</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controlContainer}>
        {(isPaused || (outputFile && !isRecording)) && (
          <Pressable
            onPress={() => setShowDiscardModal(true)}
            style={({ pressed }) => [
              styles.controlButton,
              styles.discardButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons name="delete-outline" size={32} color="white" />
            <Text style={styles.buttonText}>Descartar</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            styles.recordButton,
            isRecording && !isPaused && styles.recordingButton,
            isLoading && styles.disabledButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleRecordPress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <>
              <MaterialIcons
                name={
                  isRecording && !isPaused
                    ? "pause"
                    : isPaused
                    ? "play-arrow"
                    : "mic"
                }
                size={40}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isRecording && !isPaused
                  ? "Pausar"
                  : isPaused
                  ? "Continuar"
                  : "Gravar"}
              </Text>
            </>
          )}
        </Pressable>

        {(isPaused || (outputFile && !isRecording)) && (
          <Pressable
            onPress={openVocalizationModal}
            style={({ pressed }) => [
              styles.controlButton,
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons name="save" size={32} color="white" />
            <Text style={styles.buttonText}>Salvar</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={showVocalizationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVocalizationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Rótulo</Text>
              <MaterialIcons
                name="close"
                size={24}
                color="#666"
                onPress={closeVocalizationModal}
                style={styles.modalClose}
              />
            </View>

            {loadingVocalizations ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : (
              <VocalizationSelect
                vocalizations={vocalizations}
                selectedVocalizationId={selectedVocalizationId}
                onValueChange={(value) => setSelectedVocalizationId(value)}
              />
            )}

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Salvar Gravação"
                onPress={handleSaveAudio}
                color="#2196F3"
                style={styles.modalButton}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={handleDiscard}
        message="Tem certeza que deseja descartar a gravação?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  timerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2196F3",
    fontVariant: ["tabular-nums"],
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F44336",
    marginRight: 8,
  },
  recordingText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "600",
  },
  controlContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    gap: 20,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    minWidth: 96,
  },
  recordButton: {
    backgroundColor: "#2196F3",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  recordingButton: {
    backgroundColor: "#F44336",
  },
  discardButton: {
    backgroundColor: "#757575",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
  },
  modalClose: {
    padding: 4,
  },
  modalActions: {
    marginTop: 24,
  },
  modalButton: {
    marginVertical: 8,
  },
});
