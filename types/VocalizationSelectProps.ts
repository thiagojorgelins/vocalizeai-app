import { Vocalizacao } from "./Vocalizacao";

export interface VocalizationSelectProps {
  vocalizations: Vocalizacao[];
  selectedVocalizationId: number | null;
  onValueChange: (value: number) => void;
  label?: string;
  placeholder?: string;
}