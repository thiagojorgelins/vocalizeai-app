import ConfirmationModal from "@/components/ConfirmationModal";
import { deleteAudio, listAudiosByUser } from "@/services/audioService";
import { getUserById } from "@/services/usuarioService";
import { AudioItem } from "@/types/Audio";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function AudiosUsuarioScreen() {
  const { id } = useLocalSearchParams();
  const userId = typeof id === "string" ? id : "";

  const [userName, setUserName] = useState<string>("Usuário");
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const fetchAudios = useCallback(async () => {
    if (!userId) {
      setError("ID do usuário não fornecido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const audiosList = await listAudiosByUser(Number(userId));
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
  }, [userId]);

  const handleDeleteAudio = async () => {
    if (!selectedAudio) return;

    setIsLoading(true);
    try {
      await deleteAudio(selectedAudio.id);

      Toast.show({
        type: "success",
        text1: "Áudio excluído com sucesso",
      });

      setShowConfirmModal(false);
      fetchAudios();
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

  useFocusEffect(
    useCallback(() => {
      fetchUserName();
      fetchAudios();
    }, [fetchUserName, fetchAudios])
  );

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

  const renderAudioItem = ({ item }: { item: AudioItem }) => {
    const fileName =
      typeof item.nome_arquivo === "string" ? item.nome_arquivo : "Sem nome";
    const createdDate = formatDate(item.created_at || "");

    return (
      <View style={styles.audioContainer}>
        <View style={styles.audioContent}>
          <View style={styles.audioHeader}>
            <Text style={styles.audioName}>{fileName}</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedAudio(item);
                setShowConfirmModal(true);
              }}
              style={styles.iconButton}
            >
              <MaterialIcons name="delete" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
          <View style={styles.audioDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={18} color="#666" />
              <Text style={styles.detailText}>Data: {createdDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="tag" size={18} color="#666" />
              <Text style={styles.detailText}>ID: {item.id || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="mic" size={18} color="#666" />
              <Text style={styles.detailText}>
                ID Vocalização: {item.id_vocalizacao || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ErrorView = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={48} color="#F44336" />
      <Text style={styles.errorText}>{error}</Text>
      <View style={styles.errorButtonRow}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchAudios}
          disabled={isLoading}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Áudios de {userName}</Text>
      </View>

      {isLoading && audios.length === 0 ? (
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
          keyExtractor={(item, index) => `audio-${item.id || index}`}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="audiotrack" size={48} color="#666" />
              <Text style={styles.emptyText}>
                Não há áudios para este usuário
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={fetchAudios}
        />
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteAudio}
        message="Tem certeza que deseja excluir este áudio?"
      />
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
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  audioContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioContent: {
    padding: 16,
  },
  audioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  audioName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  iconButton: {
    padding: 8,
  },
  audioDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
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
});
