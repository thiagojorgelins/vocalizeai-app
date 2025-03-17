import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import {
  confirmRegistration,
  doLogin,
  sendConfirmationCode,
} from "@/services/authService";
import { validarEmail } from "@/services/usuarioService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (text: string) => {
    setEmail(text);

    if (text && !validarEmail(text)) {
      setEmailError("Formato de email inválido.");
    } else {
      setEmailError("");
    }
  };
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="login" size={40} color="#2196F3" />
          <Text style={styles.title}>Bem vindo ao Projeto VocalizeAI!</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acesse sua conta</Text>

            <Input
              label="Email"
              placeholder="Informe seu email"
              value={email}
              showCharacterCount={true}
              maxLength={80}
              onChangeText={handleEmailChange}
              leftIcon={<MaterialIcons name="email" size={20} color="#666" />}
              keyboardType="email-address"
              error={!!emailError}
              errorMessage={emailError}
            />

            <InputPassword
              label="Senha"
              placeholder="Informe sua Senha"
              value={password}
              onChangeText={setPassword}
              leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
            />

            <ButtonCustom
              title="Esqueci minha senha"
              variant="link"
              onPress={() => router.push("/auth/esqueci-senha")}
              icon={
                <MaterialIcons name="help-outline" size={20} color="#2196F3" />
              }
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title="Entrar"
              onPress={handleLogin}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="login" size={20} color="#FFF" />}
            />
            <ButtonCustom
              title="Não possui cadastro? Cadastre-se"
              variant="link"
              color="#2196F3"
              onPress={() => router.push("/auth/cadastro")}
            />
          </View>
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 16,
  },
  forgotPassword: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  forgotPasswordText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    textDecorationLine: "underline",
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  registerText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
