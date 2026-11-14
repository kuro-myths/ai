import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  const base = process.env.ROUTER_BASE_URL;
  const key = process.env.ROUTER_API_KEY;
  if (!base || !key) return NextResponse.json({ models: [], error: "ROUTER_BASE_URL dan ROUTER_API_KEY belum dikonfigurasi." }, { status: 200 });
  try {
    const response = await fetch(`${base.replace(/\\/$/, "")}/models`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ models: [], error: `9Router mengembalikan HTTP ${response.status}` }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ models: (data.data ?? []).map((m: { id: string; name?: string }) => ({ id: m.id, name: m.name })) });
  } catch { return NextResponse.json({ models: [], error: "Tidak dapat menghubungi 9Router." }, { status: 502 }); }
}
