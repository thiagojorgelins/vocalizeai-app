import { Header } from "@/components/Header";
import { getRole } from "@/services/util";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}) {
  return <MaterialIcons size={32} style={{ marginBottom: -3 }} {...props} />;
}
export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await getRole();
        setRole(storedRole);
      } catch (error) {
        console.error("Erro ao buscar a role do AsyncStorage", error);
      }
    };

    fetchRole();
  }, []);

  if (role == null) {
    return null;
  }

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
            tabBarIcon: ({ color }) => <TabBarIcon name="mic" color={color} />,
          }}
        />
        <Tabs.Screen
          name="audios"
          options={{
            title: "Áudios",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="audio-file" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="usuario/editar-usuario"
          options={{
            title: "Editar Usuário",
            href: null,
          }}
        />
        <Tabs.Screen
          name="usuario/dados-participante"
          options={{
            title: "Dados do Participante",
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin/vocalizacoes"
          options={{
            title: "Vocalizações",
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin/usuarios"
          options={{
            title: "Usuarios",
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="admin-panel-settings" color={color} />
            ),
            tabBarItemStyle: { display: role === "admin" ? "flex" : "none" },
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
