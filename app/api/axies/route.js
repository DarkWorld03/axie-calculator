import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Intentamos leer la dirección de varias formas posibles
    const address = body.address || body.variables?.address || body.owner;

    if (!address) {
      console.error("ERROR: No llegó ninguna dirección en el body:", body);
      return NextResponse.json({ error: "No wallet address provided" }, { status: 400 });
    }

    const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");
    console.log("Dirección procesada correctamente:", cleanAddress);

    const query = `query GetAxieBriefList($owner: String!) {
      axies(owner: $owner, from: 0, size: 24) {
        results {
          id
          name
          image
          class
          parts { id name class type stage }
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
      console.error("SKY MAVIS ERROR:", JSON.stringify(resData.errors));
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    return NextResponse.json(resData.data?.axies?.results || []);

  } catch (error) {
    console.error("ERROR CRITICO EN ROUTE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}