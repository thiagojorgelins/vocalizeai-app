export interface AudioRecording {
  uri: string;
  timestamp: number;
  duration: number;
  vocalizationId: number;
  vocalizationName: string;
  participanteId?: number;
  status: string
}