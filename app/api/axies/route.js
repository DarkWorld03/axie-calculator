import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address;

    if (!address) return NextResponse.json({ error: "No address" }, { status: 400 });

    const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");

    const query = `
      query GetAxieBriefList($owner: String!) {
        axies(owner: $owner, from: 0, size: 100) {
          total
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
      }
    `;

    // URL SACADA DE TU TABLA:
    const response = await fetch('https://api-gateway.skymavis.com/graphql/axie-marketplace', {
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
    
    // Si hay errores de GraphQL los mostramos
    if (resData.errors) {
      console.error("Error Sky Mavis:", resData.errors[0].message);
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    // Extraemos los resultados
    const axies = resData.data?.axies?.results || [];
    console.log(`Consulta exitosa. Axies encontrados: ${axies.length}`);

    return NextResponse.json(axies);

  } catch (error) {
    console.error("ERROR CRITICO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}