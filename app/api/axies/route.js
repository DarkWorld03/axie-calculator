import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Usamos el Gateway oficial de Axie Infinity
    const res = await fetch("https://graphql-gateway.axieinfinity.com/graphql", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Error en servidor Axie" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}