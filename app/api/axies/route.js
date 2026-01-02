import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address;

    if (!address) return NextResponse.json({ error: "No address" }, { status: 400 });

    const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");

    // Query oficial para la API de Desarrolladores
    const query = `
      query GetAxieBriefList($owner: String!) {
        axies(owner: $owner, from: 0, size: 24) {
          total
          results {
            id
            name
            image
            class
            stats { hp speed skill morale }
            parts { id name class type stage }
          }
        }
      }
    `;

    const response = await fetch('https://api-gateway.skymavis.com/graphql/mainnet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': process.env.AXIE_API_KEY?.trim()
      },
      body: JSON.stringify({
        query,
        variables: { owner: cleanAddress }
      }),
    });

    const resData = await response.json();

    // Log para ver en Netlify si vienen datos
    console.log("Respuesta de Sky Mavis recibida. Total:", resData.data?.axies?.total || 0);

    if (resData.errors) {
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    // Enviamos solo el array de resultados
    return NextResponse.json(resData.data?.axies?.results || []);

  } catch (error) {
    console.error("Error en servidor:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}