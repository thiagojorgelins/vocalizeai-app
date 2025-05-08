import ConfirmationModal from "@/components/ConfirmationModal";
import VocalizationSelect from "@/components/VocalizationSelect";
import {
  deleteAudio,
  getAudioPlayUrl,
  listAudiosByParticipante,
  updateAudio,
} from "@/services/audioService";
import { getUserById } from "@/services/usuarioService";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { AudioItem } from "@/types/Audio";
import { Vocalizacao } from "@/types/Vocalizacao";
import translateVocalization from "@/utils/TranslateVocalization";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { getParticipantesByUsuario } from "@/services/participanteService";

export default function AudiosUsuarioScreen() {
  const { id, participanteId, fromScreen } = useLocalSearchParams();
  const userId = typeof id === "string" ? id : "";

  const [userName, setUserName] = useState<string>("Usuário");
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const [selectedVocalizationId, setSelectedVocalizationId] = useState<
    number | null
  >(null);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [updatingAudio, setUpdatingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<any | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"participantes" | "audios">(
    "participantes"
  );

  const fetchUserName = useCallback(async () => {
    if (!userId) return;

    try {
      const userData = await getUserById(Number(userId));
      setUserName(userData?.nome || "Usuário");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao carregar nome do usuário",
      });
    }
  }, [userId]);

  const fetchParticipantes = useCallback(async () => {
    if (!userId) {
      setError("ID do usuário não fornecido");
      return;
    }

    setLoadingParticipantes(true);
    try {
      const participantesList = await getParticipantesByUsuario(userId);
      setParticipantes(participantesList);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar participantes",
        text2: error?.message || "Tente novamente mais tarde",
      });
    } finally {
      setLoadingParticipantes(false);
    }
  }, [userId]);

  const fetchAudiosByParticipante = useCallback(
    async (participanteId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const audiosList = await listAudiosByParticipante(participanteId);
        setAudios(audiosList);
      } catch (error: any) {
        setError(error?.message || "Erro ao carregar áudios");

        Toast.show({
          type: "error",
          text1: "Erro ao carregar áudios",
          text2: error?.message || "Tente novamente mais tarde",
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchVocalizations = async () => {
    setLoadingVocalizations(true);
    try {
      const vocalizationsList = await getVocalizacoes();
      setVocalizations(vocalizationsList);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao carregar vocalizações",
      });
    } finally {
      setLoadingVocalizations(false);
    }
  };

  const stopAudioPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingAudioId(null);
      } catch (error) {
        Toast.show({
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Erro ao parar a reprodução de áudio",
          type: "error",
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  useEffect(() => {
    if (participanteId && participantes.length > 0) {
      const participant = participantes.find(
        p => p.id.toString() === participanteId.toString()
      );
      if (participant) {
        handleSelectParticipante(participant);
      }
    }
  }, [participanteId, participantes]);

  useFocusEffect(
    useCallback(() => {
      fetchUserName();
      fetchParticipantes();
      fetchVocalizations();

      return () => {
        stopAudioPlayback();
      };
    }, [fetchUserName, fetchParticipantes])
  );

  const handleDeleteAudio = async () => {
    if (!selectedAudio) return;

    setIsLoading(true);
    try {
      if (playingAudioId === selectedAudio.id) {
        await stopAudioPlayback();
      }

      await deleteAudio(selectedAudio.id);

      Toast.show({
        type: "success",
        text1: "Áudio excluído com sucesso",
      });

      setShowConfirmModal(false);
      setShowOptionsModal(false);

      if (selectedParticipante) {
        fetchAudiosByParticipante(selectedParticipante.id);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao excluir áudio",
        text2: error?.message || "Tente novamente mais tarde",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVocalization = async () => {
    if (!selectedAudio || !selectedVocalizationId) {
      Toast.show({
        type: "error",
        text1: "Erro ao atualizar vocalização",
        text2: "Áudio ou vocalização não selecionados",
      });
      return;
    }

    setUpdatingAudio(true);
    try {
      const vocalization = vocalizations.find(
        (voc) => voc.id === selectedVocalizationId
      );

      if (!vocalization) {
        throw new Error("Vocalização não encontrada");
      }

      await updateAudio(selectedAudio.id, {
        id_vocalizacao: selectedVocalizationId,
      });

      Toast.show({
        type: "success",
        text1: "Vocalização atualizada com sucesso",
      });

      setShowUpdateConfirmModal(false);
      setShowOptionsModal(false);

      if (selectedParticipante) {
        fetchAudiosByParticipante(selectedParticipante.id);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao atualizar vocalização",
      });
    } finally {
      setUpdatingAudio(false);
    }
  };

  const handlePlayAudio = async (audioId: number) => {
    try {
      if (playingAudioId === audioId && soundRef.current) {
        await stopAudioPlayback();
        return;
      }

      if (soundRef.current) {
        await stopAudioPlayback();
      }

      const audioUrl = await getAudioPlayUrl(audioId);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { progressUpdateIntervalMillis: 500 }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          newSound.unloadAsync();
          soundRef.current = null;
        }
      });

      await newSound.playAsync();
      soundRef.current = newSound;
      setPlayingAudioId(audioId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao reproduzir áudio",
        text2: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const handlePressAudio = (audio: AudioItem) => {
    if (vocalizations.length === 0) {
      fetchVocalizations();
    }
    setSelectedAudio(audio);
    setSelectedVocalizationId(audio.id_vocalizacao);
    setShowOptionsModal(true);
  };

  const handleSelectParticipante = (participante: any) => {
    setSelectedParticipante(participante);
    fetchAudiosByParticipante(participante.id);
    setViewMode("audios");
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Data não disponível";
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Data inválida";
    }
  };

  const getVocalizationName = (id_vocalizacao: number) => {
    const vocalization = vocalizations.find((v) => v.id === id_vocalizacao);
    return vocalization?.nome || "Desconhecida";
  };

  const renderAudioItem = ({ item }: { item: AudioItem }) => {
    const fileName =
      typeof item.nome_arquivo === "string" ? item.nome_arquivo : "Sem nome";
    const createdDate = formatDate(item.created_at || "");
    const isPlaying = playingAudioId === item.id;
    const vocalizationName = getVocalizationName(item.id_vocalizacao);
    const translatedName =
      translateVocalization[vocalizationName] || vocalizationName;

    return (
      <TouchableOpacity onPress={() => handlePressAudio(item)}>
        <View style={styles.audioContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="audio-file" size={40} color="#666" />
          </View>
          <View style={styles.audioInfo}>
            <Text style={styles.audioName} numberOfLines={1}>
              {fileName}
            </Text>
            <Text style={styles.vocalizationName} numberOfLines={1}>
              {translatedName}
            </Text>
            <Text style={styles.dateText}>{createdDate}</Text>
          </View>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayAudio(item.id)}
          >
            <MaterialIcons
              name={isPlaying ? "pause" : "play-arrow"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderParticipanteItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity onPress={() => handleSelectParticipante(item)}>
        <View style={styles.participanteContainer}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={30} color="#2196F3" />
          </View>
          <View style={styles.participanteInfo}>
            <Text style={styles.participanteName}>
              {item.nome || `Participante ${item.id}`}
            </Text>
            <Text style={styles.participanteDetails}>
              {item.genero}, {item.idade} anos
            </Text>
            <Text style={styles.participanteDetails}>
              {item.nivel_suporte === 0
                ? "Nível não informado"
                : `Nível ${item.nivel_suporte}`}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  const ErrorView = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={48} color="#F44336" />
      <Text style={styles.errorText}>{error}</Text>
      <View style={styles.errorButtonRow}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            viewMode === "participantes"
              ? fetchParticipantes()
              : fetchAudiosByParticipante(selectedParticipante?.id)
          }
          disabled={isLoading}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (viewMode === "audios") {
              setViewMode("participantes");
              setSelectedParticipante(null);
            } else if (fromScreen === "usuarios") {
              router.push("/admin/usuarios");
            } else if (fromScreen === "participantes") {
              router.push("/(tabs)/admin/participantes");
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => {
    if (viewMode === "participantes") {
      return (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => {
              if (fromScreen === "usuarios") {
                router.push("/admin/usuarios");
              } else if (fromScreen === "participantes") {
                router.push("/(tabs)/admin/participantes");
              } else {
                router.back();
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Participantes de {userName}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => {
              setViewMode("participantes");
              setSelectedParticipante(null);
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            Áudios de {selectedParticipante?.nome || "Participante"}
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {viewMode === "participantes" ? (
        loadingParticipantes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Carregando participantes...</Text>
          </View>
        ) : error ? (
          <ErrorView />
        ) : (
          <FlatList
            data={participantes}
            renderItem={renderParticipanteItem}
            keyExtractor={(item) => `participante-${item.id}`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people" size={48} color="#666" />
                <Text style={styles.emptyText}>
                  Não há participantes cadastrados para este usuário
                </Text>
              </View>
            }
            contentContainerStyle={
              participantes.length === 0
                ? { flex: 1, justifyContent: "center" }
                : styles.listContainer
            }
            refreshing={loadingParticipantes}
            onRefresh={fetchParticipantes}
          />
        )
      ) : 
      isLoading && audios.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando áudios...</Text>
        </View>
      ) : error ? (
        <ErrorView />
      ) : (
        <FlatList
          data={audios}
          renderItem={renderAudioItem}
          keyExtractor={(item) => `audio-${item.id}`}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="audiotrack" size={48} color="#666" />
              <Text style={styles.emptyText}>
                Não há áudios para este participante
              </Text>
            </View>
          }
          contentContainerStyle={
            audios.length === 0
              ? { flex: 1, justifyContent: "center" }
              : styles.listContainer
          }
          refreshing={isLoading}
          onRefresh={() => fetchAudiosByParticipante(selectedParticipante?.id)}
        />
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteAudio}
        message="Tem certeza que deseja excluir este áudio?"
      />

      <ConfirmationModal
        visible={showUpdateConfirmModal}
        onCancel={() => setShowUpdateConfirmModal(false)}
        onConfirm={handleUpdateVocalization}
        message="Confirma a atualização da vocalização? Isso alterará o nome do arquivo no servidor."
        confirmText={updatingAudio ? "Atualizando..." : "Confirmar"}
        confirmDisabled={updatingAudio}
        confirmIcon={
          updatingAudio ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialIcons name="check" size={20} color="#FFF" />
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
              <Text style={styles.modalTitle}>Dados do Áudio</Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                style={styles.modalClose}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedAudio && (
              <View style={styles.recordingDetailCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="insert-drive-file"
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.infoText}>
                    {selectedAudio.nome_arquivo}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {formatDate(selectedAudio.created_at || "")}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="label" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {translateVocalization[
                      getVocalizationName(selectedAudio.id_vocalizacao)
                    ] || getVocalizationName(selectedAudio.id_vocalizacao)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Participante:{" "}
                    {selectedParticipante?.nome ||
                      `ID: ${selectedAudio.id_participante}`}
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
                <Text style={styles.selectLabel}>
                  Alterar Tipo de Vocalização:
                </Text>
                <VocalizationSelect
                  vocalizations={vocalizations}
                  selectedVocalizationId={selectedVocalizationId}
                  onValueChange={(value) => setSelectedVocalizationId(value)}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowUpdateConfirmModal(true)}
              >
                <MaterialIcons name="edit" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  Atualizar Vocalização
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                onPress={() =>
                  selectedAudio && handlePlayAudio(selectedAudio.id)
                }
              >
                <MaterialIcons
                  name={
                    playingAudioId === selectedAudio?.id
                      ? "pause"
                      : "play-arrow"
                  }
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.actionButtonText}>
                  {playingAudioId === selectedAudio?.id
                    ? "Pausar"
                    : "Reproduzir"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#F44336" }]}
                onPress={() => setShowConfirmModal(true)}
              >
                <MaterialIcons name="delete" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Excluir Áudio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backIcon: {
    marginRight: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  audioContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  participanteContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  participanteInfo: {
    flex: 1,
  },
  participanteName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  participanteDetails: {
    fontSize: 14,
    color: "#666666",
  },
  iconContainer: {
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  audioName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  vocalizationName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
  },
  playButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    width: 40,
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  errorButtonRow: {
    flexDirection: "row",
    gap: 16,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  backButtonText: {
    color: "#666666",
    fontWeight: "600",
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
  selectLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
