import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import { doLogout } from "@/services/authService";
import { getUser, updateUser } from "@/services/usuarioService";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { showMessage } from "react-native-flash-message";

export default function EditarUsuarioScreen() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUser();
      setEmail(userData.email);
      setNome(userData.nome);
      setCelular(userData.celular);
    } catch (error: any) {
      showMessage({
        message: "Não foi possível carregar os dados do usuário.",
        type: "danger",
        duration: 3000,
        icon: "danger"
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  async function handleUpdate() {
    try {
      await updateUser({ email, nome, celular });
      showMessage({
        message: "Sucesso!",
        description: "Dados do usuário atualizados.",
        type: "success",
        duration: 3000,
        icon: "success"
      });
      setModalVisible(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Não foi possível atualizar os dados do usuário.";
      showMessage({
        message: "Erro ao atualizar",
        description: errorMessage,
        type: "danger",
        duration: 3000,
        icon: "danger"
      });
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="person" size={40} color="#2196F3" />
          <Text style={styles.title}>Editar Perfil</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <Input
              label="Nome"
              placeholder="Informe seu nome"
              value={nome}
              onChangeText={setNome}
              leftIcon={<MaterialIcons name="person-outline" size={20} color="#666" />}
            />
            
            <Input
              label="Email"
              placeholder="Informe seu email"
              value={email}
              onChangeText={setEmail}
              leftIcon={<MaterialIcons name="email" size={20} color="#666" />}
              keyboardType="email-address"
            />
            
            <Input
              label="Celular"
              mask="(99) 99999-9999"
              value={celular}
              placeholder="Informe seu celular"
              onChangeText={setCelular}
              keyboardType="phone-pad"
              leftIcon={<MaterialIcons name="phone-android" size={20} color="#666" />}
            />
          </View>

          <View style={styles.actions}>
            <ButtonCustom
              title="Atualizar Dados"
              onPress={() => setModalVisible(true)}
              color="#2196F3"
              style={styles.mainButton}
              icon={<MaterialIcons name="save" size={20} color="#FFF" />}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/usuario/dados-participante")}
            >
              <MaterialIcons name="person-add" size={20} color="#666" />
              <Text style={styles.linkText}>Dados do Participante</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={doLogout}
            >
              <MaterialIcons name="logout" size={20} color="#D32F2F" />
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleUpdate}
        message="Deseja confirmar a atualização dos dados do usuário?"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: 0.25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    height: 48,
    borderRadius: 24,
  },
  linkButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  linkText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '500',
  },
});