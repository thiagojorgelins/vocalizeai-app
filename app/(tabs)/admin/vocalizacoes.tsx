import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import {
  createVocalizacoes,
  deleteVocalizacoes,
  getVocalizacoes,
  updateVocalizacoes,
} from "@/services/vocalizacoesService";
import { Vocalizacao } from "@/types/Vocalizacao";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { getRole } from "@/services/util";

export default function VocalizacoesScreen() {
  const [vocalizacoes, setVocalizacoes] = useState<Vocalizacao[]>([]);
  const [selectedVocalizacao, setSelectedVocalizacao] = useState<Vocalizacao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = useCallback(async () => {
    try {
      const role = await getRole();
      setIsAdmin(role === "admin");
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível verificar a permissão de administrador",
        type: "danger", 
      })
      setIsAdmin(false);
    }
  }, []);

  const fetchVocalizacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const vocalizacaosList = await getVocalizacoes();
      setVocalizacoes(vocalizacaosList);
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: error.message || "Não foi possível carregar as vocalizações",
        type: "danger",
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

  const handleEdit = (vocalizacao: Vocalizacao) => {
    if (!isAdmin) {
      showMessage({
        message: "Acesso Negado",
        description: "Você não tem permissão para editar vocalizações",
        type: "warning",
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
      showMessage({
        message: "Erro",
        description: "O nome é obrigatório",
        type: "warning",
      });
      return false;
    }
    if (!descricao.trim()) {
      showMessage({
        message: "Erro",
        description: "A descrição é obrigatória",
        type: "warning",
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
        await updateVocalizacoes(selectedVocalizacao.id.toString(), {
          ...selectedVocalizacao,
          nome: nome.trim(),
          descricao: descricao.trim(),
        });

        showMessage({
          message: "Sucesso",
          description: "Vocalização atualizada com sucesso!",
          type: "success",
        });
      } else {
        await createVocalizacoes(nome.trim(), descricao.trim());

        showMessage({
          message: "Sucesso",
          description: "Vocalização criada com sucesso!",
          type: "success",
        });
      }

      setShowModal(false);
      fetchVocalizacoes();
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: error.message,
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVocalizacao) return;

    setIsLoading(true);
    try {
      await deleteVocalizacoes(selectedVocalizacao.id.toString());

      showMessage({
        message: "Sucesso",
        description: "Vocalização deletada com sucesso!",
        type: "success",
      });

      setShowConfirmModal(false);
      fetchVocalizacoes();
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: error.message,
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    if (!isAdmin) {
      showMessage({
        message: "Acesso Negado",
        description: "Você não tem permissão para adicionar vocalizações",
        type: "warning",
      });
      return;
    }
    setSelectedVocalizacao(null);
    setNome("");
    setDescricao("");
    setShowModal(true);
  };

  const renderVocalizacoes = ({ item }: { item: Vocalizacao }) => (
    <View style={styles.vocalizationContainer}>
      <View style={styles.vocalizationContent}>
        <View style={styles.vocalizationHeader}>
          <Text style={styles.vocalizationName}>{item.nome}</Text>
          {isAdmin && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => handleEdit(item)}
                style={styles.iconButton}
              >
                <MaterialIcons name="edit" size={24} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSelectedVocalizacao(item);
                  setShowConfirmModal(true);
                }}
                style={styles.iconButton}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.vocalizationDescription}>{item.descricao}</Text>
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
      {isAdmin && (
        <ButtonCustom
          title="Adicionar Rótulo de vocalização"
          onPress={handleAdd}
          color="#2196F3"
          style={styles.addButton}
          icon={<MaterialIcons name="add" size={12} color="#FFF" />}
        />
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
              label="Nome"
              maxLength={50}
              showCharacterCount={true}
              value={nome}
              onChangeText={setNome}
              placeholder="Digite o nome da vocalização"
              editable={!isLoading}
            />

            <Input
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              style={styles.descriptionInput}
              placeholder="Digite a descrição da vocalização"
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
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  addButton: {
    marginBottom: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  vocalizationContainer: {
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vocalizationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  vocalizationDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
    gap: 16
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
  descriptionInput: {
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: 24,
  },
});