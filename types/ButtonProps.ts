import { ButtonProps, StyleProp, ViewStyle } from 'react-native';
export interface ButtonCustomProps extends ButtonProps {
  style?: StyleProp<ViewStyle>
  icon?: React.ReactNode;
}
