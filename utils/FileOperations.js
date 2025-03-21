import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const { FileOperations } = NativeModules;

const FileOperationsModule = {
  async deleteFile(filePath) {
    if (Platform.OS === 'android') {
      try {
        const result = await FileOperations.deleteFile(filePath);
        return result;
      } catch (error) {
        console.error('Error in native deleteFile:', error);
        try {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          return true;
        } catch (fsError) {
          console.error('Fallback deletion also failed:', fsError);
          return false;
        }
      }
    } else {
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        return true;
      } catch (error) {
        console.error('Error deleting file with FileSystem:', error);
        return false;
      }
    }
  },
  
  async getAudioDirectory() {
    if (Platform.OS === 'android') {
      try {
        const dirPath = await FileOperations.getAppAudioDirectory();
        return dirPath;
      } catch (error) {
        console.error('Error getting audio directory:', error);
        return FileSystem.documentDirectory + 'audio/';
      }
    } else {
      const dirPath = FileSystem.documentDirectory + 'audio/';
      
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
      
      return dirPath;
    }
  }
};

export default FileOperationsModule;