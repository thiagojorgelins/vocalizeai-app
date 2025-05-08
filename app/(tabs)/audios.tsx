import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import VocalizationSelect from "@/components/VocalizationSelect";
import { uploadAudioFile } from "@/services/audioService";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { AudioRecording } from "@/types/AudioRecording";
import { Vocalizacao } from "@/types/Vocalizacao";
import FileOperations from "@/utils/FileOperations";
import translateVocalization from "@/utils/TranslateVocalization";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function AudiosScreen() {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] =
    useState<AudioRecording | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [selectedVocalizationId, setSelectedVocalizationId] = useState<
    number | null
  >(null);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [showConfirmBatchSendModal, setShowConfirmBatchSendModal] =
    useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] =
    useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  const stopAudioPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingUri(null);
      } catch (error) {
        Toast.show({
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao parar a reprodução de áudio",
          type: "error",
        })
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecordings();
      return () => {
        stopAudioPlayback();
      };
    }, [])
  );

  async function fetchRecordings() {
    try {
      const storedRecordings = await AsyncStorage.getItem("recordings");
      if (storedRecordings) {
        setRecordings(JSON.parse(storedRecordings));
      }
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao carregar gravações",
        type: "error",
      })
    } finally {
      setLoadingVocalizations(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  async function handleDeleteAllAudios() {
    if (recordings.length === 0) {
      Toast.show({
        text1: "Informação",
        text2: "Não há áudios para excluir",
        type: "info",
      })
      setShowConfirmDeleteAllModal(false);
      return;
    }

    setDeletingAll(true);
    try {
      await stopAudioPlayback();

      try {
        await FileOperations.cleanAudioDirectory();
      } catch (error) {
        Toast.show({
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao limpar diretório de áudio",
          type: "error",
        })
      }

      setRecordings([]);
      await AsyncStorage.setItem("recordings", JSON.stringify([]));

      setShowConfirmDeleteAllModal(false);

      Toast.show({
        text1: "Sucesso",
        text2: "Todos os áudios foram removidos com sucesso!",
        type: "success",
      })
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao excluir todos os áudios",
        type: "error",
      })
    } finally {
      setDeletingAll(false);
    }
  }

  async function handlePlayAudio(uri: string) {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;

        if (playingUri === uri) {
          setPlayingUri(null);
          return;
        }
      }

      const properUri = uri.startsWith("file://") ? uri : `file://${uri}`;

      const fileInfo = await FileSystem.getInfoAsync(properUri);

      if (!fileInfo.exists) {
        throw new Error("Arquivo não existe");
      }

      if (fileInfo.size === 0) {
        throw new Error("O arquivo está vazio ou corrompido");
      }

      const soundObject = new Audio.Sound();

      try {
        await soundObject.loadAsync(
          { uri: properUri },
          { progressUpdateIntervalMillis: 500 }
        );

        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingUri(null);
            soundObject.unloadAsync();
            soundRef.current = null;
          }

          if (!status.isLoaded && "error" in status) {
            setPlayingUri(null);
            soundObject.unloadAsync();
            soundRef.current = null;
            Toast.show({
              text1: "Erro",
              text2: `Erro de reprodução: ${status.error}`,
              type: "error",
            })
          }
        });

        await soundObject.playAsync();

        soundRef.current = soundObject;
        setPlayingUri(uri);
      } catch (error) {
        Toast.show({
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao carregar áudio",
          type: "error",
        })
        if (error instanceof Error) {
          throw new Error(`Não foi possível carregar áudio: ${error.message}`);
        } else {
          throw new Error(
            "Não foi possível carregar áudio: ocorreu um erro desconhecido"
          );
        }
      }
    } catch (error) {
      setPlayingUri(null);
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao reproduzir áudio",
        type: "error",
      })
    }
  }

  async function handleDeleteAudio(recording: AudioRecording) {
    try {
      if (playingUri === recording.uri) {
        await stopAudioPlayback();
      }

      const uriTimestamp = recording.uri.match(/recording_(\d+)/);
      const timestampInFilename = uriTimestamp ? uriTimestamp[1] : null;

      let deleted = false;

      try {
        const audioDir = await FileOperations.getAudioDirectory();

        if (Platform.OS === "android") {
          try {
            let matchingFile = null;

            if (timestampInFilename) {
              const pattern = new RegExp(
                `recording_${timestampInFilename.substring(0, 8)}`
              );

              const dirInfo = await FileSystem.getInfoAsync(audioDir);

              if (dirInfo.exists && dirInfo.isDirectory) {
                const files = await FileSystem.readDirectoryAsync(audioDir);

                for (const file of files) {
                  if (pattern.test(file)) {
                    matchingFile = file;
                    break;
                  }
                }
              }
            }

            if (matchingFile) {
              const filePath = `${audioDir}/${matchingFile}`;

              try {
                deleted = await FileOperations.deleteFile(filePath);

                if (!deleted) {
                  await FileSystem.deleteAsync(filePath, { idempotent: true });
                  deleted = true;
                }
              } catch (fileError) {
                Toast.show({
                  text1: fileError instanceof Error ? fileError.message : "Erro",
                  text2: "Erro ao excluir arquivo específico",
                  type: "error",
                })
              }
            } else {
              Toast.show({
                text1: "Erro",
                text2: "Não foi possível encontrar o arquivo de áudio",
                type: "error",
              })
            }
          } catch (error) {
            Toast.show({
              text1: error instanceof Error ? error.message : "Erro",
              text2: "Erro ao acessar o diretório de áudio",
              type: "error",
            })
          }
        } else {
          try {
            await FileSystem.deleteAsync(recording.uri, { idempotent: true });
            deleted = true;
          } catch (error) {
            Toast.show({
              text1: error instanceof Error ? error.message : "Erro",
              text2: "Erro ao excluir o arquivo de áudio",
              type: "error",
            })
          }
        }
      } catch (error) {
        Toast.show({
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao acessar o diretório de áudio",
          type: "error",
        })
      }

      const updated = recordings.filter(
        (item) => item.timestamp !== recording.timestamp
      );

      setRecordings(updated);
      await AsyncStorage.setItem("recordings", JSON.stringify(updated));
      setShowOptionsModal(false);
      setShowConfirmDeleteModal(false);
      setSelectedRecording(null);

      if (deleted) {
        Toast.show({
          text1: "Sucesso",
          text2: "Áudio excluído com sucesso!",
          type: "success",
        })
      } else {
        Toast.show({
          text1: "Atenção",
          text2: "O áudio foi removido da lista, mas não foi possível excluir o arquivo.",
          type: "info",
        })
      }
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao excluir o áudio",
        type: "error",
      })
    }
  }

  async function handleUpdateVocalizationId() {
    if (!selectedRecording || !selectedVocalizationId) return;

    try {
      const vocalization = vocalizations.find(
        (voc) => voc.id === selectedVocalizationId
      );

      const updatedList = recordings.map((rec) => {
        if (rec.timestamp === selectedRecording.timestamp) {
          return {
            ...rec,
            vocalizationId: selectedVocalizationId,
            vocalizationName: vocalization?.nome || "",
          };
        }
        return rec;
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(updatedList));
      setRecordings(updatedList);

      Toast.show({
        text1: "Sucesso",
        text2: "Vocalização atualizada com sucesso!",
        type: "success",
      })

      setShowUpdateConfirmModal(false);
      setShowOptionsModal(false);
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao atualizar vocalização",
        type: "error",
      })
    }
  }

  async function fetchVocalizations() {
    setLoadingVocalizations(true);
    try {
      const vocalizations = await getVocalizacoes();
      setVocalizations(vocalizations);
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao carregar vocalizações",
        type: "error",
      })
    } finally {
      setLoadingVocalizations(false);
    }
  }

  async function handleUpload(idVocalizacao: number, fileUri: string) {
    setSendingAudio(true);
    try {
      await uploadAudioFile(idVocalizacao, fileUri);

      if (selectedRecording) {
        const updateRecordings = recordings.map((rec) => {
          if (rec.timestamp === selectedRecording.timestamp) {
            return { ...rec, status: "sent" };
          }
          return rec;
        });
        setRecordings(updateRecordings);
        await AsyncStorage.setItem(
          "recordings",
          JSON.stringify(updateRecordings)
        );
        setShowOptionsModal(false);
      }
      Toast.show({
        text1: "Sucesso",
        text2: "Áudio enviado com sucesso!",
        type: "success",
      })
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao enviar áudio",
        type: "error",
      })
    } finally {
      setSendingAudio(false);
    }
  }

  async function handlePressRecording(rec: AudioRecording) {
    if (vocalizations.length === 0) {
      await fetchVocalizations();
    }
    setSelectedRecording(rec);
    setSelectedVocalizationId(rec.vocalizationId);
    setShowOptionsModal(true);
  }

  async function handleBatchUpload() {
    const pendingRecordings = recordings.filter(
      (recording) => recording.status !== "sent"
    );

    if (pendingRecordings.length === 0) {
      Toast.show({
        text1: "Informação",
        text2: "Não há áudios pendentes para enviar",
        type: "info",
      })
      setShowConfirmBatchSendModal(false);
      return;
    }

    setSendingBatch(true);
    setShowConfirmBatchSendModal(false);

    let successCount = 0;
    let errorCount = 0;
    let updatedRecordingsList = [...recordings];

    try {
      for (const recording of pendingRecordings) {
        try {
          await uploadAudioFile(recording.vocalizationId, recording.uri);
          successCount++;

          updatedRecordingsList = updatedRecordingsList.map((rec) => {
            if (rec.timestamp === recording.timestamp) {
              return { ...rec, status: "sent" };
            }
            return rec;
          });

          setRecordings(updatedRecordingsList);
          await AsyncStorage.setItem(
            "recordings",
            JSON.stringify(updatedRecordingsList)
          );
        } catch (error) {
          Toast.show({
            text1: error instanceof Error ? error.message : "Erro",
            text2: `Erro ao enviar áudio ${recording.uri}`,
            type: "error",
          })
          errorCount++;
        }
      }

      if (successCount > 0 && errorCount === 0) {
        Toast.show({
          text1: "Sucesso",
          text2: "Todos os áudios enviados com sucesso!",
          type: "success",
        })
      } else if (successCount > 0 && errorCount > 0) {
        Toast.show({
          text1: "Informação",
          text2: `${successCount} áudio(s) enviado(s) com sucesso e ${errorCount} falha(s)`,
          type: "info",
        })
      } else {
        Toast.show({
          text1: "Erro",
          text2: "Nenhum áudio foi enviado",
          type: "error",
        })
      }
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao processar o envio em lote",
        type: "error",
      })
    } finally {
      setSendingBatch(false);
    }
  }

  const getPendingCount = () => {
    return recordings.filter((recording) => recording.status !== "sent").length;
  };

  const renderRecording = ({ item }: { item: AudioRecording }) => {
    const isSent = item.status === "sent";
    const isPlaying = playingUri === item.uri;

    return (
      <TouchableOpacity onPress={() => handlePressRecording(item)}>
        <View
          style={[
            styles.recordingItem,
            isSent ? styles.sentRecording : styles.pendingRecording,
          ]}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="audio-file"
              size={40}
              color={isSent ? "white" : "#666"}
            />
          </View>

          <View style={styles.recordingInfo}>
            <Text
              style={[styles.recordingName, isSent && styles.sentText]}
              numberOfLines={1}
            >
              {item.uri.split("/").pop()?.split("_")[1] || "Gravação"}
            </Text>

            <Text
              style={[styles.recordingType, isSent && styles.sentText]}
              numberOfLines={1}
            >
              {translateVocalization[item.vocalizationName] ||
                item.vocalizationName}
            </Text>

            <Text style={[styles.recordingDate, isSent && styles.sentText]}>
              {new Date(item.timestamp).toLocaleString("pt-BR")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayAudio(item.uri)}
          >
            <MaterialIcons
              name={isPlaying ? "pause" : "play-arrow"}
              size={24}
              color={isSent ? "white" : "#666"}
            />
            <Text
              style={[
                styles.durationText,
                isSent && styles.sentText,
                isPlaying && styles.playingText,
              ]}
            >
              {formatTime(item.duration)}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.pendingLegend]} />
        <Text style={styles.legendText}>Pendente de envio</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.sentLegend]} />
        <Text style={styles.legendText}>Enviado</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Áudios Gravados</Text>
        <TouchableOpacity
          onPress={() => setShowConfirmDeleteAllModal(true)}
          style={styles.deleteAllButton}
          disabled={recordings.length === 0 || deletingAll}
        >
          <MaterialIcons
            name="delete"
            size={24}
            color={recordings.length === 0 ? "#ccc" : "#F44336"}
          />
        </TouchableOpacity>
      </View>

      <ButtonCustom
        title={`Enviar Todos os Áudios (${getPendingCount()})`}
        onPress={() => setShowConfirmBatchSendModal(true)}
        color="#2196F3"
        style={styles.batchUploadButton}
        icon={<MaterialIcons name="cloud-upload" size={20} color="#FFF" />}
        disabled={getPendingCount() === 0 || sendingBatch}
      />

      {renderLegend()}

      {sendingBatch && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Enviando áudios...</Text>
        </View>
      )}

      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={(item) => item.timestamp.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="audiotrack" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma gravação encontrada</Text>
            <Text style={styles.emptySubtext}>
              Grave áudios na tela inicial para visualizá-los aqui
            </Text>
          </View>
        }
        contentContainerStyle={
          recordings.length === 0 ? { flex: 1, justifyContent: "center" } : {}
        }
      />

      <ConfirmationModal
        visible={showUpdateConfirmModal}
        onCancel={() => setShowUpdateConfirmModal(false)}
        onConfirm={handleUpdateVocalizationId}
        message="Confirma a atualização da vocalização?"
      />

      <ConfirmationModal
        visible={showConfirmDeleteModal}
        onCancel={() => setShowConfirmDeleteModal(false)}
        onConfirm={() =>
          selectedRecording && handleDeleteAudio(selectedRecording)
        }
        message="Tem certeza que deseja excluir a gravação?"
      />

      <ConfirmationModal
        visible={showConfirmBatchSendModal}
        onCancel={() => setShowConfirmBatchSendModal(false)}
        onConfirm={handleBatchUpload}
        message={`Deseja enviar os ${getPendingCount()} áudios pendentes?`}
      />

      <ConfirmationModal
        visible={showConfirmDeleteAllModal}
        onCancel={() => setShowConfirmDeleteAllModal(false)}
        onConfirm={() => handleDeleteAllAudios()}
        message="Tem certeza que deseja excluir TODOS os áudios? Esta ação não pode ser desfeita."
        confirmText={deletingAll ? "Excluindo..." : "Excluir Todos"}
        confirmDisabled={deletingAll}
        confirmIcon={
          deletingAll ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialIcons name="delete-forever" size={20} color="#FFF" />
          )
        }
      />

      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dados da Gravação</Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                style={styles.modalClose}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRecording && (
              <View style={styles.recordingDetailCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {new Date(selectedRecording.timestamp).toLocaleString(
                      "pt-BR"
                    )}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="timer" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {formatTime(selectedRecording.duration)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="label" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {translateVocalization[
                      selectedRecording.vocalizationName
                    ] || selectedRecording.vocalizationName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name={
                      selectedRecording.status === "sent"
                        ? "cloud-done"
                        : "cloud-upload"
                    }
                    size={20}
                    color={
                      selectedRecording.status === "sent" ? "#4CAF50" : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.infoText,
                      selectedRecording.status === "sent" && {
                        color: "#4CAF50",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {selectedRecording.status === "sent"
                      ? "Enviado"
                      : "Pendente de envio"}
                  </Text>
                </View>
              </View>
            )}

            {loadingVocalizations ? (
              <ActivityIndicator
                size="large"
                color="#2196F3"
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.selectContainer}>
                <VocalizationSelect
                  vocalizations={vocalizations}
                  selectedVocalizationId={selectedVocalizationId}
                  onValueChange={(value) => setSelectedVocalizationId(value)}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Atualizar Tipo da Vocalização"
                onPress={() => setShowUpdateConfirmModal(true)}
                color="#2196F3"
                style={styles.actionButton}
                icon={<MaterialIcons name="edit" size={20} color="#FFF" />}
                disabled={selectedRecording?.status === "sent"}
              />

              <ButtonCustom
                title={sendingAudio ? "Enviando..." : "Enviar Áudio"}
                onPress={() =>
                  selectedRecording &&
                  handleUpload(
                    selectedRecording.vocalizationId,
                    selectedRecording.uri
                  )
                }
                color="#4CAF50"
                style={styles.actionButton}
                icon={
                  sendingAudio ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialIcons name="cloud-upload" size={20} color="#FFF" />
                  )
                }
                disabled={selectedRecording?.status === "sent" || sendingAudio}
              />

              <ButtonCustom
                title="Excluir Áudio"
                onPress={() => setShowConfirmDeleteModal(true)}
                color="#F44336"
                style={styles.actionButton}
                icon={<MaterialIcons name="delete" size={20} color="#FFF" />}
              />
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
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  batchUploadButton: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: "#2196F3",
    fontWeight: "500",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    elevation: 2
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
  pendingLegend: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sentLegend: {
    backgroundColor: "#26ba2d",
  },
  recordingItem: {
    flexDirection: "row",
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
  },
  pendingRecording: {
    backgroundColor: "#FFFFFF",
  },
  sentRecording: {
    backgroundColor: "#26ba2d",
  },
  iconContainer: {
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  recordingName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  recordingType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  recordingDate: {
    fontSize: 12,
    color: "#888",
  },
  sentText: {
    color: "#fff",
  },
  playingText: {
    fontWeight: "bold",
  },
  playButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 40,
  },
  durationText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
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
  recordingDetailCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  selectContainer: {
    marginBottom: 20,
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 0,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  deleteAllButton: {
    padding: 8,
    borderRadius: 20,
  },
});
