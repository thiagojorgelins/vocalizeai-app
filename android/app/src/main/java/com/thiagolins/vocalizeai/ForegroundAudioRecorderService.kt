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
                sendBroadcast(Intent("com.thiagolins.vocalizeai.OUTPUT_FILE_SET")
                    .putExtra("outputFile", outputFile))
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
        
        val filter = IntentFilter("com.thiagolins.vocalizeai.REQUEST_OUTPUT_FILE")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(broadcastReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(broadcastReceiver, filter)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
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
            return
        }

        try {
            currentRecordingTime = elapsedTimeBeforePause
            
            val soundDir = File(applicationContext.filesDir, "audiorecordings")
            if (!soundDir.exists()) {
                soundDir.mkdirs()
            }

            soundDir.setReadable(true, false)
            soundDir.setWritable(true, false)
            soundDir.setExecutable(true, false)

            val fileName = "recording_${System.currentTimeMillis()}.m4a"
            val file = File(soundDir, fileName)
            outputFile = file.absolutePath
            
            sendBroadcast(Intent("com.thiagolins.vocalizeai.OUTPUT_FILE_SET")
                .putExtra("outputFile", outputFile))

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            mediaRecorder?.apply {
                try {
                    try {
                        setAudioSource(MediaRecorder.AudioSource.MIC)
                    } catch (e: Exception) {
                        setAudioSource(MediaRecorder.AudioSource.CAMCORDER)
                    }
                    
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
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao configurar MediaRecorder: ${e.message}")
                    throw e
                }
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
        } catch (e: Exception) {
            Log.e(TAG, "Error starting recording: ${e.message}")
            
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
            } else {
                stopRecording()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao pausar gravação: ${e.message}")
        }
    }

    private fun resumeRecording() {
        if (!isRecording || !isPaused) return

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                mediaRecorder?.resume()
                isPaused = false
                startTimer()
                
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                    .putExtra("isRecording", true)
                    .putExtra("isPaused", false)
                    .putExtra("outputFile", outputFile)
                    .putExtra("currentTime", currentRecordingTime))
            } else {
                startRecording()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao retomar gravação: ${e.message}")
        }
    }

    private fun stopRecording(): String? {
        if (!isRecording) {
            return null
        }

        timer?.cancel()
        timer = null

        val finalOutputFile = outputFile
        
        try {
            try {
                mediaRecorder?.stop()
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping MediaRecorder: ${e.message}")
            }
            
            try {
                mediaRecorder?.reset()
                mediaRecorder?.release()
            } catch (e: Exception) {
                Log.e(TAG, "Error releasing MediaRecorder: ${e.message}")
            } finally {
                mediaRecorder = null
            }
            
            Thread.sleep(500)
            
            if (finalOutputFile != null) {
                val file = File(finalOutputFile)
                
                if (file.exists()) {
                    val fileSize = file.length()

                    if (fileSize > 0) {
                        file.setReadable(true, false)
                        file.setWritable(true, false)
                        
                        try {
                            val cacheDir = applicationContext.filesDir
                            val accessibleFile = File(cacheDir, "latest_recording_${System.currentTimeMillis()}.m4a")
                            
                            file.inputStream().use { input ->
                                accessibleFile.outputStream().use { output ->
                                    input.copyTo(output)
                                }
                            }
                            
                            accessibleFile.setReadable(true, false)
                            accessibleFile.setWritable(true, false)
                            
                            for (i in 0..2) {
                                try {
                                    val intent = Intent("com.thiagolins.vocalizeai.RECORDING_COMPLETED")
                                        .putExtra("outputFile", accessibleFile.absolutePath)
                                        .putExtra("originalFile", finalOutputFile)
                                        .putExtra("duration", currentRecordingTime)
                                    
                                    intent.setPackage(packageName)
                                    sendBroadcast(intent)
                                    
                                    Thread.sleep(100)
                                } catch (e: Exception) {
                                    Log.e(TAG, "Erro ao enviar broadcast na tentativa ${i+1}: ${e.message}")
                                }
                            }
                            
                            resetRecordingState(accessibleFile.absolutePath)
                            return accessibleFile.absolutePath
                        } catch (e: Exception) {
                            Log.e(TAG, "Erro ao tornar arquivo acessível: ${e.message}")
                            
                            sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_COMPLETED")
                                .putExtra("outputFile", finalOutputFile)
                                .putExtra("duration", currentRecordingTime))
                            
                            resetRecordingState(finalOutputFile)
                            return finalOutputFile
                        }
                    } else {
                        file.delete()
                        resetRecordingState(null)
                        return null
                    }
                } else {
                    resetRecordingState(null)
                    return null
                }
            } else {
                resetRecordingState(null)
                return null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording: ${e.message}")
            resetRecordingState(null)
            return null
        }
    }

    private fun validateAudioFile(file: File): Boolean {
        try {
            if (!file.exists() || file.length() == 0L) {
                return false
            }
            
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error validating audio file: ${e.message}")
            return false
        }
    }

    private fun resetRecordingState(finalOutputFile: String? = null) {
        isRecording = false
        isPaused = false
        outputFile = finalOutputFile
        currentRecordingTime = 0
        elapsedTimeBeforePause = 0
        recordingStartTime = 0

        sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
            .putExtra("isRecording", false)
            .putExtra("isPaused", false)
            .putExtra("currentTime", 0)
            .putExtra("outputFile", finalOutputFile))
    }

    private fun startTimer() {
        timer?.cancel()
        timer = null
        
        timer = Timer()
        var lastFileSize = 0L

        val startTimeMs = System.currentTimeMillis()
        
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                try {
                    val elapsedSeconds = ((System.currentTimeMillis() - startTimeMs) / 1000).toInt()
                    
                    currentRecordingTime = elapsedTimeBeforePause + elapsedSeconds
                    
                    updateNotification()
                    
                    sendTimeUpdateBroadcast()
                } catch (e: Exception) {
                    Log.e(TAG, "Erro no timer: ${e.message}")
                }
            }
        }, 0, 1000)
    }

    private fun sendTimeUpdateBroadcast() {
        try {
            val intent = Intent("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE")
            intent.putExtra("currentTime", currentRecordingTime)
            intent.putExtra("outputFile", outputFile)
            intent.setPackage(packageName)
            
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar broadcast de tempo: ${e.message}")
        }
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
          .setPriority(NotificationCompat.PRIORITY_LOW)
          .setOngoing(true)
          .setOnlyAlertOnce(true) 

        
        builder.addAction(
            android.R.drawable.ic_media_pause, 
            if (isPaused) "Continuar" else "Pausar", 
            pauseResumePendingIntent
        )
        
        builder.addAction(
            android.R.drawable.ic_media_previous,
            "Cancelar",
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
    }

    override fun onDestroy() {
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
        showNotification("Gravação continua em segundo plano")
        super.onTaskRemoved(rootIntent)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}