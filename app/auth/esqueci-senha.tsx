import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
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
      showMessage({
        message: "Um código de recuperação foi enviado para o email informado.",
        type: "success",
      });
      router.push("/auth/login");
    } catch (error) {
      showMessage({
        message: "Erro ao enviar solicitação de recuperação.",
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
