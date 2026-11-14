"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Film, LoaderCircle, Play, Sparkles, WandSparkles } from "lucide-react";

type Theme = "cinematic" | "minimal" | "neon";

const palettes: Record<Theme, { a: string; b: string; accent: string; label: string }> = {
  cinematic: { a: "#101827", b: "#593b4a", accent: "#f2bd86", label: "Cinematic" },
  minimal: { a: "#f3eee5", b: "#d9e2dc", accent: "#263b35", label: "Minimal" },
  neon: { a: "#090d20", b: "#28205c", accent: "#7cf5e8", label: "Neon" },
};

function makeScenes(prompt: string, count: number) {
  const clean = prompt.trim().replace(/\s+/g, " ");
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  const hooks = [
    "Sebuah ide besar dimulai dari satu langkah.",
    "Kenali masalahnya, lalu temukan peluangnya.",
    "Saatnya mengubah rencana menjadi aksi nyata.",
    "Bangun sesuatu yang memberi dampak.",
    "Masa depan dimulai dari apa yang kamu lakukan hari ini.",
  ];
  return Array.from({ length: count }, (_, i) => {
    const source = sentences[i] || sentences[i % Math.max(1, sentences.length)] || clean;
    const text = source.length > 115 ? source.slice(0, 112).trimEnd() + "…" : source;
    return { title: i === 0 ? "CERITA DIMULAI" : ["TEMUKAN IDE","BANGUN VISI","AMBIL LANGKAH","WUJUDKAN"][i % 4], text: text || hooks[i % hooks.length] };
  });
}

function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number, scene: { title: string; text: string }, index: number, total: number, progress: number, theme: Theme) {
  const palette = palettes[theme];
  const gradient = ctx.createLinearGradient(width * (0.1 + progress * 0.15), 0, width, height);
  gradient.addColorStop(0, palette.a);
  gradient.addColorStop(1, palette.b);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * (0.78 - progress * 0.2), height * 0.3, 5, width * 0.72, height * 0.35, width * 0.62);
  glow.addColorStop(0, theme === "minimal" ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.13)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = theme === "minimal" ? "rgba(38,59,53,.14)" : "rgba(255,255,255,.14)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = width * 0.73 + i * 35 + Math.sin(progress * Math.PI * 2 + i) * 13;
    ctx.beginPath(); ctx.arc(x, height * 0.42, 90 + i * 24, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.fillStyle = palette.accent;
  ctx.fillRect(100, 150, 54, 5);
  ctx.textAlign = "left";
  ctx.font = "600 23px Arial, sans-serif";
  ctx.fillText(scene.title, 100, 205);
  ctx.fillStyle = theme === "minimal" ? "#263b35" : "#ffffff";
  ctx.font = "700 64px Arial, sans-serif";
  const words = scene.text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > 980 && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((item, i) => ctx.fillText(item, 100, 315 + i * 82));
  ctx.fillStyle = palette.accent;
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText("KURO AI  /  CREATIVE STUDIO", 100, height - 72);
  ctx.textAlign = "right";
  ctx.fillText(String(index + 1).padStart(2, "0") + "  /  " + String(total).padStart(2, "0"), width - 100, height - 72);
  ctx.fillStyle = theme === "minimal" ? "rgba(38,59,53,.2)" : "rgba(255,255,255,.25)";
  ctx.fillRect(100, height - 48, width - 200, 3);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(100, height - 48, (width - 200) * progress, 3);
}

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(20);
  const [theme, setTheme] = useState<Theme>("cinematic");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scenes = useMemo(() => makeScenes(prompt || "Cerita hebat tentang ide, kreativitas, dan masa depan.", 5), [prompt]);

  async function createVideo() {
    if (!prompt.trim() || busy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!("MediaRecorder" in window) || !canvas.captureStream) {
      setStatus("Browser ini belum mendukung perekaman video. Gunakan Chrome atau Edge versi terbaru.");
      return;
    }
    setBusy(true); setProgress(0); setStatus("Menyiapkan storyboard dan animasi…");
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(""); setFileName("");
    const width = 1280, height = 720, fps = 30;
    const sceneList = makeScenes(prompt, 5);
    const stream = canvas.captureStream(fps);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("Gagal merekam animasi di browser."));
    });
    try {
      recorder.start(250);
      const started = performance.now();
      const totalMs = duration * 1000;
      await new Promise<void>(resolve => {
        const frame = (now: number) => {
          const elapsed = Math.min(now - started, totalMs);
          const overall = elapsed / totalMs;
          const sceneIndex = Math.min(sceneList.length - 1, Math.floor(overall * sceneList.length));
          const local = (overall * sceneList.length) % 1;
          drawFrame(ctx, width, height, sceneList[sceneIndex], sceneIndex, sceneList.length, local, theme);
          setProgress(Math.round(overall * 35));
          if (elapsed < totalMs) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());
      setStatus("Mengonversi video ke MP4…");
      const webm = new Blob(chunks, { type: mime });
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => setProgress(35 + Math.min(64, Math.round(p * 64))));
      const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(base + "/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL(base + "/ffmpeg-core.wasm", "application/wasm"),
      });
      await ffmpeg.writeFile("kuro-video.webm", new Uint8Array(await webm.arrayBuffer()));
      await ffmpeg.exec(["-i", "kuro-video.webm", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", String(fps), "kuro-video.mp4"]);
      const output = await ffmpeg.readFile("kuro-video.mp4");
      const blob = new Blob([new Uint8Array(output).buffer as ArrayBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      const name = "kuro-ai-video-" + new Date().toISOString().slice(0, 10) + ".mp4";
      setFileName(name);
      setProgress(100);
      setStatus("Video MP4 berhasil dibuat. Kamu bisa memutar atau mengunduhnya.");
      await ffmpeg.terminate();
    } catch (error) {
      setStatus((error as Error).message || "Pembuatan video gagal. Coba lagi.");
    } finally { setBusy(false); }
  }

  return <main className="studio-shell">
    <header className="studio-topbar">
      <button className="studio-back" onClick={() => { window.location.href = "/"; }}><ArrowLeft size={17}/> Kembali ke Kuro AI</button>
      <div className="studio-brand"><span>✳</span> Kuro AI <i>/</i> Video Studio</div>
      <span className="studio-local">Render di browser kamu</span>
    </header>
    <div className="studio-content">
      <section className="studio-intro">
        <div className="studio-eyebrow"><WandSparkles size={15}/> AI CREATIVE WORKSPACE</div>
        <h1>Ubah ide menjadi <em>video.</em></h1>
        <p>Tulis topik atau naskah. Kuro AI menyusun adegan, menganimasikan visual, lalu mengekspor video MP4.</p>
      </section>
      <div className="studio-grid">
        <section className="studio-panel studio-controls">
          <label className="studio-label" htmlFor="video-prompt">CERITAKAN VIDEO YANG INGIN DIBUAT</label>
          <textarea id="video-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: Video promosi KVT Hub, platform belajar digital untuk semua. Tampilkan fitur belajar interaktif, tantangan, dan komunitas…" rows={7}/>
          <div className="studio-row"><label className="studio-label" htmlFor="video-duration">DURASI</label><strong>{duration} detik</strong></div>
          <input id="video-duration" className="studio-range" type="range" min="10" max="60" step="5" value={duration} onChange={e => setDuration(Number(e.target.value))}/>
          <div className="studio-row"><span className="studio-label">GAYA VISUAL</span></div>
          <div className="studio-themes">
            {(Object.keys(palettes) as Theme[]).map(key => <button key={key} className={theme === key ? "theme-choice selected" : "theme-choice"} onClick={() => setTheme(key)}><span style={{ background: "linear-gradient(135deg," + palettes[key].a + "," + palettes[key].b + ")" }}/>{palettes[key].label}</button>)}
          </div>
          <button className="studio-generate" onClick={createVideo} disabled={!prompt.trim() || busy}>{busy ? <><LoaderCircle className="spin" size={18}/> Membuat video…</> : <><Sparkles size={18}/> Buat video MP4 otomatis</>}</button>
          {busy && <div className="studio-progress"><div><span>{status}</span><b>{progress}%</b></div><div className="progress-track"><span style={{ width: progress + "%" }}/></div></div>}
          {!busy && status && <p className="studio-status">{status}</p>}
          <p className="studio-note">Proses rendering berjalan di browser. Naskah dan hasil video tidak dikirim ke server Kuro AI.</p>
        </section>
        <section className="studio-preview-panel">
          <div className="preview-heading"><div><span className="studio-label">PREVIEW / OUTPUT</span><h2>{videoUrl ? "Video kamu siap" : "Storyboard video"}</h2></div><Film size={22}/></div>
          {videoUrl ? <div className="video-result"><video src={videoUrl} controls playsInline/><a className="studio-download" href={videoUrl} download={fileName}><Download size={17}/> Unduh MP4</a></div> : <div className="storyboard">
            {scenes.map((scene, i) => <div className="story-scene" key={i}><div className="story-thumb" style={{ background: "linear-gradient(135deg," + palettes[theme].a + "," + palettes[theme].b + ")" }}><span>{String(i + 1).padStart(2, "0")}</span><b>{scene.title}</b></div><div><small>ADEGAN {i + 1}</small><p>{scene.text}</p></div></div>)}
          </div>}
          <div className="preview-footer"><span>1280 × 720 · 16:9 · 30 FPS</span><span>H.264 / MP4</span></div>
        </section>
      </div>
    </div>
    <canvas ref={canvasRef} width={1280} height={720} className="render-canvas" aria-hidden="true"/>
  </main>;
}
