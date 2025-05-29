import { notifyUsernameUpdated } from "@/components/Header";
import { UsuarioUpdate } from "@/types/UsuarioUpdate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { getToken, getUserId } from "./util";
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEYS = {
  USER_DATA: "user_data",
};

const EXPIRATION_TIME = 24 * 60 * 60 * 1000;

/**
 * Obtém todos os usuários cadastrados no sistema
 * @returns Promise que resolve com a lista de usuários
 * @throws Error se ocorrer um erro durante a busca
 */
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

/**
 * Obtém os dados do usuário atualmente autenticado salva no AsyncStorage,
 * verifica se os dados estão armazenados localmente e se estão expirados.
 * Se não houver conexão com a internet, tenta usar os dados armazenados
 * @returns Promise que resolve com os dados do usuário
 * @throws Error se o usuário não estiver autenticado ou se ocorrer um erro na requisição
 */
export const getUser = async (): Promise<any> => {
  try {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    const userId = await getUserId();
    if (!userId) throw new Error("Usuário não autenticado");
    
    const storedDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    const storedData = storedDataStr ? JSON.parse(storedDataStr) : null;
    const isDataExpired = storedData && (Date.now() - storedData.timestamp > EXPIRATION_TIME);
    
    if (isConnected && (!storedData || isDataExpired)) {
      const token = await getToken();
      const response = await api.get(`/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const dataToStore = {
        data: response.data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(dataToStore));
      
      return response.data;
    }
    
    if (storedData) {
      return storedData.data;
    }
    
    throw new Error("Sem conexão e nenhum dado salvo anteriormente");
  } catch (error: any) {
    try {
      const storedDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (storedDataStr) {
        const storedData = JSON.parse(storedDataStr);
        return storedData.data;
      }
    } catch (localError) {
    }
    
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar dados do usuário.";
    throw new Error(errorMessage);
  }
};

/**
 * Obtém os dados de um usuário específico pelo ID
 * @param userId ID do usuário a ser consultado
 * @returns Promise que resolve com os dados do usuário
 * @throws Error se ocorrer um erro durante a busca
 */
export const getUserById = async (userId: number): Promise<any> => {
  try {
    const token = await getToken();

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

/**
 * Valida o formato de um endereço de email
 * @param email Email a ser validado
 * @returns true se o email for válido, false caso contrário
 */
export const validarEmail = (email: string): boolean => {
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regexEmail.test(email);
};

/**
 * Atualiza os dados do usuário atual
 * @param data Dados a serem atualizados (nome, email, celular)
 * @returns Promise que resolve com o resultado da operação
 * @throws Error se ocorrer um erro durante a atualização
 */
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

/**
 * Atualiza os dados de qualquer usuário (função administrativa)
 * @param data Dados a serem atualizados, incluindo o ID do usuário
 * @returns Promise que resolve quando a atualização for concluída
 * @throws Error se o email for inválido ou se ocorrer um erro na requisição
 */
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

/**
 * Remove um usuário do sistema
 * @param id ID do usuário a ser removido
 * @returns Promise que resolve quando a deleção for concluída
 * @throws Error se o usuário não estiver autenticado ou se ocorrer um erro na requisição
 */
export const deleteUser = async (id: any): Promise<void> => {
  const token = await getToken();
  const userId = await getUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  await api.delete(`/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}