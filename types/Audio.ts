export interface AudioItem {
  id: number;
  nome_arquivo: string;
  id_vocalizacao: number;
  id_usuario: number;
  id_participante: number;
  created_at?: string;
  updated_at?: string;
  segments?: string[];
}