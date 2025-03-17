import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { confirmRegistration, doLogout, sendConfirmationCode } from "@/services/authService";
import { getUser, updateUser, validarEmail } from "@/services/usuarioService";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { showMessage } from "react-native-flash-message";

export default function EditarUsuarioScreen() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isVerificationModalVisible, setVerificationModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationLoading, setVerificationLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [celularError, setCelularError] = useState("");
  const [emailOriginal, setEmailOriginal] = useState("");
  const [verificationError, setVerificationError] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await getUser();
      setEmail(userData.email);
      setEmailOriginal(userData.email);
      setNome(userData.nome);
      setCelular(userData.celular);
    } catch (error: any) {
      showMessage({
        message: "Não foi possível carregar os dados do usuário.",
        type: "danger",
        duration: 3000,
        icon: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handleEmailChange = (text: string) => {
    setEmail(text);

    if (text && !validarEmail(text)) {
      setEmailError("Formato de email inválido.");
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

  async function handleUpdate() {
    try {
      if (email && !validarEmail(email)) {
        showMessage({
          message: "Formato de email inválido.",
          description: "Por favor, digite um endereço de email válido.",
          type: "warning",
          duration: 3000,
          icon: "warning",
        });
        setModalVisible(false);
        return;
      }
      
      if (celular && celular.replace(/\D/g, "").length < 10) {
        showMessage({
          message: "Celular inválido.",
          description: "Por favor, digite um número de celular válido.",
          type: "warning",
          duration: 3000,
          icon: "warning",
        });
        setModalVisible(false);
        return;
      }

      setIsLoading(true);
      setModalVisible(false);

      const dadosAtualizados: any = {};

      if (nome !== undefined && nome.trim() !== "") {
        dadosAtualizados.nome = nome;
      }

      const emailFoiAlterado = email !== emailOriginal && email.trim() !== "";
      
      if (!emailFoiAlterado) {
        if (celular !== undefined && celular.trim() !== "") {
          dadosAtualizados.celular = celular;
        }

        const result = await updateUser(dadosAtualizados);

        if (result.usuario) {
          setNome(result.usuario.nome);
          setCelular(result.usuario.celular);
        }

        showMessage({
          message: "Sucesso!",
          description: result.message,
          type: "success",
          duration: 3000,
          icon: "success",
        });
      } else {
        dadosAtualizados.email = email;
        
        if (celular !== undefined && celular.trim() !== "") {
          dadosAtualizados.celular = celular;
        }
        
        const result = await updateUser(dadosAtualizados);

        if (result.usuario) {
          setNome(result.usuario.nome);
          setCelular(result.usuario.celular);
        }
        
        if (result.emailAlterado) {
          setVerificationModalVisible(true);
        } else {
          showMessage({
            message: "Sucesso!",
            description: result.message,
            type: "success",
            duration: 3000,
            icon: "success",
          });
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Não foi possível atualizar os dados do usuário.";
      showMessage({
        message: "Erro ao atualizar",
        description: errorMessage,
        type: "danger",
        duration: 3000,
        icon: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleVerifyEmail = async (codigo?: string) => {
    if (!codigo || codigo.trim() === "") {
      setVerificationError(true);
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      await confirmRegistration(email, codigo);
      
      showMessage({
        message: "Sucesso!",
        description: "Email verificado com sucesso!",
        type: "success",
        duration: 3000,
        icon: "success",
      });
      
      setVerificationModalVisible(false);
      setEmailOriginal(email);
    } catch (error: any) {
      setVerificationError(true);
      showMessage({
        message: "Erro na verificação",
        description: error.message || "Código de verificação inválido.",
        type: "danger",
        duration: 3000,
        icon: "danger",
      });
    } finally {
      setVerificationLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    try {
      setVerificationLoading(true);
      await sendConfirmationCode(email);
      
      showMessage({
        message: "Código enviado",
        description: "Um novo código foi enviado para seu email.",
        type: "success",
        duration: 3000,
        icon: "success",
      });
    } catch (error: any) {
      showMessage({
        message: "Erro ao enviar código",
        description: error.message || "Não foi possível enviar o código de verificação.",
        type: "danger",
        duration: 3000,
        icon: "danger",
      });
    } finally {
      setVerificationLoading(false);
    }
  };
  
  const handleCancelVerification = () => {
    setVerificationModalVisible(false);
    
    showMessage({
      message: "Verificação necessária",
      description: "Você precisa verificar seu novo email para continuar. Fazendo logout...",
      type: "info",
      duration: 3000,
      icon: "info",
    });
    
    setTimeout(() => {
      doLogout();
    }, 3000);
  };

  const confirmarAtualizacao = () => {
    const emailFoiAlterado = email !== emailOriginal;

    if (emailFoiAlterado && !validarEmail(email)) {
      showMessage({
        message: "Formato de email inválido.",
        description: "Por favor, digite um endereço de email válido.",
        type: "warning",
        duration: 3000,
        icon: "warning",
      });
      return;
    }

    if (celular && celular.replace(/\D/g, "").length < 10) {
      showMessage({
        message: "Celular inválido.",
        description: "Por favor, digite um número de celular válido.",
        type: "warning",
        duration: 3000,
        icon: "warning",
      });
      return;
    }

    setModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Animatable.View
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
          >
            <ActivityIndicator size="large" color="#2196F3" />
          </Animatable.View>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="person" size={40} color="#2196F3" />
          <Text style={styles.title}>Editar Perfil</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Responsável</Text>

            <Input
              maxLength={50}
              showCharacterCount={true}
              label="Nome"
              placeholder="Informe seu nome"
              value={nome}
              onChangeText={setNome}
              leftIcon={
                <MaterialIcons name="person-outline" size={20} color="#666" />
              }
            />

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
              label="Celular"
              placeholder="Informe seu número de celular"
              keyboardType="phone-pad"
              value={celular}
              maxLength={15}
              mask="(99) 99999-9999"
              onChangeText={handleCelularChange}
              leftIcon={
                <MaterialIcons name="phone-android" size={20} color="#666" />
              }
              error={!!celularError}
              errorMessage={celularError}
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title="Atualizar Dados"
              onPress={confirmarAtualizacao}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="save" size={20} color="#FFF" />}
              disabled={isLoading || !!emailError}
            />

            <ButtonCustom
              title="Dados do Participante"
              onPress={() => router.push("/usuario/dados-participante")}
              icon={<MaterialIcons name="person-add" size={20} color="#666" />}
              variant="secondary"
              disabled={isLoading}
            />

            <ButtonCustom
              title="Sair do App"
              onPress={doLogout}
              icon={<MaterialIcons name="logout" size={20} color="#D32F2F" />}
              variant="danger"
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmação de atualização de dados */}
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleUpdate}
        message={
          email !== emailOriginal
            ? "Deseja confirmar a atualização dos dados? Um código de confirmação será enviado para o novo email."
            : "Deseja confirmar a atualização dos dados do usuário?"
        }
      />
      
      {/* Modal de verificação de email */}
      <ConfirmationModal
        visible={isVerificationModalVisible}
        onCancel={handleCancelVerification}
        onConfirm={handleVerifyEmail}
        onResend={handleResendCode}
        message="Por favor, insira o código de verificação enviado para o seu novo email. Se você cancelar, será necessário fazer login novamente."
        input={{
          placeholder: "Código de verificação",
          keyboardType: "numeric",
          value: "",
        }}
        showResendButton={true}
        error={verificationError}
        errorMessage="Código de verificação inválido"
        isLoading={isVerificationLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "600",
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 16,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#D32F2F",
    fontWeight: "500",
  },
});