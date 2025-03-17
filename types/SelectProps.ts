import { StyleProp, ViewStyle } from "react-native";

export interface SelectProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}