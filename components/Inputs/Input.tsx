import { InputProps } from "@/types/InputProps";
import React from "react";
import { Text, TextInput, View } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
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
  multiline,
  editable
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
            multiline={multiline}
            editable={editable}
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
            multiline={multiline}
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
          />
        )}
      </View>
    </>
  );
}
