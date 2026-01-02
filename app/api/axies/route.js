import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address;

    if (!address) {
      return NextResponse.json({ error: "No wallet address" }, { status: 400 });
    }

    const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");
    console.log("Consultando para:", cleanAddress);

    const query = `query GetAxieBriefList($owner: String!) {
      axies(owner: $owner, from: 0, size: 24) {
        results {
          id
          name
          image
          class
          stats { hp speed skill morale }
          parts { 
            id name class type stage 
            abilities { id name attack defense description }
          }
        }
      }
    }`;

    // CAMBIO AQUÍ: Usamos la URL específica para API KEYS
    const response = await fetch('https://api-gateway.skymavis.com/graphql/explorer', {
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

    // Verificamos si la respuesta es HTML antes de procesar JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      const textError = await response.text();
      console.error("RESPUESTA NO ES JSON. Recibido:", textError.substring(0, 100));
      throw new Error("Sky Mavis devolvió HTML en lugar de JSON. Revisa la URL o API Key.");
    }

    const resData = await response.json();

    if (resData.errors) {
      console.error("SKY MAVIS ERROR:", JSON.stringify(resData.errors));
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    return NextResponse.json(resData.data?.axies?.results || []);

  } catch (error) {
    console.error("ERROR CRITICO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}