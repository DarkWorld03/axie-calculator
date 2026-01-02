// lib/axieApi.js

export const getAxiesByAddress = async (addr) => {
  if (!addr) return [];
  
  // Limpiar dirección
  const roninAddr = addr.trim().replace("ronin:", "0x").toLowerCase();
  
  const query = {
    query: `query GetAxieBriefList($owner: String) {
      axies(owner: $owner, from: 0, size: 24) {
        results {
          id
          name
          class
          image
          stats { hp speed skill morale }
          parts { 
            id 
            name 
            class 
            type 
            abilities { id name attack defense description } 
          }
        }
      }
    }`,
    variables: { owner: roninAddr }
  };

  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    });
    
    const json = await res.json();
    return json.data?.axies?.results || [];
  } catch (e) {
    console.error("Error cargando inventario:", e);
    return [];
  }
};

export const getAxieById = async (id) => {
  if (!id) return null;
  const query = {
    query: `query GetAxieDetail($axieId: String!) {
      axie(axieId: $axieId) {
        id name class image stats { hp speed skill morale }
        parts { id name class type abilities { id name attack defense description } }
      }
    }`,
    variables: { axieId: id }
  };
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    });
    const json = await res.json();
    return json.data?.axie || null;
  } catch (e) { return null; }
};