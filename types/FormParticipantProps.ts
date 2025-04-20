export interface FormParticipanteProps {
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