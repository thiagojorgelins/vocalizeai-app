import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import FormParticipante from "@/components/FormParticipante";
import ModalInfoNiveisAutismo from "@/components/ModalInfoNiveisAutismo";
import { doLogout } from "@/services/authService";
import {
  createParticipante,
  getParticipante,
  updateParticipante,
} from "@/services/participanteService";
import { getUser } from "@/services/usuarioService";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Toast from "react-native-toast-message";

export default function DadosParticipanteScreen() {
  const [idade, setIdade] = useState("");
  const [qtdPalavras, setQtdPalavras] = useState(
    "Não pronuncia nenhuma palavra"
  );
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [idadeError, setIdadeError] = useState("");
  const [redirectedFromHome, setRedirectedFromHome] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkRedirection = async () => {
      const fromHome = await AsyncStorage.getItem("redirectedFromHome");
      if (fromHome === "true") {
        setRedirectedFromHome(true);
        await AsyncStorage.removeItem("redirectedFromHome");
      }
    };

    checkRedirection();
  }, []);

  const loadParticipantData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await getUser();

      if (userData.participante && userData.participante.id) {
        const participantData = await getParticipante(
          userData.participante.id.toString()
        );
        setParticipantId(participantData.id.toString());
        setIdade(participantData.idade.toString());
        setQtdPalavras(participantData.qtd_palavras);
        setGenero(participantData.genero);
        setNivelSuporte(participantData.nivel_suporte.toString());
      } else {
        setParticipantId(null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao carregar os dados do participante.";
      Toast.show({
        type: "error",
        text1: "Erro ao carregar dados",
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadParticipantData();
    }, [loadParticipantData])
  );

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
    if (!validateIdade(idade)) {
      return;
    }
    setModalVisible(true);
  }

  async function handleSave() {
    try {
      setIsModalLoading(true);

      const payload: ParticipantePayload = {
        idade: parseInt(idade),
        qtd_palavras: qtdPalavras,
        genero,
        nivel_suporte: parseInt(nivelSuporte),
      };

      setModalVisible(false);

      if (participantId) {
        await updateParticipante(participantId, payload);
        await AsyncStorage.setItem("hasParticipant", "true");

        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Dados do participante atualizados.",
        });
      } else {
        const response = await createParticipante(payload);
        if (response && response.id) {
          setParticipantId(response.id.toString());
          await AsyncStorage.setItem("hasParticipant", "true");
          await AsyncStorage.setItem("participantId", response.id.toString());
        }

        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Participante criado com sucesso.",
        });

        if (redirectedFromHome) {
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao salvar os dados do participante.";

      setModalVisible(false);

      Toast.show({
        type: "error",
        text1: "Erro ao salvar dados",
        text2: errorMessage,
      });
    } finally {
      setIsModalLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
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
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="face" size={30} color="#2196F3" />
            </View>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="face-3" size={30} color="#E91E63" />
            </View>
          </View>
          <Text style={styles.title}>
            {participantId ? "Editar Participante" : "Novo Participante"}
          </Text>

          {redirectedFromHome && (
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Por favor, preencha os dados do participante antes de gravar as
                vocalizações.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <FormParticipante
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
            <ButtonCustom
              title={
                participantId ? "Atualizar Participante" : "Criar Participante"
              }
              onPress={handleOpenModal}
              icon={<MaterialIcons name="save" size={20} color="#FFF" />}
              color="#2196F3"
              style={styles.mainButton}
              disabled={!!idadeError || !idade.trim()}
            />

            <ButtonCustom
              title="Voltar para Dados do Usuário"
              variant="secondary"
              onPress={() => router.push("/usuario/editar-usuario")}
              icon={<MaterialIcons name="arrow-back" size={20} color="#666" />}
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
      
      <ModalInfoNiveisAutismo
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
      
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleSave}
        message={`Deseja confirmar a ${
          participantId ? "atualização" : "criação"
        } dos dados do participante?`}
        isLoading={isModalLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  warningText: {
    fontSize: 14,
    color: "#E65100",
    marginLeft: 8,
    flex: 1,
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
});