import React from "react";
import { View, Text, TextInput } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { InputProps } from "@/types/InputProps";
import { styles } from "./style";

export default function Input({
  placeholder,
  value,
  label,
  onChangeText,
  keyboardType = "default",
  style,
  maxLength,
  mask,
}: InputProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, style]}>
        {mask ? (
          <MaskedTextInput
            mask={mask}
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor="#878383"
            style={styles.input}
            value={value}
            onChangeText={(text, rawText) => {
                if (onChangeText) onChangeText(rawText);
              }}
            keyboardType={keyboardType}
          />
        ) : (
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#878383"
            style={styles.input}
            maxLength={maxLength}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
          />
        )}
      </View>
    </>
  );
}
