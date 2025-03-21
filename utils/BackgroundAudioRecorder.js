import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BackgroundAudioRecorder } = NativeModules;

// Verifique se o módulo nativo existe antes de prosseguir
if (!BackgroundAudioRecorder) {
  console.error('Módulo nativo BackgroundAudioRecorder não encontrado. A funcionalidade de gravação em segundo plano pode não funcionar.');
}

// Crie o emissor de eventos apenas se o módulo existir
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
    
    // Configurar listeners para eventos do módulo nativo apenas se o módulo existir
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
      
      // Sincronizar status inicial
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
        console.log('Arquivo de saída sincronizado:', filePath);
        this._outputFile = filePath;
        
        // Notificar ouvintes da mudança
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
        console.log('Nenhum arquivo de saída disponível para sincronizar');
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
      // Remover o prefixo "file://" se presente
      const filePath = this._outputFile.startsWith('file://') 
        ? this._outputFile.slice(7) 
        : this._outputFile;
        
      // Use o FileSystem do Expo para verificar o arquivo
      const fileInfo = await FileSystem.getInfoAsync(this._outputFile);
      
      console.log('Informações do arquivo:', fileInfo);
      
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log(`Arquivo existe e tem tamanho: ${fileInfo.size} bytes`);
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
  
  resetState() {
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
  
  // Adicione este método para lidar com erros de gravação
  _handleRecordingError(error) {
    console.error('Erro na gravação:', error);
    
    this._isRecording = false;
    this._isPaused = false;
    
    // Notificar ouvintes de erro
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
      console.log('Arquivo de saída atualizado via time update:', update.outputFile);
      this._outputFile = update.outputFile;
    }
    
    this._timeUpdateListeners.forEach(listener => {
      listener(this._recordingTime);
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
  
  // Métodos públicos
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
      // O resultado será entregue através do evento onRecordingComplete
      return true;
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      throw error;
    }
  }
  
  // Métodos para obter o estado atual
  isRecording() {
    return this._isRecording;
  }
  
  isPaused() {
    return this._isPaused;
  }
  
  getCurrentTime() {
    return this._recordingTime;
  }
  
  getOutputFile() {
    return this._outputFile;
  }
  
  // Métodos para adicionar ouvintes de eventos
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
  
  // Método para limpar todos os ouvintes e recursos
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

// Crie e exporte a instância após a definição da classe
const audioRecorderService = new AudioRecorderService();
export default audioRecorderService;