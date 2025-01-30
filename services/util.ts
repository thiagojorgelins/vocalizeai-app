import AsyncStorage from "@react-native-async-storage/async-storage";

export const getUserId = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("userId");
};

export const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("token");
}

export const getRole = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("role");
}