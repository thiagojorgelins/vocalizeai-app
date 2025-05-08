import ButtonCustom from "@/components/Button";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message?: string;
  primaryButtonText: string;
  primaryButtonIcon?: React.ReactNode;
  primaryButtonColor?: string;
  onPrimaryButtonPress: () => void;
  secondaryButtonText: string;
  secondaryButtonIcon?: React.ReactNode;
  secondaryButtonColor?: string;
  onSecondaryButtonPress: () => void;
}

export default function SuccessModal({
  visible,
  title,
  message = "O que você deseja fazer agora?",
  primaryButtonText,
  primaryButtonIcon = <MaterialIcons name="person-add" size={20} color="#FFF" />,
  primaryButtonColor = "#2196F3",
  onPrimaryButtonPress,
  secondaryButtonText,
  secondaryButtonIcon = <MaterialIcons name="home" size={20} color="#FFF" />,
  secondaryButtonColor = "#4CAF50",
  onSecondaryButtonPress,
}: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.successModalTitle}>
            {title}
          </Text>
          <Text style={styles.successModalMessage}>
            {message}
          </Text>
          <View style={styles.successModalButtons}>
            <ButtonCustom
              title={primaryButtonText}
              onPress={onPrimaryButtonPress}
              icon={primaryButtonIcon}
              color={primaryButtonColor}
              style={styles.successModalButton}
            />
            <ButtonCustom
              title={secondaryButtonText}
              onPress={onSecondaryButtonPress}
              icon={secondaryButtonIcon}
              color={secondaryButtonColor}
              style={styles.successModalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "85%",
    elevation: 4,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
    textAlign: "center",
  },
  successModalMessage: {
    fontSize: 16,
    color: "#666666",
    marginVertical: 16,
    textAlign: "center",
  },
  successModalButtons: {
    width: "100%",
    gap: 12,
  },
  successModalButton: {
    marginVertical: 0,
  },
});