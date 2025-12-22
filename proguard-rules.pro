# ProGuard rules for Step & Water App
# These rules prevent code obfuscation issues in production builds

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }

# Keep React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Keep React Navigation
-keep class com.reactnavigation.** { *; }

# Keep AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep Supabase (if used)
-keep class io.supabase.** { *; }

# Keep notification classes
-keep class expo.modules.notifications.** { *; }

# Keep sensor classes
-keep class expo.modules.sensors.** { *; }

# Keep all native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep custom exceptions
-keep public class * extends java.lang.Exception

# Keep annotation default values
-keepattributes AnnotationDefault

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep generic signatures
-keepattributes Signature

# Keep inner classes
-keepattributes InnerClasses

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep foreground service classes
-keep class * extends android.app.Service {
    public <init>();
}

# Keep notification channel classes
-keep class * extends android.app.NotificationChannel { *; }

# Keep UUID classes
-keep class java.util.UUID { *; }

# Keep date-fns classes (if bundled)
-keep class date.fns.** { *; }

# Keep Lottie classes
-keep class com.airbnb.lottie.** { *; }

# Keep SVG classes
-keep class com.horcrux.svg.** { *; }

# Don't warn about missing classes (some are optional)
-dontwarn io.supabase.**
-dontwarn com.facebook.react.**
-dontwarn expo.modules.**

# Optimization settings
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# Remove logging in production (optional)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}






