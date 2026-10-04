#!/bin/bash
# ============================================================
# NORA TUNNEL — APK Build Script
# ============================================================

set -e

echo ""
echo "🛡️  NORA TUNNEL — APK Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "  ✅ Java: $JAVA_VERSION"
else
    echo "  ❌ Java 17 not found. Install from https://adoptium.net"
    exit 1
fi

# Android SDK
if [ -n "$ANDROID_HOME" ]; then
    echo "  ✅ Android SDK: $ANDROID_HOME"
else
    echo "  ⚠️  ANDROID_HOME not set. Set it to your Android SDK path."
    echo "     Example: export ANDROID_HOME=\$HOME/Android/Sdk"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🌐 Building web app..."
npm run build

echo ""
echo "📱 Syncing Capacitor..."
npx cap sync android
npx cap copy android

echo ""
echo "🔨 Building APK..."
cd android
chmod +x gradlew 2>/dev/null || true

if [ "$1" = "release" ]; then
    echo "  Building RELEASE APK..."
    ./gradlew assembleRelease --no-daemon
    APK="app/build/outputs/apk/release/app-release-unsigned.apk"
else
    echo "  Building DEBUG APK..."
    ./gradlew assembleDebug --no-daemon
    APK="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ APK Build Complete!"
echo ""
echo "📱 APK: android/$APK"
echo ""

if [ -f "android/$APK" ]; then
    SIZE=$(du -h "android/$APK" | cut -f1)
    echo "📊 Size: $SIZE"
    echo ""
    echo "📲 Install:"
    echo "  1. Transfer APK to your Android device"
    echo "  2. Enable 'Install from unknown sources'"
    echo "  3. Install the APK"
else
    echo "⚠️  APK file not found at expected location"
fi

echo ""
