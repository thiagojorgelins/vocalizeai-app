export interface ConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (inputValue?: string) => void;
  message: string;
  input?: {
      placeholder: string;
      value: string;
      onChangeText: (text: string) => void;
  };
  onResend?: () => void;
  showResendButton?: boolean;
}