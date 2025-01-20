export interface ModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    message: string;
}