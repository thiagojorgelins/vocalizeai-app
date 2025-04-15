export interface AudioItem {
  id: number;
  id_usuario: number;
  id_vocalizacao: number;
  id_participante: number;
  nome_arquivo: string;
  created_at: string;
  updated_at: string;
  nome_vocalizacao?: string;
  arquivo_url?: string;
  data_criacao?: string;
  duracao?: number;
  tamanho?: number;
}