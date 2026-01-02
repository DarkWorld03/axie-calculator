/**
 * @param {string} abilityName - Nombre de la carta
 * @param {number} currentDmg - Daño base calculado hasta el momento
 * @param {number} effectValue - Valor del botón (1, 2, 3 o 0)
 * @param {number} level - Nivel de la carta (1 o 2)
 */
// lib/cardEffects.js

export const applyCardEffect = (abilityName, currentDmg, effectValue, level) => {
    // Si no hay botón activo, devolvemos el daño tal cual
    if (!effectValue || effectValue === 0) return currentDmg;

    const name = abilityName.trim();

    switch (name) {
        case "Wooden Stab":
            // Lvl 1: 120%, Lvl 2: 150%
            return level === 1 ? currentDmg * 1.20 : currentDmg * 1.50;

        case "Bamboo Clan":
            if (level === 1) return currentDmg * 1.20;
            if (level === 2) {
                // effectValue es 1, 2 o 3 según plantas vivas
                return currentDmg * (1 + (effectValue * 0.10));
            }
            return currentDmg;

        default:
            return currentDmg;
    }
};