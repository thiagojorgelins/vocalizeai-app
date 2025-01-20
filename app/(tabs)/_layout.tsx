import { Header } from "@/components/Header";
import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={32} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { ...style.tabBar },
          tabBarLabelStyle: { ...style.tabBarLabel },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Gravação",
            tabBarIcon: () => <TabBarIcon name="microphone" color={"black"} />,
          }}
        />
        <Tabs.Screen
          name="audios"
          options={{
            title: "Áudios",
            tabBarIcon: () => <TabBarIcon name="upload" color={"black"} />,
          }}
        />
        <Tabs.Screen
          name="editar-usuario"
          options={{
            title: "Editar Usuário",
            href: null,
          }}
        />
        <Tabs.Screen
          name="dados-participante"
          options={{
            title: "Dados do Participante",
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}

const style = StyleSheet.create({
  tabBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    padding: 8,
    backgroundColor: "#D8D8D8",
    color: "white",
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "black",
  },
});
