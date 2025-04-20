export interface FormUsuarioProps {
  nome: string;
  setNome: (value: string) => void;
  email: string;
  handleEmailChange: (value: string) => void;
  celular: string;
  handleCelularChange: (value: string) => void;
  emailError: string;
  nomeError?: string;
  celularError: string;
  showPasswordFields?: boolean;
  senha?: string;
  setSenha?: (value: string) => void;
  confirmaSenha?: string;
  setConfirmaSenha?: (value: string) => void;
  senhaError?: string;
  confirmaSenhaError?: string;
}