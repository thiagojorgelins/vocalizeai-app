import { ModalProps } from "@/types/ModalProps";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import ButtonCustom from "./Button";

export default function ConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  message,
}: ModalProps) {
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
            <View style={styles.modalButtons}>
              <ButtonCustom
                title="Cancelar"
                onPress={onCancel}
                color="red"
                style={{ marginRight: 10 }}
              />
              <ButtonCustom
                title="Confirmar"
                onPress={onConfirm}
                color="green"
              />
            </View>
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
    flexDirection: "row",
  },
});
