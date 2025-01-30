import ButtonCustom from "@/components/Button";
import InputPassword from "@/components/Inputs/InputPassword";
import { resetPassword } from "@/services/authService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function ChangePasswordScreen() {
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const router = useRouter();
  const { email, codigoConfirmacao } = useLocalSearchParams();

  async function handleChangePassword() {
    if (!senha || !confirmaSenha) {
      showMessage({
        message: "Todos os campos são obrigatórios.",
        type: "danger",
      });
      return;
    }

    if (senha !== confirmaSenha) {
      showMessage({
        message: "As senhas não coincidem.",
        type: "danger",
      });
      return;
    }

    try {
      await resetPassword(email as string, codigoConfirmacao as string, senha);
      showMessage({
        message: "Senha redefinida com sucesso!",
        type: "success",
      });
      router.push("/auth/login");
    } catch (error: any) {
      showMessage({
        message: error.message,
        type: "danger",
      });
    }
  }

  return (
    <View style={styles.container}>
      <InputPassword
        label="Nova senha"
        placeholder="Informe sua nova senha"
        value={senha}
        onChangeText={setSenha}
        style={{ marginBottom: 60 }}
      />
      <InputPassword
        label="Confirmar senha"
        placeholder="Confirme sua nova senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        style={{ marginBottom: 60 }}
      />
      <ButtonCustom
        title="Redefinir senha"
        onPress={handleChangePassword}
        color="black"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
});