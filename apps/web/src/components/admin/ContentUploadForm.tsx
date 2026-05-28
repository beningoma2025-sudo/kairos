"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, Film } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadStep = "idle" | "uploading" | "metadata" | "saving" | "done";

const CONTENT_TYPES = [
  { value: "MOVIE", label: "Movie" },
  { value: "DOCUMENTARY", label: "Documentary" },
  { value: "TEACHING", label: "Teaching / Sermon" },
  { value: "SERIES", label: "Series" },
  { value: "EPISODE", label: "Episode" },
  { value: "KIDS", label: "Kids Content" },
  { value: "SHORT", label: "Short" },
];

const AGE_RATINGS = ["G", "PG", "PG_13", "TV_Y", "TV_Y7", "TV_G", "TV_PG"];

export function ContentUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadId, setUploadId] = useState("");
  const [error, setError] = useState("");

  // Metadata form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("MOVIE");
  const [ageRating, setAgeRating] = useState("PG");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState("");
  const [publishNow, setPublishNow] = useState(true);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    setError("");
    setStep("uploading");
    setUploadProgress(0);

    try {
      // Step 1: Get Mux upload URL
      const urlRes = await fetch("/api/admin/mux-upload", { method: "POST" });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadId: uid, uploadUrl } = (await urlRes.json()) as {
        uploadId: string;
        uploadUrl: string;
      };
      setUploadId(uid);

      // Step 2: Upload directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload network error")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setStep("metadata");
      // Pre-fill title from file name
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    } catch (e) {
      setError((e as Error).message);
      setStep("idle");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadId) return;

    setStep("saving");
    setError("");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          ageRating,
          thumbnailUrl,
          muxUploadId: uploadId,
          isKids,
          isFeatured,
          publishNow,
          tags: tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to save content");
      }

      setStep("done");
      setTimeout(() => router.push("/admin/content"), 1500);
    } catch (e) {
      setError((e as Error).message);
      setStep("metadata");
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CheckCircle size={48} className="text-green-400" />
        <h2 className="text-xl font-semibold text-white">Content saved!</h2>
        <p className="text-white/40 text-sm">Redirecting to content list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Upload zone */}
      {(step === "idle" || step === "uploading") && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => step === "idle" && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
            step === "idle"
              ? "border-kairo-dark-border hover:border-kairo-gold/40 hover:bg-kairo-gold/5 cursor-pointer"
              : "border-kairo-gold/30 bg-kairo-gold/5 cursor-default"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {step === "idle" ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-kairo-dark-muted flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-kairo-gold" />
              </div>
              <p className="text-white font-semibold mb-1">Drop video here or click to browse</p>
              <p className="text-white/30 text-sm">MP4, MOV, MKV, AVI · Max 10GB</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-kairo-gold/10 flex items-center justify-center mx-auto mb-4">
                <Film size={24} className="text-kairo-gold" />
              </div>
              <p className="text-white font-semibold mb-1">Uploading to Mux…</p>
              <p className="text-kairo-gold text-2xl font-bold my-3">{uploadProgress}%</p>
              <div className="h-2 bg-kairo-dark-border rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-gold-gradient rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-white/30 text-xs mt-3">
                Uploading directly to Mux CDN — do not close this tab
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Metadata form */}
      {(step === "metadata" || step === "saving") && (
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <CheckCircle size={15} />
            Video uploaded successfully — now fill in the details
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40 resize-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Content Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-kairo-gold/40"
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Rating */}
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Age Rating
              </label>
              <select
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-kairo-gold/40"
              >
                {AGE_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", "-")}
                  </option>
                ))}
              </select>
            </div>

            {/* Thumbnail URL */}
            <div className="col-span-2">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40"
              />
            </div>

            {/* Tags */}
            <div className="col-span-2">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="faith, prayer, family..."
                className="w-full bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-kairo-gold/40"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 py-2">
            {[
              { label: "Kids Content", value: isKids, set: setIsKids },
              { label: "Featured", value: isFeatured, set: setIsFeatured },
              { label: "Publish immediately", value: publishNow, set: setPublishNow },
            ].map((toggle) => (
              <label key={toggle.label} className="flex items-center gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggle.set((v) => !v)}
                  className={cn(
                    "w-10 h-5.5 rounded-full transition-all relative shrink-0",
                    toggle.value
                      ? "bg-kairo-gold"
                      : "bg-kairo-dark-muted border border-kairo-dark-border"
                  )}
                  style={{ height: "22px" }}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                      toggle.value ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
                <span className="text-sm text-white/70">{toggle.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/admin/content")}
              className="px-6 py-2.5 rounded-xl border border-kairo-dark-border text-white/50 text-sm hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={step === "saving" || !title || !description}
              className="flex-1 py-2.5 rounded-xl bg-kairo-gold text-kairo-dark font-semibold text-sm hover:bg-kairo-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "saving" ? "Saving…" : "Save Content"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
