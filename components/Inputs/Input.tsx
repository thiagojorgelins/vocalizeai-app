import { InputProps } from "@/types/InputProps";
import React from "react";
import { Text, TextInput, View } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { styles } from "./style";
import * as Animatable from "react-native-animatable";

export default function Input({
  placeholder,
  value = "",
  label,
  onChangeText,
  keyboardType = "default",
  style,
  maxLength,
  mask,
  multiline,
  editable,
  leftIcon,
  error,
  errorMessage,
  showCharacterCount = false,
}: InputProps) {
  const inputContainerStyle = [
    styles.inputContainer,
    style,
    error ? styles.inputError : null,
  ];

  const charactersUsed = value ? value.length : 0;

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        {mask ? (
          <MaskedTextInput
            mask={mask}
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor="#878383"
            style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
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
            style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
            maxLength={maxLength}
            multiline={multiline}
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
          />
        )}
      </View>
      <View style={styles.errorCountContainer}>
        <View>
          {error && errorMessage && (
            <Animatable.Text
              animation="shake"
              duration={500}
              style={styles.errorText}
            >
              {errorMessage}
            </Animatable.Text>
          )}
        </View>
        {showCharacterCount && (
          <Text style={styles.characterCount}>
            {charactersUsed} / {maxLength}
          </Text>
        )}
      </View>
    </>
  );
}
