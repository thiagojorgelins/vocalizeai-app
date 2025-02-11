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
          headerBackVisible: false,
          headerShown: false
        }}
      />
      <Stack.Screen
        name="cadastro"
        options={{
          headerBackVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="esqueci-senha"
        options={{
          headerBackVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="trocar-senha"
        options={{
          headerBackVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cadastro-participante"
        options={{
          headerBackVisible: false,
          headerShown: false
        }}
      />
    </Stack>
  );
}
