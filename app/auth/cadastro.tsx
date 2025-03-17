import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import TermsRadioButton from "@/components/TermsRadioButton";
import {
  confirmRegistration,
  doLogin,
  register,
  sendConfirmationCode,
} from "@/services/authService";
import { validarEmail } from "@/services/usuarioService";
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
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [termoAceite, setTermoAceite] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [nomeError, setNomeError] = useState("");
  const [celularError, setCelularError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [confirmaSenhaError, setConfirmaSenhaError] = useState("");
  const [codigoError, setCodigoError] = useState("");

  const router = useRouter();

  const validarCampos = () => {
    let isValid = true;

    if (!nome.trim()) {
      setNomeError("Nome é obrigatório");
      isValid = false;
    } else {
      setNomeError("");
    }

    if (!celular || celular.length < 11) {
      setCelularError("Celular inválido");
      isValid = false;
    } else {
      setCelularError("");
    }

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!validarEmail(email)) {
      setEmailError("Formato de email inválido");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!senha) {
      setSenhaError("Senha é obrigatória");
      isValid = false;
    } else if (senha.length < 6) {
      setSenhaError("A senha deve ter no mínimo 6 caracteres");
      isValid = false;
    } else {
      setSenhaError("");
    }

    if (senha !== confirmaSenha) {
      setConfirmaSenhaError("As senhas não coincidem");
      isValid = false;
    } else {
      setConfirmaSenhaError("");
    }

    if (!termoAceite) {
      showMessage({
        message:
          "É necessário aceitar os termos de uso e política de privacidade.",
        type: "warning",
      });
      isValid = false;
    }

    return isValid;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text && !validarEmail(text)) {
      setEmailError("Formato de email inválido");
    } else {
      setEmailError("");
    }
  };

  async function handleRegister() {
    if (!validarCampos()) {
      return;
    }

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
          message: "Cadastro realizado com sucesso!",
          description: "Verifique seu e-mail para confirmar o cadastro.",
          type: "success",
          duration: 3000,
        });

        setIsModalVisible(true);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro inesperado ao realizar o cadastro.",
        description: error.message || "Tente novamente mais tarde.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmRegistration(codigo?: string) {
    if (!codigo) {
      setCodigoError("Código é obrigatório");
      return;
    }

    setIsModalLoading(true);
    try {
      await confirmRegistration(email, codigo);

      showMessage({
        message: "Cadastro confirmado com sucesso!",
        type: "success",
        duration: 3000,
      });

      setIsModalVisible(false);

      const loginResult = await doLogin(email, senha);
      if (loginResult === "success") {
        router.push("/auth/cadastro-participante");
      } else {
        router.push("/auth/login");
      }
    } catch (error: any) {
      setCodigoError("Código de confirmação inválido.");

      showMessage({
        message: "Código de confirmação inválido.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setIsModalLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      setIsModalLoading(true);
      await sendConfirmationCode(email);

      showMessage({
        message: "Código reenviado com sucesso!",
        description: "Verifique seu e-mail.",
        type: "success",
        duration: 3000,
      });

      setCodigoError("");
    } catch (error: any) {
      showMessage({
        message: "Erro ao reenviar código.",
        description: error.message || "Tente novamente mais tarde.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setIsModalLoading(false);
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
          <Text style={styles.title}>Criar Conta de Usuário</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

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

            <Input
              label="Nome do responsável"
              placeholder="Informe seu nome"
              showCharacterCount={true}
              maxLength={50}
              value={nome}
              onChangeText={setNome}
              leftIcon={<MaterialIcons name="person" size={20} color="#666" />}
              error={!!nomeError}
              errorMessage={nomeError}
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
              error={!!celularError}
              errorMessage={celularError}
            />

            <InputPassword
              label="Senha"
              placeholder="Informe sua senha"
              value={senha}
              onChangeText={setSenha}
              leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
              error={!!senhaError}
              errorMessage={senhaError}
            />

            <InputPassword
              label="Confirmar senha"
              placeholder="Confirme sua senha"
              value={confirmaSenha}
              onChangeText={setConfirmaSenha}
              leftIcon={
                <MaterialIcons name="lock-outline" size={20} color="#666" />
              }
              error={!!confirmaSenhaError}
              errorMessage={confirmaSenhaError}
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
              color="#2196F3"
              disabled={isLoading}
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
          keyboardType: "numeric",
        }}
        error={!!codigoError}
        errorMessage={codigoError}
        isLoading={isModalLoading}
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
