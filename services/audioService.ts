import { AudioItem } from "@/types/Audio";
import { api } from "./api";
import { getToken } from "./util";

/**
 * Faz o upload de um arquivo de áudio
 * @param idVocalizacao ID da vocalização associada ao áudio
 * @param fileUri URI do arquivo de áudio a ser enviado
 * @param participanteId ID do participante associado ao áudio
 * @returns Promise que resolve com a resposta da API
 * @throws Error se ocorrer um erro durante o upload
 */
export const uploadAudioFile = async (
  idVocalizacao: number,
  fileUri: string,
  participanteId: number
): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const normalizedUri = fileUri.startsWith("file://")
      ? fileUri
      : `file://${fileUri}`;

    const filename = normalizedUri.split("/").pop() || "audio.m4a";

    const formData = new FormData();
    formData.append("file", {
      uri: normalizedUri,
      name: filename,
      type: "audio/mp4",
    } as any);

    const response = await api.post(
      `/audios?id_vocalizacao=${idVocalizacao}&id_participante=${participanteId}`,
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
      errorMessage =
        error.response.data?.detail ||
        `Erro do servidor: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Servidor não respondeu ao upload.";
    } else {
      errorMessage = error.message || "Erro ao configurar upload.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Atualiza os dados de um áudio específico, incluindo a vocalização associada
 * e renomeia o arquivo no S3 de acordo com o novo rótulo
 * @param audioId ID do áudio a ser atualizado
 * @param audioData Objeto contendo os dados a serem atualizados (id_vocalizacao)
 * @returns Promise que resolve com o áudio atualizado
 * @throws Error se ocorrer um erro durante a atualização
 */
export const updateAudio = async (
  audioId: number,
  audioData: {
    id_vocalizacao: number;
  }
): Promise<AudioItem> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.patch(`/audios/${audioId}`, audioData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    let errorMessage = "Erro ao atualizar o áudio.";

    if (error.response) {
      if (error.response.status === 403) {
        errorMessage = "Sem permissão para atualizar este áudio.";
      } else if (error.response.status === 404) {
        errorMessage = "Áudio não encontrado.";
      } else {
        errorMessage =
          error.response.data?.detail ||
          `Erro do servidor: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro ao configurar solicitação.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Obtém a quantidade de áudios enviados de um participante
 * @param participanteId ID do participante
 * @returns Promise que resolve com um objeto com a quantidade de áudios enviados deste participante
 * @throws Error se ocorrer um erro durante a busca
 */
export const amountAudiosByParticipante = async (
  participanteId: number
): Promise<number> => {
  try {
    if (!participanteId || isNaN(participanteId) || participanteId <= 0) {
      throw new Error("O ID do participante informado é inválido.");
    }
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.get(
      `/audios/amount/participante/${participanteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (typeof response.data?.quantidade === "number") {
      return response.data.quantidade;
    } else {
      throw new Error(
        "Resposta inesperada do servidor ao buscar quantidade de áudios."
      );
    }
  } catch (error: any) {
    let errorMessage = "Erro ao buscar a quantidade de áudios do participante.";

    if (error.response) {
      if (error.response.status === 422) {
        errorMessage = "Dados inválidos para buscar a quantidade de áudios.";
        try {
          if (error.response.data?.detail) {
            const detail = error.response.data.detail;
            if (Array.isArray(detail)) {
              const errors = detail.map((item: any) => {
                const msg = item.msg || item.message || JSON.stringify(item);
                const loc = item.loc
                  ? ` em '${item.loc[item.loc.length - 1]}'`
                  : "";
                return `${msg}${loc}`;
              });
              errorMessage += ` ${errors.join("; ")}`;
            } else if (typeof detail === "string") {
              errorMessage += ` ${detail}`;
            } else if (typeof detail === "object") {
              errorMessage += ` ${JSON.stringify(detail)}`;
            }
          }
        } catch (e) {}
      } else if (error.response.status === 401) {
        errorMessage = "Não autorizado. Faça login novamente.";
      } else if (error.response.status === 403) {
        errorMessage = "Você não tem permissão para acessar esta informação.";
      } else if (error.response.status === 404) {
        errorMessage = "Participante ou áudios não encontrados.";
      } else {
        errorMessage = `Erro do servidor: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro desconhecido.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Obtém a lista de áudios de um usuário específico
 * @param userId ID do usuário
 * @returns Promise que resolve com a lista de áudios do usuário
 * @throws Error se ocorrer um erro durante a busca
 */
export const listAudiosByUser = async (
  userId: number
): Promise<AudioItem[]> => {
  try {
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new Error("ID de usuário inválido");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.get(`/audios/usuario/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error: any) {
    let errorMessage = "Erro ao buscar áudios do usuário.";

    if (error.response) {
      if (error.response.status === 422) {
        errorMessage = "Dados inválidos para buscar áudios.";
        try {
          if (error.response.data?.detail) {
            const detail = error.response.data.detail;
            if (Array.isArray(detail)) {
              const errors = detail.map((item: any) => {
                const msg = item.msg || item.message || JSON.stringify(item);
                const loc = item.loc
                  ? ` em '${item.loc[item.loc.length - 1]}'`
                  : "";
                return `${msg}${loc}`;
              });
              errorMessage += ` ${errors.join("; ")}`;
            } else if (typeof detail === "string") {
              errorMessage += ` ${detail}`;
            } else if (typeof detail === "object") {
              errorMessage += ` ${JSON.stringify(detail)}`;
            }
          }
        } catch (e) {
          // ignora falhas de parse
        }
      } else if (error.response.status === 401) {
        errorMessage = "Não autorizado. Faça login novamente.";
      } else if (error.response.status === 404) {
        errorMessage = "Áudios não encontrados.";
      } else {
        errorMessage = `Erro do servidor: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro desconhecido.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Exclui um áudio específico
 * @param audioId ID do áudio a ser excluído
 * @returns Promise que resolve com a resposta da API
 * @throws Error se ocorrer um erro durante a exclusão
 */
export const deleteAudio = async (audioId: number): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.delete(`/audios/${audioId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    let errorMessage = "Erro ao excluir o áudio.";

    if (error.response) {
      errorMessage =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro ao configurar solicitação.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Exclui todos os áudios de um usuário específico
 * @param userId ID do usuário
 * @returns Promise que resolve com a resposta da API
 * @throws Error se ocorrer um erro durante a exclusão
 */
export const deleteAllAudiosByUser = async (userId: number): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.get(`/audios/usuario/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    let errorMessage = "Erro ao excluir todos os áudios do usuário.";

    if (error.response) {
      errorMessage =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro ao configurar solicitação.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Obtém a URL de reprodução de um áudio específico, chamando o endpoint /audios/{id}/play
 * @param audioId ID do áudio
 * @returns A URL (presigned ou pública) pronta para reprodução
 * @throws Error se ocorrer algum problema ao obter a URL
 */
export const getAudioPlayUrl = async (audioId: number): Promise<string> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.get(`/audios/${audioId}/play`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data?.url) {
      throw new Error("Não foi possível obter a URL do áudio.");
    }

    return response.data.url;
  } catch (error: any) {
    let errorMessage = "Erro ao obter URL para reproduzir o áudio.";

    if (error.response) {
      errorMessage =
        error.response.data?.detail ||
        `Erro do servidor: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro ao configurar solicitação.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Lista todos os áudios de um participante específico
 * @param participanteId ID do participante
 * @returns Promise que resolve com a lista de áudios do participante
 * @throws Error se ocorrer um erro durante a busca
 */
export const listAudiosByParticipante = async (
  participanteId: number
): Promise<AudioItem[]> => {
  try {
    if (!participanteId || isNaN(participanteId) || participanteId <= 0) {
      throw new Error("ID de participante inválido");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.get(`/audios/participante/${participanteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error: any) {
    let errorMessage = "Erro ao buscar áudios do participante.";

    if (error.response) {
      if (error.response.status === 422) {
        errorMessage = "Dados inválidos para buscar áudios.";
      } else if (error.response.status === 401) {
        errorMessage = "Não autorizado. Faça login novamente.";
      } else if (error.response.status === 404) {
        errorMessage = "Áudios não encontrados.";
      } else {
        errorMessage = `Erro do servidor: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro desconhecido.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Exclui todos os áudios de um participante específico
 * @param participanteId ID do participante
 * @returns Promise que resolve com a resposta da API
 * @throws Error se ocorrer um erro durante a exclusão
 */
export const deleteAllAudiosByParticipante = async (
  participanteId: number
): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const response = await api.delete(
      `/audios/participante/${participanteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    let errorMessage = "Erro ao excluir todos os áudios do participante.";

    if (error.response) {
      errorMessage =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
    } else if (error.request) {
      errorMessage = "Servidor não respondeu à solicitação.";
    } else {
      errorMessage = error.message || "Erro ao configurar solicitação.";
    }

    throw new Error(errorMessage);
  }
};
