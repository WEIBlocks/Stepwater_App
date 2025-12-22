package com.stepwater.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Restart the service after device reboot
            val serviceIntent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}






