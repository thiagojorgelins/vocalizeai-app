import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";

import { createParticipante } from "@/services/participanteService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function CadastroParticipanteScreen() {
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [qtdPalavras, setQtdPalavras] = useState(
    "Não pronuncia nenhuma palavra"
  );
  const [idade, setIdade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [idadeError, setIdadeError] = useState("");

  const router = useRouter();

  const handleIdadeChange = (text: string) => {
    setIdade(text);
    validateIdade(text);
  };

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

  async function handleCreateParticipante() {
    if (!validateIdade(idade)) {
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        genero,
        idade: parseInt(idade),
        nivel_suporte:
          nivelSuporte === "Não sei informar" ? 0 : parseInt(nivelSuporte),
        qtd_palavras: qtdPalavras,
      };

      await createParticipante(payload);

      Toast.show({
        type: "success",
        text1: "Participante criado com sucesso!",
        text2: "Você já pode acessar o sistema completo.",
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao criar participante.";
      Toast.show({
        type: "error",
        text1: "Erro ao criar participante",
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Participante</Text>

            <Select
              label="Gênero"
              selectedValue={genero}
              onValueChange={setGenero}
              options={[
                { label: "Masculino", value: "Masculino" },
                { label: "Feminino", value: "Feminino" },
                { label: "Outros", value: "Outros" },
              ]}
              leftIcon={<MaterialIcons name="face" size={20} color="#666" />}
            />

            <View style={styles.supportLevelContainer}>
              <View style={styles.selectWithHelpContainer}>
                <Select
                  style={{ minWidth: "85%" }}
                  label="Nível de Suporte"
                  selectedValue={nivelSuporte}
                  onValueChange={setNivelSuporte}
                  options={[
                    { label: "Nível 1", value: "1" },
                    { label: "Nível 2", value: "2" },
                    { label: "Nível 3", value: "3" },
                    { label: "Não sei informar", value: "0" },
                  ]}
                  leftIcon={
                    <MaterialIcons name="star" size={20} color="#666" />
                  }
                />
                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() => setShowSupportModal(true)}
                >
                  <MaterialIcons name="help" size={22} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </View>

            <Select
              label="Quantidade de Palavras"
              selectedValue={qtdPalavras}
              onValueChange={setQtdPalavras}
              options={[
                {
                  label: "Não pronuncia nenhuma palavra",
                  value: "Não pronuncia nenhuma palavra",
                },
                {
                  label: "Pronuncia entre 1 e 5 palavras",
                  value: "Pronuncia entre 1 e 5 palavras",
                },
                {
                  label: "Pronuncia entre 6 e 15 palavras",
                  value: "Pronuncia entre 6 e 15 palavras",
                },
                {
                  label: "Pronuncia 16 ou mais palavras",
                  value: "Pronuncia 16 ou mais palavras",
                },
              ]}
              leftIcon={
                <MaterialIcons
                  name="record-voice-over"
                  size={20}
                  color="#666"
                />
              }
            />

            <View style={styles.readOnlyFieldContainer}>
              <Text style={styles.fieldLabel}>Condição do Participante</Text>
              <View style={styles.readOnlyField}>
                <MaterialIcons
                  name="medical-services"
                  size={20}
                  color="#666"
                  style={styles.fieldIcon}
                />
                <Text style={styles.readOnlyText}>TEA</Text>
              </View>
            </View>
            <Input
              label="Idade do Participante"
              placeholder="Informe a idade"
              keyboardType="numeric"
              value={idade}
              maxLength={2}
              onChangeText={handleIdadeChange}
              leftIcon={<MaterialIcons name="cake" size={20} color="#666" />}
              error={!!idadeError}
              errorMessage={idadeError}
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
                title="Criar Participante"
                onPress={handleCreateParticipante}
                color="#2196F3"
                style={styles.mainButton}
                icon={<MaterialIcons name="save" size={20} color="#FFF" />}
                disabled={!!idadeError || !idade.trim()}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showSupportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Níveis de Suporte no Autismo
              </Text>
              <TouchableOpacity
                onPress={() => setShowSupportModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                Os níveis de suporte do autismo são definidos de acordo com a
                necessidade de apoio que cada pessoa tem. São eles:
              </Text>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 1:</Text>
                <Text style={styles.levelDesc}>Necessita de pouco apoio</Text>
              </View>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 2:</Text>
                <Text style={styles.levelDesc}>
                  Necessita de suporte moderado
                </Text>
              </View>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 3:</Text>
                <Text style={styles.levelDesc}>
                  Necessita de suporte substancial
                </Text>
              </View>

              <Text style={styles.modalText}>
                A classificação dos níveis de suporte é feita de acordo com o
                Manual Diagnóstico e Estatístico de Transtornos Mentais 5.ª
                edição ou DSM-5. O DSM-5 é um manual diagnóstico e estatístico
                feito pela Associação Americana de Psiquiatria para definir como
                é feito o diagnóstico de transtornos mentais. Usado por
                psicólogos, fonoaudiólogos, médicos e terapeutas ocupacionais.
              </Text>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  Linking.openURL(
                    "https://www.canalautismo.com.br/artigos/os-tres-niveis-de-suporte-no-autismo/#:~:text=Segundo%20o%20Manual%20de%20Diagn%C3%B3stico,para%20pessoas%20de%20sua%20idade"
                  );
                  setShowSupportModal(false);
                }}
              >
                <Text style={styles.linkButtonText}>
                  Para mais informações, visite "Os três níveis de suporte no
                  autismo - Canal Autismo"
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  readOnlyFieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#424242",
    marginBottom: 8,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldIcon: {
    marginRight: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
  },
  supportLevelContainer: {
    width: "100%",
    marginBottom: 16,
  },
  selectWithHelpContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  helpButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    elevation: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: "100%",
  },
  modalText: {
    fontSize: 16,
    color: "#424242",
    lineHeight: 24,
    marginBottom: 16,
  },
  levelItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginRight: 8,
  },
  levelDesc: {
    fontSize: 16,
    color: "#424242",
  },
  linkButton: {
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 14,
    color: "#2196F3",
    textAlign: "center",
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
