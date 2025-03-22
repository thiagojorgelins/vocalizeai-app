import * as FileSystem from 'expo-file-system';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { BackgroundAudioRecorder } = NativeModules;

if (!BackgroundAudioRecorder) {
  console.error('Módulo nativo BackgroundAudioRecorder não encontrado. A funcionalidade de gravação em segundo plano pode não funcionar.');
}

const BackgroundAudioRecorderEmitter = BackgroundAudioRecorder
  ? new NativeEventEmitter(BackgroundAudioRecorder)
  : null;

class AudioRecorderService {
  constructor() {
    this._isRecording = false;
    this._isPaused = false;
    this._recordingTime = 0;
    this._outputFile = null;
    this._timeUpdateListeners = [];
    this._statusChangeListeners = [];
    this._recordingCompleteListeners = [];

    if (BackgroundAudioRecorderEmitter) {
      this._recordingStatusListener = BackgroundAudioRecorderEmitter.addListener(
        'onRecordingStatusChange',
        this._handleRecordingStatusChange.bind(this)
      );

      this._recordingTimeListener = BackgroundAudioRecorderEmitter.addListener(
        'onRecordingTimeUpdate',
        this._handleRecordingTimeUpdate.bind(this)
      );

      this._recordingCompleteListener = BackgroundAudioRecorderEmitter.addListener(
        'onRecordingComplete',
        this._handleRecordingComplete.bind(this)
      );

      this._recordingErrorListener = BackgroundAudioRecorderEmitter.addListener(
        'onRecordingError',
        this._handleRecordingError.bind(this)
      );

      this._syncStatus();
    }
  }

  async syncOutputFile() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    try {
      const filePath = await BackgroundAudioRecorder.getOutputFilePath();

      if (filePath) {
        this._outputFile = filePath;

        this._statusChangeListeners.forEach(listener => {
          listener({
            isRecording: this._isRecording,
            isPaused: this._isPaused,
            currentTime: this._recordingTime,
            outputFile: this._outputFile
          });
        });

        return filePath;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao sincronizar arquivo de saída:', error);
      throw error;
    }
  }
  
  async checkOutputFile() {
    if (!this._outputFile) {
      console.error('Não há arquivo de saída para verificar');
      return false;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(this._outputFile);

      if (fileInfo.exists && fileInfo.size > 0) {
        return true;
      } else if (fileInfo.exists && fileInfo.size === 0) {
        console.error('Arquivo existe mas está vazio');
        return false;
      } else {
        console.error('Arquivo não existe');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar arquivo:', error);
      return false;
    }
  }

async resetState() {
  if (!BackgroundAudioRecorder) {
    console.warn('Módulo nativo BackgroundAudioRecorder não disponível para resetState');
    return false;
  }

  try {
    await BackgroundAudioRecorder.forceStopService();
    
    this._isRecording = false;
    this._isPaused = false;
    this._recordingTime = 0;
    this._outputFile = null;
    
    this._statusChangeListeners.forEach(listener => {
      listener({
        isRecording: false,
        isPaused: false,
        currentTime: 0,
        outputFile: null
      });
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar estado:', error);
    return false;
  }
}

  async verifyRecording() {
    if (!this._outputFile) {
      console.error('Sem arquivo de saída para verificar');
      return {
        exists: false,
        message: 'Sem arquivo de saída para verificar'
      };
    }

    try {
      const fileExists = await this.checkOutputFile();

      return {
        exists: fileExists,
        path: this._outputFile,
        duration: this._recordingTime,
        message: fileExists ? 'Arquivo de gravação encontrado' : 'Arquivo de gravação não encontrado'
      };
    } catch (error) {
      console.error('Erro ao verificar gravação:', error);
      return {
        exists: false,
        error: error.message,
        message: 'Erro ao verificar gravação'
      };
    }
  }

  _handleRecordingError(error) {
    console.error('Erro na gravação:', error);

    this._isRecording = false;
    this._isPaused = false;

    this._statusChangeListeners.forEach(listener => {
      listener({
        isRecording: false,
        isPaused: false,
        currentTime: 0,
        outputFile: null,
        error: error.error || 'Erro desconhecido na gravação'
      });
    });
  }

  async forceStopService() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    try {
      await BackgroundAudioRecorder.forceStopService();
      this.resetState();
      return true;
    } catch (error) {
      console.error('Erro ao forçar parada do serviço:', error);
      throw error;
    }
  }

  async _syncStatus() {
    if (!BackgroundAudioRecorder) return;

    try {
      const status = await BackgroundAudioRecorder.getStatus();
      this._isRecording = status.isRecording;
      this._isPaused = status.isPaused;
      this._recordingTime = status.currentTime;
      this._outputFile = status.outputFile;
    } catch (error) {
      console.error('Erro ao sincronizar status do gravador:', error);
    }
  }

  _handleRecordingStatusChange(status) {
    this._isRecording = status.isRecording;
    this._isPaused = status.isPaused;
    this._recordingTime = status.currentTime;
    this._outputFile = status.outputFile;

    this._statusChangeListeners.forEach(listener => {
      listener({
        isRecording: this._isRecording,
        isPaused: this._isPaused,
        currentTime: this._recordingTime,
        outputFile: this._outputFile
      });
    });
  }

  _handleRecordingTimeUpdate(update) {
    this._recordingTime = update.currentTime;

    if (update.outputFile && (!this._outputFile || this._outputFile !== update.outputFile)) {
      this._outputFile = update.outputFile;
    }

    this._timeUpdateListeners.forEach(listener => {
      try {
        listener(this._recordingTime);
      } catch (error) {
        console.error("Erro ao notificar listener de tempo:", error);
      }
    });
  }

  _handleRecordingComplete(data) {
    this._isRecording = false;
    this._isPaused = false;

    this._recordingCompleteListeners.forEach(listener => {
      listener({
        outputFile: data.outputFile,
        duration: data.duration
      });
    });
  }

  async syncOutputFile() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }
  
    try {
      const filePath = await BackgroundAudioRecorder.getOutputFilePath();
  
      if (filePath) {
        this._outputFile = filePath;
  
        this._statusChangeListeners.forEach(listener => {
          listener({
            isRecording: this._isRecording,
            isPaused: this._isPaused,
            currentTime: this._recordingTime,
            outputFile: this._outputFile
          });
        });
  
        try {
          const normalizedPath = filePath.startsWith('file://') 
            ? filePath 
            : `file://${filePath}`;
            
          const fileInfo = await FileSystem.getInfoAsync(normalizedPath);
        } catch (error) {
          console.error("Erro ao verificar arquivo:", error);
        }
  
        return filePath;
      } else {
        
        if (this._outputFile) {
          try {
            const normalizedPath = this._outputFile.startsWith('file://') 
              ? this._outputFile 
              : `file://${this._outputFile}`;
              
            const fileInfo = await FileSystem.getInfoAsync(normalizedPath);
            
            if (fileInfo.exists && fileInfo.size > 0) {
              return this._outputFile;
            }
          } catch (error) {
            console.error("Erro ao verificar arquivo memorizado:", error);
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('Erro ao sincronizar arquivo de saída:', error);
      throw error;
    }
  }

  async getStatus() {
    if (Platform.OS !== 'android') {
      throw new Error('Gravação em segundo plano disponível apenas para Android');
    }
    
    try {
      return {
        isRecording: this._isRecording,
        isPaused: this._isPaused,
        currentTime: this._recordingTime,
        outputFile: this._outputFile
      };

    } catch (error) {
      console.error("Erro ao obter status da gravação:", error);
      return {
        isRecording: false,
        isPaused: false,
        currentTime: 0,
        outputFile: null
      };
    }
  }
  async startRecording(elapsedTimeBeforePause = 0) {
    if (Platform.OS !== 'android') {
      throw new Error('Gravação em segundo plano disponível apenas para Android');
    }

    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    try {
      await BackgroundAudioRecorder.startRecording(elapsedTimeBeforePause);
      this._isRecording = true;
      this._isPaused = false;
      return true;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      throw error;
    }
  }

  async pauseRecording() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    if (!this._isRecording || this._isPaused) {
      throw new Error('Nenhuma gravação ativa para pausar');
    }

    try {
      await BackgroundAudioRecorder.pauseRecording();
      this._isPaused = true;
      return true;
    } catch (error) {
      console.error('Erro ao pausar gravação:', error);
      throw error;
    }
  }

  async resumeRecording() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    if (!this._isRecording || !this._isPaused) {
      throw new Error('Nenhuma gravação pausada para retomar');
    }

    try {
      await BackgroundAudioRecorder.resumeRecording();
      this._isPaused = false;
      return true;
    } catch (error) {
      console.error('Erro ao retomar gravação:', error);
      throw error;
    }
  }

  async stopRecording() {
    if (!BackgroundAudioRecorder) {
      throw new Error('Módulo nativo BackgroundAudioRecorder não disponível');
    }

    if (!this._isRecording) {
      throw new Error('Nenhuma gravação ativa para parar');
    }

    try {
      await BackgroundAudioRecorder.stopRecording();
      return true;
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      throw error;
    }
  }

  isRecording() {
    return this._isRecording;
  }

  isPaused() {
    return this._isPaused;
  }

  getCurrentTime() {
    return this._recordingTime;
  }

  getOutputFilePath() {
    if (!this._outputFile) {
      return null;
    }

    return this._outputFile.startsWith('file://')
      ? this._outputFile
      : `file://${this._outputFile}`;
  }

  addTimeUpdateListener(listener) {
    this._timeUpdateListeners.push(listener);
    return () => {
      this._timeUpdateListeners = this._timeUpdateListeners.filter(l => l !== listener);
    };
  }

  addStatusChangeListener(listener) {
    this._statusChangeListeners.push(listener);
    return () => {
      this._statusChangeListeners = this._statusChangeListeners.filter(l => l !== listener);
    };
  }

  addRecordingCompleteListener(listener) {
    this._recordingCompleteListeners.push(listener);
    return () => {
      this._recordingCompleteListeners = this._recordingCompleteListeners.filter(l => l !== listener);
    };
  }

  cleanup() {
    if (this._recordingStatusListener) {
      this._recordingStatusListener.remove();
      this._recordingStatusListener = null;
    }

    if (this._recordingTimeListener) {
      this._recordingTimeListener.remove();
      this._recordingTimeListener = null;
    }

    if (this._recordingCompleteListener) {
      this._recordingCompleteListener.remove();
      this._recordingCompleteListener = null;
    }

    this._timeUpdateListeners = [];
    this._statusChangeListeners = [];
    this._recordingCompleteListeners = [];
  }
}

const audioRecorderService = new AudioRecorderService();
export default audioRecorderService;