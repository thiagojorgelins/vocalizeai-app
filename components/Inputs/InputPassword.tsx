import { InputProps } from "@/types/InputProps";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./style";
import * as Animatable from 'react-native-animatable';

export default function InputPassword({
  placeholder,
  value,
  label,
  onChangeText,
  style,
  leftIcon,
  error,
  errorMessage
}: InputProps) {
  const [hidePass, setHidePass] = useState(true);

  const passwordContainerStyle = [
    styles.passwordContainer,
    style,
    error ? styles.inputError : null
  ];

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={passwordContainerStyle}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#878383"
          secureTextEntry={hidePass}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setHidePass(!hidePass)}
        >
          {hidePass ? (
            <MaterialIcons name="visibility" color="#878383" size={24} />
          ) : (
            <MaterialIcons name="visibility-off" color="#878383" size={24} />
          )}
        </TouchableOpacity>
      </View>
      {error && errorMessage && (
        <Animatable.Text 
          animation="shake" 
          duration={500}
          style={styles.errorText}
        >
          {errorMessage}
        </Animatable.Text>
      )}
    </>
  );
}