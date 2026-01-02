"use client";
import { useState, useEffect, useRef } from 'react';
import { getAxiesByAddress, getAxieById } from '../lib/axieApi';
import { CLASSIC_DATA } from '../lib/classicCards';

const ENEMY_GROUPS = [
  { 
    id: "Plant", 
    icons: ["plant.png", "reptile.png", "dusk.png"], 
    color: "border-green-500/50 bg-green-500/10",
    activeColor: "border-green-400 bg-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
  },
  { 
    id: "Aquatic", 
    icons: ["aquatic.png", "bird.png", "dawn.png"], 
    color: "border-blue-500/50 bg-blue-500/10",
    activeColor: "border-blue-400 bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
  },
  { 
    id: "Beast", 
    icons: ["beast.png", "bug.png", "mech.png"], 
    color: "border-orange-500/50 bg-orange-500/10",
    activeColor: "border-orange-400 bg-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
  }
];

const ALL_SPECIES = [
  { id: "Plant", icon: "plant.png" },
  { id: "Reptile", icon: "reptile.png" },
  { id: "Dusk", icon: "dusk.png" },
  { id: "Aquatic", icon: "aquatic.png" },
  { id: "Bird", icon: "bird.png" },
  { id: "Dawn", icon: "dawn.png" },
  { id: "Beast", icon: "beast.png" },
  { id: "Bug", icon: "bug.png" },
  { id: "Mech", icon: "mech.png" }
];

const GEAR_DATA = {
  hp: { 0: { hp: 0, skl: 0 }, 1: { hp: 12, skl: -2 }, 2: { hp: 24, skl: -4 }, 3: { hp: 36, skl: -6 }, 4: { hp: 48, skl: -8 }, 5: { hp: 72, skl: -10 } },
  speed: { 0: { spd: 0, mor: 0 }, 1: { spd: 1, mor: -3 }, 2: { spd: 2, mor: -4 }, 3: { spd: 3, mor: -5 }, 4: { spd: 4, mor: -6 }, 5: { Shm: 6, mor: -7 } }
};

const getGroupMult = (attackerClass, defenderClass) => {
  const groups = {
    rojo: ["Plant", "Reptile", "Dusk"],
    verde: ["Aquatic", "Bird", "Dawn"],
    azul: ["Beast", "Bug", "Mech"]
  };
  const getG = (c) => Object.keys(groups).find(k => groups[k].includes(c));
  const aG = getG(attackerClass);
  const dG = getG(defenderClass);
  if (!aG || !dG) return 1.0;
  if ((aG === 'rojo' && dG === 'verde') || (aG === 'verde' && dG === 'azul') || (aG === 'azul' && dG === 'rojo')) return 1.15;
  if ((aG === 'rojo' && dG === 'azul') || (aG === 'azul' && dG === 'verde') || (aG === 'verde' && dG === 'rojo')) return 0.85;
  return 1.0;
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [axies, setAxies] = useState([]);
  const [team, setTeam] = useState([null, null, null]);
  const [manualId, setManualId] = useState("");
  const [combo, setCombo] = useState([]);
  const [forceLevel, setForceLevel] = useState({});
  const [axieGears, setAxieGears] = useState({});
  const [cardModifiers, setCardModifiers] = useState({});
  const [openGearMenu, setOpenGearMenu] = useState(null);
  const [axieTargets, setAxieTargets] = useState({}); 
  const [savedTeams, setSavedTeams] = useState([]);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showInventory, setShowInventory] = useState(true);
  const [replacingSlot, setReplacingSlot] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [loading, setLoading] = useState(false); // Estado de carga unificado
  const inventoryRef = useRef(null);

  const [fragileStatus, setFragileStatus] = useState({}); 
  const [enemyShield, setEnemyShield] = useState({}); 

  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`axie_teams_${address}`);
      setSavedTeams(saved ? JSON.parse(saved) : []);
    } else {
      setSavedTeams([]);
    }
  }, [address]);

  const saveTeam = () => {
    if (!address) return alert("CONECTA TU WALLET PARA GUARDAR EQUIPOS");
    if (team.some(a => a === null)) return alert("NECESITAS 3 AXIES EN LA CALCULADORA");
    const teamName = prompt("NOMBRE DEL EQUIPO:");
    if (!teamName) return;

    const newTeam = { 
        name: teamName, 
        axies: team, 
        id: Date.now(),
        config: {
            forceLevel,
            axieGears,
            cardModifiers,
            axieTargets,
            fragileStatus,
            enemyShield
        }
    };

    const updatedTeams = [...savedTeams, newTeam];
    setSavedTeams(updatedTeams);
    localStorage.setItem(`axie_teams_${address}`, JSON.stringify(updatedTeams));
    alert("EQUIPO GUARDADO CON CONFIGURACIÓN");
  };

  const loadTeam = (selectedTeam) => {
    setTeam(selectedTeam.axies);
    if (selectedTeam.config) {
        setForceLevel(selectedTeam.config.forceLevel || {});
        setAxieGears(selectedTeam.config.axieGears || {});
        setCardModifiers(selectedTeam.config.cardModifiers || {});
        setAxieTargets(selectedTeam.config.axieTargets || {});
        setFragileStatus(selectedTeam.config.fragileStatus || {});
        setEnemyShield(selectedTeam.config.enemyShield || {});
    }
    setShowTeamSelector(false);
    setIsMenuOpen(false);
  };

  const deleteTeam = (id) => {
    const updated = savedTeams.filter(t => t.id !== id);
    setSavedTeams(updated);
    localStorage.setItem(`axie_teams_${address}`, JSON.stringify(updated));
  };

  const updateCardModifiers = (axieId, partId, type) => {
    const key = `${axieId}-${partId}`;
    setCardModifiers(prev => {
      const current = prev[key] || { up: 0, down: 0 };
      if (current[type] >= 5) return prev; 
      return { ...prev, [key]: { ...current, [type]: current[type] + 1 } };
    });
  };

  const resetCardModifiers = (axieId, partId) => {
    const key = `${axieId}-${partId}`;
    setCardModifiers(prev => ({ ...prev, [key]: { up: 0, down: 0 } }));
  };

  const calculateDamage = (ability, axie, part, currentCombo, currentShieldValue = 0) => {
    const cardData = CLASSIC_DATA[ability.name.trim()];
    const selectedLevel = forceLevel[`${axie.id}-${part.id}`] || part.stage;
    
    let baseAtk = 0; let hits = 1;
    if (cardData?.[selectedLevel]) {
      baseAtk = cardData[selectedLevel].atk;
      hits = cardData[selectedLevel].hits || 1;
    } else if (cardData && selectedLevel === 2) {
      baseAtk = Math.floor(cardData[1].atk * 1.23);
    } else { return 0; }
  
    if (baseAtk === 0) return 0;
  
    let classMult = 1.0;
    const cardClass = part.class.toLowerCase();
    const attackerClass = axie.class.toLowerCase();
    const HERMANAS = { dusk: ['plant', 'reptile'], dawn: ['aquatic', 'bird'], mech: ['beast', 'bug'] };
    if (cardClass === attackerClass) { classMult = 1.1; } 
    else if (HERMANAS[attackerClass]?.includes(cardClass)) { classMult = 1.075; }
  
    const targetClass = axieTargets[axie.id] || "Plant";
    const groupMult = getGroupMult(part.class, targetClass); 
  
    let skillMult = 1.0;
    const cardsOfThisAxie = currentCombo.filter(c => c.axieId === axie.id).length;
    if (cardsOfThisAxie >= 2) {
      const gear = axieGears[axie.id];
      const skillPenalty = (gear?.type === 'hp') ? GEAR_DATA.hp[gear.lvl].skl : 0;
      const finalSkill = Math.max(0, (axie.stats?.skill || 0) + skillPenalty);
      skillMult = 1 + ((finalSkill * 0.55 - 12.25) / 100 * 0.985);
    }
  
    const mods = cardModifiers[`${axie.id}-${part.id}`] || { up: 0, down: 0 };
    const combinedModMult = 1 + (0.20 * mods.up) - (0.20 * mods.down);
  
    let finalRawDmg = Math.floor(baseAtk * classMult * groupMult * skillMult * combinedModMult) * hits;
    const isFragile = fragileStatus[axie.id] || false;

    if (currentShieldValue > 0) {
        const effectiveDmgToShield = isFragile ? (finalRawDmg * 2) : finalRawDmg;
        if (effectiveDmgToShield > currentShieldValue) {
            const costToBreak = isFragile ? (currentShieldValue / 2) : currentShieldValue;
            return Math.floor(finalRawDmg - costToBreak);
        } else {
            return 0;
        }
    }
    return finalRawDmg;
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ronin) {
        alert("Por favor instala Ronin Wallet");
        setLoading(false);
        return;
      }

      const accounts = await window.ronin.provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress); 
        console.log("Conectado con éxito:", userAddress);
        
        const data = await getAxiesByAddress(userAddress);
        
        if (data && data.length > 0) {
          setAxies(data);
          setShowInventory(true);
        } else {
          alert("No se encontraron Axies en esta wallet.");
        }
      }
    } catch (err) {
      console.error("Error al conectar:", err);
      alert("Error al acceder a la wallet.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAddress(""); setAxies([]); setTeam([null, null, null]); setCombo([]); setSavedTeams([]); setIsMenuOpen(false);
  };

  const toggleLevel = (axieId, partId, defaultStage) => {
    const key = `${axieId}-${partId}`;
    setForceLevel(prev => ({ ...prev, [key]: (prev[key] || defaultStage) === 2 ? 1 : 2 }));
  };

  const addToCombo = (img, axieId, abilityName, partId) => {
    const axie = team.find(a => a?.id === axieId);
    if (!axie) return;
    if (combo.filter(c => c.axieId === axieId).length >= 4) return alert("MÁX 4 CARTAS");
    if (combo.filter(c => c.axieId === axieId && c.partId === partId).length >= 2) return alert("MÁX 2 COPIAS");
    
    // Añadimos la carta al array
    setCombo([...combo, { img, axieId, abilityName, partId, dmg: 0 }]);
};

useEffect(() => {
    if (combo.length === 0) return;

    const newCombo = combo.map((card, index) => {
        const axie = team.find(a => a.id === card.axieId);
        const part = axie.parts.find(p => p.id === card.partId);
        const isFragile = fragileStatus[card.axieId] || false;

        // Calculamos el escudo para el axie que recibe el golpe
        let runningShield = enemyShield[card.axieId] || 0;
        
        // Buscamos solo las cartas anteriores que golpean al MISMO axie
        for (let i = 0; i < index; i++) {
            const prev = combo[i];
            if (prev.axieId === card.axieId) {
                const pAxie = team.find(a => a.id === prev.axieId);
                const pPart = pAxie.parts.find(p => p.id === prev.partId);
                
                // Daño bruto de la carta anterior (sin escudo)
                const raw = calculateDamage(pPart.abilities[0], pAxie, pPart, combo, 0);
                const shieldDmg = isFragile ? (raw * 2) : raw;
                runningShield = Math.max(0, runningShield - shieldDmg);
            }
        }

        const updatedDmg = calculateDamage(part.abilities[0], axie, part, combo, runningShield);
        return { ...card, dmg: updatedDmg };
    });

    // Evitar bucles infinitos comparando si el daño realmente cambió
    const damagesChanged = newCombo.some((c, i) => c.dmg !== combo[i]?.dmg);
    if (damagesChanged) {
        setCombo(newCombo);
    }
}, [combo, enemyShield, fragileStatus, team]);

  const clearAxieCombo = (axieId) => {
    setCombo(prev => prev.filter(c => c.axieId !== axieId));
    setCardModifiers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.startsWith(`${axieId}-`)) next[key] = { up: 0, down: 0 }; });
      return next;
    });
    // Opcional: Resetear escudo y fragile al limpiar
    setEnemyShield(prev => ({...prev, [axieId]: 0}));
    setFragileStatus(prev => ({...prev, [axieId]: false}));
  };

  const getModCount = (axieId, partId, type) => cardModifiers[`${axieId}-${partId}`]?.[type] || 0;

  useEffect(() => {
    if (combo.length === 0) return;
    setCombo(prev => prev.map(item => {
      const axie = team.find(a => a?.id === item.axieId);
      const part = axie?.parts.find(p => p.id === item.partId);
      if (!axie || !part) return item;
      const dmg = calculateDamage(part.abilities[0], axie, part, prev);
      return item.dmg === dmg ? item : { ...item, dmg };
    }));
  }, [axieTargets, forceLevel, team, combo.length, axieGears, cardModifiers, fragileStatus, enemyShield]);

  const selectAxieFromInventory = (axie) => {
    const newTeam = [...team];
    if (replacingSlot !== null) {
      newTeam[replacingSlot] = axie;
      setReplacingSlot(null);
    } else {
      const emptyIdx = team.findIndex(s => s === null);
      if (emptyIdx !== -1) newTeam[emptyIdx] = axie;
    }
    setTeam(newTeam);
  };

  const filteredAxies = filterClass 
    ? axies.filter(a => a.class.toLowerCase() === filterClass.toLowerCase()) 
    : axies;

    console.log("--- DEBUG INVENTARIO ---");
    console.log("Dirección Wallet:", address);
    console.log("Axies en estado (API):", axies.length);
    console.log("Filtro de clase:", filterClass || "Ninguno");
    console.log("Axies tras filtrar:", filteredAxies.length);
    console.log("------------------------");

  return (
    <main className="relative min-h-screen text-white p-4 font-sans uppercase tracking-tighter overflow-x-hidden">
      <div className="fixed inset-0 -z-10" style={{ backgroundImage: "url('/icons/fondo.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px) brightness(0.4)', transform: 'scale(1.1)' }} />

      {/* SIDEBAR MENU */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsMenuOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-80 bg-[#11161f] border-l border-white/10 p-8 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-xl font-black italic">CONFIG <span className="text-blue-500">MENU</span></h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">✕</button>
          </div>
          
          <div className="space-y-4 flex-grow overflow-y-auto pr-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-blue-400 font-black mb-1">CONNECTED WALLET</p>
              <p className="text-[9px] truncate text-slate-400 font-mono">{address || "NOT CONNECTED"}</p>
            </div>
            <button onClick={saveTeam} className="w-full text-left p-4 bg-blue-600/10 hover:bg-blue-600/20 rounded-xl transition-all font-black text-xs border border-blue-500/30 flex items-center justify-between group cursor-pointer">SAVE TEAM <span className="opacity-40 group-hover:opacity-100">💾</span></button>
            <button onClick={() => setShowTeamSelector(!showTeamSelector)} className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-black text-xs border border-white/10 flex items-center justify-between group cursor-pointer">SELECT TEAM <span className="opacity-40 group-hover:opacity-100">▾</span></button>
            {showTeamSelector && (
              <div className="space-y-2 pl-2">
                {!address ? ( <p className="text-[10px] text-amber-500 italic text-center py-4">CONNECT WALLET TO SEE TEAMS</p> ) : savedTeams.length === 0 ? ( <p className="text-[10px] text-slate-500 italic text-center py-4">NO TEAMS SAVED</p> ) : (
                  savedTeams.map(t => (
                    <div key={t.id} className="p-3 bg-black/40 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => loadTeam(t)}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black text-blue-400 truncate w-32">{t.name}</p>
                        <button onClick={(e) => {e.stopPropagation(); deleteTeam(t.id);}} className="text-[8px] text-red-500 font-black hover:text-red-400 cursor-pointer">DELETE</button>
                      </div>
                      <div className="flex gap-1 items-center justify-between">
                        <div className="flex -space-x-3">
                          {t.axies.map((ax, idx) => ax && <img key={idx} src={`https://axiecdn.axieinfinity.com/axies/${ax.id}/axie/axie-full-transparent.png`} className="w-12 h-10 object-contain drop-shadow-md" alt="axie" />)}
                        </div>
                        <span className="bg-blue-600 text-white text-[8px] px-2 py-1 rounded font-black">LOAD</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <button className="w-full text-left p-4 hover:bg-white/5 rounded-xl transition-all font-black text-xs border border-transparent hover:border-white/10 cursor-pointer">USER SETTINGS</button>
          </div>
          {address && (
            <div className="mt-auto pt-8 border-t border-white/5">
              <button onClick={logout} className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all font-black text-xs group cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                LOGOUT WALLET
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="sticky top-4 z-50 flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-[#11161f]/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic">AXIE <span className="text-blue-500">CLASSIC</span></h1>
            <span className="text-[8px] text-slate-500 font-bold tracking-[0.3em]">CALCULATOR V2</span>
          </div>

          <div className="flex items-center gap-6 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
            <div className="flex -space-x-2 min-w-[100px] h-10">
                {combo.map((c, i) => <img key={i} src={c.img} className="w-8 h-10 object-contain rounded border border-white/20 bg-slate-900 shadow-lg" alt="card" />)}
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold text-blue-400 opacity-60">GLOBAL TOTAL DMG</p>
              <p className="text-4xl font-black tabular-nums">{combo.reduce((acc, curr) => acc + (curr.dmg || 0), 0)}</p>
            </div>
            <button onClick={() => {
                    setCombo([]);
                    setEnemyShield({});
                    setFragileStatus({});
                    setCardModifiers({}); // <--- ESTO pone en 0 todos los Atk Up y Low
                      }} className="bg-red-500/20 text-red-500 px-4 py-1 rounded-lg font-black text-[10px] hover:bg-red-500 hover:text-white transition-all cursor-pointer">CLEAR ALL</button>
          </div>

          <div className="flex gap-2 items-center">
            {!address && <button onClick={connectWallet} className="bg-blue-600 px-6 py-2 rounded-xl font-black text-[10px] hover:bg-blue-500 transition-all shadow-lg cursor-pointer">CONNECT</button>}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="AXIE ID" className="bg-transparent px-3 py-1 w-24 text-[11px] focus:outline-none font-bold text-white"/>
              <button onClick={async () => {
                const a = await getAxieById(manualId);
                if(a) setAxies(prev => [a, ...prev]);
              }} className="bg-white/10 hover:bg-blue-600 px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer">ADD</button>
            </div>
            <button onClick={() => setIsMenuOpen(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-black text-[10px] transition-all border border-white/10 flex items-center gap-2 ml-2 cursor-pointer">
              <div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-white"></div><div className="w-3 h-0.5 bg-white"></div></div> MENU
            </button>
          </div>
        </div>

        {/* TEAM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((slot, i) => {
            if (!slot) return (
              <div key={i} className={`bg-[#0f131a]/60 backdrop-blur-sm rounded-[40px] p-6 border-2 border-dashed border-white/5 flex items-center justify-center opacity-40 min-h-[500px] cursor-pointer hover:bg-white/5 transition-all ${replacingSlot === i ? 'border-blue-500 border-solid opacity-100' : ''}`} onClick={() => { setReplacingSlot(i); setShowInventory(true); inventoryRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
                <div className="text-white/10 font-black text-xl italic tracking-widest text-center">{replacingSlot === i ? "SELECT FROM BELOW" : `SLOT ${i+1}`}</div>
              </div>
            );

            const activeGear = axieGears[slot.id]; 
            const axieComboDmg = combo.filter(c => c.axieId === slot.id).reduce((acc, curr) => acc + (curr.dmg || 0), 0);
            const isFragileActive = fragileStatus[slot.id] || false;

            return (
              <div key={i} className={`bg-[#0f131a]/80 backdrop-blur-md rounded-[40px] p-5 border-2 transition-all relative min-h-[550px] flex flex-col ${replacingSlot === i ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-blue-500/20'}`}>
                <div className="absolute top-6 left-8 z-30">
                  <button onClick={() => setOpenGearMenu(openGearMenu === slot.id ? null : slot.id)} className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all flex items-center gap-2 border cursor-pointer ${activeGear ? 'bg-white/10 border-white/40 text-white' : 'bg-blue-600/20 text-blue-400 border-blue-500/50 hover:bg-blue-600 hover:text-white'}`}>
                    {activeGear ? (<><img src={`/gears/${activeGear.type === 'hp' ? 'hplvl' : 'speedlvl'}${activeGear.lvl}.png`} className="w-4 h-4 object-contain" alt="gear" /><span>LVL {activeGear.lvl}</span></>) : ( "GEAR" )}
                  </button>
                  {openGearMenu === slot.id && (
                    <div className="absolute top-8 left-0 w-44 bg-[#1a1f29] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 z-50 backdrop-blur-xl">
                      <div>
                        <p className="text-[7px] text-slate-500 mb-2 font-black tracking-widest text-center">SELECT ONE</p>
                        <div className="mb-3">
                          <p className="text-[7px] text-green-500 mb-1 font-black">HP GEARS</p>
                          <div className="grid grid-cols-5 gap-1">
                            {[1,2,3,4,5].map(lvl => (
                              <button key={lvl} onClick={() => { setAxieGears(prev => ({...prev, [slot.id]: {type: 'hp', lvl}})); setOpenGearMenu(null); }} className={`p-1 rounded border transition-all cursor-pointer ${activeGear?.type === 'hp' && activeGear.lvl === lvl ? 'border-green-500 bg-green-500/20' : 'border-transparent hover:bg-white/5'}`}>
                                <img src={`/gears/hplvl${lvl}.png`} className="w-5 h-5 object-contain" alt="hp gear" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[7px] text-yellow-500 mb-1 font-black">SPEED GEARS</p>
                          <div className="grid grid-cols-5 gap-1">
                            {[1,2,3,4,5].map(lvl => (
                              <button key={lvl} onClick={() => { setAxieGears(prev => ({...prev, [slot.id]: {type: 'speed', lvl}})); setOpenGearMenu(null); }} className={`p-1 rounded border transition-all cursor-pointer ${activeGear?.type === 'speed' && activeGear.lvl === lvl ? 'border-yellow-500 bg-yellow-500/20' : 'border-transparent hover:bg-white/5'}`}>
                                <img src={`/gears/speedlvl${lvl}.png`} className="w-5 h-5 object-contain" alt="speed gear" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setAxieGears(prev => {const n={...prev}; delete n[slot.id]; return n;}); setOpenGearMenu(null); }} className="text-[8px] text-red-500 font-black hover:bg-red-500/10 p-1 rounded cursor-pointer">REMOVE GEAR</button>
                    </div>
                  )}
                </div>

                <div className="absolute top-6 right-8 flex items-center z-30">
                    <button onClick={() => setTeam(t => {const n=[...t]; n[i]=null; return n;})} className="text-slate-600 hover:text-white font-black transition-colors cursor-pointer">✕</button>
                </div>

                <div className="flex flex-col items-center -mt-6">
                  <img 
                    src={`https://axiecdn.axieinfinity.com/axies/${slot.id}/axie/axie-full-transparent.png`} 
                    className={`w-40 h-32 object-contain drop-shadow-2xl relative z-10 cursor-pointer hover:scale-110 transition-transform ${replacingSlot === i ? 'brightness-150' : ''}`}
                    onClick={() => {
                        setReplacingSlot(i);
                        setShowInventory(true);
                        inventoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    alt="axie"
                  />
                  
                  <div className="flex flex-col items-center gap-2 w-full -mt-2 min-h-[40px] justify-center">
                    <div className="flex justify-center gap-2">
                      {ENEMY_GROUPS.map(group => {
                        const isActive = (axieTargets[slot.id] || "Plant") === group.id;
                        return (
                          <button key={group.id} onClick={() => setAxieTargets(prev => ({...prev, [slot.id]: group.id}))} className={`flex gap-1 items-center px-2 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${isActive ? group.activeColor : 'border-white/5 bg-black/20 opacity-40 hover:opacity-100'}`}>
                            {group.icons.map(icon => <img key={icon} src={`/icons/${icon}`} className="w-4 h-4 object-contain" alt={icon} />)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-auto mb-4">
                  {slot.parts.filter(p => p.abilities?.length > 0).map(p => {
                    const level = forceLevel[`${slot.id}-${p.id}`] || p.stage;
                    const cardImg = `https://cdn.axieinfinity.com/game/cards/base-v2/${p.abilities[0].id}.png`;
                    const count = combo.filter(c => c.axieId === slot.id && c.partId === p.id).length;
                    return (
                      <div key={p.id} className="flex flex-col items-center bg-black/40 hover:bg-black/60 transition-colors p-1.5 rounded-xl border border-white/10 gap-1.5">
                        <button onClick={() => toggleLevel(slot.id, p.id, p.stage)} className={`w-full h-6 rounded-md font-black text-[8px] flex items-center justify-center border transition-all cursor-pointer ${level === 2 ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>L{level}</button>
                        <button onClick={() => addToCombo(cardImg, slot.id, p.abilities[0].name, p.id)} className={`relative w-full h-24 bg-gradient-to-b from-white/5 to-transparent rounded-lg border transition-all overflow-hidden group cursor-pointer ${count >= 2 ? 'border-blue-500/50' : 'border-white/10 hover:border-blue-500'}`}>
                          <img src={cardImg} className="w-full h-full object-contain transform group-hover:scale-110 transition-transform" alt="card" />
                          {count > 0 && <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg border border-white/20">{count}</div>}
                        </button>
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <div className="flex justify-center gap-1.5">
                            <div className="relative">
                              <button onClick={() => updateCardModifiers(slot.id, p.id, 'up')} className="hover:scale-110 transition-transform cursor-pointer"><img src="/icons/attack-up.png" className="w-5 h-5 object-contain" alt="up" /></button>
                              <span className="absolute -top-2 -right-2 bg-[#22c55e] text-black text-[9px] font-black min-w-[15px] h-[15px] flex items-center justify-center rounded-full border-2 border-black shadow-sm">{getModCount(slot.id, p.id, 'up')}</span>
                            </div>
                            <div className="relative">
                              <button onClick={() => updateCardModifiers(slot.id, p.id, 'down')} className="hover:scale-110 transition-transform cursor-pointer"><img src="/icons/low.png" className="w-5 h-5 object-contain" alt="down" /></button>
                              <span className="absolute -top-2 -right-2 bg-[#ef4444] text-black text-[9px] font-black min-w-[15px] h-[15px] flex items-center justify-center rounded-full border-2 border-black shadow-sm">{getModCount(slot.id, p.id, 'down')}</span>
                            </div>
                          </div>
                          <button onClick={() => resetCardModifiers(slot.id, p.id)} className="w-full py-0.5 bg-white/5 hover:bg-red-500/20 rounded-md transition-colors flex justify-center items-center cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

{/* AREA INFERIOR: FRAGILE - DAÑO - CLEAR */}
<div className="pt-4 border-t border-white/5 grid grid-cols-3 items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => setFragileStatus(prev => ({...prev, [slot.id]: !prev[slot.id]}))}
                      className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer shrink-0 ${
                        isFragileActive 
                          ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-105' 
                          : 'bg-white/5 border-white/10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <img src="/icons/fragil.png" className="w-5 h-5 object-contain" alt="fragile" />
                    </button>

                    {isFragileActive && (
                      <div className="flex flex-col flex-1 pr-1 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-[7px] text-red-500 font-black ml-1 mb-0.5 tracking-widest uppercase">Shield</span>
                        <input 
                          type="number"
                          placeholder="0"
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }} // Quita flechas en Firefox
                          value={enemyShield[slot.id] || ""}
                          onChange={(e) => setEnemyShield(prev => ({...prev, [slot.id]: parseInt(e.target.value) || 0}))}
                          className="w-full bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-2 text-sm font-black text-red-100 focus:outline-none focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="text-[8px] text-slate-500 font-black tracking-widest uppercase mb-1">AXIE DMG</p>
                    <p className={`text-3xl font-black transition-all duration-300 ${axieComboDmg > 0 ? 'text-white' : 'text-slate-700'}`}>
                      {axieComboDmg}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => clearAxieCombo(slot.id)} 
                      className="bg-red-500/10 text-red-500 px-3 py-2.5 rounded-xl font-black text-[9px] hover:bg-red-600 hover:text-white transition-all border border-red-500/20 active:scale-95 cursor-pointer"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INVENTORY SECTION */}
        <div ref={inventoryRef} className="mt-12 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 bg-[#11161f] p-2 rounded-full border border-white/10 shadow-2xl">
              <button 
                onClick={() => setShowInventory(!showInventory)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-black text-[10px] shadow-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                {showInventory ? "OCULTAR INVENTARIO ▴" : "MOSTRAR INVENTARIO ▾"}
              </button>
              
              <div className="flex items-center gap-2 border-l border-white/10 px-2 ml-1">
                <button 
                  onClick={() => setShowFilterOptions(!showFilterOptions)}
                  className={`px-4 py-2 rounded-full font-black text-[10px] transition-all cursor-pointer ${showFilterOptions ? 'bg-white/20 text-white' : 'bg-black/40 text-blue-400 hover:bg-white/5'}`}
                >
                  FILTRAR {showFilterOptions ? '▴' : '▾'}
                </button>

                <div className={`flex gap-1 overflow-hidden transition-all duration-300 ${showFilterOptions ? 'max-w-md opacity-100' : 'max-w-0 opacity-0'}`}>
                    {ALL_SPECIES.map(species => (
                    <button 
                        key={species.id}
                        onClick={() => setFilterClass(filterClass === species.id ? null : species.id)}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 shrink-0 ${filterClass === species.id ? 'bg-white/20 ring-1 ring-white/50' : 'opacity-40 hover:opacity-100'}`}
                    >
                        <img src={`/icons/${species.icon}`} className="w-5 h-5 object-contain" alt={species.id} />
                    </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-500 overflow-hidden ${showInventory ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-[#0f131a]/80 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-2xl pt-12">
                {replacingSlot !== null && (
                    <div className="mb-6 text-center">
                        <p className="text-blue-400 font-black text-xs animate-pulse">SELECCIONA UN AXIE PARA EL SLOT {replacingSlot + 1}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredAxies.map(axie => (
                  <div key={axie.id} onClick={() => selectAxieFromInventory(axie)} className="bg-black/40 p-4 rounded-3xl border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden">
                    <img src={`https://axiecdn.axieinfinity.com/axies/${axie.id}/axie/axie-full-transparent.png`} className="w-full h-24 object-contain mb-2 group-hover:scale-110 transition-transform" alt="inventory axie" />
                    <p className="text-[10px] font-black text-center truncate">#{axie.id}</p>
                    <div className="absolute top-2 right-2">
                        <img src={`/icons/${axie.class.toLowerCase()}.png`} className="w-4 h-4" alt="class" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}