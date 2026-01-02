import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { address, axieId } = body;
    const apiKey = process.env.AXIE_API_KEY?.trim();

    // --- CASO 1: BUSCAR POR ID INDIVIDUAL ---
    if (axieId) {
      console.log(`Buscando Axie por ID: ${axieId}`);
      const queryById = `
        query GetAxieDetail($axieId: ID!) {
          axie(axieId: $axieId) {
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
      `;

      const response = await fetch('https://api-gateway.skymavis.com/graphql/axie-marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query: queryById,
          variables: { axieId: axieId.toString() }
        }),
      });

      const resData = await response.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      return NextResponse.json(resData.data?.axie || null);
    }

    // --- CASO 2: BUSCAR POR WALLET (INVENTARIO) ---
    if (address) {
      const cleanAddress = address.toLowerCase().trim().replace("ronin:", "0x");
      console.log(`Consultando inventario para: ${cleanAddress}`);

      const queryByWallet = `
        query GetAxieBriefList($owner: String!) {
          axies(owner: $owner, from: 0, size: 100) {
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

      const response = await fetch('https://api-gateway.skymavis.com/graphql/axie-marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query: queryByWallet,
          variables: { owner: cleanAddress }
        }),
      });

      const resData = await response.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      
      const axies = resData.data?.axies?.results || [];
      console.log(`Éxito. Axies encontrados: ${axies.length}`);
      return NextResponse.json(axies);
    }

    return NextResponse.json({ error: "No se proporcionó address ni axieId" }, { status: 400 });

  } catch (error) {
    console.error("ERROR EN SERVIDOR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}