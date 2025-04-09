import { ParticipantePayload } from "@/types/ParticipantePayload";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { getToken } from "./util";

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

export const updateParticipante = async (
  participantId: string, data: ParticipantePayload): Promise<void> => {
  const token = await getToken();

  await api.patch(`/participantes/${participantId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await AsyncStorage.setItem("hasParticipant", "true");
};

export const deleteParticipante = async (participantId: string): Promise<void> => {
  const token = await getToken();

  await api.delete(`/participantes/${participantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await AsyncStorage.setItem("hasParticipant", "false");
  await AsyncStorage.removeItem("participantId");
};

export const checkParticipantExists = async (): Promise<boolean> => {
  try {
    const hasParticipant = await AsyncStorage.getItem("hasParticipant");
    return hasParticipant === "true";
  } catch (error) {
    return false;
  }
};