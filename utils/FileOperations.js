import * as FileSystem from 'expo-file-system';
import { NativeModules, Platform } from 'react-native';

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
  },

  async cleanAudioDirectory() {
    if (Platform.OS === 'android') {
      try {
        return await FileOperations.cleanAudioDirectory();
      } catch (error) {
        console.error('Error cleaning audio directory:', error);
        return 0;
      }
    } else {
      try {
        const dirPath = FileSystem.documentDirectory + 'audio/';
        const dirInfo = await FileSystem.getInfoAsync(dirPath);

        if (dirInfo.exists && dirInfo.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(dirPath);
          let deletedCount = 0;

          for (const file of files) {
            try {
              await FileSystem.deleteAsync(dirPath + file, { idempotent: true });
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete ${file}:`, error);
            }
          }

          return deletedCount;
        }
        return 0;
      } catch (error) {
        console.error('Error cleaning audio directory with FileSystem:', error);
        return 0;
      }
    }
  },

  async moveFile(sourcePath, destPath) {
    try {
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destPath
      });

      try {
        if (Platform.OS === 'android' && FileOperations.deleteFile) {
          await FileOperations.deleteFile(sourcePath);
        } else {
          await FileSystem.deleteAsync(sourcePath, { idempotent: true });
        }
      } catch (deleteError) {
        console.error('Failed to delete source file after copy:', deleteError);
      }

      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }
};

export default FileOperationsModule;