import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import { doLogin, sendConfirmationCode, confirmRegistration } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      showMessage({
        message: "Email e senha são obrigatórios.",
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
      const loginStatus = await doLogin(email, password);
      if (loginStatus === "success") {
        router.replace("/(tabs)");
      } else if (loginStatus === "unverified") {
        setIsModalVisible(true);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro inesperado ao fazer login.",
        type: "danger",
      });
    }
  }

  async function handleConfirmRegistration(codigoConfirmacao?: string) {
    if (!codigoConfirmacao) return;
    try {
      await confirmRegistration(email, codigoConfirmacao);
      showMessage({
        message: "Cadastro confirmado com sucesso!",
        type: "success",
      });
      setIsModalVisible(false);
      const loginStatus = await doLogin(email, password);
      if (loginStatus === "success") {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      showMessage({
        message: "Código de confirmação inválido.",
        type: "danger",
      });
    }
  }

  async function handleResendCode() {
    try {
      await sendConfirmationCode(email);
      showMessage({
        message: "Novo código de confirmação enviado para o e-mail.",
        type: "success",
      });
    } catch (error: any) {
      showMessage({
        message: "Erro ao enviar o código de confirmação.",
        type: "danger",
      });
    }
  }

  return (
    <View style={styles.container}>
      <Input
        label="Email"
        placeholder="Informe seu Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <InputPassword
        label="Senha"
        placeholder="Informe sua Senha"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => router.push("/auth/esqueci-senha")}>
        <Text style={styles.linkText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <ButtonCustom
        title="Login"
        onPress={handleLogin}
        color="black"
        style={{
          margin: 24,
        }}
      />

      <TouchableOpacity onPress={() => router.push("/auth/cadastro")}>
        <Text style={styles.linkText}>Não possui cadastro? Cadastre-se</Text>
      </TouchableOpacity>

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmRegistration}
        onResend={handleResendCode}
        showResendButton={true}
        message="Digite o código de confirmação enviado para o seu e-mail."
        input={{
          placeholder: "Código de confirmação",
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
  linkText: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});