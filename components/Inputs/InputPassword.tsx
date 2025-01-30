import { InputProps } from "@/types/InputProps";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./style";

export default function InputPassword({
  placeholder,
  value,
  label,
  onChangeText,
  style,
}: InputProps) {
  const [hidePass, setHidePass] = useState(true);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.passwordContainer, style]}>
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
    </>
  );
}
