import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address;
    const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");

    // Imprimir en el log de Netlify para ver si la dirección llega bien
    console.log("Intentando buscar axies para:", cleanAddress);

    const query = `query GetAxieBriefList($owner: String!) {
      axies(owner: $owner, from: 0, size: 24) {
        results {
          id
          name
          image
          class
        }
      }
    }`;

    const response = await fetch('https://graphql-gateway.axieinfinity.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AXIE_API_KEY?.trim()
      },
      body: JSON.stringify({
        query,
        variables: { owner: cleanAddress }
      }),
    });

    const resData = await response.json();

    if (resData.errors) {
      // ESTO ES LO QUE NECESITAMOS VER EN EL LOG
      console.error("DETALLE ERROR SKY MAVIS:", JSON.stringify(resData.errors));
      return NextResponse.json({ error: "Error de API" }, { status: 400 });
    }

    console.log("Axies encontrados:", resData.data?.axies?.results?.length || 0);
    return NextResponse.json(resData.data?.axies?.results || []);

  } catch (error) {
    console.error("ERROR CRITICO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}