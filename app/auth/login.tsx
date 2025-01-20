import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import { doLogin } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const isLoggedIn = await doLogin(email, password);
      if (isLoggedIn) {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      showMessage({
        message: error.message || "Erro inesperado ao fazer login.",
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
