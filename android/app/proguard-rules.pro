# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-dontwarn com.getcapacitor.**
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
