package com.thiagolins.vocalizeai;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.app.NotificationManager;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class AudioRecorderModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "AudioRecorderModule";
    private final ReactApplicationContext reactContext;
    private boolean isRecording = false;
    private boolean isPaused = false;
    private String currentOutputFile = null;
    private long currentRecordingTime = 0;
    
    private final BroadcastReceiver recordingStatusReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
          String action = intent.getAction();
          
          if ("com.thiagolins.vocalizeai.OUTPUT_FILE_SET".equals(action)) {
            String outputFile = intent.getStringExtra("outputFile");
            if (outputFile != null) {
                currentOutputFile = outputFile;
                
                WritableMap params = Arguments.createMap();
                params.putString("outputFile", "file://" + outputFile);
                params.putBoolean("isRecording", isRecording);
                params.putBoolean("isPaused", isPaused);
                params.putDouble("currentTime", currentRecordingTime);
                
                sendEvent("onRecordingStatusChange", params);
            }
          } 
          else if ("com.thiagolins.vocalizeai.RECORDING_STATUS".equals(action)) {
              isRecording = intent.getBooleanExtra("isRecording", false);
              isPaused = intent.getBooleanExtra("isPaused", false);
              currentOutputFile = intent.getStringExtra("outputFile");
              currentRecordingTime = intent.getLongExtra("currentTime", 0);
              
              WritableMap params = Arguments.createMap();
              params.putBoolean("isRecording", isRecording);
              params.putBoolean("isPaused", isPaused);
              params.putString("outputFile", currentOutputFile != null ? "file://" + currentOutputFile : null);
              params.putDouble("currentTime", currentRecordingTime);
              
              sendEvent("onRecordingStatusChange", params);
          } else if ("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE".equals(action)) {
              currentRecordingTime = intent.getLongExtra("currentTime", 0);
      
              String updatedOutputFile = intent.getStringExtra("outputFile");
              if (updatedOutputFile != null && !updatedOutputFile.isEmpty()) {
                  if (currentOutputFile == null || !currentOutputFile.equals(updatedOutputFile)) {
                      currentOutputFile = updatedOutputFile;
                  }
              }
              
              WritableMap params = Arguments.createMap();
              params.putDouble("currentTime", currentRecordingTime);
              
              if (currentOutputFile != null) {
                  params.putString("outputFile", "file://" + currentOutputFile);
              }
              
              sendEvent("onRecordingTimeUpdate", params);
          } else if ("com.thiagolins.vocalizeai.RECORDING_COMPLETED".equals(action)) {
              String outputFile = intent.getStringExtra("outputFile");
              long duration = intent.getLongExtra("duration", 0);
              
              if (outputFile != null) {
                  File file = new File(outputFile);
                  if (file.exists() && file.length() > 0) {
                      if (!file.canRead()) {
                          file.setReadable(true, false);
                      }
                      
                      String fileUrl = "file://" + outputFile;
                      
                      WritableMap params = Arguments.createMap();
                      params.putString("outputFile", fileUrl);
                      params.putDouble("duration", duration);
                      
                      sendEvent("onRecordingComplete", params);
                      
                      isRecording = false;
                      isPaused = false;
                      currentOutputFile = outputFile;
                  } else {
                      Log.e(TAG, "Arquivo não existe ou está vazio: " + outputFile);
                      
                      WritableMap params = Arguments.createMap();
                      params.putString("error", "Arquivo não existe ou está vazio");
                      
                      sendEvent("onRecordingError", params);
                  }
              } else {
                  Log.e(TAG, "OutputFile recebido é null");
                  
                  WritableMap params = Arguments.createMap();
                  params.putString("error", "Caminho do arquivo é null");
                  
                  sendEvent("onRecordingError", params);
              }
          }
      }
  };

    public AudioRecorderModule(ReactApplicationContext reactContext) {
      super(reactContext);
      this.reactContext = reactContext;
      this.reactContext.addLifecycleEventListener(this);
      
      IntentFilter filter = new IntentFilter();
      filter.addAction("com.thiagolins.vocalizeai.RECORDING_STATUS");
      filter.addAction("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE");
      filter.addAction("com.thiagolins.vocalizeai.RECORDING_COMPLETED");
      filter.addAction("com.thiagolins.vocalizeai.OUTPUT_FILE_SET");
      filter.addAction("com.thiagolins.vocalizeai.RECORDING_ERROR");

      try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              this.reactContext.registerReceiver(recordingStatusReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
          } else {
              this.reactContext.registerReceiver(recordingStatusReceiver, filter);
          }
      } catch (Exception e) {
          Log.e(TAG, "Erro ao registrar receptor de broadcast: " + e.getMessage(), e);
      }
    }

    @Override
    public String getName() {
        return "BackgroundAudioRecorder";
    }
    
    private void sendEvent(String eventName, WritableMap params) {
      try {
          if (reactContext.hasActiveReactInstance()) {
              reactContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit(eventName, params);
          } else {
              new Handler(Looper.getMainLooper()).postDelayed(() -> {
                  if (reactContext.hasActiveReactInstance()) {
                      try {
                          reactContext
                              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                              .emit(eventName, params);
                      } catch (Exception retryEx) {
                          Log.e(TAG, "Falha na nova tentativa de enviar evento: " + retryEx.getMessage());
                      }
                  }
              }, 500);
          }
      } catch (Exception e) {
          Log.e(TAG, "Erro ao enviar evento " + eventName + ": " + e.getMessage(), e);
      }
    }
    
    @ReactMethod
    public void addListener(String eventName) {
    }

    @ReactMethod
    public void removeListeners(Integer count) {
    }

    @ReactMethod
    public void forceStopService(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, ForegroundAudioRecorderService.class);
            reactContext.stopService(serviceIntent);
            NotificationManager notificationManager = 
                (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.cancel(ForegroundAudioRecorderService.NOTIFICATION_ID);
            WritableMap params = Arguments.createMap();
            params.putBoolean("isRecording", false);
            params.putBoolean("isPaused", false);
            params.putDouble("currentTime", 0);
            params.putString("outputFile", null); 
            sendEvent("onRecordingStatusChange", params);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao forçar parada do serviço: " + e.getMessage());
            promise.reject("FORCE_STOP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startRecording(double elapsedTimeBeforePause, Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) 
                    != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "Permissão para gravar áudio não concedida");
                promise.reject("PERMISSION_DENIED", "Permissão para gravar áudio não concedida");
                return;
            }
            
            Intent serviceIntent = new Intent(reactContext, ForegroundAudioRecorderService.class);
            serviceIntent.setAction(ForegroundAudioRecorderService.ACTION_START_RECORDING);
            serviceIntent.putExtra(ForegroundAudioRecorderService.EXTRA_ELAPSED_TIME, (long)elapsedTimeBeforePause);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            
            isRecording = true;
            isPaused = false;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao iniciar gravação: " + e.getMessage());
            promise.reject("START_RECORDING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void pauseRecording(Promise promise) {
        try {
            if (!isRecording || isPaused) {
                promise.reject("INVALID_STATE", "Não há gravação ativa para pausar");
                return;
            }
            
            Intent serviceIntent = new Intent(reactContext, ForegroundAudioRecorderService.class);
            serviceIntent.setAction(ForegroundAudioRecorderService.ACTION_PAUSE_RECORDING);
            reactContext.startService(serviceIntent);
            
            isPaused = true;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao pausar gravação: " + e.getMessage());
            promise.reject("PAUSE_RECORDING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void resumeRecording(Promise promise) {
        try {
            if (!isRecording || !isPaused) {
                promise.reject("INVALID_STATE", "Não há gravação pausada para retomar");
                return;
            }
            
            Intent serviceIntent = new Intent(reactContext, ForegroundAudioRecorderService.class);
            serviceIntent.setAction(ForegroundAudioRecorderService.ACTION_RESUME_RECORDING);
            reactContext.startService(serviceIntent);
            
            isPaused = false;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao retomar gravação: " + e.getMessage());
            promise.reject("RESUME_RECORDING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopRecording(Promise promise) {
        try {
            if (!isRecording) {
                promise.reject("INVALID_STATE", "Não há gravação ativa para parar");
                return;
            }
            
            Intent serviceIntent = new Intent(reactContext, ForegroundAudioRecorderService.class);
            serviceIntent.setAction(ForegroundAudioRecorderService.ACTION_STOP_RECORDING);
            reactContext.startService(serviceIntent);
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao parar gravação: " + e.getMessage());
            promise.reject("STOP_RECORDING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();
            status.putBoolean("isRecording", isRecording);
            status.putBoolean("isPaused", isPaused);
            status.putString("outputFile", currentOutputFile);
            status.putDouble("currentTime", currentRecordingTime);
            
            promise.resolve(status);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao obter status: " + e.getMessage());
            promise.reject("GET_STATUS_ERROR", e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        return constants;
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
        try {
            reactContext.unregisterReceiver(recordingStatusReceiver);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao desregistrar receptor: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getOutputFilePath(Promise promise) {
        try {
            if (currentOutputFile != null) {
                File file = new File(currentOutputFile);
                if (file.exists() && file.length() > 0) {
                    file.setReadable(true, false);
                    
                    String fileUrl = currentOutputFile.startsWith("file://") 
                        ? currentOutputFile 
                        : "file://" + currentOutputFile;
                    
                    promise.resolve(fileUrl);
                } else {
                    promise.resolve(null);
                }
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting file path: " + e.getMessage());
            promise.reject("GET_FILE_PATH_ERROR", e.getMessage());
        }
    }
}