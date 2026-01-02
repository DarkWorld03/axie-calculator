// lib/axieApi.js

export const getAxiesByAddress = async (addr) => {
  if (!addr) return [];
  
  // Limpiamos la dirección antes de enviarla
  const roninAddr = addr.trim().replace("ronin:", "0x").toLowerCase();
  
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Enviamos solo la dirección, el servidor se encarga de la Query
      body: JSON.stringify({ address: roninAddr })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Error del servidor:", errorData);
      return [];
    }

    const data = await res.json();
    // El servidor ya nos devuelve la lista de axies directamente
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error cargando inventario:", e);
    return [];
  }
};

export const getAxieById = async (id) => {
  if (!id) return null;
  
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Le enviamos el ID al servidor (el servidor debe estar listo para esto)
      body: JSON.stringify({ axieId: id })
    });
    
    const data = await res.json();
    return data || null;
  } catch (e) { 
    return null; 
  }
};