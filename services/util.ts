import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Retorna o ID do usuário armazenado no AsyncStorage
 * @returns Uma string com o ID do usuário ou null se não encontrado
 */
export const getUserId = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("userId");
};

/**
 * Retorna o token de autenticação armazenado no AsyncStorage
 * @returns Uma string com o token de autenticação ou null se não encontrado
 */
export const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("token");
}

/**
 * Retorna o papel (role) do usuário armazenado no AsyncStorage
 * @returns Uma string com a role do usuário ou null se não encontrado
 */
export const getRole = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("role");
}