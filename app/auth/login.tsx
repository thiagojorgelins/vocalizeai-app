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
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";

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
      Toast.show({
        type: "error",
        text1: "Erro ao fazer login",
        text2: "Email e senha são obrigatórios.",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: "error",
        text1: "Erro ao fazer login",
        text2: "Formato do email é inválido.",
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
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro Inesperado",
        text2: error.response?.data?.detail || "Erro ao fazer login.",
      });
    }
  }

  async function handleConfirmRegistration(codigoConfirmacao?: string) {
    if (!codigoConfirmacao) return;
    try {
      await confirmRegistration(email, codigoConfirmacao);
      Toast.show({
        type: "success",
        text1: "Cadastro confirmado com sucesso!",
        text2: "Você já pode acessar o aplicativo.",
      });
      setIsModalVisible(false);
      const loginStatus = await doLogin(email, password);
      if (loginStatus === "success") {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao confirmar cadastro",
        text2: "Código de confirmação inválido.",
      });
    }
  }

  async function handleResendCode() {
    try {
      await sendConfirmationCode(email);
      Toast.show({
        text1: "Novo código de confirmação enviado",
        text2: "Verifique seu e-mail.",
        type: "success",
      });
    } catch (error: any) {
      Toast.show({
        text1: "Erro ao enviar o código de confirmação",
        type: "error",
      });
    }
  }

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bem vindo ao projeto</Text>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>VocalizeAI</Text>

            <LinearGradient
              colors={["#2196F3", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acesse o Aplicativo</Text>

            <Input
              label="E-mail"
              placeholder="Informe seu e-mail"
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
        <View>
          <ButtonCustom
            title="Conheça o nosso projeto"
            variant="link"
            onPress={() =>
              Linking.openURL("https://www.youtube.com/watch?v=wUq2CeCC7CI")
            }
          />
          <Text style={{ textAlign: "center", margin: 8, height: 54 }}>
            v.1.0.1
          </Text>
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
    fontSize: 20,
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
    textAlign: "center",
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
  underline: {
    width: "50%",
    height: 3,
    marginTop: 8,
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: "center",
    width: "100%",
  },
  gradient: {
    borderRadius: 8,
    padding: 8,
  },
  logoText: {
    fontSize: 32,
    fontFamily: "Quicksand-Bold",
    letterSpacing: 1.2,
    color: "#2196F3",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
