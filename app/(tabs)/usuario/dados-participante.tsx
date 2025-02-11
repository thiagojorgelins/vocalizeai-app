import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";
import { doLogout } from "@/services/authService";
import {
  createParticipante,
  getParticipante,
  updateParticipante,
} from "@/services/participanteService";
import { getUser } from "@/services/usuarioService";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function DadosParticipanteScreen() {
  const [idade, setIdade] = useState("");
  const [qtdPalavras, setQtdPalavras] = useState("");
  const [genero, setGenero] = useState("");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const loadParticipantData = useCallback(async () => {
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
      showMessage({
        message: "Erro ao carregar dados",
        description: errorMessage,
        type: "danger",
        duration: 3000,
        icon: "danger"
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadParticipantData();
    }, [loadParticipantData])
  );

  async function handleSave() {
    try {
      const payload: ParticipantePayload = {
        idade: parseInt(idade),
        qtd_palavras: qtdPalavras,
        genero,
        nivel_suporte: parseInt(nivelSuporte),
      };

      if (participantId) {
        await updateParticipante(participantId, payload);
        showMessage({
          message: "Sucesso!",
          description: "Dados do participante atualizados.",
          type: "success",
          duration: 3000,
          icon: "success"
        });
      } else {
        await createParticipante(payload);
        showMessage({
          message: "Sucesso!",
          description: "Participante criado com sucesso!",
          type: "success",
          duration: 3000,
          icon: "success"
        });
        router.replace("/usuario/editar-usuario");
      }
      setModalVisible(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao salvar os dados do participante.";
      showMessage({
        message: "Erro ao salvar",
        description: errorMessage,
        type: "danger",
        duration: 3000,
        icon: "danger"
      });
    }
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
          <MaterialIcons name="child-care" size={40} color="#2196F3" />
          <Text style={styles.title}>
            {participantId ? "Editar Participante" : "Novo Participante"}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Participante</Text>
            
            <Input
              label="Idade"
              placeholder="Idade do Participante"
              keyboardType="numeric"
              value={idade}
              onChangeText={setIdade}
              leftIcon={<MaterialIcons name="cake" size={20} color="#666" />}
            />
            
            <Select
              label="Gênero"
              selectedValue={genero}
              onValueChange={setGenero}
              options={[
                { label: "Masculino", value: "Masculino" },
                { label: "Feminino", value: "Feminino" },
              ]}
            />
            
            <Select
              label="Nível de Suporte"
              selectedValue={nivelSuporte}
              onValueChange={setNivelSuporte}
              options={[
                { label: "Nível 1", value: "1" },
                { label: "Nível 2", value: "2" },
                { label: "Nível 3", value: "3" },
              ]}
            />
            
            <Select
              label="Quantidade de Palavras"
              selectedValue={qtdPalavras}
              onValueChange={setQtdPalavras}
              options={[
                { label: "Nenhuma palavra", value: "Nenhuma palavra" },
                { label: "Entre 1 - 5", value: "Entre 1 - 5" },
                { label: "Entre 6 - 10", value: "Entre 6 - 10" },
                { label: "Entre 11 - 20", value: "Entre 11 - 20" },
              ]}
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title={participantId ? "Atualizar Participante" : "Criar Participante"}
              onPress={() => setModalVisible(true)}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="save" size={20} color="#FFF" />}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/usuario/editar-usuario")}
            >
              <MaterialIcons name="arrow-back" size={20} color="#666" />
              <Text style={styles.linkText}>Voltar para Dados do Usuário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={doLogout}
            >
              <MaterialIcons name="logout" size={20} color="#D32F2F" />
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleSave}
        message={`Deseja confirmar a ${
          participantId ? "atualização" : "criação"
        } dos dados do participante?`}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: 0.25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
  linkButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  linkText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '500',
  },
});