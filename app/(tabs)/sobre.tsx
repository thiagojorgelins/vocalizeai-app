import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { WebView } from "react-native-webview";

export default function SobreScreen() {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth - 40;
  const webViewWidth = cardWidth - 40; 

  const [webViewHeights, setWebViewHeights] = useState<{ [key: string]: number }>({});

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
      showMessage({
        message: "Texto copiado para a área de transferência",
        type: "success",
        duration: 2000,
      });
    } catch (error) {
      showMessage({
        message: "Erro ao copiar texto",
        type: "danger",
        duration: 2000,
      });
    }
  };

  const injectedJavaScript = `
    (function() {
      // Envia a altura apenas uma vez quando o conteúdo estiver carregado
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.ReactNativeWebView.postMessage(JSON.stringify({height: height}));
      document.body.style.height = 'auto';
      
      true;
    })();
  `;

  const createJustifiedHtml = (text: string, id: string) => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #424242;
              font-size: 16px;
              line-height: 1.5;
              background-color: transparent;
              width: ${webViewWidth}px;
              overflow-x: hidden;
            }
            p {
              text-align: justify;
              margin: 0 0 12px 0;
              padding: 0;
            }
            p:last-child {
              margin-bottom: 0;
            }
          </style>
        </head>
        <body id="${id}">
          ${text
            .split("\n\n")
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join("")}
        </body>
      </html>
    `;
  };

  const renderJustifiedWebView = (text: string, id: string) => {
    const baseHeight = 50;

    return (
      <WebView
        key={id}
        originWhitelist={["*"]}
        source={{ html: createJustifiedHtml(text, id) }}
        style={{
          height: webViewHeights[id] || baseHeight,
          width: webViewWidth,
          backgroundColor: "transparent",
          opacity: webViewHeights[id] ? 1 : 0,
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height && (!webViewHeights[id] || data.height > webViewHeights[id])) {
              setWebViewHeights((prev) => ({
                ...prev,
                [id]: Math.ceil(data.height) + 5,
              }));
            }
          } catch (error) {
            showMessage({
              message: "Erro ao processar mensagem do WebView",
              type: "danger",
            })
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
      />
    );
  };

  const renderCard = (
    title: string,
    content: string | React.ReactNode,
    showShareButton = true,
    id: string = ""
  ) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {showShareButton && typeof content === "string" && (
          <TouchableOpacity
            onPress={() => handleCopy(content, title)}
            style={styles.shareButton}
          >
            <MaterialIcons name="content-copy" size={20} color="#2196F3" />
          </TouchableOpacity>
        )}
      </View>

      {typeof content === "string"
        ?
          renderJustifiedWebView(
            content,
            id || `webview-${Math.random().toString(36).substring(7)}`
          )
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
              {renderJustifiedWebView(
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
              {renderJustifiedWebView(
                "O Commalla (Communication for all) é um projeto de pesquisa dedicado a encontrar formas inteligentes de usar tecnologia para um futuro melhor para todos. O projeto foca em mais de 1 milhão de pessoas nos EUA que são não-verbais ou minimamente verbais, incluindo pessoas com autismo, síndrome de Down e outros transtornos.",
                "commalla-desc-1"
              )}
              <View style={{ height: 16 }} />
              {renderJustifiedWebView(
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
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
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#424242",
  },
  marginTop: {
    marginTop: 16,
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
