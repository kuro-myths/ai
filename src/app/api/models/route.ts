import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.ROUTER_BASE_URL;
  const key = process.env.ROUTER_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ models: [], error: "ROUTER_BASE_URL dan ROUTER_API_KEY belum dikonfigurasi." });
  }
  try {
    const response = await fetch(\`\${base.replace(/\/$/, "")}/models\`, {
      headers: { Authorization: \`Bearer \${key}\` },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ models: [], error: \`9Router mengembalikan HTTP \${response.status}\` }, { status: 502 });
    }
    const data = await response.json();
    const models = (data.data ?? []).map((m: { id: string; name?: string }) => ({ id: m.id, name: m.name }));
    return NextResponse.json({
      models,
      defaultModel: process.env.ROUTER_DEFAULT_MODEL || models[0]?.id || "",
    });
  } catch {
    return NextResponse.json({ models: [], error: "Tidak dapat menghubungi 9Router." }, { status: 502 });
  }
}
