export interface AudioLocal {
    id: string;
    fileName: string;
    duration: string;
    vocalizationId: number;
    vocalizationName: string;
    fileUri: string;
    createdAt: string;
    status: 'pending' | 'sent';
  }