import { StyleProp, TextProps, TextStyle } from "react-native";

export interface JustifiedTextProps extends TextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  textBreakStrategy?: 'simple' | 'highQuality' | 'balanced';
}