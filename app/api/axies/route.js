import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Esto evita que Netlify guarde datos viejos

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body.address || body.variables?.address; // Doble verificación de la wallet

    if (!address) {
      return NextResponse.json({ error: "No wallet address provided" }, { status: 400 });
    }

    const query = `
      query GetAxieBriefList($owner: String) {
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
        variables: { owner: address } // Cambié $address por $owner para que coincida con la query
      }),
    });

    const resData = await response.json();

    // Si Sky Mavis responde con errores dentro del JSON
    if (resData.errors) {
      console.error("GraphQL Errors:", resData.errors);
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    // Retornamos los resultados o un array vacío si no hay nada
    const axies = resData.data?.axies?.results || [];
    return NextResponse.json(axies);

  } catch (error) {
    console.error("Critical API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}