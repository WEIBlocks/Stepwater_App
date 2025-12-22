package com.stepwater.service

import android.content.Context
import android.content.SharedPreferences
import java.util.Calendar

class StepWaterDataManager(private val context: Context) {
    
    companion object {
        private const val PREFS_NAME = "stepwater_data"
        private const val KEY_STEPS = "current_steps"
        private const val KEY_WATER = "current_water"
        private const val KEY_STEP_GOAL = "step_goal"
        private const val KEY_WATER_GOAL = "water_goal"
        private const val KEY_WATER_UNIT = "water_unit"
        private const val KEY_BASELINE_STEPS = "baseline_steps"
        private const val KEY_LAST_RAW_STEPS = "last_raw_steps"
        private const val KEY_LAST_DATE = "last_date"
        
        private fun getTodayDateString(): String {
            val calendar = Calendar.getInstance()
            val year = calendar.get(Calendar.YEAR)
            val month = calendar.get(Calendar.MONTH) + 1
            val day = calendar.get(Calendar.DAY_OF_MONTH)
            return "$year-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}"
        }
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    fun getCurrentSteps(): Int {
        val today = getTodayDateString()
        val lastDate = prefs.getString(KEY_LAST_DATE, "")
        
        // Reset if new day
        if (lastDate != today) {
            resetDailyData()
            return 0
        }
        
        return prefs.getInt(KEY_STEPS, 0)
    }
    
    fun getCurrentWater(): Int {
        val today = getTodayDateString()
        val lastDate = prefs.getString(KEY_LAST_DATE, "")
        
        // Reset if new day
        if (lastDate != today) {
            resetDailyData()
            return 0
        }
        
        return prefs.getInt(KEY_WATER, 0)
    }
    
    fun updateSteps(steps: Int) {
        val today = getTodayDateString()
        prefs.edit().apply {
            putInt(KEY_STEPS, steps)
            putString(KEY_LAST_DATE, today)
            apply()
        }
    }
    
    fun updateWater(waterMl: Int) {
        val today = getTodayDateString()
        val currentWater = getCurrentWater()
        val newWater = currentWater + waterMl
        prefs.edit().apply {
            putInt(KEY_WATER, newWater)
            putString(KEY_LAST_DATE, today)
            apply()
        }
    }
    
    fun setWater(waterMl: Int) {
        val today = getTodayDateString()
        prefs.edit().apply {
            putInt(KEY_WATER, waterMl)
            putString(KEY_LAST_DATE, today)
            apply()
        }
    }
    
    fun getStepGoal(): Int {
        return prefs.getInt(KEY_STEP_GOAL, 10000)
    }
    
    fun setStepGoal(goal: Int) {
        prefs.edit().putInt(KEY_STEP_GOAL, goal).apply()
    }
    
    fun getWaterGoal(): Int {
        return prefs.getInt(KEY_WATER_GOAL, 2000)
    }
    
    fun setWaterGoal(goal: Int) {
        prefs.edit().putInt(KEY_WATER_GOAL, goal).apply()
    }
    
    fun getWaterUnit(): String {
        return prefs.getString(KEY_WATER_UNIT, "ml") ?: "ml"
    }
    
    fun setWaterUnit(unit: String) {
        prefs.edit().putString(KEY_WATER_UNIT, unit).apply()
    }
    
    fun getBaselineSteps(): Long {
        return prefs.getLong(KEY_BASELINE_STEPS, 0L)
    }
    
    fun saveBaselineSteps(baseline: Long) {
        prefs.edit().putLong(KEY_BASELINE_STEPS, baseline).apply()
    }
    
    fun getLastRawSteps(): Long {
        return prefs.getLong(KEY_LAST_RAW_STEPS, 0L)
    }
    
    fun saveLastRawSteps(steps: Long) {
        prefs.edit().putLong(KEY_LAST_RAW_STEPS, steps).apply()
    }
    
    private fun resetDailyData() {
        val today = getTodayDateString()
        prefs.edit().apply {
            putInt(KEY_STEPS, 0)
            putInt(KEY_WATER, 0)
            putString(KEY_LAST_DATE, today)
            // Don't reset baseline - it persists across days
            apply()
        }
    }
    
    fun resetAllData() {
        val today = getTodayDateString()
        prefs.edit().apply {
            putInt(KEY_STEPS, 0)
            putInt(KEY_WATER, 0)
            putString(KEY_LAST_DATE, today)
            // Reset goals to defaults
            putInt(KEY_STEP_GOAL, 10000)
            putInt(KEY_WATER_GOAL, 2000)
            putString(KEY_WATER_UNIT, "ml")
            // Don't reset baseline - it's device-specific and should persist
            apply()
        }
    }
}






