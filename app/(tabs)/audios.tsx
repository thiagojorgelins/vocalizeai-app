import { StyleSheet, Text, View } from "react-native";

export default function AudiosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audios</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sendAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  sendAllText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
  },
  audioList: {
    flex: 1,
  },
  audioItem: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  audioName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  audioActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
});
