import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";

import { createParticipantData } from "@/services/userService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { showMessage } from "react-native-flash-message";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function CadastroParticipanteScreen() {
  const [genero, setGenero] = useState("");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [qtdPalavras, setQtdPalavras] = useState("");
  const [idade, setIdade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleCreateParticipante() {
    if (!idade) {
        showMessage({
            message: "Todos os campos são obrigatórios.",
            type: "danger",
        });
        return;
    }

    if (parseInt(idade) < 1 || parseInt(idade) > 200) {
        showMessage({
            message: "Idade deve estar entre 1 e 200.",
            type: "danger",
        });
        return;
    }

    try {
        setIsLoading(true);

        const payload = {
            genero,
            idade: parseInt(idade),
            nivel_suporte: parseInt(nivelSuporte),
            qtd_palavras: qtdPalavras,
        };

        await createParticipantData(payload);

        showMessage({
            message: "Participante criado com sucesso!",
            type: "success",
        });
        router.replace("/(tabs)");
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail || 
            error.message || 
            "Erro ao criar participante.";
        showMessage({
            message: errorMessage,
            type: "danger",
        });
    } finally {
        setIsLoading(false);
    }
}


  return (
    <ScrollView style={styles.container}>
      <Select
        label="Gênero"
        selectedValue={genero}
        onValueChange={setGenero}
        options={[
          { label: "Masculino", value: "M" },
          { label: "Feminino", value: "F" },
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

      <Input
        label="Idade do Participante"
        placeholder="Idade do Participante"
        keyboardType="numeric"
        value={idade}
        maxLength={3}
        onChangeText={setIdade}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ButtonCustom
          title="Criar Participante"
          onPress={handleCreateParticipante}
          color={"black"}
          style={{ marginTop: 20 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
