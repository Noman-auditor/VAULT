import { Download, Smartphone, Package, Terminal, CheckCircle } from 'lucide-react';
import { GlassCard, ScreenHeader } from '../components';

const STEPS = [
  { num: 1, title: 'Push to GitHub', desc: 'Fork or push this repository to your GitHub account' },
  { num: 2, title: 'Go to Actions', desc: 'Navigate to the "Actions" tab in your repository' },
  { num: 3, title: 'Run Workflow', desc: 'Click "Build Nora Tunnel APK" → "Run workflow"' },
  { num: 4, title: 'Wait for Build', desc: 'Build takes approximately 3-5 minutes' },
  { num: 5, title: 'Download APK', desc: 'Download "nora-tunnel-debug" artifact from the completed run' },
  { num: 6, title: 'Install on Device', desc: 'Transfer APK to Android device and install' },
];

export function BuildInfoScreen() {
  return (
    <div className="animate-fade-in">
      <ScreenHeader title="Build APK" subtitle="Create Android APK via GitHub Actions" />

      {/* App Info */}
      <GlassCard accent="accent" className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl glass-accent flex items-center justify-center">
            <Package size={24} className="text-nora-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-nora-text">NORA TUNNEL</h2>
            <p className="text-xs text-nora-text-tertiary">com.nora.tunnel • v1.0.0</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone size={12} className="text-nora-accent" />
            <span className="text-nora-text-secondary">Android 10+ (API 29+)</span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={12} className="text-nora-accent" />
            <span className="text-nora-text-secondary">ARM64 / ARM</span>
          </div>
        </div>
      </GlassCard>

      {/* GitHub Actions Steps */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-nora-text-tertiary" />
          <span className="text-xs font-semibold text-nora-text-tertiary uppercase tracking-wider">
            GitHub Actions Build
          </span>
        </div>

        <div className="space-y-2">
          {STEPS.map(step => (
            <GlassCard key={step.num} hover className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full glass-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-nora-accent">{step.num}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-nora-text">{step.title}</p>
                  <p className="text-xs text-nora-text-tertiary mt-0.5">{step.desc}</p>
                </div>
                <CheckCircle size={14} className="text-nora-text-tertiary/30" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={16} className="text-nora-text-tertiary" />
          <span className="text-xs font-semibold text-nora-text-tertiary uppercase tracking-wider">
            Local Build (Requires Android SDK)
          </span>
        </div>

        <GlassCard className="p-4 font-mono text-xs">
          <div className="space-y-2 text-nora-text-secondary">
            <p className="text-nora-text-tertiary"># Install dependencies</p>
            <p className="text-nora-accent">npm install</p>
            <p className="mt-2 text-nora-text-tertiary"># Build web app</p>
            <p className="text-nora-accent">npm run build</p>
            <p className="mt-2 text-nora-text-tertiary"># Sync Capacitor</p>
            <p className="text-nora-accent">npx cap sync android</p>
            <p className="mt-2 text-nora-text-tertiary"># Build APK</p>
            <p className="text-nora-accent">cd android && ./gradlew assembleDebug</p>
            <p className="mt-2 text-nora-text-tertiary"># APK location:</p>
            <p className="text-nora-text-tertiary">android/app/build/outputs/apk/debug/app-debug.apk</p>
          </div>
        </GlassCard>
      </div>

      {/* APK Output */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Download size={16} className="text-nora-text-tertiary" />
          <span className="text-xs font-semibold text-nora-text-tertiary uppercase tracking-wider">
            Build Artifacts
          </span>
        </div>

        <div className="space-y-2">
          <GlassCard hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-accent flex items-center justify-center">
                <Download size={18} className="text-nora-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-nora-text">Debug APK</p>
                <p className="text-xs text-nora-text-tertiary">app-debug.apk • Debuggable, signed with debug key</p>
              </div>
              <Chip color="accent">Debug</Chip>
            </div>
          </GlassCard>

          <GlassCard hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-purple flex items-center justify-center">
                <Download size={18} className="text-nora-purple" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-nora-text">Release APK</p>
                <p className="text-xs text-nora-text-tertiary">app-release-unsigned.apk • Minified, requires signing</p>
              </div>
              <Chip color="default">Release</Chip>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Tech Stack */}
      <GlassCard className="p-4 mb-4">
        <p className="text-xs font-semibold text-nora-text-tertiary uppercase tracking-wider mb-3">Tech Stack</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-nora-text-secondary">
          <span>React 19 + Vite 7</span>
          <span>Tailwind CSS 4</span>
          <span>Capacitor 6</span>
          <span>TypeScript 5</span>
          <span>Android SDK 34</span>
          <span>Gradle 8.5</span>
          <span>Java 17</span>
          <span>Min SDK 29</span>
        </div>
      </GlassCard>

      {/* Notice */}
      <GlassCard accent="warning" className="p-4">
        <p className="text-xs text-yellow-400/80 leading-relaxed">
          ⚠️ This builds the UI shell as an Android APK. Real VPN/tunnel functionality requires integrating native cores (WireGuard, Xray, sing-box) as additional Android library modules.
        </p>
      </GlassCard>
    </div>
  );
}

function Chip({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'accent' | 'error' | 'warning' }) {
  const bgClass = color === 'accent' ? 'bg-nora-accent-dim text-nora-accent'
    : color === 'error' ? 'bg-red-500/15 text-red-400'
    : color === 'warning' ? 'bg-yellow-500/15 text-yellow-400'
    : 'bg-white/5 text-nora-text-secondary';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${bgClass}`}>
      {children}
    </span>
  );
}
