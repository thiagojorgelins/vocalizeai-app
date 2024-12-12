import { Tabs } from "expo-router";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="home"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recording"
        options={{
          title: "Gravação",
          tabBarIcon: ({ color}) => (
            <TabBarIcon name="microphone" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="cloud-upload"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
