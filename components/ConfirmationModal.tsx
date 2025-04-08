import { ConfirmationModalProps } from "@/types/ConfirmationModalProps";
import React, { useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from "react-native";
import ButtonCustom from "./Button";
import Input from "./Inputs/Input";
import Toast from "react-native-toast-message";

export default function ConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  onResend,
  message,
  input,
  showResendButton,
  error,
  errorMessage,
  isLoading,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "#4CAF50",
  cancelColor = "#F44336",
  confirmIcon,
  confirmDisabled,
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [localError, setLocalError] = React.useState("");
  
  useEffect(() => {
    if (visible) {
      setInputValue(input?.value || "");
      setLocalError("");
    }
  }, [visible, input?.value]);

  useEffect(() => {
    if (error) {
      setLocalError(errorMessage || "Valor inválido");
    } else {
      setLocalError("");
    }
  }, [error, errorMessage]);

  const handleConfirm = () => {
    if (input && !inputValue.trim()) {
      setLocalError("Este campo é obrigatório");
      return;
    }
    
    setLocalError("");
    
    onConfirm(inputValue);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>{message}</Text>
              
              {input && (
                <Input
                  placeholder={input.placeholder}
                  value={inputValue}
                  style={{ marginBottom: 24, width: "100%" }}
                  onChangeText={(text) => {
                    setInputValue(text);
                    if (input.onChangeText) {
                      input.onChangeText(text);
                    }
                    if (localError) setLocalError("");
                  }}
                  keyboardType={input.keyboardType || "default"}
                  error={!!localError}
                  errorMessage={localError}
                />
              )}
              
              <View style={styles.modalButtons}>
                <ButtonCustom
                  title={cancelText}
                  onPress={onCancel}
                  color={cancelColor}
                  style={{ width: "45%" }}
                  disabled={isLoading}
                />
                <ButtonCustom
                  title={confirmText}
                  onPress={handleConfirm}
                  color={confirmColor}
                  style={{ width: "45%" }}
                  disabled={confirmDisabled || isLoading}
                  icon={confirmIcon}
                />
              </View>
              
              {isLoading && (
                <ActivityIndicator 
                  size="large" 
                  color="#2196F3" 
                  style={styles.loader} 
                />
              )}
              
              {showResendButton && (
                <ButtonCustom
                  title="Reenviar código"
                  onPress={onResend}
                  variant="link"
                  style={{ marginTop: 20, width: "100%" }}
                  disabled={isLoading}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      <Toast />
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
    width: "85%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#424242",
    lineHeight: 22,
  },
  modalButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
});