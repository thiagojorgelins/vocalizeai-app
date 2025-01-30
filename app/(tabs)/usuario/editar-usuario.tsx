import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { doLogout } from "@/services/authService";
import { getUser, updateUser } from "@/services/usuarioService";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function EditarUsuarioScreen() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUser();
      setEmail(userData.email);
      setNome(userData.nome);
      setCelular(userData.celular);
    } catch (error: any) {
      showMessage({
        message: "Não foi possível carregar os dados do usuário.",
        type: "danger",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  async function handleUpdate() {
    try {
      await updateUser({ email, nome, celular });
      showMessage({
        message: "Dados do usuário atualizados!",
        type: "success",
      });
      setModalVisible(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Não foi possível atualizar os dados do usuário.";
      showMessage({
        message: `Erro ao atualizar dados do usuário: ${errorMessage}`,
        type: "danger",
      });
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Email"
        placeholder="Informe seu email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Nome"
        placeholder="Informe seu Nome"
        value={nome}
        onChangeText={setNome}
      />
      <Input
        label="Celular"
        mask="(99) 99999-9999"
        value={celular}
        placeholder="Informe seu celular"
        onChangeText={setCelular}
        keyboardType="phone-pad"
      />
      <ButtonCustom
        title="Atualizar Dados do Usuário"
        onPress={() => setModalVisible(true)}
        color="black"
        style={{ marginBottom: 10 }}
      />
      <ButtonCustom
        title="Ir para Dados do Participante"
        onPress={() => router.push("/usuario/dados-participante")}
        color="#464646"
        style={{ marginBottom: 10 }}
      />
      <ButtonCustom title="Logout" color="red" onPress={doLogout} />

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleUpdate}
        message="Deseja confirmar a atualização dos dados do usuário?"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
