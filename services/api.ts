import axios from 'axios';
import Constants from 'expo-constants';

// const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = "http://192.168.100.66:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});