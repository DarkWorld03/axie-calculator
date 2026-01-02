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
          results {
            id
            name
            image
            class
            stats { hp speed skill morale }
            parts { id name class type stage abilities { id name attack defense description } }
          }
        }
      }
    `;

    // Probamos con la URL de Mainnet oficial para Developers
    const response = await fetch('https://api-gateway.skymavis.com/graphql/mainnet', {
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
    
    // LOG DE SEGURIDAD: Esto nos dirá la estructura real en Netlify
    console.log("Estructura completa recibida:", JSON.stringify(resData).substring(0, 200));

    // Si Sky Mavis responde con un error de API Key o cuota
    if (resData.errors) {
      console.error("Error de Sky Mavis:", resData.errors[0].message);
      return NextResponse.json({ error: resData.errors[0].message }, { status: 400 });
    }

    // Navegamos por el objeto con seguridad (Optional Chaining)
    const axies = resData.data?.axies?.results || resData.axies?.results || [];
    
    console.log(`Encontrados ${axies.length} axies para ${cleanAddress}`);

    return NextResponse.json(axies);

  } catch (error) {
    console.error("ERROR EN SERVIDOR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}