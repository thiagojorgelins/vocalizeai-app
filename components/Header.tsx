import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "react-native-linear-gradient";
import Toast from "react-native-toast-message";

let headerUpdateListeners: any[] = [];

export const subscribeToUsernameUpdate = (callback: () => Promise<void>) => {
  headerUpdateListeners.push(callback);
  return () => {
    headerUpdateListeners = headerUpdateListeners.filter(
      (cb) => cb !== callback
    );
  };
};

export const notifyUsernameUpdated = () => {
  headerUpdateListeners.forEach((callback) => callback());
};

export function Header() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const loadUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      setUsername(storedUsername || "Usuário");
    } catch (error) {
      Toast.show({
        text1:
          error instanceof Error
            ? error.message
            : "Erro ao carregar o nome de usuário.",
        text2: "Por favor, tente novamente mais tarde.",
        type: "error",
      });
      setUsername("Usuário");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsername();

      const unsubscribe = subscribeToUsernameUpdate(loadUsername);

      return () => {
        unsubscribe();
      };
    }, [])
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <MaskedView
            style={styles.maskedView}
            maskElement={<Text style={styles.titleText}>VocalizeAI</Text>}
          >
            <LinearGradient
              colors={["#2196F3", "#03A9F4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </MaskedView>

          <LinearGradient
            colors={["#2196F3", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
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
  maskedView: {
    height: 40,
    flexDirection: "row",
  },
  titleText: {
    fontSize: 30,
    fontFamily: "Quicksand-Bold",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleUnderline: {
    height: 3,
    width: "100%",
    marginTop: 8,
    borderRadius: 2,
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
    fontWeight: "600",
    textAlign: "center",
  },
  icon: {
    marginLeft: 2,
  },
});
