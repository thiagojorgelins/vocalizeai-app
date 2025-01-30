import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ButtonCustom from "../../components/Button";

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <ButtonCustom
        title="Gerenciar Vocalizações"
        onPress={() => router.push("/admin/vocalizacoes")}
        style={styles.btnSize}
        color="#000"
      />
      <ButtonCustom
        title="Gerenciar Usuários"
        onPress={() => router.push("/admin/usuarios")}
        style={styles.btnSize}
        color="#000"
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
