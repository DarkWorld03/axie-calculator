// lib/axieApi.js

export const getAxiesByAddress = async (addr) => {
  if (!addr) return [];
  
  // Limpiamos la dirección: quitamos ronin:, espacios y pasamos a minúsculas
  const cleanAddr = addr.trim().replace("ronin:", "0x").toLowerCase();
  
  console.log("Solicitando inventario para:", cleanAddr);

  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: cleanAddr })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Error en la respuesta del servidor:", errorData);
      return [];
    }

    const data = await res.json();
    
    // Verificamos si lo que llega es realmente un array
    console.log("Respuesta cruda del servidor:", data);

    if (Array.isArray(data)) {
      console.log(`¡Éxito! Se encontraron ${data.length} axies.`);
      return data;
    } else {
      console.warn("La respuesta no es un array, revisando formato alternativo...");
      return data.results || [];
    }
  } catch (e) {
    console.error("Error fatal cargando inventario:", e);
    return [];
  }
};

export const getAxieById = async (id) => {
  if (!id) return null;
  
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Enviamos el axieId para que el servidor sepa que es una consulta individual
      body: JSON.stringify({ axieId: id })
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data || null;
  } catch (e) { 
    console.error("Error obteniendo detalle del axie:", e);
    return null; 
  }
};