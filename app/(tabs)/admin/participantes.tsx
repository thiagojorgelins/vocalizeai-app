import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import ModalInfoNiveisAutismo from "@/components/ModalInfoNiveisAutismo";
import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";
import {
  deleteParticipante,
  getAllParticipantes,
  updateParticipante,
} from "@/services/participanteService";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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

export default function ParticipantesScreen() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [idade, setIdade] = useState("");
  const [qtdPalavras, setQtdPalavras] = useState(
    "Não pronuncia nenhuma palavra"
  );
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [idadeError, setIdadeError] = useState("");

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

  const handleIdadeChange = (text: string) => {
    setIdade(text);
    validateIdade(text);
  };

  const handleEdit = (participante: any) => {
    setSelectedParticipante(participante);
    setIdade(participante.idade.toString());
    setQtdPalavras(participante.qtd_palavras);
    setGenero(participante.genero);
    setNivelSuporte(participante.nivel_suporte.toString());
    setIdadeError("");
    setShowModal(true);
  };

  const validateForm = () => {
    return validateIdade(idade);
  };

  const handleSave = async () => {
    if (!selectedParticipante) return;
    if (!validateForm()) return;

    try {
      setIsModalLoading(true);

      const payload: ParticipantePayload = {
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

  const renderParticipante = ({ item }: { item: any }) => (
    <View style={styles.participanteContainer}>
      <View style={styles.participanteInfoContainer}>
        <View style={styles.participanteHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.participanteName}>
              ID Participante: {item.id}
            </Text>
            <View style={styles.participanteBadge}>
              <MaterialIcons name="medical-services" size={16} color="#FFF" />
              <Text style={styles.participanteBadgeText}>TEA</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.iconButton}
            >
              <MaterialIcons name="edit" size={24} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
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
              <View style={styles.modalForm}>
                <View style={styles.readOnlyFieldContainer}>
                  <Text style={styles.fieldLabel}>
                    Condição do Participante
                  </Text>
                  <View style={styles.readOnlyField}>
                    <MaterialIcons
                      name="medical-services"
                      size={20}
                      color="#666"
                      style={styles.fieldIcon}
                    />
                    <Text style={styles.readOnlyText}>TEA</Text>
                  </View>
                </View>

                <Select
                  label="Gênero"
                  selectedValue={genero}
                  onValueChange={setGenero}
                  options={[
                    { label: "Masculino", value: "Masculino" },
                    { label: "Feminino", value: "Feminino" },
                    { label: "Outros", value: "Outros" },
                  ]}
                  leftIcon={
                    <MaterialIcons name="face" size={20} color="#666" />
                  }
                />

                <View style={styles.supportLevelContainer}>
                  <View style={styles.selectWithHelpContainer}>
                    <Select
                      style={{ minWidth: "85%" }}
                      label="Nível de Suporte"
                      selectedValue={nivelSuporte}
                      onValueChange={setNivelSuporte}
                      options={[
                        { label: "Nível 1", value: "1" },
                        { label: "Nível 2", value: "2" },
                        { label: "Nível 3", value: "3" },
                        { label: "Não sei informar", value: "0" },
                      ]}
                      leftIcon={
                        <MaterialIcons name="star" size={20} color="#666" />
                      }
                    />
                    <TouchableOpacity
                      style={styles.helpButton}
                      onPress={() => setShowSupportModal(true)}
                    >
                      <MaterialIcons name="help" size={22} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Select
                  label="Quantidade de Palavras"
                  selectedValue={qtdPalavras}
                  onValueChange={setQtdPalavras}
                  options={[
                    {
                      label: "Não pronuncia nenhuma palavra",
                      value: "Não pronuncia nenhuma palavra",
                    },
                    {
                      label: "Pronuncia entre 1 e 5 palavras",
                      value: "Pronuncia entre 1 e 5 palavras",
                    },
                    {
                      label: "Pronuncia entre 6 e 15 palavras",
                      value: "Pronuncia entre 6 e 15 palavras",
                    },
                    {
                      label: "Pronuncia 16 ou mais palavras",
                      value: "Pronuncia 16 ou mais palavras",
                    },
                  ]}
                  leftIcon={
                    <MaterialIcons
                      name="record-voice-over"
                      size={20}
                      color="#666"
                    />
                  }
                />

                <Input
                  label="Idade do Participante"
                  placeholder="Informe a idade"
                  keyboardType="numeric"
                  value={idade}
                  maxLength={2}
                  onChangeText={handleIdadeChange}
                  leftIcon={
                    <MaterialIcons name="cake" size={20} color="#666" />
                  }
                  error={!!idadeError}
                  errorMessage={idadeError}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Salvar Alterações"
                onPress={handleSave}
                color="#2196F3"
                style={styles.modalButton}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
                disabled={isModalLoading || !!idadeError || !idade}
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
  modalForm: {
    gap: 16,
  },
  modalActions: {
    marginTop: 24,
  },
  modalButton: {
    marginVertical: 8,
  },
  readOnlyFieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#424242",
    marginBottom: 8,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldIcon: {
    marginRight: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
  },
  supportLevelContainer: {
    width: "100%",
  },
  selectWithHelpContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  helpButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    elevation: 1,
  },
});
