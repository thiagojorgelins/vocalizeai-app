import { Stack } from "expo-router";
import React from "react";
import FlashMessage from "react-native-flash-message";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f9f9f9" },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="cadastro"
        options={{
          title: "Cadastro Usuário",
        }}
      />
      <Stack.Screen
        name="esqueci-senha"
        options={{
          title: "Recuperar Senha",
        }}
      />
      <Stack.Screen
        name="participante"
        options={{
          title: "Criar Parcipante",
        }}
      />
    </Stack>
  );
}
