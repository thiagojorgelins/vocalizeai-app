import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import TermsRadioButton from "@/components/TermsRadioButton";
import { confirmRegistration, doLogin, register } from "@/services/authService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function CadastroUsuarioScreen() {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [termoAceite, setTermoAceite] = useState(false);

  const router = useRouter();

  async function handleRegister() {
    setIsLoading(true);
    try {
      const isRegistered = await register(
        nome,
        email,
        celular,
        senha,
        confirmaSenha,
        termoAceite
      );
      if (isRegistered) {
        showMessage({
          message:
            "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar o cadastro.",
          type: "success",
        });
        setIsModalVisible(true);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro inesperado ao realizar o cadastro.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmRegistration(codigoConfirmacao?: string) {
    setIsLoading(true);
    try {
      await confirmRegistration(email, codigoConfirmacao || "");
      showMessage({
        message: "Cadastro confirmado com sucesso!",
        type: "success",
      });
      setIsModalVisible(false);
      await doLogin(email, senha);
      router.push("/auth/cadastro-participante");
    } catch (error: any) {
      showMessage({
        message: "Código de confirmação inválido.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleToLogin() {
    router.push("/auth/login");
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="app-registration" size={40} color="#2196F3" />
          <Text style={styles.title}>Cadastro de Usuário</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

            <Input
              label="Email"
              placeholder="Informe seu email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              leftIcon={<MaterialIcons name="email" size={20} color="#666" />}
            />

            <Input
              label="Nome do cuidador"
              placeholder="Informe seu nome"
              value={nome}
              onChangeText={setNome}
              leftIcon={<MaterialIcons name="person" size={20} color="#666" />}
            />

            <Input
              label="Celular"
              placeholder="Informe seu número de celular"
              keyboardType="phone-pad"
              value={celular}
              maxLength={15}
              mask="(99) 99999-9999"
              onChangeText={setCelular}
              leftIcon={
                <MaterialIcons name="phone-android" size={20} color="#666" />
              }
            />

            <InputPassword
              label="Senha"
              placeholder="Informe sua senha"
              value={senha}
              onChangeText={setSenha}
              leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
            />

            <InputPassword
              label="Confirmar senha"
              placeholder="Confirme sua senha"
              value={confirmaSenha}
              onChangeText={setConfirmaSenha}
              leftIcon={
                <MaterialIcons name="lock-outline" size={20} color="#666" />
              }
            />

            <View style={styles.termsContainer}>
              <TermsRadioButton
                selected={termoAceite}
                onPress={setTermoAceite}
                style={styles.termsRadio}
              />
            </View>
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
                title="Avançar"
                onPress={handleRegister}
                color="#2196F3"
                style={styles.mainButton}
                icon={
                  <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                }
              />
            )}
            <ButtonCustom
              title="Já possui cadastro? Fazer login"
              variant="link"
              onPress={handleToLogin}
              color={'F5F5F5'}
            />
          </View>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmRegistration}
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
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  termsRadio: {
    marginRight: 10,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
  },
  linkText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  loader: {
    marginVertical: 20,
  },
});