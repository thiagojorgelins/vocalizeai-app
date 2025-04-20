import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import ButtonCustom from "@/components/Button";

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <ButtonCustom
        title="Gerenciar Usuários"
        onPress={() => router.push("/admin/usuarios")}
        style={styles.btnSize}
      />
      <ButtonCustom
        title="Gerenciar Participantes"
        onPress={() => router.push("/admin/participantes")}
        style={styles.btnSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSize: {
    width: 300,
    marginBottom: 10,
  },
});
