"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Radio, CheckCircle, AlertCircle } from "lucide-react";

export default function NewLivePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isRecorded, setIsRecorded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ muxStreamKey: string; muxPlaybackId: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          scheduledStartAt: new Date(scheduledAt).toISOString(),
          isRecorded,
          tags: [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { muxStreamKey: string; muxPlaybackId: string };
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="px-8 py-8 max-w-[600px]">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Live event created!</h2>
          <p className="text-white/40 text-sm">Configure OBS or your streaming software with these details:</p>

          <div className="w-full space-y-3 mt-4 text-left">
            <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Stream Key</p>
              <code className="text-sm text-kairo-gold font-mono break-all">{result.muxStreamKey}</code>
            </div>
            <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">RTMP URL</p>
              <code className="text-sm text-white/70 font-mono break-all">rtmps://global-live.mux.com:443/app</code>
            </div>
            <div className="bg-kairo-dark-card border border-kairo-dark-border rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Playback ID (for viewers)</p>
              <code className="text-sm text-white/70 font-mono break-all">{result.muxPlaybackId}</code>
            </div>
          </div>

          <button
            onClick={() => router.push("/admin/live")}
            className="mt-4 px-6 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors"
          >
            Back to Live Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-[600px]">
      <Link
        href="/admin/live"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Live Events
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Radio size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-white">New Live Event</h1>
          <p className="text-white/40 text-sm">Creates a Mux live stream automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Sunday Worship Service"
            className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40"
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Scheduled Start *</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-kairo-gold/40"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setIsRecorded((v) => !v)}
            className={`w-10 rounded-full transition-all relative shrink-0 ${isRecorded ? "bg-kairo-gold" : "bg-kairo-dark-muted border border-kairo-dark-border"}`}
            style={{ height: "22px" }}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isRecorded ? "left-[22px]" : "left-0.5"}`} />
          </button>
          <span className="text-sm text-white/70">Save replay after stream ends</span>
        </label>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !title || !description || !scheduledAt}
          className="w-full py-3 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Creating live stream…" : "Create Live Event"}
        </button>
      </form>
    </div>
  );
}
