import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ButtonCustomProps } from "@/types/ButtonProps";

export default function ButtonCustom({
  title,
  color = "#2196F3",
  onPress,
  style,
  icon,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  outlined = false,
  disabled = false,
}: ButtonCustomProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: "#F5F5F5",
          borderWidth: 1,
          borderColor: "#E0E0E0",
        };
      case "link":
        return {
          backgroundColor: "transparent",
        };
      case "danger":
        return {
          backgroundColor: "#FFF5F5",
          borderWidth: 1,
          borderColor: "#D32F2F",
        };
      default:
        return {
          backgroundColor: outlined ? "transparent" : color,
          borderWidth: outlined ? 1 : 0,
          borderColor: color,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: 36,
          paddingHorizontal: 16,
          borderRadius: 18,
        };
      case "large":
        return {
          height: 56,
          paddingHorizontal: 24,
          borderRadius: 28,
        };
      default:
        return {
          height: 48,
          paddingHorizontal: 20,
          borderRadius: 24,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return "#9E9E9E";

    if (variant === "secondary") return "#424242";
    if (variant === "link") return color;
    if (variant === "danger") return "#D32F2F";

    return outlined ? color : "#FFFFFF";
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <View style={[styles.iconContainer, { opacity: disabled ? 0.5 : 1 }]}>
          {icon}
        </View>
      )}
      <Text
        style={[
          styles.buttonText,
          {
            color: getTextColor(),
            fontSize: getTextSize(),
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
  },
});
