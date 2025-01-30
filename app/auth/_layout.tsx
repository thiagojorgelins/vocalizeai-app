import { Stack } from "expo-router";
import React from "react";

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
        name="cadastro-participante"
        options={{
          title: "Criar Parcipante",
        }}
      />
    </Stack>
  );
}
