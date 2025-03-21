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
    private var currentRecordingTime: Long = 0 // Tempo em segundos
    
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
        
        // Registrar o receptor
        val filter = IntentFilter("com.thiagolins.vocalizeai.REQUEST_OUTPUT_FILE")
        registerReceiver(broadcastReceiver, filter)
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
        
        // Retorna START_STICKY para garantir que o serviço seja reiniciado se for morto pelo sistema
        return START_STICKY
    }
    
    private fun showNotification(contentText: String) {
        // Criar Intent para abrir o app quando a notificação for clicada
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
            wakeLock?.acquire(30*60*1000L) // 30 minutos
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao adquirir WakeLock: ${e.message}")
        }
    }

    private fun startRecording() {
        if (isRecording) {
            Log.d(TAG, "Já está gravando, ignorando startRecording")
            return
        }

        try {
            Log.d(TAG, "Iniciando gravação, tempo decorrido: $elapsedTimeBeforePause")

            val soundDir = getExternalFilesDir(Environment.DIRECTORY_MUSIC)
            if (soundDir != null && !soundDir.exists()) {
                soundDir.mkdirs()
            }

            // Create a new file only if we don't have an existing one from a paused recording
            if (outputFile == null) {
                val fileName = "recording_${System.currentTimeMillis()}.m4a"
                val file = File(soundDir, fileName)
                outputFile = file.absolutePath
                Log.d(TAG, "Novo arquivo criado: $outputFile")
            } else {
                Log.d(TAG, "Continuando gravação no arquivo existente: $outputFile")
            }

            sendBroadcast(Intent("com.thiagolins.vocalizeai.OUTPUT_FILE_SET")
                .putExtra("outputFile", outputFile))

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
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
                setOutputFile(outputFile)
                prepare()
                start()
            }

            isRecording = true
            isPaused = false
            recordingStartTime = System.currentTimeMillis()
            currentRecordingTime = elapsedTimeBeforePause

            startTimer()

            sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                .putExtra("isRecording", true)
                .putExtra("isPaused", false)
                .putExtra("outputFile", outputFile)
                .putExtra("currentTime", currentRecordingTime))

            Log.d(TAG, "Gravação iniciada com sucesso")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar gravação: ${e.message}")
            e.printStackTrace()
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
                
                // Atualizar o tempo decorrido total
                elapsedTimeBeforePause = currentRecordingTime
                
                // Transmitir status para o React Native
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                    .putExtra("isRecording", isRecording)
                    .putExtra("isPaused", true)
                    .putExtra("outputFile", outputFile)
                    .putExtra("currentTime", currentRecordingTime))
                    
                Log.d(TAG, "Gravação pausada com sucesso")
            } else {
                // Em versões antigas, temos que parar a gravação
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
                
                // Transmitir status para o React Native
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_STATUS")
                    .putExtra("isRecording", true)
                    .putExtra("isPaused", false)
                    .putExtra("outputFile", outputFile)
                    .putExtra("currentTime", currentRecordingTime))
                    
                Log.d(TAG, "Gravação retomada com sucesso")
            } else {
                // Em versões antigas, precisamos iniciar uma nova gravação
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
            Log.d(TAG, "stopRecording: não está gravando, retornando null")
            return null
        }

        try {
            Log.d(TAG, "Parando gravação")
            timer?.cancel()
            timer = null

            val finalOutputFile = outputFile

            try {
                mediaRecorder?.apply {
                try {
                    stop()
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao parar MediaRecorder: ${e.message}")
                    e.printStackTrace()
                }
                  reset() // Add explicit reset call
                  release()
                }
                Log.d(TAG, "Gravação finalizada corretamente")
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao parar MediaRecorder: ${e.message}")
                e.printStackTrace()
            } finally {
                mediaRecorder = null
            }

            Thread.sleep(100)

            if (finalOutputFile != null) {
                val file = File(finalOutputFile)
                if (file.exists()) {
                    val fileSize = file.length()
                    Log.d(TAG, "Arquivo gravado: $finalOutputFile, tamanho: $fileSize bytes")

                    if (fileSize > 0) {
                        file.setReadable(true, false)
                        file.setWritable(true, false)

                        // Enviar evento de gravação concluída
                        sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_COMPLETED")
                            .putExtra("outputFile", finalOutputFile)
                            .putExtra("duration", currentRecordingTime))

                        Log.d(TAG, "Evento RECORDING_COMPLETED enviado")
                        resetRecordingState()
                        return finalOutputFile
                    } else {
                        Log.e(TAG, "Erro: Arquivo gravado tem tamanho zero")
                        resetRecordingState()
                        return null
                    }
                } else {
                    Log.e(TAG, "Erro: Arquivo gravado não existe")
                    resetRecordingState()
                    return null
                }
            } else {
                Log.e(TAG, "Erro: outputFile é null ao parar gravação")
                resetRecordingState()
                return null
            }

            // 🔄 **Resetar o estado completamente**
            resetRecordingState()

            return finalOutputFile
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parar gravação: ${e.message}")
            e.printStackTrace()
            resetRecordingState()
            return null
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
        timer = Timer()
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                currentRecordingTime++
                updateNotification()
                
                // Enviar atualização de tempo a cada segundo para garantir sincronização constante
                sendBroadcast(Intent("com.thiagolins.vocalizeai.RECORDING_TIME_UPDATE")
                    .putExtra("currentTime", currentRecordingTime)
                    .putExtra("outputFile", outputFile)) // Adicione o outputFile a cada atualização de tempo
                
                // Log para debug
                Log.d(TAG, "Timer atualizado: tempo=$currentRecordingTime, arquivo=$outputFile")
            }
        }, 0, 1000)
    }
    
    private fun clearState() {
        // Método auxiliar para limpar todos os estados
        isRecording = false
        isPaused = false
        outputFile = null
        currentRecordingTime = 0
        elapsedTimeBeforePause = 0
        
        // Informar clientes sobre a limpeza de estado
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
        
        // Criar Intent para abrir o app quando a notificação for clicada
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Criar Intent para parar gravação quando o botão for clicado
        val stopIntent = Intent(this, ForegroundAudioRecorderService::class.java)
        stopIntent.action = ACTION_STOP_RECORDING
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Criar Intent para pausar/continuar gravação
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
        
        // Construir a notificação com botões
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(if (isPaused) "Gravação pausada" else "Gravação em andamento")
            .setContentText("Tempo: $formattedTime")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
        
        // Adicionar botão para pausar/continuar
        builder.addAction(
            android.R.drawable.ic_media_pause, 
            if (isPaused) "Continuar" else "Pausar", 
            pauseResumePendingIntent
        )
        
        // Adicionar botão para parar
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
        // Remove a notificação quando o serviço for destruído
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        Log.d(TAG, "Notificação removida")
    }

    override fun onDestroy() {
        Log.d(TAG, "Serviço destruído")
        stopRecording()
        clearNotification()
        clearState() // Garantir que tudo está limpo
        
        // Desregistrar o receptor
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
        // Não pare o serviço, apenas atualize a notificação
        showNotification("Gravação continua em segundo plano")
        super.onTaskRemoved(rootIntent)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}