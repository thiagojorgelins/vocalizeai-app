import { MaterialIcons } from "@expo/vector-icons";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ModalInfoNiveisAutismoProps {
  visible: boolean;
  onClose: () => void;
}
export default function ModalInfoNiveisAutismo({
  visible,
  onClose,
}: ModalInfoNiveisAutismoProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Níveis de Suporte no Autismo
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                Os níveis de suporte do autismo são definidos de acordo com a
                necessidade de apoio que cada pessoa tem. São eles:
              </Text>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 1:</Text>
                <Text style={styles.levelDesc}>Necessita de pouco apoio</Text>
              </View>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 2:</Text>
                <Text style={styles.levelDesc}>
                  Necessita de suporte moderado
                </Text>
              </View>

              <View style={styles.levelItem}>
                <Text style={styles.levelTitle}>Nível 3:</Text>
                <Text style={styles.levelDesc}>
                  Necessita de suporte substancial
                </Text>
              </View>

              <Text style={styles.modalText}>
                A classificação dos níveis de suporte é feita de acordo com o
                Manual Diagnóstico e Estatístico de Transtornos Mentais 5.ª
                edição ou DSM-5. O DSM-5 é um manual diagnóstico e estatístico
                feito pela Associação Americana de Psiquiatria para definir como
                é feito o diagnóstico de transtornos mentais. Usado por
                psicólogos, fonoaudiólogos, médicos e terapeutas ocupacionais.
              </Text>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  Linking.openURL(
                    "https://www.canalautismo.com.br/artigos/os-tres-niveis-de-suporte-no-autismo/#:~:text=Segundo%20o%20Manual%20de%20Diagn%C3%B3stico,para%20pessoas%20de%20sua%20idade"
                  );
                  onClose;
                }}
              >
                <Text style={styles.linkButtonText}>
                  Para mais informações, visite "Os três níveis de suporte no
                  autismo - Canal Autismo"
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
  },
  modalText: {
    fontSize: 16,
    color: "#424242",
    lineHeight: 24,
    marginBottom: 16,
  },
  levelItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginRight: 8,
  },
  levelDesc: {
    fontSize: 16,
    color: "#424242",
  },
  linkButton: {
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 14,
    color: "#2196F3",
    textAlign: "center",
  },
});
