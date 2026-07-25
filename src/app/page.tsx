import Link from "next/link";
import { Users, PartyPopper, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary opacity-20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary opacity-20 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex flex-col items-center z-10 w-full max-w-md">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-sm font-display text-center">
          Friendlly<span className="text-primary">Fire</span>
        </h1>
        <p className="text-lg text-gray-300 mb-12 text-center max-w-sm">
          A modern Truth-or-Dare party game. No accounts, no rules, just fun.
        </p>

        <div className="flex flex-col gap-4 w-full">
          <ModeCard
            href="/create?mode=local"
            title="Local Mode"
            description="One device, pass it around. Classic bottle spin."
            icon={<Users className="w-8 h-8 text-primary" />}
            color="border-primary"
          />
          <ModeCard
            href="/create?mode=party"
            title="Party Mode"
            description="Same room, multiple devices. Anonymous Question Bank."
            icon={<PartyPopper className="w-8 h-8 text-secondary" />}
            color="border-secondary"
          />
          <ModeCard
            href="/create?mode=online"
            title="Online Mode"
            description="Play remotely. Voice truths and photo proof for dares."
            icon={<Globe className="w-8 h-8 text-accent" />}
            color="border-accent"
          />
        </div>
        
        <div className="mt-12 w-full pt-8 border-t border-white/10 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-4">Have a room code?</p>
          <Link 
            href="/join"
            className="w-full text-center py-4 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
          >
            Join Existing Game
          </Link>
        </div>
      </main>
    </div>
  );
}

function ModeCard({ href, title, description, icon, color }: { href: string; title: string; description: string; icon: React.ReactNode; color: string }) {
  return (
    <Link href={href} className="group outline-none">
      <div className={`glass-panel-interactive flex items-center p-5 rounded-2xl border-l-4 ${color}`}>
        <div className="mr-5 p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          <p className="text-sm text-gray-400 leading-tight">{description}</p>
        </div>
      </div>
    </Link>
  );
}
