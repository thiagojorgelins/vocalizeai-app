import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    margin: -4,
    color: "#424242",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: "#fff",
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    padding: 8,
    fontSize: 16,
    minHeight: 56,
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  iconContainer: {
    paddingLeft: 16,
  },
  passwordContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#ddd',
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
  errorCountContainer: {
    margin: -8,
    marginLeft: 8,
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757575',
    textAlign: 'right',
  }
});