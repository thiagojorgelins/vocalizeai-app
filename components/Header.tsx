import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function Header() {
  const [username, setUsername] = useState("");
  const router = useRouter();
    
  useEffect(() => {
    (async () => {
      const userName = await AsyncStorage.getItem("username");
      setUsername(userName || "Usuário");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CAUTA</Text>
      <TouchableOpacity
        style={styles.button_user}
        onPress={() => router.push("/editar-usuario")}
      >
        <Text>{username}</Text>
        <Ionicons name="person-circle-outline" size={24}/>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
    height: 64,
    backgroundColor: "#D8D8D8",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button_user: {
    display: 'flex',
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
});
