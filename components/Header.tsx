import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";

export function Header() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const loadUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      setUsername(storedUsername || "Usuário");
    } catch (error) {
      console.error("Erro ao carregar username:", error);
      setUsername("Usuário");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsername();
    }, [loadUsername])
  );
  
  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>VocalizaAI</Text>
        </View>

        <TouchableOpacity
          style={styles.userButton}
          activeOpacity={0.7}
          onPress={() => router.push("/usuario/editar-usuario")}
        >
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          <Ionicons
            name="person-circle-outline"
            size={28}
            color="#444"
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2C3E50",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: -2,
  },
  userButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    maxWidth: 160,
  },
  username: {
    fontSize: 14,
    color: "#444",
    marginRight: 6,
    flex: 1,
  },
  icon: {
    marginLeft: 2,
  },
});
