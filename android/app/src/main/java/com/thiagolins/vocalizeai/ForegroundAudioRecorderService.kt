package com.thiagolins.vocalizeai

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.MediaRecorder
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.File
import java.util.Timer
import java.util.TimerTask

class ForegroundAudioRecorderService : Service() {
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: String? = null
    private var isRecording = false
    private var isPaused = false
    private var recordingStartTime: Long = 0
    private var elapsedTimeBeforePause: Long = 0
    private var wakeLock: PowerManager.WakeLock? = null
    private var timer: Timer? = null
    private var currentRecordingTime: Long = 0
    
    companion object {
        const val CHANNEL_ID = "VocalizeAIAudioRecorderChannel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_RECORDING = "com.thiagolins.vocalizeai.START_RECORDING"
        const val ACTION_STOP_RECORDING = "com.thiagolins.vocalizeai.STOP_RECORDING"
        const val ACTION_PAUSE_RECORDING = "com.thiagolins.vocalizeai.PAUSE_RECORDING"
        const val ACTION_RESUME_RECORDING = "com.thiagolins.vocalizeai.RESUME_RECORDING"
        const val EXTRA_ELAPSED_TIME = "com.thiagolins.vocalizeai.ELAPSED_TIME"
        
        private const val TAG = "AudioRecorderService"
    }

    private val broadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.thiagolins.vocalizeai.REQUEST_OUTPUT_FILE") {
                Log.d(TAG, "Solicitação de caminho de arquivo recebida, respondendo com: $outputFile")
                sendBroadcast(Intent("com.thiagolins.vocalizeai.OUTPUT_FILE_SET")
                    .putExtra("outputFile", outputFile))
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Serviço criado")
        createNotificationChannel()
        acquireWakeLock()
        
        val filter = IntentFilter("com.thiagolins.vocalizeai.REQUEST_OUTPUT_FILE")
        val timeResetFilter = IntentFilter("com.thiagolins.vocalizeai.RESET_RECORDING_TIME")
        registerReceiver(object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                Log.d(TAG, "Recebido comando para resetar o tempo")
                elapsedTimeBeforePause = 0
                currentRecordingTime = 0
                
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE")
                    .putExtra("currentTime", 0L)
                    .putExtra("outputFile", outputFile))
            }
        }, timeResetFilter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START_RECORDING -> {
                elapsedTimeBeforePause = intent.getLongExtra(EXTRA_ELAPSED_TIME, 0)
                startRecording()
                showNotification("Gravação em andamento")
            }
            ACTION_PAUSE_RECORDING -> {
                pauseRecording()
                showNotification("Gravação pausada")
            }
            ACTION_RESUME_RECORDING -> {
                resumeRecording()
                showNotification("Gravação em andamento")
            }
            ACTION_STOP_RECORDING -> {
                stopRecording()
                stopForeground(true)
                stopSelf()
            }
        }
        
        return START_STICKY
    }
    
    private fun showNotification(contentText: String) {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val formattedTime = formatTime(currentRecordingTime)
        
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(contentText)
            .setContentText("Tempo: $formattedTime")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun acquireWakeLock() {
        Log.d(TAG, "Adquirindo WakeLock")
        try {
            val powerManager = getSystemService(POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "VocalizeAI:AudioRecorderWakeLock"
            )
            wakeLock?.acquire(30*60*1000L)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao adquirir WakeLock: ${e.message}")
        }
    }

    private fun startRecording() {
        if (isRecording) {
            Log.d(TAG, "Already recording, ignoring startRecording")
            return
        }

        try {
            Log.d(TAG, "Starting recording")

            currentRecordingTime = elapsedTimeBeforePause
            
            val soundDir = File(applicationContext.filesDir, "audiorecordings")
              if (!soundDir.exists()) {
                  soundDir.mkdirs()
            }
            soundDir.setReadable(true, false)
            soundDir.setWritable(true, false)

            val fileName = "recording_${System.currentTimeMillis()}.m4a"
            val file = File(soundDir, fileName)
            outputFile = file.absolutePath

            Log.d(TAG, "Saving to: $outputFile")

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            mediaRecorder?.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(256000)
                setAudioSamplingRate(44100)
                setOutputFile(outputFile)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    setAudioChannels(2) 
                }
                
                prepare()
                start()
            }

            isRecording = true
            isPaused = false
            recordingStartTime = System.currentTimeMillis()

            startTimer()

            sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                .putExtra("isRecording", true)
                .putExtra("isPaused", false)
                .putExtra("outputFile", outputFile)
                .putExtra("currentTime", currentRecordingTime))

            Log.d(TAG, "Recording started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting recording: ${e.message}")
            e.printStackTrace()
            
            try {
                mediaRecorder?.release()
            } catch (releaseError: Exception) {
                Log.e(TAG, "Error releasing MediaRecorder: ${releaseError.message}")
            }
            
            mediaRecorder = null
            outputFile = null
            isRecording = false
            stopSelf()
        }
    }

    private fun pauseRecording() {
        if (!isRecording || isPaused) return

        try {
            Log.d(TAG, "Pausando gravação")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                mediaRecorder?.pause()
                isPaused = true
                timer?.cancel()
                timer = null
                
                elapsedTimeBeforePause = currentRecordingTime
                
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                    .putExtra("isRecording", isRecording)
                    .putExtra("isPaused", true)
                    .putExtra("outputFile", outputFile)
                    .putExtra("currentTime", currentRecordingTime))
                    
                Log.d(TAG, "Gravação pausada com sucesso")
            } else {
                Log.d(TAG, "Versão do Android não suporta pausar gravação, parando...")
                stopRecording()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao pausar gravação: ${e.message}")
            e.printStackTrace()
        }
    }

    private fun resumeRecording() {
        if (!isRecording || !isPaused) return

        try {
            Log.d(TAG, "Retomando gravação")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                mediaRecorder?.resume()
                isPaused = false
                startTimer()
                
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                    .putExtra("isRecording", true)
                    .putExtra("isPaused", false)
                    .putExtra("outputFile", outputFile)
                    .putExtra("currentTime", currentRecordingTime))
                    
                Log.d(TAG, "Gravação retomada com sucesso")
            } else {
                Log.d(TAG, "Versão do Android não suporta retomar gravação, iniciando nova...")
                startRecording()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao retomar gravação: ${e.message}")
            e.printStackTrace()
        }
    }

    private fun stopRecording(): String? {
        if (!isRecording) {
            Log.d(TAG, "Not recording, returning null")
            return null
        }

        timer?.cancel()
        timer = null

        val finalOutputFile = outputFile
        
        try {
            Log.d(TAG, "Stopping recording")
            
            try {
                mediaRecorder?.stop()
                Log.d(TAG, "MediaRecorder stopped successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping MediaRecorder: ${e.message}")
                e.printStackTrace()
            }
            
            try {
                mediaRecorder?.reset()
                mediaRecorder?.release()
                Log.d(TAG, "MediaRecorder released successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error releasing MediaRecorder: ${e.message}")
                e.printStackTrace()
            } finally {
                mediaRecorder = null
            }
            
            Thread.sleep(200)
            
            if (finalOutputFile != null) {
                val file = File(finalOutputFile)
                if (file.exists()) {
                    val fileSize = file.length()
                    Log.d(TAG, "Recorded file: $finalOutputFile, size: $fileSize bytes")

                    if (fileSize > 0) {
                        file.setReadable(true, false)
                        file.setWritable(true, false)
                        
                        try {
                            val validFile = validateAudioFile(file)
                            if (!validFile) {
                                Log.e(TAG, "File validation failed")
                                throw Exception("File validation failed")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "File validation error: ${e.message}")
                        }

                        sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_COMPLETED")
                            .putExtra("outputFile", finalOutputFile)
                            .putExtra("duration", currentRecordingTime))
                        Log.d(TAG, "RECORDING_COMPLETED event sent")
                        
                        resetRecordingState()
                        return finalOutputFile
                    } else {
                        Log.e(TAG, "Error: Recorded file has zero size")
                        file.delete()
                        resetRecordingState()
                        return null
                    }
                } else {
                    Log.e(TAG, "Error: Recorded file doesn't exist")
                    resetRecordingState()
                    return null
                }
            } else {
                Log.e(TAG, "Error: outputFile is null when stopping recording")
                resetRecordingState()
                return null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording: ${e.message}")
            e.printStackTrace()
            resetRecordingState()
            return null
        }
    }

    private fun validateAudioFile(file: File): Boolean {
        try {
            if (!file.exists() || file.length() == 0L) {
                Log.e(TAG, "File validation failed: File doesn't exist or is empty")
                return false
            }
            
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error validating audio file: ${e.message}")
            return false
        }
    }

    private fun resetRecordingState() {
        Log.d(TAG, "Resetando estado da gravação")

        isRecording = false
        isPaused = false
        outputFile = null
        currentRecordingTime = 0
        elapsedTimeBeforePause = 0
        recordingStartTime = 0

        sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
            .putExtra("isRecording", false)
            .putExtra("isPaused", false)
            .putExtra("currentTime", 0)
            .putExtra("outputFile", null as String?))

        Log.d(TAG, "Estado de gravação resetado com sucesso")
    }

    private fun startTimer() {
        timer?.cancel()
        timer = null
        
        timer = Timer()
        
        val startTimeMs = System.currentTimeMillis()
        
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                val elapsedSeconds = ((System.currentTimeMillis() - startTimeMs) / 1000).toInt()
                
                currentRecordingTime = elapsedTimeBeforePause + elapsedSeconds
                
                updateNotification()
                
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE")
                    .putExtra("currentTime", currentRecordingTime)
                    .putExtra("outputFile", outputFile))
            }
        }, 0, 1000)
    }
    
    private fun clearState() {
        isRecording = false
        isPaused = false
        outputFile = null
        currentRecordingTime = 0
        elapsedTimeBeforePause = 0
        
        sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
            .putExtra("isRecording", false)
            .putExtra("isPaused", false)
            .putExtra("currentTime", 0L)
            .putExtra("outputFile", null as String?))
            
        Log.d(TAG, "Estado completamente resetado")
    }

    private fun formatTime(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return String.format("%02d:%02d", mins, secs)
    }

    private fun updateNotification() {
        val formattedTime = formatTime(currentRecordingTime)
        
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val stopIntent = Intent(this, ForegroundAudioRecorderService::class.java)
        stopIntent.action = ACTION_STOP_RECORDING
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val pauseResumeIntent = Intent(this, ForegroundAudioRecorderService::class.java)
        if (isPaused) {
            pauseResumeIntent.action = ACTION_RESUME_RECORDING
        } else {
            pauseResumeIntent.action = ACTION_PAUSE_RECORDING
        }
        val pauseResumePendingIntent = PendingIntent.getService(
            this, 2, pauseResumeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(if (isPaused) "Gravação pausada" else "Gravação em andamento")
            .setContentText("Tempo: $formattedTime")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
        
        builder.addAction(
            android.R.drawable.ic_media_pause, 
            if (isPaused) "Continuar" else "Pausar", 
            pauseResumePendingIntent
        )
        
        builder.addAction(
            android.R.drawable.ic_media_previous,
            "Parar",
            stopPendingIntent
        )
        
        val notification = builder.build()
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Gravação de Áudio",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Canal para notificações de gravação de áudio"
                setSound(null, null)
                enableVibration(false)
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun clearNotification() {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        Log.d(TAG, "Notificação removida")
    }

    override fun onDestroy() {
        Log.d(TAG, "Serviço destruído")
        stopRecording()
        clearNotification()
        clearState()
        
        try {
            unregisterReceiver(broadcastReceiver)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao desregistrar receptor: ${e.message}")
        }
        
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "onTaskRemoved chamado")
        showNotification("Gravação continua em segundo plano")
        super.onTaskRemoved(rootIntent)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}