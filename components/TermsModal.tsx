import ButtonCustom from "@/components/Button";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  initialAccepted?: boolean;
  onAcceptChange?: (accepted: boolean) => void;
}

export function TermsModal({
  visible,
  onClose,
  onAccept,
  initialAccepted = false,
  onAcceptChange,
}: TermsModalProps) {
  const [accepted, setAccepted] = useState(initialAccepted);

  useEffect(() => {
    setAccepted(initialAccepted);
  }, [initialAccepted]);

  const handleAccept = () => {
    const newAccepted = !accepted;
    setAccepted(newAccepted);

    if (onAcceptChange) {
      onAcceptChange(newAccepted);
    }
  };

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
            <Text style={styles.title}>
              Termo de Consentimento Livre e Esclarecido (TCLE)
            </Text>

            <Text style={styles.sectionTitle}>Pesquisa:</Text>
            <Text style={styles.paragraph}>
              A utilização de tecnologias assistivas para ampliar a capacidade
              de comunicação de pessoas que estão dentro do transtorno do
              espectro autista.
            </Text>

            <Text style={styles.sectionTitle}>Projeto:</Text>
            <Text style={styles.paragraph}>
              VocalizeAI: uma ferramenta de apoio à comunicação para pessoas
              autistas não verbais por meio da classificação de vocalizações
              utilizando inteligência artificial.
            </Text>

            <Text style={styles.paragraph}>
              Você está sendo convidado(a) à participar, de forma voluntária, de
              uma pesquisa científica realizada no Instituto Federal de
              Educação, Ciência e Tecnologia de Pernambuco (IFPE). Antes de
              decidir, é importante que você compreenda por que esta pesquisa
              está sendo realizada e o como será sua participação. Por favor,
              leia atentamente este documento. Em caso de dúvidas, você poderá
              entrar em contato com o pesquisador responsável.
            </Text>

            <Text style={styles.sectionTitle}>1. Objetivo da pesquisa</Text>
            <Text style={styles.paragraph}>
              Esta pesquisa tem como objetivo desenvolver uma ferramenta baseada
              em inteligência artificial capaz de auxiliar na interpretação das
              vocalizações de pessoas autistas não verbais. Para que isto seja
              possível, estamos utilizando nesta etapa da pesquisa um aplicativo
              que possibilita aos cuidadores e responsáveis coletar e
              classificar novas vocalizações emitidas por esses indivíduos. As
              vocalizações coletadas nesta fase, serão utilizadas para formar
              uma base de dados que será utilizada em um futuro próximo para
              treinar uma inteligência artificial e assim possibilitar o
              desenvolvimento de um novo aplicativo que consiga interpretar
              vocalizações automaticamente.
            </Text>

            <Text style={styles.sectionTitle}>2. Participação</Text>
            <Text style={styles.paragraph}>
              A participação consiste no uso do aplicativo, por meio do qual
              serão coletados e classificados áudios de vocalizações em cinco
              categorias: prazer, desregulação, frustração, solicitar, auto
              conversa e social. A participação é totalmente voluntária e você
              pode desistir a qualquer momento, sem qualquer prejuízo.
            </Text>

            <Text style={styles.sectionTitle}>3. Uso dos dados</Text>
            <Text style={styles.paragraph}>
              As vocalizações e classificações fornecidas serão utilizadas
              exclusivamente para fins de pesquisa científica e para o
              desenvolvimento de uma ferramenta de inteligência artificial.
              Nenhuma informação pessoal identificável será divulgada ou
              compartilhada com terceiros sem seu consentimento prévio. Seus
              dados serão tratados com confidencialidade e armazenados em
              ambiente seguro.
            </Text>

            <Text style={styles.sectionTitle}>4. Riscos e benefícios</Text>
            <Text style={styles.paragraph}>
              Não há riscos diretos associados à participação na pesquisa. A sua
              colaboração contribuirá para o avanço científico no campo da
              comunicação alternativa para pessoas autistas não verbais, podendo
              gerar impactos positivos na qualidade de vida desses indivíduos e
              de seus cuidadores.
            </Text>

            <Text style={styles.sectionTitle}>5. Confidencialidade</Text>
            <Text style={styles.paragraph}>
              As informações fornecidas serão mantidas sob sigilo e usadas
              apenas para os fins desta pesquisa. Os dados pessoais dos
              participantes não serão divulgados publicamente nem repassados a
              terceiros.
            </Text>

            <Text style={styles.sectionTitle}>
              6. Esclarecimentos e contato
            </Text>
            <Text style={styles.paragraph}>
              Se você tiver qualquer dúvida sobre a pesquisa, seus direitos
              enquanto participante, ou quiser mais informações, entre em
              contato com o pesquisador responsável:
            </Text>
            <Text style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Nome: </Text>
              <Text>Professor Roberto Luiz S. de Alencar{"\n"}</Text>
              <Text style={styles.contactLabel}>E-mail: </Text>
              <Text>roberto.alencar@jaboatao.ifpe.edu.br{"\n"}</Text>
              <Text style={styles.contactLabel}>Instituição: </Text>
              <Text>
                Instituto Federal de Educação, Ciência e Tecnologia de
                Pernambuco (IFPE){"\n"}
              </Text>
              <Text style={styles.contactLabel}>Campus: </Text>
              <Text>Jaboatão dos Guararapes</Text>
            </Text>

            <View style={styles.divider} />

            <Text style={styles.declaration}>
              Declaro que li e compreendi as informações acima, que tive a
              oportunidade de esclarecer dúvidas e que concordo, de forma livre
              e esclarecida, em participar da presente pesquisa.
            </Text>

            <TouchableOpacity
              style={styles.radioContainer}
              onPress={handleAccept}
              activeOpacity={0.7}
            >
              <View style={styles.radioButton}>
                {accepted && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioText}>Li e aceito os termos acima.</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <ButtonCustom
              title="Fechar"
              onPress={onClose}
              color="black"
              style={styles.closeButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
  },
  scrollView: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "justify",
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 15,
    marginTop: 5,
    marginBottom: 10,
  },
  contactLabel: {
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  declaration: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "justify",
    marginBottom: 15,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  radioText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
