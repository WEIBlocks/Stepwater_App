package com.stepwater.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class StepWaterForegroundService : Service(), SensorEventListener {
    
    companion object {
        const val ACTION_UPDATE_WATER = "com.stepwater.service.UPDATE_WATER"
        const val EXTRA_WATER_ML = "water_ml"
        const val NOTIFICATION_ID = 1001
        const val NOTIFICATION_CHANNEL_ID = "stepwater_foreground_channel"
        const val NOTIFICATION_CHANNEL_NAME = "Step & Water Tracker"
        
        @Volatile
        var isServiceRunning: Boolean = false
            private set
    }
    
    private lateinit var sensorManager: SensorManager
    private var stepCounterSensor: Sensor? = null
    private var dataManager: StepWaterDataManager? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var lastRawSteps: Long = 0
    private var baselineSteps: Long = 0
    
    override fun onCreate() {
        super.onCreate()
        dataManager = StepWaterDataManager(this)
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        
        // Acquire wake lock to keep service running
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StepWaterService::WakeLock").apply {
            acquire(10 * 60 * 1000L /*10 minutes*/)
        }
        
        createNotificationChannel()
        initializeStepCounter()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE_WATER -> {
                val waterMl = intent.getDoubleExtra(EXTRA_WATER_ML, 0.0).toInt()
                dataManager?.updateWater(waterMl)
                updateNotification()
            }
            else -> {
                // Start as foreground service
                startForeground(NOTIFICATION_ID, createNotification())
                isServiceRunning = true
            }
        }
        
        return START_STICKY // Restart if killed
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        if (::sensorManager.isInitialized) {
            try {
                sensorManager.unregisterListener(this)
            } catch (e: Exception) {
                // Ignore if already unregistered
            }
        }
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks your daily steps and water intake"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun formatNumber(value: Int): String {
        return value.toString().reversed().chunked(3).joinToString(",").reversed()
    }
    
    private fun createNotification(): Notification {
        val steps = dataManager?.getCurrentSteps() ?: 0
        val stepGoal = dataManager?.getStepGoal() ?: 10000
        val water = dataManager?.getCurrentWater() ?: 0
        val waterGoal = dataManager?.getWaterGoal() ?: 2000
        val waterUnit = dataManager?.getWaterUnit() ?: "ml"
        
        // Convert water to display unit
        var waterDisplay = water
        var waterGoalDisplay = waterGoal
        if (waterUnit == "oz") {
            waterDisplay = Math.round(water / 29.5735).toInt()
            waterGoalDisplay = Math.round(waterGoal / 29.5735).toInt()
        }
        
        // Format notification body - compact format to fit both on screen
        // Format: "🚶 595 / 10,000  |  💧 500 / 2,000 ml"
        val formattedStepsCurrent = formatNumber(steps)
        val formattedStepsGoal = formatNumber(stepGoal)
        val formattedWaterCurrent = formatNumber(waterDisplay)
        val formattedWaterGoal = formatNumber(waterGoalDisplay)
        val unitText = if (waterUnit.isNotEmpty()) " $waterUnit" else ""
        
        val body = "🚶 $formattedStepsCurrent / $formattedStepsGoal  |  💧 $formattedWaterCurrent / $formattedWaterGoal$unitText"
        
        // Create pending intent to open app (optional - you may need to adjust the main activity class)
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // API 31+ requires FLAG_IMMUTABLE or FLAG_MUTABLE
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(this, 0, launchIntent, pendingIntentFlags)
        } else {
            null
        }
        
        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Step & Water Tracker")
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // You may want to replace with a custom icon
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        
        pendingIntent?.let {
            builder.setContentIntent(it)
        }
        
        return builder.build()
    }
    
    private fun updateNotification() {
        val notification = createNotification()
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun initializeStepCounter() {
        stepCounterSensor?.let { sensor ->
            sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
            
            // Initialize baseline if first time
            baselineSteps = dataManager?.getBaselineSteps() ?: 0L
            lastRawSteps = dataManager?.getLastRawSteps() ?: 0L
            
            if (baselineSteps == 0L && lastRawSteps == 0L) {
                // Will be set on first sensor event
            }
        } ?: run {
            // Step counter not available on this device
            updateNotification()
        }
    }
    
    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_STEP_COUNTER && event.values.isNotEmpty()) {
            try {
                val currentRawSteps = event.values[0].toLong()
                
                // Initialize baseline on first reading
                if (baselineSteps == 0L) {
                    baselineSteps = currentRawSteps
                    dataManager?.saveBaselineSteps(baselineSteps)
                    lastRawSteps = currentRawSteps
                    dataManager?.saveLastRawSteps(lastRawSteps)
                    dataManager?.updateSteps(0)
                } else {
                    // Calculate steps since last reading
                    val stepsSinceLastReading = (currentRawSteps - lastRawSteps).toInt()
                    
                    if (stepsSinceLastReading > 0) {
                        val currentSteps = dataManager?.getCurrentSteps() ?: 0
                        val newSteps = currentSteps + stepsSinceLastReading
                        dataManager?.updateSteps(newSteps)
                        updateNotification()
                    }
                    
                    lastRawSteps = currentRawSteps
                    dataManager?.saveLastRawSteps(lastRawSteps)
                }
            } catch (e: Exception) {
                // Handle any errors gracefully to prevent crashes
                // Log error but don't crash the service
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not needed for step counter
    }
}
