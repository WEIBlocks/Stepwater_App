package com.stepwater.service

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap

class StepWaterServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "StepWaterService"
    }

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to start service: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to stop service: ${e.message}", e)
        }
    }

    @ReactMethod
    fun updateWater(amountMl: Double, promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, StepWaterForegroundService::class.java).apply {
                action = StepWaterForegroundService.ACTION_UPDATE_WATER
                putExtra(StepWaterForegroundService.EXTRA_WATER_ML, amountMl)
            }
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to update water: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getCurrentSteps(promise: Promise) {
        try {
            val dataManager = StepWaterDataManager(reactApplicationContext)
            val steps = dataManager.getCurrentSteps()
            promise.resolve(steps.toDouble())
        } catch (e: Exception) {
            promise.reject("DATA_ERROR", "Failed to get steps: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getCurrentWater(promise: Promise) {
        try {
            val dataManager = StepWaterDataManager(reactApplicationContext)
            val water = dataManager.getCurrentWater()
            promise.resolve(water.toDouble())
        } catch (e: Exception) {
            promise.reject("DATA_ERROR", "Failed to get water: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            val isRunning = StepWaterForegroundService.isServiceRunning
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to check service status: ${e.message}", e)
        }
    }

    @ReactMethod
    fun setStepGoal(goal: Int, promise: Promise) {
        try {
            val context = reactApplicationContext
            StepWaterDataManager(context).setStepGoal(goal)
            // Trigger notification update
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to set step goal: ${e.message}", e)
        }
    }

    @ReactMethod
    fun setWaterGoal(goal: Int, promise: Promise) {
        try {
            val context = reactApplicationContext
            StepWaterDataManager(context).setWaterGoal(goal)
            // Trigger notification update
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to set water goal: ${e.message}", e)
        }
    }

    @ReactMethod
    fun setWaterUnit(unit: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            StepWaterDataManager(context).setWaterUnit(unit)
            // Trigger notification update
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to set water unit: ${e.message}", e)
        }
    }

    @ReactMethod
    fun resetAllData(promise: Promise) {
        try {
            val context = reactApplicationContext
            StepWaterDataManager(context).resetAllData()
            // Trigger notification update
            val intent = Intent(context, StepWaterForegroundService::class.java)
            context.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to reset data: ${e.message}", e)
        }
    }
}

