"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, PanelLeftClose, Search, Settings2, Sparkles, SquarePen, Menu, ChevronDown, User, Square } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Model = { id: string; name?: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/models").then(r => r.json()).then(d => {
      if (Array.isArray(d.models)) { setModels(d.models); setModel(d.models[0]?.id ?? ""); }
      if (d.error) setError(d.error);
    }).catch(() => setError("Tidak dapat memuat model. Periksa konfigurasi 9Router."));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading || !model) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, model }), signal: controller.signal });
      if (!res.ok || !res.body) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Permintaan AI gagal."); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: answer }]);
      }
      answer += decoder.decode();
      if (answer) setMessages([...next, { role: "assistant", content: answer }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally { setLoading(false); abortRef.current = null; }
  }

  return <main className="app-shell">
    {sidebar && <aside className="sidebar">
      <div className="brand-row"><div className="brand-mark">✳</div><span>Kuro AI</span><button className="icon-btn side-collapse" onClick={() => setSidebar(false)} aria-label="Tutup sidebar"><PanelLeftClose size={18}/></button></div>
      <button className="side-action active" onClick={() => setMessages([])}><SquarePen size={17}/> New chat</button>
      <button className="side-action"><Search size={17}/> Search</button><button className="side-action"><Sparkles size={17}/> Projects</button>
      <div className="side-label">RECENT</div>
      {messages.length > 0 ? <button className="history-item">Percakapan baru</button> : <p className="empty-history">Percakapanmu akan muncul di sini.</p>}
      <div className="sidebar-bottom"><button className="side-action"><Settings2 size={17}/> Settings</button><div className="profile"><div className="avatar">K</div><div><strong>Kuro</strong><small>Personal workspace</small></div></div></div>
    </aside>}
    <section className="main-panel">
      <header className="topbar"><div className="top-left">
        {!sidebar && <button className="icon-btn" onClick={() => setSidebar(true)} aria-label="Buka sidebar"><Menu size={19}/></button>}
        <span className="mobile-brand">Kuro AI</span>
        <label className="model-picker"><span>{model || "Pilih model"}</span><ChevronDown size={15}/><select aria-label="Pilih model" value={model} onChange={e => setModel(e.target.value)}><option value="" disabled>Pilih model</option>{models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}</select></label>
      </div><button className="icon-btn" title="Pengaturan"><Settings2 size={18}/></button></header>
      <div className="conversation">
        {messages.length === 0 ? <div className="welcome"><div className="welcome-symbol">✳</div><h1>What can I help you with?</h1><p>Ruang berpikir dan berkarya, dengan model AI pilihanmu.</p><div className="suggestions">
          <button onClick={() => setInput("Bantu saya memahami konsep yang sulit dengan contoh sederhana.")}>Explain a concept <span>↗</span></button>
          <button onClick={() => setInput("Bantu saya menulis dan memperbaiki kode.")}>Write some code <span>↗</span></button>
          <button onClick={() => setInput("Buatkan rencana proyek yang terstruktur.")}>Plan a project <span>↗</span></button>
        </div></div> : <div className="message-list">
          {messages.map((m,i) => <article className={\`message \${m.role}\`} key={i}><div className="message-avatar">{m.role === "assistant" ? <span>✳</span> : <User size={16}/>}</div><div className="message-content"><div className="message-author">{m.role === "assistant" ? "Kuro AI" : "You"}</div><div className="message-text">{m.content || (loading && i === messages.length-1 ? <span className="typing">Thinking…</span> : "")}</div></div></article>)}
          <div ref={endRef}/>
        </div>}
      </div>
      <div className="composer-wrap"><div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message Kuro AI..." rows={2}/><div className="composer-tools">
        <button className="icon-btn attach" title="Lampirkan file" disabled><Paperclip size={18}/></button><span className="composer-hint">Your 9Router gateway</span>
        {loading ? <button className="send-btn stop" onClick={() => abortRef.current?.abort()} title="Stop"><Square size={14}/></button> : <button className="send-btn" onClick={send} disabled={!input.trim() || !model} title="Kirim"><ArrowUp size={19}/></button>}
      </div></div><p className="disclaimer">Kuro AI can make mistakes. Verify important information.</p>{error && <p className="error-text">{error}</p>}</div>
    </section>
  </main>;
}
