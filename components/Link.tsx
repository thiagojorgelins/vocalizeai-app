import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinkProps, useRouter } from "expo-router";



export default function Link({ href, children, style }: LinkProps) {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push(href)}>
      <Text style={[styles.linkText, style]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linkText: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
