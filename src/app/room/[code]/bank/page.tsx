"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { usePartyStore } from "@/store/usePartyStore";
import { ArrowLeft, Check, X, Send } from "lucide-react";

export default function BankPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  const { myPlayerId } = usePartyStore();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  
  const [text, setText] = useState("");
  const [type, setType] = useState<"truth" | "dare">("truth");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/players/${code}`).then(res => res.json()).then(data => setPlayers(data.players));
    fetchEntries();
  }, [code]);

  const fetchEntries = () => {
    fetch(`/api/bank?roomId=${code}`).then(res => res.json()).then(data => setEntries(data.entries));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: code,
          type,
          text,
          authorPlayerId: myPlayerId,
          isAnonymous,
          visibility: "everyone"
        })
      });
      setText("");
      fetchEntries();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    await fetch(`/api/bank/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved })
    });
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/bank/${id}`, { method: 'DELETE' });
    fetchEntries();
  };

  const me = players.find(p => p._id === myPlayerId);
  const isHost = me?.isHost;

  return (
    <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold font-display">Question Bank</h1>
      </div>

      <div className="glass-panel p-6 rounded-3xl mb-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              type="button" 
              onClick={() => setType("truth")}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${type === 'truth' ? 'bg-secondary text-dark' : 'text-gray-400'}`}
            >
              Truth
            </button>
            <button 
              type="button" 
              onClick={() => setType("dare")}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${type === 'dare' ? 'bg-primary text-white' : 'text-gray-400'}`}
            >
              Dare
            </button>
          </div>

          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Enter your ${type}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 resize-none h-24"
            maxLength={200}
          />
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded accent-primary bg-white/10 border-white/20" 
              />
              Submit anonymously
            </label>
            <button 
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="px-6 py-2 rounded-full font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Submit"}
              {!isSubmitting && <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <h2 className="text-xl font-bold text-white mb-2">Submitted ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No entries yet. Be the first!</p>
        ) : (
          entries.map(entry => (
            <div key={entry._id} className="glass-panel p-4 rounded-xl border-l-4" style={{ borderLeftColor: entry.type === 'truth' ? '#00F0FF' : '#FF2E93' }}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${entry.type === 'truth' ? 'text-secondary' : 'text-primary'}`}>
                  {entry.type}
                </span>
                
                {isHost && (
                  <div className="flex gap-2">
                    {!entry.approved && (
                      <button onClick={() => handleApprove(entry._id, true)} className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(entry._id)} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {!isHost && entry.authorPlayerId === myPlayerId && !entry.approved && (
                  <span className="text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded">Pending Approval</span>
                )}
              </div>
              <p className="text-white text-lg leading-snug">{entry.text}</p>
              <p className="text-xs text-gray-500 mt-3">
                By {entry.isAnonymous ? "Anonymous" : players.find(p => p._id === entry.authorPlayerId)?.name || "Unknown"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
