import { api } from "./api";
import { getToken } from "./util";

export const uploadAudioFile = async (
  idVocalizacao: number,
  fileUri: string
): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const formData = new FormData();

    formData.append("file", {
      uri: fileUri,

      name: "audio.m4a",
      type: "audio/x-m4a",
    } as any);

    const response = await api.post(
      `/audios?id_vocalizacao=${idVocalizacao}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data; 
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao fazer upload do áudio.";

    throw new Error(errorMessage);
  }
};
