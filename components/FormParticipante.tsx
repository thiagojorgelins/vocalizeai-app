import Input from "@/components/Inputs/Input";
import Select from "@/components/Select";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FormParticipanteProps } from "@/types/FormParticipantProps";



export default function FormParticipante({
  idade,
  setIdade,
  genero,
  setGenero,
  nivelSuporte,
  setNivelSuporte,
  qtdPalavras,
  setQtdPalavras,
  idadeError,
  validateIdade,
  setShowSupportModal,
}: FormParticipanteProps) {
  const handleIdadeChange = (text: string) => {
    setIdade(text);
    validateIdade(text);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informações do Participante</Text>

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
            leftIcon={<MaterialIcons name="star" size={20} color="#666" />}
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
          <MaterialIcons name="record-voice-over" size={20} color="#666" />
        }
      />

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
  );
}

const styles = StyleSheet.create({
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
});
