import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import VocalizationSelect from "@/components/VocalizationSelect";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import BackgroundAudioRecorder from "@/utils/BackgroundAudioRecorder";
import FileOperations from '@/utils/FileOperations';
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
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
    timeUpdateListenerRef.current =
      BackgroundAudioRecorder.addTimeUpdateListener((time: number) => {
        setRecordingTime(time);
      });

    statusChangeListenerRef.current =
      BackgroundAudioRecorder.addStatusChangeListener((status: any) => {
        setIsRecording(status.isRecording);
        setIsPaused(status.isPaused);
        setOutputFile(status.outputFile);
      });

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
        message: error instanceof Error ? error.message : "Erro",
        description: "Não foi possível iniciar a gravação do áudio",
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
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : "Erro",        
        description: "Não foi possível pausar a gravação do áudio",
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
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : "Erro",
        description: "Não foi possível retomar a gravação do áudio",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDiscard = async () => {
    try {
      setIsLoading(true);
  
      await BackgroundAudioRecorder.forceStopService();

      if (outputFile) {
        try {
          const deleted = await FileOperations.deleteFile(outputFile);
          
          if (!deleted) {
            throw new Error(`Não foi possível excluir o arquivo: ${outputFile}`);
          }
        } catch (error) {
          setShowDiscardModal(false);
          showMessage({
            message: "Aviso",
            description: "Erro ao excluir o arquivo de áudio temporário.",
            type: "warning",
          });

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
      setShowDiscardModal(false);
      
      showMessage({
        message: "Aviso",
        description: "A gravação foi descartada, mas houve um erro ao excluir o arquivo.",
        type: "warning",
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
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : "Erro",        description: "Não foi possível carregar os rótulos de vocalizações",
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
      await BackgroundAudioRecorder.forceStopService();
      
      const normalizedPath = outputFile.startsWith('file://') 
        ? outputFile 
        : `file://${outputFile}`;
      
      const audioDir = await FileOperations.getAudioDirectory();
      const fileName = `recording_${Date.now()}.m4a`;
      const newUri = `${audioDir}${fileName}`;
      
      await FileSystem.copyAsync({
        from: normalizedPath,
        to: newUri
      });
      
      const duration = recordingTime;
      const existingRecordings = await AsyncStorage.getItem("recordings");
      const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
      
      recordings.push({
        uri: newUri,
        timestamp: Date.now(),
        duration: duration,
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
      showMessage({
        message: error instanceof Error ? error.message : "Erro",
        description: "Erro desconhecido",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (!isRecording) {
        setRecordingTime(0);
        setElapsedTimeBeforePause(0);
      }
      
    }, [isRecording])
  );
  
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
