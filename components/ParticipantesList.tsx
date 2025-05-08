import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ParticipantePayload } from "@/types/ParticipantePayload";

interface Participante extends ParticipantePayload {
  id: number;
};

type ParticipantesListProps = {
  participantes: Participante[];
  onSelectParticipante: (participante: Participante) => void;
  onAddParticipante: () => void;
};

export default function ParticipantesList ({
  participantes,
  onSelectParticipante,
  onAddParticipante,
}: ParticipantesListProps){
  const renderItem = ({ item }: { item: Participante }) => (
    <TouchableOpacity
      style={styles.participanteCard}
      onPress={() => onSelectParticipante(item)}
    >
      <View style={styles.participanteInfo}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="face" size={30} color="#2196F3" />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.participanteName}>{item.nome || `Participante ${item.id}`}</Text>
          <Text style={styles.participanteDetails}>{item.genero}, {item.idade} anos</Text>
          <Text style={styles.participanteDetails}>
            {item.nivel_suporte === 0 ? "Nível não informado" : `Nível ${item.nivel_suporte}`}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={participantes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Participantes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddParticipante}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Novo Participante</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>Nenhum participante encontrado</Text>
            <Text style={styles.emptySubtext}>
              Crie um novo participante para começar
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  participanteCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  participanteInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  participanteName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  participanteDetails: {
    fontSize: 14,
    color: "#666666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
});
