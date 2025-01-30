import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { requestPasswordReset } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const router = useRouter();

  async function handleForgotPassword() {
    if (!email) {
      showMessage({
        message: "Informe seu email",
        type: "danger",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showMessage({
        message: "Formato do email é inválido.",
        type: "danger",
      });
      return;
    }

    try {
      await requestPasswordReset(email);
      showMessage({
        message: "Um código de recuperação foi enviado para o email informado.",
        type: "success",
      });
      setIsModalVisible(true);
    } catch (error: any) {
      showMessage({
        message: error.message,
        type: "danger",
      });
    }
  }

  async function handleConfirmResetCode(codigoConfirmacao?: string) {
    if (!codigoConfirmacao) return;
    try {
      showMessage({
        message: "Código de recuperação confirmado com sucesso!",
        type: "success",
      });
      setIsModalVisible(false);
      router.push({
        pathname: "/auth/trocar-senha",
        params: { email, codigoConfirmacao },
      });
    } catch (error: any) {
      showMessage({
        message: "Código de recuperação inválido.",
        type: "danger",
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Por favor, informe o endereço de email associado a sua conta para que
        possamos enviar um código para recuperação da sua senha
      </Text>
      <Input
        label="Email"
        placeholder="Informe seu Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ marginBottom: 60 }}
      />
      <ButtonCustom
        title="Recuperar Senha"
        onPress={handleForgotPassword}
        color="black"
      />
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmResetCode}
        message="Digite o código de recuperação enviado para o seu e-mail."
        input={{
          placeholder: "Código de recuperação",
          value: codigoConfirmacao,
          onChangeText: setCodigoConfirmacao,
        }}
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
  title: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
});