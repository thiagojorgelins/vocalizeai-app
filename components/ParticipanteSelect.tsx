import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Select from "./Select";

type Participante = {
  id: number;
  nome?: string;
};

type ParticipanteSelectProps = {
  participantes: Participante[];
  selectedParticipanteId: number | null;
  onParticipanteChange: (id: number) => void;
  placeholder?: string;
};

export default function ParticipanteSelect ({
  participantes,
  selectedParticipanteId,
  onParticipanteChange,
  placeholder,
}: ParticipanteSelectProps) {
  if (participantes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="warning" size={24} color="#FFC107" />
        <Text style={styles.emptyText}>
          Nenhum participante cadastrado. Por favor, cadastre um participante primeiro.
        </Text>
      </View>
    );
  }

  const options = participantes.map((p) => ({
    label: p.nome || `Participante ${p.id}`,
    value: p.id.toString(),
  }));

  return (
    <View style={styles.container}>
      <Select
        label="Selecione o Participante"
        selectedValue={selectedParticipanteId?.toString() || ""}
        onValueChange={(value) => onParticipanteChange(Number(value))}
        options={options}
        leftIcon={<MaterialIcons name="person" size={20} color="#666" />}
        placeholder={placeholder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#5D4037",
    marginLeft: 8,
    flex: 1,
  },
});
