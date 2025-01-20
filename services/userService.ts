import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { ParticipantePayload } from "@/types/ParticipantePayload";
import { UsuarioUpdate } from "@/types/UsuarioUpdate";

const getUserId = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("userId");
};

const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("token");
}

export const getUserData = async (): Promise<any> => {
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



export const updateUserData = async (data: UsuarioUpdate): Promise<void> => {
    const token = await getToken();
    const userId = await getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    await api.patch(`/usuarios/${userId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const createParticipantData = async (data: ParticipantePayload): Promise<void> => {
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


export const getParticipantData = async (participantId: string): Promise<any> => {
    const token = await getToken();
    if (!participantId) throw new Error("ID do participante não fornecido");

    const response = await api.get(`/participantes/${participantId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const participant = response.data;
    await AsyncStorage.setItem("participantId", participant.id.toString());

    return participant;
};

export const updateParticipantData = async (
    participantId: string, data: ParticipantePayload): Promise<void> => {
    const token = await getToken();

    await api.patch(`/participantes/${participantId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
