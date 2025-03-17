import { notifyUsernameUpdated } from "@/components/Header";
import { UsuarioUpdate } from "@/types/UsuarioUpdate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { getToken, getUserId } from "./util";

export const getAllUsers = async (): Promise<any> => {
  try {
    const token = await getToken();
    const response = await api.get("/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar usuários.";
    throw new Error(errorMessage);
  }
}

export const getUser = async (): Promise<any> => {
  try {
    const token = await getToken();
    const userId = await getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    const response = await api.get(`/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar dados do usuário.";
    throw new Error(errorMessage);
  }
};

export const validarEmail = (email: string): boolean => {
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regexEmail.test(email);
};

export const updateUser = async (data: UsuarioUpdate): Promise<{
  success: boolean;
  message: string;
  emailAlterado: boolean;
  usuario?: any;
}> => {
  try {
    if (data.email && !validarEmail(data.email)) {
      return {
        success: false,
        message: "Formato de email inválido.",
        emailAlterado: false,
      };
    }

    const token = await getToken();
    const userId = await getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    const dadosAtualizados: any = {};
    if (data.email) dadosAtualizados.email = data.email;
    if (data.nome) dadosAtualizados.nome = data.nome;
    if (data.celular) dadosAtualizados.celular = data.celular;

    const response = await api.patch(`/usuarios/${userId}`, dadosAtualizados, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.nome && response.data.usuario && response.data.usuario.nome) {
      await AsyncStorage.setItem("username", response.data.usuario.nome);

      notifyUsernameUpdated();
    }

    return {
      success: true,
      message: response.data.detail || "Dados atualizados com sucesso.",
      emailAlterado: response.data.email_alterado || false,
      usuario: response.data.usuario || null
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao atualizar dados do usuário.";
    throw new Error(errorMessage);
  }
};

export const updateUserAdmin = async (data: UsuarioUpdate): Promise<void> => {
  try {
    if (data.email && !validarEmail(data.email)) {
      throw new Error("Formato de email inválido.");
    }

    const token = await getToken();
    const userId = await getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    await api.patch(`/usuarios/${data.id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao atualizar dados do usuário.";
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (id: any): Promise<void> => {
  const token = await getToken();
  const userId = await getUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  await api.delete(`/usuarios/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}