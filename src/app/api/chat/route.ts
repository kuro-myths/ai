import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const base = process.env.ROUTER_BASE_URL;
  const key = process.env.ROUTER_API_KEY;
  if (!base || !key) return NextResponse.json({ error: "Konfigurasi 9Router belum lengkap." }, { status: 503 });
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || !body.model) return NextResponse.json({ error: "Model dan messages wajib diisi." }, { status: 400 });
    const upstream = await fetch(`${base.replace(/\\/$/, "")}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: body.model, messages: body.messages, stream: true }), signal: req.signal,
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: `Permintaan ke 9Router gagal (HTTP ${upstream.status}).` }, { status: upstream.status || 502 });
    const stream = new ReadableStream<Uint8Array>({ async start(controller) {
      const reader = upstream.body!.getReader(); const decoder = new TextDecoder(); let buffer = "";
      try { while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line.startsWith("data:")) continue; const payload = line.slice(5).trim(); if (!payload || payload === "[DONE]") continue; try { const parsed = JSON.parse(payload); const content = parsed.choices?.[0]?.delta?.content; if (typeof content === "string") controller.enqueue(new TextEncoder().encode(content)); } catch { /* Ignore malformed SSE frames. */ } } } controller.close(); } catch (error) { controller.error(error); }
    }});
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Gagal memproses permintaan chat." }, { status: 500 }); }
}
