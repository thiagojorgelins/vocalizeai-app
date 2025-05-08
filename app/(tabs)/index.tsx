import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import VocalizationSelect from "@/components/VocalizationSelect";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import BackgroundAudioRecorder from "@/utils/BackgroundAudioRecorder";
import FileOperations from "@/utils/FileOperations";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { checkParticipantExists } from "@/services/participanteService";
import ParticipanteSelector from "@/components/ParticipanteSelect";
import { getParticipantesByUsuario } from "@/services/participanteService";

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
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [hasParticipant, setHasParticipant] = useState<boolean | null>(null);
  const [checkingParticipant, setCheckingParticipant] = useState(true);
  const [actionCooldown, setActionCooldown] = useState(false);
  const cooldownTimeout = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateListenerRef = useRef<Function | null>(null);
  const statusChangeListenerRef = useRef<Function | null>(null);
  const recordingCompleteListenerRef = useRef<Function | null>(null);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [selectedParticipanteId, setSelectedParticipanteId] = useState<
    number | null
  >(null);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const verifyParticipantExists = async () => {
    await loadParticipantes(); 
    setCheckingParticipant(true);
    try {
      const participantExists = await checkParticipantExists();
      setHasParticipant(participantExists);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao verificar se o participante está cadastrado.",
      });
      setHasParticipant(false);
    } finally {
      setCheckingParticipant(false);
    }
  };

  const loadParticipantes = async () => {
    setLoadingParticipantes(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await getParticipantesByUsuario(userId);
        setParticipantes(data);

        if (data.length > 0) {
          setSelectedParticipanteId(data[0].id);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao carregar participantes do usuário",
      });
    } finally {
      setLoadingParticipantes(false);
    }
  };

  useEffect(() => {
    const setup = async () => {
      await setupApp();
      setupRecordingListeners();
      await verifyParticipantExists();
    };

    setup();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const syncInterval = setInterval(async () => {
        if (isRecording) {
          try {
            const status = await BackgroundAudioRecorder.getStatus();
            setIsRecording(status.isRecording);
            setIsPaused(status.isPaused);
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Erro ao sincronizar estado",
              text2: "Erro ao sincronizar o estado da gravação.",
            });
          }
        }
      }, 1000);

      return () => clearInterval(syncInterval);
    }

    const validateStateConsistency = async () => {
      if (!isRecording && recordingTime > 0) {
        try {
          const status = await BackgroundAudioRecorder.getStatus();
          setIsRecording(status.isRecording);
          setIsPaused(status.isPaused);

          if (!status.isRecording) {
            setRecordingTime(0);
            setElapsedTimeBeforePause(0);
            setOutputFile(null);
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Erro ao validar consistência",
            text2: "Erro ao validar a consistência do estado da gravação.",
          });
        }
      }
    };

    const consistencyInterval = setInterval(validateStateConsistency, 2000);
    return () => clearInterval(consistencyInterval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    const syncState = async () => {
      try {
        await BackgroundAudioRecorder.forceSync();
        const status = await BackgroundAudioRecorder.getStatus();

        if (status.outputFile) {
          try {
            const normalizedPath = status.outputFile.startsWith("file://")
              ? status.outputFile
              : `file://${status.outputFile}`;

            const fileInfo = await FileSystem.getInfoAsync(normalizedPath);

            if (!fileInfo.exists || fileInfo.size === 0) {
              status.isRecording = false;
              status.isPaused = false;
              status.currentTime = 0;
              status.outputFile = null;
            }
          } catch (fileError) {
            Toast.show({
              type: "error",
              text1: fileError instanceof Error ? fileError.message : "Erro",
              text2: "Erro ao verificar o arquivo de gravação.",
            });
          }
        }

        if (!status.isRecording) {
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
          setOutputFile(null);
          setElapsedTimeBeforePause(0);
        } else {
          setIsRecording(status.isRecording);
          setIsPaused(status.isPaused);
          setRecordingTime(status.currentTime || 0);
          setOutputFile(status.outputFile);
        }
      } catch (error) {
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setOutputFile(null);
        setElapsedTimeBeforePause(0);

        Toast.show({
          type: "error",
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao sincronizar o estado da gravação.",
        });
      }
    };

    syncState();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        syncState();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const setupApp = async () => {
    await requestPermissions();
    setupAppStateListener();
  };

  const handleSaveButtonPress = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const filePath = await BackgroundAudioRecorder.getOutputFilePath();

      if (!filePath) {
        Toast.show({
          type: "error",
          text1: "Nenhuma gravação",
          text2: "Não foi encontrada gravação para salvar.",
        });
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setOutputFile(null);
        setElapsedTimeBeforePause(0);
        return;
      }

      try {
        const normalizedPath = filePath.startsWith("file://")
          ? filePath
          : `file://${filePath}`;
        const fileInfo = await FileSystem.getInfoAsync(normalizedPath);

        if (!fileInfo.exists || fileInfo.size === 0) {
          Toast.show({
            type: "error",
            text1: "Arquivo não encontrado",
            text2: "O arquivo de gravação não existe ou está vazio.",
          });

          await BackgroundAudioRecorder.resetState();
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
          setOutputFile(null);
          setElapsedTimeBeforePause(0);
          return;
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro ao verificar arquivo",
          text2: "Não foi possível verificar o arquivo de gravação.",
        });
        return;
      }

      setOutputFile(filePath);

      if (vocalizations.length === 0) {
        fetchVocalizations();
        setLoadingVocalizations(true);
        try {
          const vocs = await getVocalizacoes();
          setVocalizations(vocs);

          if (!selectedVocalizationId && vocs.length > 0) {
            setSelectedVocalizationId(vocs[0].id);
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: error instanceof Error ? error.message : "Erro",
            text2: "Não foi possível carregar os rótulos de vocalizações",
          });
          return;
        } finally {
          setLoadingVocalizations(false);
        }
      }
      await loadParticipantes();
      setShowVocalizationModal(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Ocorreu um erro ao preparar para salvar.",
      });
    } finally {
      setIsLoading(false);
    }
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
          Toast.show({
            type: "error",
            text1: "Permissão Negada",
            text2: "Permissão para gravar áudio não concedida",
          });
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro ao solicitar permissão",
          text2: "Erro ao solicitar permissão de gravação de áudio.",
        });
      }
    }
  };

  const setupRecordingListeners = () => {
    if (timeUpdateListenerRef.current) {
      timeUpdateListenerRef.current();
      timeUpdateListenerRef.current = null;
    }

    if (statusChangeListenerRef.current) {
      statusChangeListenerRef.current();
      statusChangeListenerRef.current = null;
    }

    if (recordingCompleteListenerRef.current) {
      recordingCompleteListenerRef.current();
      recordingCompleteListenerRef.current = null;
    }

    timeUpdateListenerRef.current =
      BackgroundAudioRecorder.addTimeUpdateListener(
        (time: SetStateAction<number>) => {
          setRecordingTime(time);
        }
      );

    statusChangeListenerRef.current =
      BackgroundAudioRecorder.addStatusChangeListener(
        (status: {
          discardedFromNotification?: boolean;
          isRecording: boolean;
          isPaused: boolean;
          outputFile: string | null;
          currentTime: SetStateAction<number>;
        }) => {
          setIsRecording((prev) => {
            return status.isRecording;
          });

          setIsPaused((prev) => {
            return status.isPaused;
          });

          if (status.outputFile) {
            setOutputFile((prev) => {
              return status.outputFile;
            });
          }

          if (
            typeof status.currentTime === "number" &&
            status.currentTime > 0
          ) {
            setRecordingTime(status.currentTime);
          }

          if (status.discardedFromNotification) {
            setOutputFile(null);
            setElapsedTimeBeforePause(0);
            setRecordingTime(0);
            setIsPaused(false);
            setIsRecording(false);

            Toast.show({
              type: "success",
              text1: "Gravação descartada",
              text2: "A gravação foi descartada com sucesso.",
            });
          }
        }
      );

    recordingCompleteListenerRef.current =
      BackgroundAudioRecorder.addRecordingCompleteListener(
        (data: {
          outputFile: SetStateAction<string | null>;
          duration: SetStateAction<number>;
        }) => {
          setOutputFile(data.outputFile);
          setRecordingTime(data.duration);
          setIsRecording(false);
          setIsPaused(false);
        }
      );

    BackgroundAudioRecorder.getStatus()
      .then((status) => {
        setIsRecording(status.isRecording);
        setIsPaused(status.isPaused);
        setRecordingTime(status.currentTime || 0);
        if (status.outputFile) {
          setOutputFile(status.outputFile);
        }
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao obter status",
        });
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
      Toast.show({
        type: "info",
        text1: "Gravação em andamento",
        text2: "A gravação continuará em segundo plano.",
      });
    }
  };

  const handleDiscard = async () => {
    try {
      setIsLoading(true);

      await BackgroundAudioRecorder.forceStopService();
      await BackgroundAudioRecorder.resetState();

      if (outputFile) {
        try {
          const deleted = await FileOperations.deleteFile(outputFile);

          if (!deleted) {
            throw new Error(
              `Não foi possível excluir o arquivo: ${outputFile}`
            );
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Erro ao excluir arquivo",
            text2: "Erro ao excluir o arquivo de áudio temporário.",
          });
          setShowDiscardModal(false);
          setIsLoading(false);
          return;
        }
      }

      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);
      setShowDiscardModal(false);

      if (cooldownTimeout.current) {
        clearTimeout(cooldownTimeout.current);
        cooldownTimeout.current = null;
      }

      setTimeout(() => {
        Toast.show({
          type: "success",
          text1: "Gravação descartada",
          text2: "A gravação foi descartada com sucesso.",
        });
      }, 300);
    } catch (error) {
      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);
      setShowDiscardModal(false);

      setTimeout(() => {
        Toast.show({
          type: "error",
          text1: "Erro ao descartar gravação",
          text2: "Erro ao descartar a gravação.",
        });
      }, 300);
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
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Não foi possível carregar os rótulos de vocalizações",
      });
    } finally {
      setLoadingVocalizations(false);
    }
  }

  const handleRecordPress = async () => {
    if (!hasParticipant) {
      await AsyncStorage.setItem("redirectedFromHome", "true");

      router.push("/usuario/dados-participante");

      Toast.show({
        type: "info",
        text1: "Atenção",
        text2:
          "É necessário cadastrar um participante antes de gravar vocalizações.",
      });

      return;
    }

    if (isLoading || isProcessingAction || actionCooldown) return;

    try {
      setIsProcessingAction(true);
      setActionCooldown(true);
      setIsLoading(true);

      const currentStatus = await BackgroundAudioRecorder.getStatus();

      if (currentStatus.isRecording && !currentStatus.isPaused) {
        await BackgroundAudioRecorder.pauseRecording();
        setIsPaused(true);
      } else if (currentStatus.isRecording && currentStatus.isPaused) {
        await BackgroundAudioRecorder.resumeRecording();
        setIsPaused(false);
        setIsRecording(true);
      } else {
        await BackgroundAudioRecorder.startRecording(elapsedTimeBeforePause);
        setIsRecording(true);
        setIsPaused(false);
      }

      if (cooldownTimeout.current) {
        clearTimeout(cooldownTimeout.current);
      }

      cooldownTimeout.current = setTimeout(() => {
        setActionCooldown(false);
      }, 1000);

      setTimeout(async () => {
        try {
          const updatedStatus = await BackgroundAudioRecorder.getStatus();

          setIsRecording(updatedStatus.isRecording);
          setIsPaused(updatedStatus.isPaused);
          setRecordingTime(updatedStatus.currentTime);
          if (updatedStatus.outputFile) {
            setOutputFile(updatedStatus.outputFile);
          }

          setIsLoading(false);
        } catch (error) {
          Toast.show({
            type: "error",
            text1: error instanceof Error ? error.message : "Erro",
            text2: "Erro ao obter o status da gravação.",
          });
          setIsLoading(false);
        }

        setIsProcessingAction(false);
      }, 500);
    } catch (error) {
      setIsLoading(false);
      setIsProcessingAction(false);

      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Error",
        text2: "Erro ao controlar a gravação.",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (cooldownTimeout.current) {
        clearTimeout(cooldownTimeout.current);
      }
    };
  }, []);

  const getButtonStyle = () => {
    return [
      styles.controlButton,
      styles.recordButton,
      isRecording && !isPaused && styles.recordingButton,
      (isLoading ||
        checkingParticipant ||
        hasParticipant === false ||
        actionCooldown) &&
        styles.disabledButton,
    ];
  };

  const closeVocalizationModal = () => {
    setShowVocalizationModal(false);
  };

  async function handleSaveAudio() {
    if (!selectedVocalizationId) {
      Toast.show({
        type: "error",
        text1: "Rótulo não selecionado",
        text2: "Por favor, selecione um rótulo de vocalização.",
      });
      return;
    }

    if (!selectedParticipanteId) {
      Toast.show({
        type: "error",
        text1: "Participante não selecionado",
        text2: "Por favor, selecione um participante.",
      });
      return;
    }

    setIsLoading(true);

    let filePath = outputFile;
    if (!filePath) {
      try {
        filePath = await BackgroundAudioRecorder.getOutputFilePath();
        if (filePath) {
          setOutputFile(filePath);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: error instanceof Error ? error.message : "Error",
          text2: "Erro ao buscar caminho do arquivo de áudio.",
        });
      }
    }

    if (!filePath) {
      setIsLoading(false);
      Toast.show({
        type: "error",
        text1: "Nenhuma gravação",
        text2: "Não foi encontrada gravação para salvar.",
      });
      return;
    }

    try {
      await BackgroundAudioRecorder.forceStopService();

      const normalizedPath = filePath.startsWith("file://")
        ? filePath
        : `file://${filePath}`;

      try {
        const fileInfo = await FileSystem.getInfoAsync(normalizedPath);

        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error(
            `Arquivo não existe ou está vazio: ${normalizedPath}`
          );
        }
      } catch (fileCheckError) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Erro ao verificar arquivo de áudio.",
        });
        throw fileCheckError;
      }

      const audioDir = await FileOperations.getAudioDirectory();
      const fileName = `recording_${Date.now()}.m4a`;
      const newUri = `${audioDir}${fileName}`;

      await FileSystem.copyAsync({
        from: normalizedPath,
        to: newUri,
      });

      const duration = recordingTime;
      const existingRecordings = await AsyncStorage.getItem("recordings");
      const recordings = existingRecordings
        ? JSON.parse(existingRecordings)
        : [];

      recordings.push({
        uri: newUri,
        timestamp: Date.now(),
        duration: duration,
        vocalizationId: selectedVocalizationId,
        vocalizationName: vocalizations.find(
          (v) => v.id === selectedVocalizationId
        )?.nome,
        participanteId: selectedParticipanteId,
        status: "pending",
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));

      setOutputFile(null);
      setElapsedTimeBeforePause(0);
      setRecordingTime(0);
      setIsPaused(false);
      setIsRecording(false);
      setShowVocalizationModal(false);

      await BackgroundAudioRecorder.resetState();
      router.push("/audios");

      Toast.show({
        type: "success",
        text1: "Gravação salva",
        text2: "A gravação foi salva com sucesso.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Error",
        text2: "Erro ao salvar a gravação.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      const resetScreenState = async () => {
        await verifyParticipantExists();
        await loadParticipantes();
        try {
          const status = await BackgroundAudioRecorder.getStatus();

          if (status.isRecording) {
            if (status.outputFile) {
              try {
                const normalizedPath = status.outputFile.startsWith("file://")
                  ? status.outputFile
                  : `file://${status.outputFile}`;
                const fileInfo = await FileSystem.getInfoAsync(normalizedPath);

                if (!fileInfo.exists || fileInfo.size === 0) {
                  await BackgroundAudioRecorder.resetState();
                  setIsRecording(false);
                  setIsPaused(false);
                  setRecordingTime(0);
                  setOutputFile(null);
                  setElapsedTimeBeforePause(0);
                  return;
                }
              } catch (error) {
                await BackgroundAudioRecorder.resetState();
                setIsRecording(false);
                setIsPaused(false);
                setRecordingTime(0);
                setOutputFile(null);
                setElapsedTimeBeforePause(0);
                return;
              }
            }

            setIsRecording(status.isRecording);
            setIsPaused(status.isPaused);
            setRecordingTime(status.currentTime);
            setOutputFile(status.outputFile);
          } else {
            setIsRecording(false);
            setIsPaused(false);
            setRecordingTime(0);
            setOutputFile(null);
            setElapsedTimeBeforePause(0);
            await BackgroundAudioRecorder.resetState();
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: error instanceof Error ? error.message : "Erro",
            text2: "Erro ao sincronizar o estado da gravação.",
          });

          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
          setOutputFile(null);
          setElapsedTimeBeforePause(0);
        }
      };
      
      resetScreenState();

      return () => {};
    }, [])
  );

  const handleNavigateToParticipantRegistration = async () => {
    await AsyncStorage.setItem("redirectedFromHome", "true");

    router.push("/usuario/dados-participante");
  };

  return (
    <View style={styles.container}>
      {hasParticipant === false && (
        <View style={styles.warningContainer}>
          <MaterialIcons
            name="warning"
            size={24}
            color="#FF9800"
            style={{ textAlign: "center" }}
          />
          <Text style={styles.warningText}>
            É necessário cadastrar um participante antes de gravar vocalizações.
          </Text>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={handleNavigateToParticipantRegistration}
          >
            <Text style={styles.warningButtonText}>Cadastrar Participante</Text>
          </TouchableOpacity>
        </View>
      )}

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
            ...getButtonStyle(),
            pressed && styles.buttonPressed,
          ]}
          onPress={handleRecordPress}
          disabled={
            isLoading || checkingParticipant || hasParticipant === false
          }
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
              <Text
                style={[
                  styles.buttonText,
                  actionCooldown && styles.cooldownText,
                ]}
              >
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
            onPress={handleSaveButtonPress}
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
            {loadingParticipantes ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : (
              <ParticipanteSelector
                participantes={participantes}
                selectedParticipanteId={selectedParticipanteId}
                onParticipanteChange={setSelectedParticipanteId}
              />
            )}
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
        <Toast />
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
  cooldownText: {
    opacity: 0.7,
    color: "#999",
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
    elevation: 4,
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
  warningContainer: {
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 10,
    marginVertical: 16,
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#FFE0B2",
    elevation: 2,
  },
  warningText: {
    fontSize: 14,
    color: "#E65100",
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  warningButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
  },
  warningButtonText: {
    color: "#FFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
