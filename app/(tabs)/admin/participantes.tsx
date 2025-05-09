import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import ModalInfoNiveisAutismo from "@/components/ModalInfoNiveisAutismo";
import FormParticipante from "@/components/FormParticipante";
import {
  deleteParticipante,
  getAllParticipantes,
  updateParticipante,
} from "@/services/participanteService";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ParticipantesScreen() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [qtdPalavras, setQtdPalavras] = useState(
    "Não pronuncia nenhuma palavra"
  );
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [idadeError, setIdadeError] = useState("");
  const [nomeError, setNomeError] = useState("");

  const router = useRouter();

  const fetchParticipantes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllParticipantes();
      setParticipantes(data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Não foi possível carregar os participantes",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchParticipantes();
    }, [fetchParticipantes])
  );

  const validateIdade = (value: string) => {
    if (!value.trim()) {
      setIdadeError("A idade é obrigatória");
      return false;
    }

    const idadeNum = parseInt(value);
    if (isNaN(idadeNum) || idadeNum < 1 || idadeNum > 99) {
      setIdadeError("Idade deve estar entre 1 e 99 anos");
      return false;
    }

    setIdadeError("");
    return true;
  };

  const validateNome = (value: string) => {
    if (!value.trim()) {
      setNomeError("O nome é obrigatório");
      return false;
    }

    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(value)) {
      setNomeError("O nome deve conter apenas letras e espaços");
      return false;
    }

    setNomeError("");
    return true;
  };

  const handleEdit = (participante: any) => {
    setSelectedParticipante(participante);
    setNome(participante.nome);
    setIdade(participante.idade.toString());
    setQtdPalavras(participante.qtd_palavras);
    setGenero(participante.genero);
    setNivelSuporte(participante.nivel_suporte.toString());
    setNomeError("");
    setIdadeError("");
    setShowModal(true);
  };

  const validateForm = () => {
    return validateIdade(idade) && validateNome(nome);
  };

  const handleSave = async () => {
    if (!selectedParticipante) return;
    if (!validateForm()) return;

    try {
      setIsModalLoading(true);

      const payload: ParticipantePayload = {
        nome: nome,
        idade: parseInt(idade),
        qtd_palavras: qtdPalavras,
        genero,
        nivel_suporte: parseInt(nivelSuporte),
      };

      await updateParticipante(selectedParticipante.id.toString(), payload);

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Dados do participante atualizados com sucesso!",
      });

      setShowModal(false);
      await fetchParticipantes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao atualizar os dados do participante",
      });
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParticipante) return;

    try {
      await deleteParticipante(selectedParticipante.id.toString());

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Participante deletado com sucesso!",
      });

      setShowConfirmModal(false);
      fetchParticipantes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro",
        text2: "Erro ao deletar o participante",
      });
    }
  };

  const navigateToAudios = async (participante: any) => {
    try {
      router.push({
        pathname: "/(tabs)/admin/audios/[id]",
        params: {
          id: participante.id_usuario,
          participanteId: participante.id,
          fromScreen: "admin-participantes",
          directToAudios: "true"
        }
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível acessar os áudios",
      });
    }
  };

  const renderParticipante = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigateToAudios(item)}>
      <View style={styles.participanteContainer}>
        <View style={styles.participanteInfoContainer}>
          <View style={styles.participanteHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.participanteName}>{item.nome}</Text>
              <View style={styles.participanteBadge}>
                <MaterialIcons name="medical-services" size={16} color="#FFF" />
                <Text style={styles.participanteBadgeText}>TEA</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleEdit(item);
                }}
                style={styles.iconButton}
              >
                <MaterialIcons name="edit" size={24} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedParticipante(item);
                  setShowConfirmModal(true);
                }}
                style={styles.iconButton}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.participanteDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="cake" size={20} color="#666" />
              <Text style={styles.detailText}>{item.idade} anos</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="face" size={20} color="#666" />
              <Text style={styles.detailText}>{item.genero}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="star" size={20} color="#666" />
              <Text style={styles.detailText}>
                {item.nivel_suporte === 0
                  ? "Nível de suporte não informado"
                  : `Nível de suporte ${item.nivel_suporte}`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="record-voice-over" size={20} color="#666" />
              <Text style={styles.detailText}>{item.qtd_palavras}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={participantes}
        renderItem={renderParticipante}
        keyExtractor={(participante) => participante.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-off" size={48} color="#666" />
              <Text style={styles.emptyText}>
                Não há participantes cadastrados.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={fetchParticipantes}
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
              <Text style={styles.modalTitle}>Editar Participante</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
                disabled={isModalLoading}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormParticipante
                nome={nome}
                setNome={setNome}
                validateNome={validateNome}
                nomeError={nomeError}
                idade={idade}
                setIdade={setIdade}
                genero={genero}
                setGenero={setGenero}
                nivelSuporte={nivelSuporte}
                setNivelSuporte={setNivelSuporte}
                qtdPalavras={qtdPalavras}
                setQtdPalavras={setQtdPalavras}
                idadeError={idadeError}
                validateIdade={validateIdade}
                setShowSupportModal={setShowSupportModal}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Salvar Alterações"
                onPress={handleSave}
                color="#2196F3"
                style={styles.modalButton}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
                disabled={
                  isModalLoading ||
                  !!idadeError ||
                  !idade ||
                  !!nomeError ||
                  !nome
                }
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja deletar este participante? Esta ação não pode ser desfeita."
      />

      <ModalInfoNiveisAutismo
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  participanteContainer: {
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
  participanteInfoContainer: {
    padding: 16,
  },
  participanteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  participanteName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginRight: 8,
  },
  participanteBadge: {
    backgroundColor: "#2196F3",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  participanteBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  participanteDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
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
    maxHeight: "80%",
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
