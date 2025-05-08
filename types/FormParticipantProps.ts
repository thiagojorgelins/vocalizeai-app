export interface FormParticipanteProps {
  nome: string;
  setNome: (value: string) => void;
  nomeError?: string;
  validateNome: (value: string) => boolean;
  idade: string;
  setIdade: (value: string) => void;
  genero: string;
  setGenero: (value: string) => void;
  nivelSuporte: string;
  setNivelSuporte: (value: string) => void;
  qtdPalavras: string;
  setQtdPalavras: (value: string) => void;
  idadeError: string;
  validateIdade: (value: string) => boolean;
  setShowSupportModal: (show: boolean) => void;
}