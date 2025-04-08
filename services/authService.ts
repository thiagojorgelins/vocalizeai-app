import { TokenPayload } from "@/types/TokenPayload";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-toast-message";
import { api } from "./api";

let isUpdatingToken = false;

const setIsUpdatingToken = (value: boolean) => {
  isUpdatingToken = value;
};

const saveTokens = async (data: { access_token: string; sub: string, exp: number; role: string }) => {
  const tokenExpiresIn = data.exp * 1000;
  await AsyncStorage.multiSet([
    ["token", data.access_token],
    ["tokenExpires", tokenExpiresIn.toString()],
    ["role", data.role],
    ["userId", data.sub]
  ]);
};

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
      } catch (error) {
        await AsyncStorage.setItem("username", "Usuário");
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

const getExpirationTime = async (): Promise<number> => {
  const tempo = await AsyncStorage.getItem("tokenExpires");
  return Number(tempo);
};

let tokenUpdateInterval: NodeJS.Timeout | null = null;

const tokenUpdateRoutine = () => {
  if (tokenUpdateInterval === null) {
    setIsUpdatingToken(true);
    const UPDATE_INTERVAL = 9000 * 100
    tokenUpdateInterval = setInterval(updateToken, UPDATE_INTERVAL);
  } else {
    console.log("Uma rotina de atualização de token já está rodando.");
  }
};

const stopTokenUpdateRoutine = () => {
  if (tokenUpdateInterval) {
    clearInterval(tokenUpdateInterval);
    tokenUpdateInterval = null;
    setIsUpdatingToken(false);
  }
};

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

const sendConfirmationCode = async (email: string): Promise<void> => {
  try {
    const response = await api.post('/auth/resend-confirmation-code', { email });
    return response.data;
  } catch (error) {
    throw new Error('Erro ao enviar o código de confirmação.');
  }
}

const confirmRegistration = async (email: string, codigoConfirmacao: string): Promise<void> => {
  try {
    const response = await api.post('/auth/confirm-registration', { email, codigo_confirmacao: codigoConfirmacao });
    return response.data;
  } catch (error) {
    throw new Error('Erro ao confirmar o cadastro.');
  }
}

const doLogout = async (): Promise<void> => {
  await AsyncStorage.multiRemove(["token", "tokenExpires", "role", "usuarioId", "email", "senha", "username"]);
  stopTokenUpdateRoutine();
  router.push("/auth/login");
};

const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao enviar solicitação de recuperação.";
    throw new Error(errorMessage);
  }
};

const confirmPasswordReset = async (email: string, codigoConfirmacao: string): Promise<void> => {
  try {
    const response = await api.post('/auth/confirm-password-reset', { email, codigo_confirmacao: codigoConfirmacao });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || error.message || "Erro ao confirmar o código de recuperação.";
    throw new Error(errorMessage);
  }
};

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
