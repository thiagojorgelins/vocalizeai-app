package com.thiagolins.vocalizeai;

import android.util.Log;
import java.io.File;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FileOperationsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "FileOperationsModule";
    private final ReactApplicationContext reactContext;

    public FileOperationsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "FileOperations";
    }

    @ReactMethod
    public void deleteFile(String filePath, Promise promise) {
        try {
            Log.d(TAG, "Attempting to delete file: " + filePath);
            
            if (filePath.startsWith("file://")) {
                filePath = filePath.substring(7);
            }
            
            File file = new File(filePath);
            
            if (!file.exists()) {
                Log.d(TAG, "File doesn't exist: " + filePath);
                promise.resolve(false);
                return;
            }
            
            boolean deleted = file.delete();
            
            if (deleted) {
                Log.d(TAG, "File deleted successfully: " + filePath);
                promise.resolve(true);
            } else {
                Log.d(TAG, "Regular delete failed, trying alternative approach");
                
                file.setWritable(true);
                deleted = file.delete();
                
                if (deleted) {
                    Log.d(TAG, "File deleted with alternative approach: " + filePath);
                    promise.resolve(true);
                } else {
                    Log.e(TAG, "Failed to delete file: " + filePath);
                    promise.reject("DELETE_ERROR", "Failed to delete file");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error deleting file: " + e.getMessage());
            promise.reject("DELETE_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getAppAudioDirectory(Promise promise) {
        try {
            File dir = new File(reactContext.getFilesDir(), "audiorecordings");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            dir.setReadable(true, false);
            dir.setWritable(true, false);
            
            String path = dir.getAbsolutePath();
            Log.d(TAG, "App audio directory: " + path);
            promise.resolve("file://" + path);
        } catch (Exception e) {
            Log.e(TAG, "Error getting app audio directory: " + e.getMessage());
            promise.reject("DIR_ERROR", e.getMessage());
        }
    }
}