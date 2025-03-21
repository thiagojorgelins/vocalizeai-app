export async function validateAudioFile(uri) {
  try {
    // Normalize URI
    const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    
    // Check if file exists and has content
    const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
    console.log("Validating audio file:", fileInfo);
    
    if (!fileInfo.exists) {
      return {
        valid: false,
        error: "File doesn't exist",
        uri: normalizedUri
      };
    }
    
    if (fileInfo.size === 0) {
      return {
        valid: false,
        error: "File is empty",
        uri: normalizedUri
      };
    }
    
    // Try to load audio without playing it
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: normalizedUri },
        { shouldPlay: false }
      );
      
      // If successfully loaded, unload it
      await sound.unloadAsync();
      
      return {
        valid: true,
        uri: normalizedUri,
        size: fileInfo.size
      };
    } catch (audioError) {
      return {
        valid: false,
        error: "Could not load audio file",
        details: audioError.message,
        uri: normalizedUri
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      uri: uri
    };
  }
}