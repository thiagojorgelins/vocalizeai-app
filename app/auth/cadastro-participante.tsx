import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import FormParticipante from "@/components/FormParticipante";
import ModalInfoNiveisAutismo from "@/components/ModalInfoNiveisAutismo";
import SuccessModal from "@/components/SuccessModal";
import { createParticipante } from "@/services/participanteService";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function CadastroParticipanteScreen() {
  const [nome, setNome] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [qtdPalavras, setQtdPalavras] = useState(
    "Não pronuncia nenhuma palavra"
  );
  const [idade, setIdade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [idadeError, setIdadeError] = useState("");
  const [nomeError, setNomeError] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  
  const router = useRouter();

  const validateNome = (value: string) => {
    if (!value.trim()) {
      setNomeError("O nome é obrigatório");
      return false;
    }

    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(value)) {
      setNomeError("O nome deve conter apenas letras e espaços");
      return false;
    }

    setNomeError("");
    return true;
  }

  const validateIdade = (value: string) => {
    if (!value.trim()) {
      setIdadeError("A idade é obrigatória");
      return false;
    }

    const idadeNum = parseInt(value);
    if (isNaN(idadeNum) || idadeNum < 1 || idadeNum > 99) {
      setIdadeError("Idade deve estar entre 1 e 99 anos");
      return false;
    }

    setIdadeError("");
    return true;
  };

  function handleOpenModal() {
    if (!validateIdade(idade) || !validateNome(nome)) {
      return;
    }
    setModalVisible(true);
  }

  async function handleCreateParticipante() {
    try {
      setIsModalLoading(true);
  
      const payload = {
        genero,
        idade: parseInt(idade),
        nivel_suporte:
          nivelSuporte === "Não sei informar" ? 0 : parseInt(nivelSuporte),
        qtd_palavras: qtdPalavras,
        nome
      };
  
      const response = await createParticipante(payload);
      
      setModalVisible(false);
      
      if (response && response.id) {
        await AsyncStorage.setItem("hasParticipant", "true");
        await AsyncStorage.setItem("participantId", response.id.toString());
        setSuccessModalVisible(true);
      } else {
        Toast.show({
          type: "success",
          text1: "Participante criado com sucesso!",
          text2: "Você já pode acessar o sistema completo.",
        });
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao criar participante.";
      
      setModalVisible(false);
      
      Toast.show({
        type: "error",
        text1: "Erro ao criar participante",
        text2: errorMessage,
      });
    } finally {
      setIsModalLoading(false);
    }
  }

  const handleCreateAnother = () => {
    setSuccessModalVisible(false);
    setNome("");
    setIdade("");
    setQtdPalavras("Não pronuncia nenhuma palavra");
    setGenero("Masculino");
    setNivelSuporte("1");
    setParticipantId(null);
  };

  const handleGoToHome = () => {
    setSuccessModalVisible(false);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="face" size={30} color="#2196F3" />
            </View>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="face-3" size={30} color="#E91E63" />
            </View>
          </View>
          <Text style={styles.title}>Cadastro de Participante</Text>
        </View>

        <View style={styles.card}>
          <FormParticipante
            nome={nome}
            setNome={setNome}
            validateNome={validateNome}
            nomeError={nomeError}
            idade={idade}
            setIdade={setIdade}
            genero={genero}
            setGenero={setGenero}
            nivelSuporte={nivelSuporte}
            setNivelSuporte={setNivelSuporte}
            qtdPalavras={qtdPalavras}
            setQtdPalavras={setQtdPalavras}
            idadeError={idadeError}
            validateIdade={validateIdade}
            setShowSupportModal={setShowSupportModal}
          />

          <View style={styles.actions}>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#2196F3"
                style={styles.loader}
              />
            ) : (
              <ButtonCustom
                title="Criar Participante"
                onPress={handleOpenModal}
                color="#2196F3"
                style={styles.mainButton}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
                disabled={!!idadeError || !idade.trim() || !!nomeError || !nome.trim()}
              />
            )}
          </View>
        </View>
      </ScrollView>
      
      <ModalInfoNiveisAutismo
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
      
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleCreateParticipante}
        message="Deseja confirmar a criação do participante?"
        isLoading={isModalLoading}
      />
      
      <SuccessModal
        visible={isSuccessModalVisible}
        title={`Participante ${participantId ? "atualizado" : "criado"} com sucesso!`}
        primaryButtonText="Criar Outro Participante"
        onPrimaryButtonPress={handleCreateAnother}
        secondaryButtonText="Ir para Home"
        onSecondaryButtonPress={handleGoToHome}
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
  avatarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
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
    elevation: 3,
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