import axios from 'axios';

const API_BASE_URL = 'http://192.168.100.66:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadAndClassifyAudio = async (audioFile: string, fileName?: string) => {
  try {
    const formData = new FormData();
    const audioBlob = new Blob([audioFile], { type: 'audio/wav' });
    formData.append('file', audioBlob, fileName || 'recording.wav');

    const response = await api.post('/classify-upload/', formData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload and classify audio');
  }
};