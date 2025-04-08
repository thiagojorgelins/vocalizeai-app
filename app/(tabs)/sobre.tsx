import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import JustifiedText from "@/components/JustifiedText";
import Toast from "react-native-toast-message";

export default function SobreScreen() {
  const vocalizationLabels = [
    {
      title: "Frustration(Frustração)",
      description:
        "Vocalizações associadas a estados de raiva ou insatisfação, geralmente em resposta a não obter algo desejado. São identificadas por tons mais agudos ou intensos, indicando uma reação imediata a um estímulo negativo.",
    },
    {
      title: "Delight(Prazer)",
      description:
        "Refletem excitação, alegria intensa ou satisfação, frequentemente como reação a circunstâncias prazerosas. São caracterizadas por tons mais elevados e ritmos rápidos, transmitindo um estado de felicidade ou contentamento.",
    },
    {
      title: "Dysregulation(Desregulação)",
      description:
        "Associadas a estados de irritação, agitação, desconforto ou superestimulação. Podem ser involuntárias e indicam um estado afetivo disfuncional, sendo essenciais para identificar momentos que necessitam de intervenção ou apoio.",
    },
    {
      title: "Self-talk(Autoconversa)",
      description:
        "Sons produzidos de forma exploratória ou lúdica, sem função comunicativa óbvia, frequentemente associados a relaxamento ou contentamento. Podem envolver murmúrios ou sons repetitivos que refletem processos internos.",
    },
    {
      title: "Request(Solicitar)",
      description:
        "Expressam necessidades ou desejos específicos, como solicitar um objeto ou ajuda. São geralmente dirigidas a um interlocutor e podem ser acompanhadas de gestos ou olhares direcionados.",
    },
    {
      title: "Social",
      description:
        "Representam interações que não se enquadram nas outras categorias, como chamar a atenção ou iniciar uma interação social. São fundamentais para o estabelecimento e manutenção de conexões sociais.",
    },
  ];

  const handleCopy = async (text: string, title: string) => {
    try {
      const textToCopy = title ? `${title}\n\n${text}` : text;
      await Clipboard.setStringAsync(textToCopy);
      Toast.show({
        text1: "Texto copiado para a área de transferência",
        type: "success",
      })
    } catch (error) {
      Toast.show({
        text1: error instanceof Error ? error.message : "Error",
        text2: "Erro ao copiar texto",
        type: "error",
      })
    }
  };

  const renderJustifiedText = (text: string, testID: string) => {
    const paragraphs = text.split("\n\n");

    return paragraphs.map((paragraph, index) => (
      <JustifiedText
        key={`${testID}-paragraph-${index}`}
        testID={`${testID}-${index}`}
        style={index === paragraphs.length - 1 ? styles.lastParagraph : null}
      >
        {paragraph}
      </JustifiedText>
    ));
  };

  const renderCard = (
    title: string,
    content: string | React.ReactNode,
    showShareButton = true,
    testID: string = ""
  ) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {showShareButton && typeof content === "string" && (
          <TouchableOpacity
            onPress={() => handleCopy(content, title)}
            style={styles.shareButton}
            testID={`copy-${testID}`}
          >
            <MaterialIcons name="content-copy" size={20} color="#2196F3" />
          </TouchableOpacity>
        )}
      </View>

      {typeof content === "string"
        ? renderJustifiedText(content, testID)
        : content}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre a Pesquisa</Text>
          {renderCard(
            "",
            `Esta pesquisa propõe uma ferramenta de Inteligência Artificial para ampliar a capacidade de comunicação de indivíduos com autismo, focando especialmente em pessoas minimamente verbais (mv*) que produzem entre 0 e 20 palavras ou aproximações de palavras faladas.

Através do uso de técnicas de aprendizado de máquina, buscamos classificar vocalizações não verbais para melhor compreender as intenções comunicativas desses indivíduos, contribuindo para uma comunicação mais efetiva com cuidadores, familiares e profissionais de saúde.`,
            true,
            "sobre-pesquisa"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objetivo</Text>
          {renderCard(
            "",
            "Desenvolver um aplicativo móvel que permita a gravação e classificação automática de vocalizações, utilizando modelos de aprendizado de máquina treinados com o banco de dados ReCANVo e com as vocalizações coletadas a partir desta aplicação. O sistema classificará as vocalizações em seis categorias distintas, auxiliando na interpretação das intenções comunicativas.",
            true,
            "objetivo"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de Vocalizações</Text>
          {vocalizationLabels.map((type, index) => (
            <View key={index}>
              {renderCard(type.title, type.description, true, `tipo-${index}`)}
            </View>
          ))}
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Principais Referências</Text>
          {renderCard(
            "Banco de Dados ReCANVo",
            <>
              {renderJustifiedText(
                "O ReCANVo (Real-World Communicative and Affective Nonverbal Vocalizations) é um banco de dados inovador que contém mais de 7.000 vocalizações de indivíduos minimamente verbais, categorizadas por função comunicativa. As vocalizações foram gravadas em ambientes reais e rotuladas em tempo real por familiares próximos que conheciam bem o comunicador.",
                "recanvo-desc"
              )}
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://www.nature.com/articles/s41597-023-02405-7"
                  )
                }
                style={styles.linkContainer}
              >
                <MaterialIcons name="link" size={20} color="#2196F3" />
                <Text style={styles.link}>Acesse o artigo do ReCANVo</Text>
              </TouchableOpacity>
            </>
          )}

          {renderCard(
            "Projeto Commalla",
            <>
              {renderJustifiedText(
                "O Commalla (Communication for all) é um projeto de pesquisa dedicado a encontrar formas inteligentes de usar tecnologia para um futuro melhor para todos. O projeto foca em mais de 1 milhão de pessoas nos EUA que são não-verbais ou minimamente verbais, incluindo pessoas com autismo, síndrome de Down e outros transtornos.",
                "commalla-desc-1"
              )}
              <View style={{ height: 16 }} />
              {renderJustifiedText(
                "O projeto desenvolve modelos personalizados para classificar vocalizações usando rótulos em tempo real de cuidadores através do aplicativo Commalla, com métodos escaláveis para coleta e rotulagem de dados naturalísticos.",
                "commalla-desc-2"
              )}
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://commallamit.wixsite.com/commalla/research"
                  )
                }
                style={styles.linkContainer}
              >
                <MaterialIcons name="link" size={20} color="#2196F3" />
                <Text style={styles.link}>Conheça o projeto Commalla</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#212121",
    letterSpacing: 0.25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2196F3",
    flex: 1,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  lastParagraph: {
    marginBottom: 0,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: 8,
  },
  link: {
    color: "#2196F3",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
});
