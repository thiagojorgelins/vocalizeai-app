import { getExpirationTime, updateToken } from "@/services/authService";
import { Slot, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const router = useRouter();

  const checkToken = async () => {
    try {
      const now = Date.now();
      const expirationTime = await getExpirationTime();

      if (expirationTime > now) {
        router.replace("/(tabs)");
      } else {
        await updateToken();

        const newExpirationTime = await getExpirationTime();
        if (newExpirationTime > now) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth/login");
        }
      }
    } catch (error) {
      showMessage({
        message: "Erro ao verificar token",
        description: "Por favor, faça login novamente",
        type: "danger",
      });
      router.replace("/auth/login");
    } finally {
      setTimeout(() => setIsSplashVisible(false), 1000);
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {isSplashVisible ? (
        <View style={styles.splashContainer}>
          <Text style={styles.splashText}>VocalizaAI</Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : null}
      <Slot />
      <FlashMessage position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    zIndex: 1,
  },
  splashText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
