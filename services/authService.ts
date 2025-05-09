import { TokenPayload } from "@/types/TokenPayload";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-toast-message";
import { api } from "./api";
import { getUser } from "./usuarioService";

let isUpdatingToken = false;

/**
 * Define o estado de atualização do token
 * @param value Valor booleano que indica se o token está em processo de atualização
 */
const setIsUpdatingToken = (value: boolean) => {
  isUpdatingToken = value;
};

/**
 * Salva os tokens de autenticação no AsyncStorage
 * @param data Objeto contendo o token de acesso, ID do usuário, tempo de expiração e papel do usuário
 */
const saveTokens = async (data: { access_token: string; sub: string, exp: number; role: string }) => {
  const tokenExpiresIn = data.exp * 1000;
  await AsyncStorage.multiSet([
    ["token", data.access_token],
    ["tokenExpires", tokenExpiresIn.toString()],
    ["role", data.role],
    ["userId", data.sub]
  ]);
};

/**
 * Atualiza o token de acesso através do endpoint /auth/refresh
 * @throws Redireciona para a tela de login em caso de falha
 */
const updateToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      stopTokenUpdateRoutine()
      router.push("/auth/login");
      return;
    }
    const response = await api.post("/auth/refresh", { access_token: token });

    const { access_token } = response.data;
    if (access_token) {
      const payload: TokenPayload = jwtDecode(access_token);
      await saveTokens({
        access_token,
        exp: payload.exp!,
        role: payload.role!,
        sub: payload.sub
      });
      if (!isUpdatingToken) {
        tokenUpdateRoutine();
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Erro ao atualizar o token",
        text2: "O token retornado é inválido.",
      })
    }
  } catch (error: any) {
    Toast.show({
      type: "error",
      text1: error instanceof Error ? error.message : "Erro",
      text2: "Erro ao atualizar o token.",
    })
    router.push("/auth/login");
  }
};

/**
 * Efetua login do usuário
 * @param email Email do usuário
 * @param senha Senha do usuário
 * @returns Retorna uma string que indica o status do login: 'success', 'unverified' ou 'error'
 */
const doLogin = async (email: string, senha: string): Promise<string> => {
  try {
    const response = await api.post("/auth/login", { email, senha });
    const { access_token } = response.data;

    if (access_token) {
      const payload: TokenPayload = jwtDecode(access_token);
      await saveTokens({
        access_token,
        exp: payload.exp!,
        role: payload.role!,
        sub: payload.sub,
      });

      try {
        const userResponse = await api.get(`/usuarios/${payload.sub}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        await AsyncStorage.setItem("username", userResponse.data.nome);

        const userData = await getUser();
        
        if (userData.participantes && userData.participantes.length > 0) {
          await AsyncStorage.setItem("hasParticipant", "true");
          
          if (userData.participantes[0] && userData.participantes[0].id) {
            await AsyncStorage.setItem("participantId", userData.participantes[0].id.toString());
          }
          
          router.replace("/(tabs)");
        } else {
          await AsyncStorage.setItem("hasParticipant", "false");
          router.replace("/usuario/dados-participante");

          Toast.show({
            type: "info",
            text1: "Atenção",
            text2: "Por favor, cadastre um participante antes de gravar as vocalizações.",
          });
        }
      } catch (error) {
        await AsyncStorage.setItem("username", "Usuário");
        await AsyncStorage.setItem("hasParticipant", "false");
        router.replace("/usuario/dados-participante");
      }

      await AsyncStorage.multiSet([
        ["email", email],
        ["senha", senha],
      ]);
      tokenUpdateRoutine();
      return "success";
    } else {
      throw new Error("Resposta inválida do servidor.");
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao fazer login.";
    if (error.response?.status === 403 && error.response?.data?.detail === "Usuário não verificado. Verifique seu e-mail para ativar sua conta.") {
      return "unverified";
    }
    Toast.show({
      type: "error",
      text1: "Erro ao fazer login",
      text2: errorMessage,
    })
    return "error";
  }
};

/**
 * Obtém o tempo de expiração do token
 * @returns Retorna o tempo de expiração do token em milissegundos
 */
const getExpirationTime = async (): Promise<number> => {
  const tempo = await AsyncStorage.getItem("tokenExpires");
  return Number(tempo);
};

let tokenUpdateInterval: NodeJS.Timeout | null = null;

/**
 * Inicia a rotina de atualização do token em intervalos definidos
 * Se já houver uma rotina em execução, não inicia uma nova
 */
const tokenUpdateRoutine = () => {
  if (tokenUpdateInterval === null) {
    setIsUpdatingToken(true);
    const UPDATE_INTERVAL = 9000 * 100
    tokenUpdateInterval = setInterval(updateToken, UPDATE_INTERVAL);
  } else {
    console.log("Uma rotina de atualização de token já está rodando.");
  }
};

/**
 * Para a rotina de atualização do token, caso exista
 */
const stopTokenUpdateRoutine = () => {
  if (tokenUpdateInterval) {
    clearInterval(tokenUpdateInterval);
    tokenUpdateInterval = null;
    setIsUpdatingToken(false);
  }
};

/**
 * Registra um novo usuário
 * @param nome Nome do usuário
 * @param email Email do usuário
 * @param celular Número de celular do usuário
 * @param senha Senha do usuário
 * @param confirmaSenha Confirmação da senha
 * @param aceiteTermos Booleano indicando se o usuário aceitou os termos
 * @returns Retorna true se o cadastro foi bem sucedido, caso contrário false
 */
const register = async (
  nome: string,
  email: string,
  celular: string,
  senha: string,
  confirmaSenha: string,
  aceiteTermos: boolean
): Promise<boolean> => {
  if (!nome || !celular || !email || !senha || !confirmaSenha) {
    Toast.show({
      type: "error",
      text1: "Erro ao cadastrar usuário",
      text2: "Todos os campos são obrigatórios.",
    })
    return false;
  }

  if (!aceiteTermos) {
    Toast.show({
      type: "error",
      text1: "Erro ao cadastrar usuário",
      text2: "É necessário aceitar os termos de uso e política de privacidade.",
    })
    return false;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    Toast.show({
      type: "error",
      text1: "Erro ao cadastrar usuário",
      text2: "Formato do email é inválido.",
    })
    return false;
  }

  if (senha !== confirmaSenha) {
    Toast.show({
      type: "error",
      text1: "Erro ao cadastrar usuário",
      text2: "As senhas não coincidem.",
    })
    return false;
  }

  try {
    const response = await api.post("/auth/register", {
      nome,
      email,
      celular,
      senha,
      aceite_termos: aceiteTermos
    });
    if (response.status === 201) {
      return true;
    } else {
      throw new Error("Erro ao registrar usuário.");
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail || error.message || "Erro ao cadastrar usuário.";
    Toast.show({
      type: "error",
      text1: "Erro ao cadastrar usuário",
      text2: errorMessage,
    })
    return false;
  }
};

/**
 * Envia um novo código de confirmação para o email do usuário
 * @param email Email do usuário para qual o código será enviado
 */
const sendConfirmationCode = async (email: string): Promise<void> => {
  try {
    const response = await api.post('/auth/resend-confirmation-code', { email });
    return response.data;
  } catch (error) {
    throw new Error('Erro ao enviar o código de confirmação.');
  }
}

/**
 * Confirma o registro de um usuário utilizando código de confirmação
 * @param email Email do usuário
 * @param codigoConfirmacao Código recebido por email
 */
const confirmRegistration = async (email: string, codigoConfirmacao: string): Promise<void> => {
  try {
    const response = await api.post('/auth/confirm-registration', { email, codigo_confirmacao: codigoConfirmacao });
    return response.data;
  } catch (error) {
    throw new Error('Erro ao confirmar o cadastro.');
  }
}

/**
 * Efetua o logout do usuário, removendo dados do AsyncStorage e interrompendo a rotina de atualização do token
 */
const doLogout = async (): Promise<void> => {
  await AsyncStorage.multiRemove(["token", "tokenExpires", "role", "usuarioId", "email", "senha", "username", "hasParticipant", "participantId"]);
  stopTokenUpdateRoutine();
  router.push("/auth/login");
};

/**
 * Envia solicitação de redefinição de senha
 * @param email Email do usuário que deseja redefinir a senha
 * @throws Lança erro caso ocorra falha na solicitação
 */
const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao enviar solicitação de recuperação.";
    throw new Error(errorMessage);
  }
};

/**
 * Confirma o código de redefinição de senha
 * @param email Email do usuário
 * @param codigoConfirmacao Código de confirmação recebido
 * @throws Lança erro caso ocorra falha na confirmação
 */
const confirmPasswordReset = async (email: string, codigoConfirmacao: string): Promise<void> => {
  try {
    const response = await api.post('/auth/confirm-password-reset', { email, codigo_confirmacao: codigoConfirmacao });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao confirmar o código de recuperação.";
    throw new Error(errorMessage);
  }
};

/**
 * Redefine a senha do usuário
 * @param email Email do usuário
 * @param codigoConfirmacao Código de confirmação recebido
 * @param novaSenha Nova senha escolhida
 * @throws Lança erro caso ocorra falha na redefinição
 */
const resetPassword = async (email: string, codigoConfirmacao: string, novaSenha: string): Promise<void> => {
  try {
    const response = await api.post('/auth/confirm-password-reset', { email, codigo_confirmacao: codigoConfirmacao, nova_senha: novaSenha });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao redefinir a senha.";
    throw new Error(errorMessage);
  }
};

export { confirmPasswordReset, confirmRegistration, doLogin, doLogout, getExpirationTime, register, requestPasswordReset, resetPassword, sendConfirmationCode, updateToken };