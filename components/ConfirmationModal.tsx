import { ConfirmationModalProps } from "@/types/ConfirmationModalProps";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ButtonCustom from "./Button";
import Input from "./Inputs/Input";

export default function ConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  onResend,
  message,
  input,
  showResendButton,
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = React.useState(input?.value || "");

  React.useEffect(() => {
    if (input) {
      setInputValue(input.value);
    }
  }, [input]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{message}</Text>
            {input && (
              <Input
                placeholder={input.placeholder}
                value={inputValue}
                style={{ marginBottom: 20, width: "100%" }}
                onChangeText={(text) => {
                  setInputValue(text);
                  input.onChangeText(text);
                }}
              />
            )}
            <View style={styles.modalButtons}>
              <ButtonCustom
                title="Confirmar"
                onPress={() => onConfirm(inputValue)}
                color="black"
                style={{ width: "45%" }}
              />
              <ButtonCustom
                title="Cancelar"
                onPress={onCancel}
                color="red"
                style={{ width: "45%" }}
              />
            </View>
            {showResendButton && (
              <ButtonCustom
                title="Reenviar código"
                onPress={onResend}
                color="blue"
                style={{ marginTop: 20, width: "100%" }}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
