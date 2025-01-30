import { showMessage } from "react-native-flash-message";
import { Vocalizacao } from "../types/Vocalizacao";
import { api } from "./api";
import { getRole, getToken } from "./util";

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

export const createVocalizacoes = async (nome: string, descricao: string): Promise<void> => {
    try {
        if(!nome ||!descricao) {
          throw new Error("Nome e descrição são obrigatórios.");
        }
        const token = await getToken();
        const role = await getRole()

        if (role !== "admin") {
            throw new Error("Você não tem permissão para criar vocalizações.");
        }

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

export const updateVocalizacoes = async (vocalizacaoId: string, data: Vocalizacao): Promise<void> => {
    try {
        const token = await getToken();
        const role = await getRole()

        if (role !== "admin") {
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