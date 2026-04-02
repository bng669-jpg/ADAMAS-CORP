import { Link, useLocation } from "wouter";
import { Activity, Target, Layers, History } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "SIMULATION", icon: Target },
    { href: "/results", label: "RESULTS", icon: Activity },
    { href: "/formations", label: "FORMATIONS", icon: Layers },
    { href: "/history", label: "HISTORY", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary selection:text-background dark">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col z-10 sticky top-0 md:h-screen shadow-lg">
        <div className="p-6 border-b border-border flex items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 border-2 border-primary bg-primary/10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <div className="w-2 h-2 bg-primary animate-pulse" />
            </div>
            <span className="text-2xl font-bold tracking-[0.2em] text-white group-hover:text-primary transition-colors glow-text">
              ADAMAS
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="flex-shrink-0">
                <div
                  className={`flex items-center gap-3 px-4 py-3 border transition-all duration-200 cursor-pointer text-sm tracking-widest font-medium ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary glow-border"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border hidden md:block">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            SYSTEM ONLINE
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative matrix-bg min-h-[100dvh]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0icmdiYSg1NywgMjU1LCAyMCwgMC4xKSIvPgo8L3N2Zz4=')] opacity-30 pointer-events-none" />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
