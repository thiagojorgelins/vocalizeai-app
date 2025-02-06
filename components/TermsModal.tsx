import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import ButtonCustom from '@/components/Button';
import { TermsModalProps } from '@/types/TermsModalProps';


export function TermsModal({ visible, onClose }: TermsModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>Termos de Uso e Política de Privacidade</Text>
            <Text style={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
          </ScrollView>
          <ButtonCustom
            title="Fechar"
            onPress={onClose}
            color="black"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  scrollView: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
});