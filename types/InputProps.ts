import { StyleProp, ViewStyle } from "react-native";

export interface InputProps {
    placeholder?: string;
    label?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    style?: StyleProp<ViewStyle>
    mask?: string;
    maxLength?: number;
    multiline?: boolean;
    editable?: boolean;
    leftIcon?: React.ReactNode;
    numberOfLines?: number;
}