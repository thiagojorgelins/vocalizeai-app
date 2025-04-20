import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import FormUsuario from "@/components/FormUsuario";
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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

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
      Toast.show({
        type: "error",
        text1: "Erro ao cadastrar usuário",
        text2:
          "É necessário aceitar os termos de uso e política de privacidade.",
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

  const handleCelularChange = (text: string) => {
    setCelular(text);
    if (!text || text.length < 11) {
      setCelularError("Celular inválido");
    } else {
      setCelularError("");
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
        Toast.show({
          type: "success",
          text1: "Cadastro realizado com sucesso!",
          text2: "Verifique seu e-mail para confirmar o cadastro.",
        });

        setIsModalVisible(true);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Erro inesperado",
        text2: "Tente novamente mais tarde.",
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

      Toast.show({
        type: "success",
        text1: "Cadastro confirmado com sucesso!",
        text2: "Você já pode acessar o aplicativo.",
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

      Toast.show({
        type: "error",
        text1:
          error instanceof Error ? error.message : "Erro ao confirmar cadastro",
        text2: "Código inválido.",
      });
    } finally {
      setIsModalLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      setIsModalLoading(true);
      await sendConfirmationCode(email);

      Toast.show({
        type: "success",
        text1: "Código reenviado com sucesso!",
        text2: "Verifique seu e-mail.",
      });

      setCodigoError("");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1:
          error instanceof Error ? error.message : "Erro ao reenviar código",
        text2: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsModalLoading(false);
    }
  }

  function handleToLogin() {
    router.push("/auth/login");
  }

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
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

            <FormUsuario
              nome={nome}
              setNome={setNome}
              email={email}
              handleEmailChange={handleEmailChange}
              celular={celular}
              handleCelularChange={handleCelularChange}
              emailError={emailError}
              nomeError={nomeError}
              celularError={celularError}
              showPasswordFields={true}
              senha={senha}
              setSenha={setSenha}
              confirmaSenha={confirmaSenha}
              setConfirmaSenha={setConfirmaSenha}
              senhaError={senhaError}
              confirmaSenhaError={confirmaSenhaError}
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
