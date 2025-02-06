import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SobreScreen() {
  const vocalizationLabels = [
    {
      title: 'Frustration(Frustração)',
      description: 'Vocalizações associadas a estados de raiva ou insatisfação, geralmente em resposta a não obter algo desejado. São identificadas por tons mais agudos ou intensos, indicando uma reação imediata a um estímulo negativo.'
    },
    {
      title: 'Delight(Prazer)',
      description: 'Refletem excitação, alegria intensa ou satisfação, frequentemente como reação a circunstâncias prazerosas. São caracterizadas por tons mais elevados e ritmos rápidos, transmitindo um estado de felicidade ou contentamento.'
    },
    {
      title: 'Dysregulation(Desregulação)',
      description: 'Associadas a estados de irritação, agitação, desconforto ou superestimulação. Podem ser involuntárias e indicam um estado afetivo disfuncional, sendo essenciais para identificar momentos que necessitam de intervenção ou apoio.'
    },
    {
      title: 'Self-talk(Autoconversa)',
      description: 'Sons produzidos de forma exploratória ou lúdica, sem função comunicativa óbvia, frequentemente associados a relaxamento ou contentamento. Podem envolver murmúrios ou sons repetitivos que refletem processos internos.'
    },
    {
      title: 'Request(Solicitar)',
      description: 'Expressam necessidades ou desejos específicos, como solicitar um objeto ou ajuda. São geralmente dirigidas a um interlocutor e podem ser acompanhadas de gestos ou olhares direcionados.'
    },
    {
      title: 'Social',
      description: 'Representam interações que não se enquadram nas outras categorias, como chamar a atenção ou iniciar uma interação social. São fundamentais para o estabelecimento e manutenção de conexões sociais.'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre a Pesquisa</Text>
          <View style={styles.card}>
            <Text style={styles.text}>
              Esta pesquisa propõe uma ferramenta de Inteligência Artificial para ampliar a capacidade de comunicação de indivíduos com autismo, focando especialmente em pessoas minimamente verbais (mv*) que produzem entre 0 e 20 palavras ou aproximações de palavras faladas.
            </Text>
            <Text style={[styles.text, styles.marginTop]}>
              Através do uso de técnicas de aprendizado de máquina, buscamos classificar vocalizações não verbais para melhor compreender as intenções comunicativas desses indivíduos, contribuindo para uma comunicação mais efetiva com cuidadores, familiares e profissionais de saúde.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objetivo</Text>
          <View style={styles.card}>
            <Text style={styles.text}>
              Desenvolver um aplicativo móvel que permita a gravação e classificação automática de vocalizações, utilizando modelos de aprendizado de máquina treinados com o banco de dados ReCANVo e com as vocalizações coletadas a partir desta aplicação. O sistema classificará as vocalizações em seis categorias distintas, auxiliando na interpretação das intenções comunicativas.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de Vocalizações</Text>
          {vocalizationLabels.map((type, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{type.title}</Text>
              <Text style={styles.text}>{type.description}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Principais Referências</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Banco de Dados ReCANVo</Text>
            <Text style={styles.text}>
              O ReCANVo (Real-World Communicative and Affective Nonverbal Vocalizations) é um banco de dados inovador que contém mais de 7.000 vocalizações de indivíduos minimamente verbais, categorizadas por função comunicativa. As vocalizações foram gravadas em ambientes reais e rotuladas em tempo real por familiares próximos que conheciam bem o comunicador.
            </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://www.nature.com/articles/s41597-023-02405-7')}>
              Acesse o artigo do ReCANVo
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Projeto Commalla</Text>
            <Text style={styles.text}>
              O Commalla (Communication for all) é um projeto de pesquisa dedicado a encontrar formas inteligentes de usar tecnologia para um futuro melhor para todos. O projeto foca em mais de 1 milhão de pessoas nos EUA que são não-verbais ou minimamente verbais, incluindo pessoas com autismo, síndrome de Down e outros transtornos.
            </Text>
            <Text style={[styles.text, styles.marginTop]}>
              O projeto desenvolve modelos personalizados para classificar vocalizações usando rótulos em tempo real de cuidadores através do aplicativo Commalla, com métodos escaláveis para coleta e rotulagem de dados naturalísticos.
            </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://commallamit.wixsite.com/commalla/research')}>
              Conheça o projeto Commalla
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  marginTop: {
    marginTop: 12,
  },
  link: {
    color: '#0066cc',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});