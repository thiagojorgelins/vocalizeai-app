import { getExpirationTime, updateToken } from "@/services/authService";
import { getParticipantesByUsuario } from "@/services/participanteService";
import { getUser } from "@/services/usuarioService";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Font from "expo-font";
import { Slot, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

const fontMap = {
  Quicksand: require("@/assets/fonts/Quicksand-Regular.ttf"),
  "Quicksand-Bold": require("@/assets/fonts/Quicksand-Bold.ttf"),
};

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const router = useRouter();

  const loadFonts = async () => {
    try {
      await Font.loadAsync(fontMap);
      setFontsLoaded(true);
      return true;
    } catch (error) {
      setFontsLoaded(true);
      return false;
    }
  };

  const loadInitialData = async () => {
    try {
      const userData = await getUser();
      const userId = userData.id;
      if (userId) {
        await getParticipantesByUsuario(userId);
      }
      await getVocalizacoes();
    } catch (error) {}
  };

  const checkToken = async () => {
    try {
      await loadFonts();

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
      Toast.show({
        type: "error",
        text1: "Erro ao verificar token",
        text2: "Por favor, faça login novamente",
      });
      router.replace("/auth/login");
    } finally {
      setTimeout(() => {
        setIsSplashVisible(false);
        SplashScreen.hideAsync();
      }, 1500);
    }
  };

  useEffect(() => {
    checkToken();
    loadInitialData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {isSplashVisible ? (
        <View style={styles.splashContainer}>
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <Text
                style={[
                  styles.splashText,
                  fontsLoaded ? { fontFamily: "Quicksand-Bold" } : null,
                ]}
              >
                VocalizeAI
              </Text>
            }
          >
            <LinearGradient
              colors={["#2196F3", "#03A9F4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.splashText,
                  { opacity: 0 },
                  fontsLoaded ? { fontFamily: "Quicksand-Bold" } : null,
                ]}
              >
                VocalizeAI
              </Text>
            </LinearGradient>
          </MaskedView>

          <LinearGradient
            colors={["#2196F3", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.underline}
          />

          <ActivityIndicator
            style={{ marginTop: 30 }}
            size="large"
            color="#2196F3"
          />
        </View>
      ) : null}
      <Slot />
      <Toast visibilityTime={3000} position="top" />
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
  maskedView: {
    height: 60,
    flexDirection: "row",
  },
  splashText: {
    fontSize: 48,
    fontFamily: "Quicksand-Bold",
    letterSpacing: 1.2,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  underline: {
    width: "60%",
    height: 3,
    marginTop: 8,
    borderRadius: 2,
  },
});
