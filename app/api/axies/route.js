import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { address } = await request.json();
    
    const query = `
      query GetAxieBriefList($address: String) {
        axies(owner: $address, from: 0, size: 24) {
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

    const response = await fetch('https://graphql-gateway.axieinfinity.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Netlify leerá automáticamente la variable que pusiste en su panel
        'x-api-key': process.env.AXIE_API_KEY 
      },
      body: JSON.stringify({
        query,
        variables: { address }
      }),
    });

    const resData = await response.json();

    if (resData.errors) {
      console.error("Error de GraphQL:", resData.errors);
      return NextResponse.json({ error: "Error en la consulta" }, { status: 400 });
    }

    return NextResponse.json(resData.data.axies.results);

  } catch (error) {
    console.error("Error en API Route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}