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
  ActivityIndicator,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function ChangePasswordScreen() {
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [confirmaSenhaError, setConfirmaSenhaError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { email, codigoConfirmacao } = useLocalSearchParams();

  const handleSenhaChange = (text: string) => {
    setSenha(text);
    if (!text) {
      setSenhaError("A senha é obrigatória");
    } else if (text.length < 6) {
      setSenhaError("A senha deve ter no mínimo 6 caracteres");
    } else {
      setSenhaError("");
      if (confirmaSenha && confirmaSenha !== text) {
        setConfirmaSenhaError("As senhas não coincidem");
      } else if (confirmaSenha) {
        setConfirmaSenhaError("");
      }
    }
  };

  const handleConfirmaSenhaChange = (text: string) => {
    setConfirmaSenha(text);
    if (!text) {
      setConfirmaSenhaError("Confirme sua senha");
    } else if (text !== senha) {
      setConfirmaSenhaError("As senhas não coincidem");
    } else {
      setConfirmaSenhaError("");
    }
  };

  async function handleChangePassword() {
    if (!senha) {
      setSenhaError("A senha é obrigatória");
      return;
    } else if (senha.length < 6) {
      setSenhaError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!confirmaSenha) {
      setConfirmaSenhaError("Confirme sua senha");
      return;
    } else if (senha !== confirmaSenha) {
      setConfirmaSenhaError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email as string, codigoConfirmacao as string, senha);
      showMessage({
        message: "Senha redefinida com sucesso!",
        description: "Você já pode fazer login com sua nova senha.",
        type: "success",
        duration: 3000,
      });
      router.push("/auth/login");
    } catch (error: any) {
      showMessage({
        message: "Erro ao redefinir senha",
        description: error.message || "Não foi possível redefinir sua senha.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={"height"}
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
              onChangeText={handleSenhaChange}
              leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
              error={!!senhaError}
              errorMessage={senhaError}
            />

            <InputPassword
              label="Confirmar senha"
              placeholder="Confirme sua nova senha"
              value={confirmaSenha}
              onChangeText={handleConfirmaSenhaChange}
              leftIcon={
                <MaterialIcons name="lock-outline" size={20} color="#666" />
              }
              error={!!confirmaSenhaError}
              errorMessage={confirmaSenhaError}
            />
          </View>

          <View style={styles.actions}>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#2196F3"
                style={styles.loader}
              />
            ) : (
              <ButtonCustom
                title="Redefinir Senha"
                onPress={handleChangePassword}
                color="#2196F3"
                style={styles.mainButton}
                icon={<MaterialIcons name="check" size={20} color="#FFF" />}
                disabled={!!senhaError || !!confirmaSenhaError || !senha || !confirmaSenha}
              />
            )}

            <ButtonCustom
              title="Cancelar"
              variant="secondary"
              onPress={() => router.back()}
              icon={<MaterialIcons name="close" size={20} color="#424242" />}
              disabled={isLoading}
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
    elevation: 3
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
  loader: {
    marginVertical: 20,
  },
});