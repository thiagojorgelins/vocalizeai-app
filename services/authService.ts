import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { showMessage } from "react-native-flash-message";
import { TokenPayload } from "@/types/TokenPayload";
import { api } from "./api";

let isUpdatingToken = false;

const setIsUpdatingToken = (value: boolean) => {
    isUpdatingToken = value;
};

const saveTokens = async (data: { access_token: string; sub: string, exp: number; role: string }) => {
    const tokenExpiresIn = data.exp * 1000;
    await AsyncStorage.multiSet([
        ["token", data.access_token],
        ["tokenExpires", tokenExpiresIn.toString()],
        ["role", data.role],
        ["userId", data.sub]
    ]);
};

const updateToken = async (): Promise<void> => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            stopTokenUpdateRoutine()
            router.push("/auth/login");
            return;
        }
        const response = await api.post("/auth/refresh", { access_token: token });

        const { access_token } = response.data;
        if (access_token) {
            const payload: TokenPayload = jwtDecode(access_token);
            await saveTokens({
                access_token,
                exp: payload.exp!,
                role: payload.role!,
                sub: payload.sub
            });
            if (!isUpdatingToken) {
                tokenUpdateRoutine();
            }
        } else {
            showMessage({
                description: "Token inválido",
                message: "Erro ao atualizar a sessão",
                type: "danger"
            })
        }
    } catch (error: any) {
        showMessage({
            message: "Erro ao atualizar o token:" + error.message,
            type: "danger"
        })
        router.push("/auth/login");
    }
};

const doLogin = async (email: string, senha: string): Promise<boolean> => {
    try {
        const response = await api.post("/auth/login", { email, senha });
        const { access_token } = response.data;

        if (access_token) {
            const payload: TokenPayload = jwtDecode(access_token);
            await saveTokens({
                access_token,
                exp: payload.exp!,
                role: payload.role!,
                sub: payload.sub,
            });
            await AsyncStorage.multiSet([
                ["email", email],
                ["senha", senha],
            ]);
            tokenUpdateRoutine();
            return true
        } else {
            throw new Error("Resposta inválida do servidor.");
        }
    } catch (error: any) {
        showMessage({
            message: error.response?.data?.message || error.message || "Erro ao fazer login.",
            type: "danger",
        });
        return false
    }
};



const getExpirationTime = async (): Promise<number> => {
    const tempo = await AsyncStorage.getItem("tokenExpires");
    return Number(tempo);
};

let tokenUpdateInterval: NodeJS.Timeout | null = null;

const tokenUpdateRoutine = () => {
    if (tokenUpdateInterval === null) {
        setIsUpdatingToken(true);
        const UPDATE_INTERVAL = 3000 * 1000
        tokenUpdateInterval = setInterval(updateToken, UPDATE_INTERVAL);
    } else {
        console.log("Uma rotina de atualização de token já está rodando.");
    }
};

const stopTokenUpdateRoutine = () => {
    if (tokenUpdateInterval) {
        clearInterval(tokenUpdateInterval);
        tokenUpdateInterval = null;
        setIsUpdatingToken(false);
    }
};

const register = async (
    nome: string,
    email: string,
    celular: string,
    senha: string,
    confirmaSenha: string
): Promise<boolean> => {
    if (!nome || !celular || !email || !senha || !confirmaSenha) {
        showMessage({
            message: "Todos os campos são obrigatórios.",
            type: "warning",
        });
        return false
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showMessage({
            message: "Formato do email é inválido.",
            type: "danger",
        });
        return false
    }

    if (senha !== confirmaSenha) {
        showMessage({
            message: "As senhas não coincidem.",
            type: "warning",
        });
        return false
    }

    try {
        const response = await api.post("/auth/register", { nome, email, celular, senha });
        if (response.status === 201) {
            await doLogin(email, senha);
            return true
        } else {
            throw new Error("Erro ao registrar usuário.");
        }
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.detail || error.message || "Erro ao cadastrar usuário.";
        showMessage({
            message: errorMessage,
            type: "danger",
        });
        return false;
    }
};


const doLogout = async (): Promise<void> => {
    await AsyncStorage.multiRemove(["token", "tokenExpires", "role", "usuarioId", "email", "senha"]);
    stopTokenUpdateRoutine();
    router.push("/auth/login");
};

export { doLogin, doLogout, getExpirationTime, register, updateToken };

