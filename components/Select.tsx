import { SelectProps } from "@/types/SelectProps";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Select({
  label,
  selectedValue,
  onValueChange,
  options,
  style,
  leftIcon,
  placeholder,
}: SelectProps) {
  const pickerContainerStyle = [styles.pickerContainer, style];

  const pickerOptions = placeholder
    ? [{ label: placeholder, value: "" }, ...options]
    : options;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={pickerContainerStyle}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={styles.picker}
            dropdownIconColor="#666"
            itemStyle={styles.pickerItem}
          >
            {pickerOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
                color={option.value === "" ? "#999" : "#424242"}
              />
            ))}
          </Picker>
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color="#666"
            style={styles.dropdownIcon}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#424242",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 24,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    overflow: "hidden",
  },
  pickerWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  picker: {
    flex: 1,
    height: 56,
    color: "#424242",
    paddingLeft: 12,
  },
  pickerItem: {
    paddingLeft: 20,
    fontSize: 16,
  },
  dropdownIcon: {
    position: "absolute",
    right: 12,
    pointerEvents: "none",
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
});
