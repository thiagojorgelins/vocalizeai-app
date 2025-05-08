import { ParticipantePayload } from "@/types/ParticipantePayload";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { getToken } from "./util";

/**
 * Cria um novo participante
 * @param data Objeto contendo os dados do participante
 * @returns Retorna os dados do participante criado
 * @throws Lança um erro caso a criação falhe
 */
export const createParticipante = async (data: ParticipantePayload): Promise<any> => {
  try {
    const token = await getToken();
    const response = await api.post(`/participantes`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await AsyncStorage.setItem("hasParticipant", "true");

    if (response.data && response.data.id) {
      await AsyncStorage.setItem("participantId", response.data.id.toString());
    }

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao criar participante.";
    throw new Error(errorMessage);
  }
};

/**
 * Obtém um participante específico
 * @param participantId ID do participante
 * @returns Retorna os dados do participante
 * @throws Lança um erro caso o ID não seja fornecido ou a requisição falhe
 */
export const getParticipante = async (participantId: string): Promise<any> => {
  const token = await getToken();
  if (!participantId) throw new Error("ID do participante não fornecido");

  const response = await api.get(`/participantes/${participantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const participant = response.data;
  await AsyncStorage.setItem("participantId", participant.id.toString());
  await AsyncStorage.setItem("hasParticipant", "true");

  return participant;
};

/**
 * Obtém todos os participantes de um usuário específico
 * @param usuarioId ID do usuário
 * @returns Retorna uma lista de todos os participantes do usuário
 * @throws Lança um erro caso ocorra alguma falha ao buscar os participantes
 */
export const getParticipantesByUsuario = async (usuarioId: string): Promise<any[]> => {
  try {
    const token = await getToken();
    const response = await api.get(`/participantes/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.data && response.data.length > 0) {
      await AsyncStorage.setItem("hasParticipant", "true");
    } else {
      await AsyncStorage.setItem("hasParticipant", "false");
    }
    
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar participantes do usuário.";
    throw new Error(errorMessage);
  }
};

/**
 * Obtém todos os participantes
 * @returns Retorna uma lista de todos os participantes
 * @throws Lança um erro caso ocorra alguma falha ao buscar os participantes
 */
export const getAllParticipantes = async (): Promise<any[]> => {
  try {
    const token = await getToken();
    const response = await api.get(`/participantes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar participantes.";
    throw new Error(errorMessage);
  }
};

/**
 * Atualiza os dados de um participante específico
 * @param participantId ID do participante
 * @param data Objeto contendo os dados atualizados do participante
 * @throws Lança um erro caso a atualização falhe
 */
export const updateParticipante = async (
  participantId: string, data: ParticipantePayload): Promise<void> => {
  const token = await getToken();

  await api.patch(`/participantes/${participantId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await AsyncStorage.setItem("hasParticipant", "true");
};

/**
 * Deleta um participante específico
 * @param participantId ID do participante a ser deletado
 * @throws Lança um erro caso a exclusão falhe
 */
export const deleteParticipante = async (participantId: string): Promise<void> => {
  const token = await getToken();

  await api.delete(`/participantes/${participantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await AsyncStorage.setItem("hasParticipant", "false");
  await AsyncStorage.removeItem("participantId");
};

/**
 * Verifica se existe um participante vinculado ao usuário
 * @returns Retorna true se o participante existir, caso contrário false
 */
export const checkParticipantExists = async (): Promise<boolean> => {
  try {
    const hasParticipantStorage = await AsyncStorage.getItem("hasParticipant");
    
    if (hasParticipantStorage === "true" || hasParticipantStorage === "false") {
      return hasParticipantStorage === "true";
    }
    
    const userId = await AsyncStorage.getItem("userId");
    if (userId) {
      const participantes = await getParticipantesByUsuario(userId);
      const hasParticipants = participantes && participantes.length > 0;
      await AsyncStorage.setItem("hasParticipant", hasParticipants ? "true" : "false");
      return hasParticipants;
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar participante:", error);
    return false;
  }
};