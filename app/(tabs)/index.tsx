import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Select from "@/components/Select";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BackgroundTimer from "react-native-background-timer";
import { showMessage } from "react-native-flash-message";
import translateVocalization from "@/utils/TranslateVocalization";

export default function HomeScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showVocalizationModal, setShowVocalizationModal] = useState(false);
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [selectedVocalizationId, setSelectedVocalizationId] = useState<
    number | null
  >(null);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const [recordingSegments, setRecordingSegments] = useState<string[]>([]);
  const [elapsedTimeBeforePause, setElapsedTimeBeforePause] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const notificationRef = useRef<string | null>(null);

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
      await checkExistingRecording();
    };

    setup();
    return () => {
      cleanup();
    };
  }, []);

  const checkExistingRecording = async () => {
    try {
      const startTimeStr = await AsyncStorage.getItem("recordingStartTime");
      const isRecording = await AsyncStorage.getItem("isRecording");
      const savedElapsedTime = await AsyncStorage.getItem(
        "elapsedTimeBeforePause"
      );

      if (startTimeStr && isRecording === "true") {
        const startTime = parseInt(startTimeStr);
        startTimeRef.current = startTime;

        const elapsedTime = savedElapsedTime ? parseInt(savedElapsedTime) : 0;
        setElapsedTimeBeforePause(elapsedTime);

        const currentTime = Math.floor((Date.now() - startTime) / 1000);
        setDisplayTime(currentTime);
        setRecordingTime(currentTime);

        startTimer();
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível verificar a gravação existente",
        type: "danger",
      });
    }
  };

  const setupApp = async () => {
    await setupAudioMode();
    await setupNotifications();
    setupAppStateListener();
  };

  const setupAudioMode = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível configurar o modo de áudio",
        type: "danger",
      });
    }
  };

  const setupNotifications = async () => {
    try {
      const { status, granted } = await Notifications.requestPermissionsAsync();

      if (status === "denied") {
        showMessage({
          message: "Permissão Negada",
          description:
            "As notificações foram desativadas. Por favor, ative nas configurações do dispositivo.",
          type: "warning",
        });
        return;
      }

      if (granted) {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("recording", {
            name: "Gravação",
            importance: Notifications.AndroidImportance.HIGH,
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            enableVibrate: false,
            enableLights: false,
            showBadge: false,
            sound: null,
          });
        }

        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldVibrate: false,
            priority: Notifications.AndroidNotificationPriority.MAX,
          }),
        });
      } else {
        showMessage({
          message: "Notificações Desativadas",
          description:
            "Algumas funcionalidades podem ser limitadas sem permissão de notificação.",
          type: "warning",
        });
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível configurar as notificações",
        type: "danger",
      });
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          recording &&
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          if (startTimeRef.current) {
            const elapsedSeconds = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            setRecordingTime(elapsedSeconds);
            updateNotification(elapsedSeconds);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  };

  const startTimer = async () => {
    BackgroundTimer.stopBackgroundTimer();

    await AsyncStorage.setItem(
      "recordingStartTime",
      startTimeRef.current!.toString()
    );
    await AsyncStorage.setItem("isRecording", "true");
    await AsyncStorage.setItem(
      "elapsedTimeBeforePause",
      elapsedTimeBeforePause.toString()
    );

    BackgroundTimer.runBackgroundTimer(() => {
      if (startTimeRef.current) {
        const currentTime = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const totalTime = currentTime;
        setDisplayTime(totalTime);
        setRecordingTime(totalTime);
        updateNotification(totalTime);
      }
    }, 1000);
  };

  const stopTimer = async () => {
    BackgroundTimer.stopBackgroundTimer();

    startTimeRef.current = null;

    await AsyncStorage.removeItem("recordingStartTime");
    await AsyncStorage.removeItem("isRecording");

    if (notificationRef.current) {
      await Notifications.dismissNotificationAsync(notificationRef.current);
      notificationRef.current = null;
      await AsyncStorage.removeItem("currentNotificationId");
    }
  };

  const updateNotification = async (time: number = recordingTime) => {
    try {
      if (!notificationRef.current) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Gravação em andamento",
            body: `Tempo: ${formatTime(time)}`,
            priority: Platform.OS === "android" ? "max" : undefined,
            sound: false,
            sticky: true,
          },
          trigger: null,
        });
        notificationRef.current = identifier;
        await AsyncStorage.setItem("currentNotificationId", identifier);
      } else {
        await Notifications.scheduleNotificationAsync({
          identifier: notificationRef.current,
          content: {
            title: "Gravação em andamento",
            body: `Tempo: ${formatTime(time)}`,
            data: { type: "recording" },
            priority: Platform.OS === "android" ? "max" : undefined,
            sound: false,
            sticky: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível atualizar a notificação",
        type: "danger",
      });
    }
  };

  const cleanup = async () => {
    if (recording) {
      await stopRecording();
    }
    if (notificationRef.current) {
      await Notifications.dismissNotificationAsync(notificationRef.current);
      notificationRef.current = null;
    }
    stopTimer();
    BackgroundTimer.stopBackgroundTimer();
  };

  useEffect(() => {
    return () => {
      BackgroundTimer.stopBackgroundTimer();
    };
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.getPermissionsAsync();
      if (!granted) {
        showMessage({
          message: "Permissão Negada",
          description: "Não há permissão para gravar áudio",
          type: "danger",
        });
        return;
      }

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: undefined,
          bitsPerSecond: undefined,
        },
      });

      await newRecording.startAsync();
      setRecording(newRecording);
      setIsPaused(false);

      startTimeRef.current = Date.now() - elapsedTimeBeforePause * 1000;
      startTimer();
      updateNotification(elapsedTimeBeforePause);
    } catch (error) {
      showMessage({
        message: "Erro ao gravar",
        description: "Não foi possível iniciar a gravação do áudio",
        type: "danger",
      });
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          setRecordingSegments((prev) => [...prev, uri]);
          setElapsedTimeBeforePause(displayTime);
        }
        setRecording(null);
        stopTimer();
        setIsPaused(true);

        if (notificationRef.current) {
          await Notifications.dismissNotificationAsync(notificationRef.current);
          notificationRef.current = null;
        }
      }
    } catch (error) {
      showMessage({
        message: "Erro ao pausar",
        description: "Não foi possível parar a gravação do áudio",
        type: "danger",
      });
    }
  };

  const handleDiscard = async () => {
    for (const uri of recordingSegments) {
      try {
        await FileSystem.deleteAsync(uri);
      } catch (error) {
        showMessage({
          message: "Erro",
          description: "Não foi possível descartar a gravação",
          type: "danger",
        });
      }
    }

    setRecordingSegments([]);
    setElapsedTimeBeforePause(0);
    setDisplayTime(0);
    setRecordingTime(0);
    setIsPaused(false);
    setShowDiscardModal(false);
  };

  const concatenateAudioSegments = async () => {
    if (recordingSegments.length === 0) return null;
    if (recordingSegments.length === 1) return recordingSegments[0];

    try {
      const tempDirectory = `${FileSystem.cacheDirectory}temp_audio/`;
      await FileSystem.makeDirectoryAsync(tempDirectory, {
        intermediates: true,
      });

      const finalPath = `${tempDirectory}final_recording_${Date.now()}.m4a`;
      const fileList = `${tempDirectory}filelist.txt`;

      const fileListContent = recordingSegments
        .map((uri) => {
          const cleanUri = uri.replace("file://", "");
          return `file '${cleanUri}'`;
        })
        .join("\n");

      await FileSystem.writeAsStringAsync(fileList, fileListContent);

      const command = `-f concat -safe 0 -i ${fileList} -c copy ${finalPath}`;

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      await FileSystem.deleteAsync(fileList);

      if (returnCode.isValueSuccess()) {
        for (const uri of recordingSegments) {
          try {
            await FileSystem.deleteAsync(uri);
          } catch (error) {
            showMessage({
              message: "Erro",
              description: "Não foi possível deletar o segmento de áudio",
              type: "danger",
            });
          }
        }
        return finalPath;
      } else {
        showMessage({
          message: "Erro",
          description: "Falha ao juntar os segmentos de áudio",
          type: "danger",
        });
        return recordingSegments[0];
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível juntar os segmentos de áudio",
        type: "danger",
      });
      return recordingSegments[0];
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

    if (recordingSegments.length === 0) {
      showMessage({
        message: "Nenhuma gravação",
        description: "Não foi encontrada gravação para salvar.",
        type: "warning",
      });
      return;
    }

    try {
      const finalUri = await concatenateAudioSegments();
      if (!finalUri) return;

      const filename = `recording_${Date.now()}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({
        from: finalUri,
        to: newUri,
      });

      const existingRecordings = await AsyncStorage.getItem("recordings");
      const recordings = existingRecordings
        ? JSON.parse(existingRecordings)
        : [];

      recordings.push({
        uri: newUri,
        timestamp: Date.now(),
        duration: displayTime,
        vocalizationId: selectedVocalizationId,
        vocalizationName: vocalizations.find(
          (v) => v.id === selectedVocalizationId
        )?.nome,
        status: "pending",
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));

      setRecordingSegments([]);
      setElapsedTimeBeforePause(0);
      setDisplayTime(0);
      setRecordingTime(0);
      setIsPaused(false);
      setShowVocalizationModal(false);

      await AsyncStorage.removeItem("recordingStartTime");
      await AsyncStorage.removeItem("isRecording");
      await AsyncStorage.removeItem("elapsedTimeBeforePause");

      router.push("/audios");
    } catch (error) {
      showMessage({
        message: "Erro ao salvar",
        description: "Não foi possível salvar o áudio",
        type: "danger",
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerSection}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Tempo de Gravação</Text>
          <Text style={styles.timer}>{formatTime(displayTime)}</Text>
          {recording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Gravando</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controlContainer}>
        {isPaused && (
          <Pressable
            onPress={() => setShowDiscardModal(true)}
            style={({ pressed }) => [
              styles.controlButton,
              styles.discardButton,
              pressed && styles.buttonPressed
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
            recording && styles.recordingButton,
            pressed && styles.buttonPressed
          ]}
          onPress={recording ? stopRecording : startRecording}
        >
          <MaterialIcons
            name={recording ? "pause" : isPaused ? "play-arrow" : "mic"}
            size={40}
            color="white"
          />
          <Text style={styles.buttonText}>
            {recording ? "Pausar" : isPaused ? "Continuar" : "Gravar"}
          </Text>
        </Pressable>

        {isPaused && (
          <Pressable
            onPress={openVocalizationModal}
            style={({ pressed }) => [
              styles.controlButton,
              styles.saveButton,
              pressed && styles.buttonPressed
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
              <Select
                label="Tipo de Vocalização"
                selectedValue={selectedVocalizationId?.toString() || ""}
                onValueChange={(itemValue) =>
                  setSelectedVocalizationId(Number(itemValue))
                }
                options={vocalizations.map((voc) => ({
                  label: translateVocalization[voc.nome] || voc.nome,
                  value: voc.id.toString(),
                }))}
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
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#666',
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2196F3',
    fontVariant: ['tabular-nums'],
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  recordingText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    minWidth: 96,
  },
  recordButton: {
    backgroundColor: '#2196F3',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  discardButton: {
    backgroundColor: '#757575',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
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