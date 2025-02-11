import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { requestPasswordReset } from "@/services/authService";
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="lock-reset" size={40} color="#2196F3" />
          <Text style={styles.title}>Recuperação de Senha</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.description}>
              Por favor, informe o endereço de email associado a sua conta para
              que possamos enviar um código para recuperação da sua senha
            </Text>

            <Input
              label="Email"
              placeholder="Informe seu Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon={<MaterialIcons name="email" size={20} color="#666" />}
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title="Recuperar Senha"
              onPress={handleForgotPassword}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="send" size={20} color="#FFF" />}
            />

            <ButtonCustom
              title="Voltar para Login"
              variant="secondary"
              onPress={() => router.back()}
              icon={
                <MaterialIcons name="arrow-back" size={20} color="#424242" />
              }
            />
          </View>
        </View>
      </ScrollView>

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
    letterSpacing: 0.25,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
});
