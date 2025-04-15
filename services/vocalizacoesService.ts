import { Vocalizacao } from "@/types/Vocalizacao";
import { api } from "./api";
import { getRole, getToken , getUserId} from "./util";

/**
 * Obtém a lista de todas as vocalizações
 * @returns Lista de vocalizações
 * @throws Lança um erro caso ocorra alguma falha ao buscar as vocalizações
 */
export const getVocalizacoes = async (): Promise<Vocalizacao[]> => {
    try {
        const token = await getToken();
        const response = await api.get("/vocalizacoes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "Erro ao buscar vocalizações.";
        throw new Error(errorMessage);
    }
}

/**
 * Cria uma nova vocalização
 * @param nome Nome da vocalização
 * @param descricao Descrição da vocalização
 * @throws Lança um erro caso nome ou descrição não sejam fornecidos ou ocorra falha ao criar
 */
export const createVocalizacoes = async (nome: string, descricao: string): Promise<void> => {
    try {
        if(!nome ||!descricao) {
          throw new Error("Nome e descrição são obrigatórios.");
        }
        const token = await getToken();

        await api.post(`/vocalizacoes`, {nome, descricao}, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "Erro ao criar vocalizações.";
        throw new Error(errorMessage);
    }
}

/**
 * Atualiza uma vocalização específica
 * @param vocalizacaoId ID da vocalização a ser atualizada
 * @param data Objeto contendo os dados da vocalização
 * @throws Lança um erro caso o usuário não tenha permissão ou ocorra falha na atualização
 */
export const updateVocalizacoes = async (vocalizacaoId: string, data: Vocalizacao): Promise<void> => {
    try {
        const token = await getToken();
        const role = await getRole()
        const userId = await getUserId()

        if (role != "admin" || data.id_usuario != Number(userId)) {
            throw new Error("Você não tem permissão para atualizar vocalizações.");
        }

        await api.patch(`/vocalizacoes/${vocalizacaoId}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "Erro ao atualizar vocalizações.";
        throw new Error(errorMessage);
    }
}

/**
 * Deleta uma vocalização específica
 * @param vocalizacaoId ID da vocalização a ser deletada
 * @throws Lança um erro caso o usuário não tenha permissão ou ocorra falha na exclusão
 */
export const deleteVocalizacoes = async (vocalizacaoId: string): Promise<void> => {
    try {
        const token = await getToken();
        const role = await getRole()

        if (role !== "admin") {
            throw new Error("Você não tem permissão para deletar vocalizações.");
        }

        await api.delete(`/vocalizacoes/${vocalizacaoId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "Erro ao deletar vocalizações.";
        throw new Error(errorMessage);
    }
}