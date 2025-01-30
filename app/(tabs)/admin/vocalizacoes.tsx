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
import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function VocalizacoesScreen() {
  const [vocalizacoes, setVocalizacoes] = useState<Vocalizacao[]>([]);
  const [selectedVocalizacao, setSelectedVocalizacao] =
    useState<Vocalizacao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  async function fetchVocalizacoes() {
    try {
      const vocalizacaos = await getVocalizacoes();
      setVocalizacoes(vocalizacaos);
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar as vocalizações",
        type: "danger",
      });
    }
  }

  useFocusEffect(()=> {
    fetchVocalizacoes();
  })

  const handleEdit = (vocalizacao: Vocalizacao) => {
    setSelectedVocalizacao(vocalizacao);
    setNome(vocalizacao.nome);
    setDescricao(vocalizacao.descricao);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedVocalizacao) {
        await updateVocalizacoes(selectedVocalizacao.id.toString(), {
          ...selectedVocalizacao,
          nome,
          descricao,
        });

        showMessage({
          message: "Sucesso",
          description: "Vocalização atualizada com sucesso!",
          type: "success",
        });
      } else {
        await createVocalizacoes(nome, descricao);

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
    }
  };

  const handleDelete = async () => {
    if (!selectedVocalizacao) return;

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
        description: "Erro ao deletar a vocalização",
        type: "danger",
      });
    }
  };

  const handleAdd = () => {
    setSelectedVocalizacao(null);
    setNome("");
    setDescricao("");
    setShowModal(true);
  };

  const renderVocalizacoes = ({ item }: { item: Vocalizacao }) => (
    <TouchableOpacity
      style={styles.vocalizationContainer}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.vocalizationDivName}>
        <Text style={styles.vocalizationName}>Rótulo: {item.nome}</Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedVocalizacao(item);
            setShowConfirmModal(true);
          }}
        >
          <MaterialIcons name="delete" size={32} color="red" />
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.vocalizationDescription}>{item.descricao}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ButtonCustom
        title="Adicionar Vocalização"
        onPress={handleAdd}
        style={{ marginBottom: 16, width: "100%" }}
      />
      <FlatList
        data={vocalizacoes}
        renderItem={renderVocalizacoes}
        keyExtractor={(vocalizacao) => vocalizacao.id.toString()}
        ListEmptyComponent={<Text>Não há vocalizações</Text>}
      />

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedVocalizacao
                ? "Editar Vocalização"
                : "Adicionar Vocalização"}
            </Text>

            <Input
              label="Nome"
              value={nome}
              onChangeText={setNome}
            />

            <Input
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <View style={styles.buttonRow}>
              <ButtonCustom
                title="Salvar"
                onPress={handleSave}
                style={{ width: "45%" }}
              />
              <ButtonCustom
                title="Cancelar"
                onPress={() => setShowModal(false)}
                color="red"
                style={{ width: "45%" }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja deletar esta vocalização?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  vocalizationContainer: {
    minWidth: "100%",
    backgroundColor: "#d6d6d6",
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  vocalizationDivName: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vocalizationName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  vocalizationDescription: {
    fontSize: 16,
    padding: 4,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
