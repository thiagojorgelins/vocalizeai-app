import Input from "@/components/Inputs/Input";
import InputPassword from "@/components/Inputs/InputPassword";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { FormUsuarioProps } from "@/types/FormUsuarioProps";

export default function FormUsuario({
  nome,
  setNome,
  email,
  handleEmailChange,
  celular,
  handleCelularChange,
  emailError,
  nomeError = "",
  celularError,
  showPasswordFields = false,
  senha = "",
  setSenha = () => {},
  confirmaSenha = "",
  setConfirmaSenha = () => {},
  senhaError = "",
  confirmaSenhaError = "",
}: FormUsuarioProps) {
  return (
    <View style={styles.formContainer}>
      <Input
        label="Email"
        placeholder="Informe seu email"
        value={email}
        showCharacterCount={true}
        maxLength={80}
        onChangeText={handleEmailChange}
        leftIcon={<MaterialIcons name="email" size={20} color="#666" />}
        keyboardType="email-address"
        error={!!emailError}
        errorMessage={emailError}
      />

      <Input
        label={showPasswordFields ? "Nome do responsável" : "Nome"}
        placeholder="Informe seu nome"
        showCharacterCount={true}
        maxLength={50}
        value={nome}
        onChangeText={setNome}
        leftIcon={<MaterialIcons name="person" size={20} color="#666" />}
        error={!!nomeError}
        errorMessage={nomeError}
      />

      <Input
        label="Celular"
        placeholder="Informe seu número de celular"
        keyboardType="phone-pad"
        value={celular}
        maxLength={15}
        mask="(99) 99999-9999"
        onChangeText={handleCelularChange}
        leftIcon={<MaterialIcons name="phone-android" size={20} color="#666" />}
        error={!!celularError}
        errorMessage={celularError}
      />

      {showPasswordFields && (
        <>
          <InputPassword
            label="Senha"
            placeholder="Informe sua senha"
            value={senha}
            onChangeText={setSenha}
            leftIcon={<MaterialIcons name="lock" size={20} color="#666" />}
            error={!!senhaError}
            errorMessage={senhaError}
          />

          <InputPassword
            label="Confirmar senha"
            placeholder="Confirme sua senha"
            value={confirmaSenha}
            onChangeText={setConfirmaSenha}
            leftIcon={
              <MaterialIcons name="lock-outline" size={20} color="#666" />
            }
            error={!!confirmaSenhaError}
            errorMessage={confirmaSenhaError}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
});
