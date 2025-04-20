import axios from 'axios';
import Constants from 'expo-constants';

const { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_API_KEY } = Constants.expoConfig?.extra || process.env;

export const api = axios.create({
  baseURL: EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": EXPO_PUBLIC_API_KEY,
  },
});