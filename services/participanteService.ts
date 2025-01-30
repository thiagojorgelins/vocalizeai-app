import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { getToken } from "./util";
import { ParticipantePayload } from "@/types/ParticipantePayload";

export const createParticipante = async (data: ParticipantePayload): Promise<void> => {
  try {
    const token = await getToken();
    await api.post(`/participantes`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

  return participant;
};

export const updateParticipante = async (
  participantId: string, data: ParticipantePayload): Promise<void> => {
  const token = await getToken();

  await api.patch(`/participantes/${participantId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteParticipante = async (participantId: string): Promise<void> => {
  const token = await getToken();

  await api.delete(`/participantes/${participantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}