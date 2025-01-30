import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import Link from "@/components/Link";
import { confirmRegistration, doLogin, register } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { showMessage } from "react-native-flash-message";

export default function CadastroUsuarioScreen() {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const router = useRouter();

  async function handleRegister() {
    setIsLoading(true);
    try {
      const isRegistered = await register(nome, email, celular, senha, confirmaSenha);
      if (isRegistered) {
        showMessage({
          message: "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar o cadastro.",
          type: "success",
        });
        setIsModalVisible(true);
      }
    } catch (error: any) {
      showMessage({
        message: "Erro inesperado ao realizar o cadastro.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmRegistration(codigoConfirmacao?: string) {
    setIsLoading(true);
    try {
      await confirmRegistration(email, codigoConfirmacao || "");
      showMessage({
        message: "Cadastro confirmado com sucesso!",
        type: "success",
      });
      setIsModalVisible(false);
      await doLogin(email, senha);
      router.push("/auth/cadastro-participante");
    } catch (error: any) {
      showMessage({
        message: "Código de confirmação inválido.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Email"
        placeholder="Informe seu email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Nome do cuidador"
        placeholder="Informe seu nome"
        value={nome}
        onChangeText={setNome}
      />
      <Input
        label="Celular"
        placeholder="Informe seu número de celular"
        keyboardType="phone-pad"
        value={celular}
        maxLength={15}
        mask="(99) 99999-9999"
        onChangeText={setCelular}
      />
      <InputPassword
        label="Senha"
        placeholder="Informe sua senha"
        value={senha}
        onChangeText={setSenha}
      />
      <InputPassword
        label="Confirmar senha"
        placeholder="Confirme sua senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ButtonCustom
          title="Avançar"
          onPress={handleRegister}
          color={"black"}
        />
      )}
      <Link href={"/auth/login"}>Já possui cadastro? Fazer login!</Link>
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmRegistration}
        message="Digite o código de confirmação enviado para o seu e-mail."
        input={{
          placeholder: "Código de confirmação",
          value: codigoConfirmacao,
          onChangeText: setCodigoConfirmacao,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});