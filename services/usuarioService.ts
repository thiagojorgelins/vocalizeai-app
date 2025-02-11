import { UsuarioUpdate } from "@/types/UsuarioUpdate";
import { api } from "./api";
import { getToken, getUserId } from "./util";

export const getAllUsers = async (): Promise<any> => {
  try {
    const token = await getToken();
    const response = await api.get("/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao buscar usuários.";
    throw new Error(errorMessage);
  }
}


export const getUser = async (): Promise<any> => {
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

export const updateUser = async (data: UsuarioUpdate): Promise<void> => {
  const token = await getToken();
  const userId = await getUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  await api.patch(`/usuarios/${userId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserAdmin = async (data: UsuarioUpdate): Promise<void> => {
  const token = await getToken();
  const userId = await getUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  await api.patch(`/usuarios/${data.id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteUser = async (id: any): Promise<void> => {
  const token = await getToken();
  const userId = await getUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  await api.delete(`/usuarios/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}