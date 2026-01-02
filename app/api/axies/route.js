import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    let address = body.address || body.variables?.address;

    if (!address) {
      return NextResponse.json({ error: "No address provided" }, { status: 400 });
    }

    // ASEGURAR FORMATO 0x: La API interna de Sky Mavis a veces falla con "ronin:"
    const cleanAddress = address.toLowerCase().replace("ronin:", "0x");

    const query = `
      query GetAxieBriefList($owner: String!) {
        axies(owner: $owner, from: 0, size: 24) {
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

    const response = await fetch('https://graphql-gateway.axieinfinity.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AXIE_API_KEY
      },
      body: JSON.stringify({
        query,
        variables: { owner: cleanAddress } 
      }),
    });

    const resData = await response.json();

    // Si hay errores de GraphQL, los enviamos para ver qué dicen
    if (resData.errors) {
      return NextResponse.json({ 
        error: "Sky Mavis Error", 
        details: resData.errors 
      }, { status: 400 });
    }

    return NextResponse.json(resData.data?.axies?.results || []);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}