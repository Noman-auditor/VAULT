# 🛡️ NORA TUNNEL

**Secure. Private. Connected.**

Advanced Android Tunnel, VPN & Network Workspace

---

## 📦 APK Build — GitHub Actions

### Step-by-Step:

1. **Fork or push this repository to GitHub**

2. **Go to your repository on GitHub**

3. **Click "Actions" tab**

4. **Click "Build Nora Tunnel APK" workflow**

5. **Click "Run workflow" → "Run workflow" button**

6. **Wait for the build to complete (≈3-5 minutes)**

7. **Click the completed workflow run**

8. **Scroll down to "Artifacts" section**

9. **Download `nora-tunnel-debug` or `nora-tunnel-release`**

10. **Install APK on your Android device**

### Auto Build:
- Every push to `main` or `master` branch triggers automatic APK build
- APKs are available as downloadable artifacts in the Actions tab

---

## 🔧 Local Build (Requires Android SDK)

### Prerequisites:
- Node.js 20+
- Java 17
- Android SDK (API 34)
- Android Build Tools 34.0.0

### Commands:
```bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync Capacitor (first time)
npx cap sync android

# Copy web assets
npx cap copy android

# Build APK
cd android
chmod +x gradlew
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 About This App

NORA TUNNEL is a professional-grade VPN/tunnel client designed for Android.

### Features:
- 🛡️ Multi-protocol support (WireGuard, OpenVPN, IKEv2, VLESS, VMess, Trojan, etc.)
- 🔌 Protocol/Core/Transport separation with capability validation
- 📋 Unlimited local profiles with import/export
- 🧭 Advanced routing studio with rule-based routing
- 🔬 Network Lab with diagnostic tools
- 📊 Live traffic statistics and dashboard
- 🔒 Security Center with real status reporting
- 📝 Log center with automatic secret redaction
- ⚙️ Comprehensive settings

### Design:
- Nora Dark Glass glassmorphism theme
- Material 3 design language
- Phone-optimized layout
- Accessibility-first approach

### Architecture:
```
Compose UI → ViewModel → UseCase → Repository → TunnelManager → Core Adapter → VpnService → Network
```

### Package:
- **App ID:** `com.nora.tunnel`
- **Target:** Android 10+ (API 29+)
- **Architecture:** ARM64 / ARM-compatible

---

## ⚠️ Important Notes

This is the **UI prototype and framework** for Nora Tunnel. The interactive web interface demonstrates:

- Complete connection state machine
- Profile management with protocol/core/transport capability validation
- Routing studio with rule-based routing
- Network diagnostics architecture
- Security center with honest status reporting
- Log system with secret redaction

**Real tunnel functionality** requires native Android core integration:
- WireGuard Go library
- Xray-core / sing-box
- OpenVPN3
- StrongSwan (IKEv2)

These cores are **not included** in this build and must be integrated separately for actual VPN/tunnel operation.

---

## 📄 License

Private project — All rights reserved.
