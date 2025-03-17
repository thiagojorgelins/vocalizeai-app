import { StyleProp, ViewStyle } from "react-native";

export interface ConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (inputValue?: string) => void;
  onResend?: () => void;
  message: string;
  input?: {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  };
  showResendButton?: boolean;
  error?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}