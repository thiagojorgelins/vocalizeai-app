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

    const normalizedUri = fileUri.startsWith('file://') 
      ? fileUri 
      : `file://${fileUri}`;
        
    const filename = normalizedUri.split('/').pop() || 'audio.m4a';
    
    const formData = new FormData();

    formData.append("file", {
      uri: normalizedUri,
      name: filename,
      type: "audio/mp4",
    } as any);

    
    const response = await api.post(
      `/audios?id_vocalizacao=${idVocalizacao}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      }
    );

    return response.data; 
  } catch (error: any) {
    let errorMessage = "Erro ao fazer upload do áudio.";
    
    if (error.response) {
      errorMessage = error.response.data?.detail || 
                    `Erro do servidor: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Servidor não respondeu ao upload.";
    } else {
      errorMessage = error.message || "Erro ao configurar upload.";
    }

    throw new Error(errorMessage);
  }
};