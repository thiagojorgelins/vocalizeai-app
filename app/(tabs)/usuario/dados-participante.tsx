import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import ConfirmationModal from "@/components/ConfirmationModal";
import Select from "@/components/Select";
import { doLogout } from "@/services/authService";
import {
  createParticipante,
  getParticipante,
  updateParticipante,
} from "@/services/participanteService";
import { getUser } from "@/services/usuarioService";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
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
        message: "Erro",
        description: errorMessage,
        type: "danger",
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
          message: "Dados do participante atualizados!",
          type: "success",
        });
      } else {
        await createParticipante(payload);
        showMessage({
          message: "Participante criado com sucesso!",
          type: "success",
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
        message: errorMessage,
        type: "danger",
      });
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Gênero"
        placeholder="Idade do Participante"
        keyboardType="numeric"
        value={idade}
        onChangeText={setIdade}
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
      <ButtonCustom
        title={participantId ? "Atualizar Participante" : "Criar Participante"}
        onPress={() => setModalVisible(true)}
        color="black"
        style={{ marginBottom: 10 }}
      />
      <ButtonCustom
        title="Voltar para Dados do Usuário"
        onPress={() => router.push("/usuario/editar-usuario")}
        color="#464646"
        style={{ marginBottom: 10 }}
      />
      <ButtonCustom title="Logout" color="red" onPress={doLogout} />

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleSave}
        message={`Deseja confirmar a ${
          participantId ? "atualização" : "criação"
        } dos dados do participante?`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
