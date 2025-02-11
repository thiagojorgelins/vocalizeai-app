import { ButtonProps, StyleProp, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'link' | 'danger';
export interface ButtonCustomProps extends ButtonProps {
  style?: StyleProp<ViewStyle>
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  outlined?: boolean;
  disabled?: boolean;
}
