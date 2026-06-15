import { Sparkles, BookOpen, Brain, Trophy, Users } from "lucide-react";

const features = [
  { icon: BookOpen, text: "100+ AI-curated courses" },
  { icon: Brain,    text: "Smart quiz feedback" },
  { icon: Trophy,   text: "Track your progress" },
  { icon: Users,    text: "Live discussion forums" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand art ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: "var(--sidebar)" }}
      >
        {/* Mesh gradient orbs */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[55%] aspect-square rounded-full blur-[80px] opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[5%] right-[-10%] w-[50%] aspect-square rounded-full blur-[90px] opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[40%] aspect-square rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-glow-sm"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ThinkBloom</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "rgba(167,139,250,0.80)" }}>
                AI-Powered LMS
              </p>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Learn smarter,<br />
                <span className="gradient-text">grow faster.</span>
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Personalized courses, real-time AI feedback, and a community built to help you level up every day.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.35)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "rgba(167,139,250,0.90)" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tagline */}
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2025 ThinkBloom. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto"
        style={{ background: "var(--background)" }}
      >
        {/* Mobile logo — only visible on small screens */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">ThinkBloom</span>
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
}
