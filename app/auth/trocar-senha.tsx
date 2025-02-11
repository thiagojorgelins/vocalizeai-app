import ButtonCustom from "@/components/Button";
import InputPassword from "@/components/Inputs/InputPassword";
import { resetPassword } from "@/services/authService";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="lock" size={40} color="#2196F3" />
          <Text style={styles.title}>Nova Senha</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redefina sua senha</Text>

            <Text style={styles.description}>
              Digite sua nova senha e confirme-a para redefinir o acesso à sua
              conta
            </Text>

            <InputPassword
              label="Nova senha"
              placeholder="Informe sua nova senha"
              value={senha}
              onChangeText={setSenha}
              leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
            />

            <InputPassword
              label="Confirmar senha"
              placeholder="Confirme sua nova senha"
              value={confirmaSenha}
              onChangeText={setConfirmaSenha}
              leftIcon={
                <MaterialIcons name="lock-outline" size={20} color="#666" />
              }
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title="Redefinir Senha"
              onPress={handleChangePassword}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="check" size={20} color="#FFF" />}
            />

            <ButtonCustom
              title="Cancelar"
              variant="secondary"
              onPress={() => router.back()}
              icon={<MaterialIcons name="close" size={20} color="#424242" />}
            />
          </View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 16,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
});
