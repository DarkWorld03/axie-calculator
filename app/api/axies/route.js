import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address;

    if (!address) {
      return NextResponse.json({ error: "Address missing" }, { status: 400 });
    }

    const cleanAddress = address.toLowerCase().replace("ronin:", "0x");

    // Query en una sola línea para evitar errores de parseo de caracteres invisibles
    const query = "query GetAxieBriefList($owner: String!) { axies(owner: $owner, from: 0, size: 24) { results { id name image class stats { hp speed skill morale } parts { id name class type stage } } } }";

    const response = await fetch('https://graphql-gateway.axieinfinity.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AXIE_API_KEY
      },
      body: JSON.stringify({
        query: query,
        variables: { owner: cleanAddress }
      }),
    });

    const resData = await response.json();

    // Verificación profunda del error
    if (resData.errors) {
      console.error("Detalle del error Sky Mavis:", resData.errors);
      return NextResponse.json({ 
        error: "GraphQL Error", 
        message: resData.errors[0].message 
      }, { status: 400 });
    }

    const results = resData.data?.axies?.results || [];
    return NextResponse.json(results);

  } catch (error) {
    console.error("Error en servidor Netlify:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}