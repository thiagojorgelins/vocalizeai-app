import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  inputContainer: {
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
  },
  input: {
    padding: 16,
    fontSize: 16,
    minHeight: 56
  },
  passwordContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  icon: {
    padding: 10,
  },
});