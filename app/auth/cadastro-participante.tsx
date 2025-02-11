import ButtonCustom from "@/components/Button";
import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";

import { createParticipante } from "@/services/participanteService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function CadastroParticipanteScreen() {
  const [genero, setGenero] = useState("Masculino");
  const [nivelSuporte, setNivelSuporte] = useState("1");
  const [qtdPalavras, setQtdPalavras] = useState("Nenhuma palavra");
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

        await createParticipante(payload);

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
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.container}
  >
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialIcons name="person-add" size={40} color="#2196F3" />
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
            placeholder="Informe a idade"
            keyboardType="numeric"
            value={idade}
            maxLength={3}
            onChangeText={setIdade}
            leftIcon={<MaterialIcons name="cake" size={20} color="#666" />}
          />
        </View>

        <View style={styles.actions}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
          ) : (
            <ButtonCustom
              title="Criar Participante"
              onPress={handleCreateParticipante}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="save" size={20} color="#FFF" />}
            />
          )}
        </View>
      </View>
    </ScrollView>
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
},
section: {
  marginBottom: 24,
  gap: 16,
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
loader: {
  marginVertical: 20,
},
});