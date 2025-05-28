import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { getRole, getUserId } from "@/services/util";
import {
  createVocalizacoes,
  deleteVocalizacoes,
  getVocalizacoes,
  updateVocalizacoes,
} from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import translateVocalization from "@/utils/TranslateVocalization";
import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function VocalizacoesScreen() {
  const [vocalizacoes, setVocalizacoes] = useState<Vocalizacao[]>([]);
  const [selectedVocalizacao, setSelectedVocalizacao] =
    useState<Vocalizacao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await getUserId();
        setCurrentUserId(userId);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: error instanceof Error ? error.message : "Erro",
          text2: "Não foi possível obter o ID do usuário",
        });
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    fetchUserId();
    return () => {
      unsubscribe();
    };
  }, []);

  const checkAdminRole = useCallback(async () => {
    try {
      const role = await getRole();
      setIsAdmin(role === "admin");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Não foi possível verificar a permissão de administrador",
      });
      setIsAdmin(false);
    }
  }, []);

  const fetchVocalizacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const vocalizacaosList = await getVocalizacoes();
      setVocalizacoes(vocalizacaosList);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Não foi possível carregar as vocalizações",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAdminRole();
      fetchVocalizacoes();
    }, [])
  );

  const getTranslatedName = (name: string) => {
    return translateVocalization[name] || name;
  };

  const canEditVocalizacao = (vocalizacao: Vocalizacao) => {
    return (
      isAdmin ||
      (currentUserId && vocalizacao.id_usuario === Number(currentUserId))
    );
  };

  const handleEdit = (vocalizacao: Vocalizacao) => {
    if (!canEditVocalizacao(vocalizacao)) {
      Toast.show({
        type: "error",
        text1: "Acesso Negado",
        text2: "Você não tem permissão para editar esta vocalização",
      });
      return;
    }
    setSelectedVocalizacao(vocalizacao);
    setNome(vocalizacao.nome);
    setDescricao(vocalizacao.descricao);
    setShowModal(true);
  };

  const validateForm = () => {
    if (!nome.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "O nome é obrigatório",
      });
      return false;
    }
    if (!descricao.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "A descrição é obrigatória",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (selectedVocalizacao) {
        if (!canEditVocalizacao(selectedVocalizacao)) {
          throw new Error(
            "Você não tem permissão para editar esta vocalização"
          );
        }

        await updateVocalizacoes(selectedVocalizacao.id.toString(), {
          ...selectedVocalizacao,
          nome: nome.trim(),
          descricao: descricao.trim(),
        });

        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Vocalização atualizada com sucesso!",
        });
      } else {
        await createVocalizacoes(nome.trim(), descricao.trim());

        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Vocalização criada com sucesso!",
        });
      }

      setShowModal(false);
      fetchVocalizacoes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao tentar salvar a vocalização",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVocalizacao) return;

    if (!isAdmin) {
      Toast.show({
        type: "error",
        text1: "Acesso Negado",
        text2: "Você não tem permissão para excluir vocalizações",
      });
      return;
    }

    setIsLoading(true);
    try {
      await deleteVocalizacoes(selectedVocalizacao.id.toString());

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Vocalização deletada com sucesso!",
      });

      setShowConfirmModal(false);
      fetchVocalizacoes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao tentar deletar a vocalização",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedVocalizacao(null);
    setNome("");
    setDescricao("");
    setShowModal(true);
  };

  const renderVocalizacoes = ({ item }: { item: Vocalizacao }) => (
    <View style={styles.vocalizationContainer}>
      <View style={styles.vocalizationContent}>
        <View style={styles.vocalizationHeader}>
          <Text style={styles.vocalizationName}>
            {getTranslatedName(item.nome)}
            {item.nome !== getTranslatedName(item.nome) && (
              <Text style={styles.originalName}> ({item.nome})</Text>
            )}
          </Text>
          <View style={styles.actionButtons}>
            {canEditVocalizacao(item) && (
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={styles.iconButton}
              >
                <MaterialIcons name="edit" size={24} color="#2196F3" />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedVocalizacao(item);
                  setShowConfirmModal(true);
                }}
                style={styles.iconButton}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.vocalizationDescription}>{item.descricao}</Text>
        {item.id_usuario === Number(currentUserId) && (
          <Text style={styles.createdByUser}>(Criada por você)</Text>
        )}
      </View>
    </View>
  );

  if (isLoading && vocalizacoes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ButtonCustom
        title="Adicionar Rótulo de vocalização"
        onPress={handleAdd}
        color="#2196F3"
        style={styles.addButton}
        icon={<MaterialIcons name="add" size={12} color="#FFF" />}
        disabled={!isConnected}
      />
      {!isConnected && (
        <View style={styles.offlineMessage}>
          <MaterialIcons name="wifi-off" size={16} color="#F44336" />
          <Text style={styles.offlineText}>
            Sem conexão com internet. Algumas funções estão indisponíveis.
          </Text>
        </View>
      )}
      <FlatList
        data={vocalizacoes}
        renderItem={renderVocalizacoes}
        keyExtractor={(vocalizacao) => vocalizacao.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="library-music" size={48} color="#666" />
            <Text style={styles.emptyText}>Não há rótulos de vocalizações</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={fetchVocalizacoes}
      />

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVocalizacao
                  ? "Editar Rótulo de Vocalização"
                  : "Adicionar Rótulo de Vocalização"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Input
              label="Rótulo"
              maxLength={50}
              showCharacterCount={true}
              value={nome}
              onChangeText={setNome}
              placeholder="Digite o rótulo da vocalização"
              editable={!isLoading}
            />

            <Input
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              style={styles.descriptionInput}
              placeholder="Digite a descrição do rótulo da vocalização"
              editable={!isLoading}
            />

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Salvar"
                onPress={handleSave}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja deletar este rótulo?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  addButton: {
    marginBottom: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  vocalizationContainer: {
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
  vocalizationContent: {
    padding: 16,
  },
  vocalizationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vocalizationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  originalName: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  vocalizationDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    flexWrap: "wrap",
  },
  createdByUser: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
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
    gap: 16,
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
  descriptionInput: {
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: "top",
  },
  modalActions: {
    marginTop: 24,
  },
  offlineMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    marginLeft: 8,
    color: "#D32F2F",
    fontSize: 14,
  },
});
