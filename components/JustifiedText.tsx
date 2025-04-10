import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { JustifiedTextProps } from '@/types/JustifiedTextProps';


export default function JustifiedText({ 
  children, 
  style,
  textBreakStrategy = 'simple',
  ...props
}: JustifiedTextProps) {
  const justifiedStyle = React.useMemo(() => {
    return {
      textAlign: 'justify' as const,
      textBreakStrategy,
    };
  }, [textBreakStrategy]);

  return (
    <Text
      style={[styles.text, justifiedStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 12,
  },
});