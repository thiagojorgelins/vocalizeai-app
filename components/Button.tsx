import { ButtonCustomProps } from '@/types/ButtonProps';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ButtonCustom({ title, color = '#007BFF', onPress, style, icon }: ButtonCustomProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }, style]}
      onPress={onPress}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
