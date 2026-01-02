// lib/axieApi.js

// Función para obtener todos los axies de una wallet
export const getAxiesByAddress = async (addr) => {
  if (!addr) return [];
  const cleanAddr = addr.trim().replace("ronin:", "0x").toLowerCase();
  
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: cleanAddr })
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error cargando inventario:", e);
    return [];
  }
};

// Función para obtener un solo axie por su ID (Para el botón Agregar)
export const getAxieById = async (id) => {
  if (!id) return null;
  
  try {
    const res = await fetch("/api/axies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axieId: id.toString() })
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    console.log("Axie individual cargado:", data?.id);
    return data; 
  } catch (e) { 
    console.error("Error obteniendo axie por ID:", e);
    return null; 
  }
};