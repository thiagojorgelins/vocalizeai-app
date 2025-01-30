import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { deleteUser, getAllUsers, updateUser } from "@/services/usuarioService";
import { Usuario } from "@/types/Usuario";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");

  async function fetchUsuarios() {
    try {
      const users = await getAllUsers();
      setUsuarios(users);
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar os usuários",
        type: "danger",
      });
    }
  }
  useFocusEffect(() => {
    fetchUsuarios();
  });

  const handleEdit = (usuario: any) => {
    setSelectedUsuario(usuario);
    setNome(usuario.nome || "");
    setEmail(usuario.email || "");
    setCelular(usuario.celular || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedUsuario) return;

    try {
      const updateData: Usuario = {
        id: selectedUsuario.id,
        nome,
        email,
        celular,
      };

      await updateUser(updateData);

      showMessage({
        message: "Sucesso",
        description: "Dados do usuário atualizados com sucesso!",
        type: "success",
      });

      setShowModal(false);
      fetchUsuarios();
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Erro ao atualizar os dados do usuário",
        type: "danger",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUsuario) return;

    try {
      await deleteUser(selectedUsuario.id);

      showMessage({
        message: "Sucesso",
        description: "Usuário deletado com sucesso!",
        type: "success",
      });

      setShowConfirmModal(false);
      fetchUsuarios();
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Erro ao deletar o usuário",
        type: "danger",
      });
    }
  };

  const renderUsuario = ({ item }: { item: any }) => (
    <View style={styles.userContainer}>
      <View style={styles.userInfo}>
        <Text style={styles.userInfoText}>Nome: {item.nome}</Text>
        <Text style={styles.userInfoText}>Email: {item.email}</Text>
        <Text style={styles.userInfoText}>Celular: {item.celular}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <MaterialIcons name="edit" size={32} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSelectedUsuario(item);
            setShowConfirmModal(true);
          }}
        >
          <MaterialIcons name="delete" size={32} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        renderItem={renderUsuario}
        keyExtractor={(usuario) => usuario.id.toString()}
        ListEmptyComponent={<Text>Não há usuários cadastrados.</Text>}
      />

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>

            <Input label="Nome" value={nome} onChangeText={setNome} />

            <Input label="Email" value={email} onChangeText={setEmail} />

            <Input
              label="Celular"
              value={celular}
              onChangeText={setCelular}
              keyboardType="phone-pad"
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
        message="Tem certeza que deseja deletar este usuário?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  userContainer: {
    backgroundColor: "#d6d6d6",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  userInfo: {
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});
