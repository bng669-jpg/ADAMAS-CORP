import { FORMATION_MATCHUP } from "./montecarlo.js";

export interface Formation {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestAgainst: string[];
  worstAgainst: string[];
  popularityRank: number;
  winRateAvg: number;
  matchups: Record<string, number>;
}

const FORMATIONS_DATA: Omit<Formation, "winRateAvg" | "matchups">[] = [
  {
    id: "4-3-3",
    name: "4-3-3",
    description: "La formación moderna dominante, popularizada por el Barcelona de Guardiola. Alta presión, juego amplio con tres delanteros que exigen precisión posicional.",
    strengths: ["Amplitud en ataque", "Alta presión", "Control con triángulo de mediocampistas", "Laterales que se proyectan"],
    weaknesses: ["Vulnerable a contraataques", "Requiere alta condición física", "Brechas defensivas si los extremos no replican"],
    bestAgainst: ["4-4-2", "4-4-1-1", "5-4-1"],
    worstAgainst: ["4-2-3-1", "5-3-2"],
    popularityRank: 1,
  },
  {
    id: "4-4-2",
    name: "4-4-2",
    description: "El clásico inglés. Dos bloques de cuatro dan solidez defensiva con dupla de delanteros. Simple y efectivo para equipos organizados.",
    strengths: ["Compacidad defensiva", "Presencia física en el mediocampo", "Asociaciones de delanteros directas", "Fácil de organizar"],
    weaknesses: ["Superado en mediocampo vs sistemas de 3", "Falta de creatividad central", "Patrones predecibles"],
    bestAgainst: ["3-5-2", "5-4-1"],
    worstAgainst: ["4-3-3", "4-2-3-1", "3-4-3"],
    popularityRank: 3,
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    description: "La formación del ajedrecista. Doble pivote protege la defensa mientras el número 10 crea detrás de un delantero centro. Orientada al control.",
    strengths: ["Seguridad con doble pivote", "Creatividad del número 10", "Bloque defensivo compacto", "Velocidad en transición"],
    weaknesses: ["Aislamiento del delantero", "Depende de la calidad del 10", "Las bandas pueden quedar expuestas"],
    bestAgainst: ["4-3-3", "4-4-2", "3-4-3"],
    worstAgainst: ["3-5-2", "4-3-1-2"],
    popularityRank: 2,
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    description: "Sistema con carriles con tres centrales y mediocampo cargado. Crea superioridad en zonas centrales con carrileros que dan amplitud ofensiva.",
    strengths: ["Dominio del mediocampo", "Dinamismo de carrileros", "Profundidad defensiva con 3 centrales", "Flexible en transición"],
    weaknesses: ["Bandas vulnerables cuando carrileros suben", "Requiere carrileros especializados", "Puede ser estirado"],
    bestAgainst: ["4-4-2", "4-3-3", "5-4-1"],
    worstAgainst: ["5-3-2", "4-3-3"],
    popularityRank: 5,
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    description: "Formación muy ofensiva con tres atacantes y tres centrales. Máxima amenaza goleadora con alto riesgo — exige un atletismo inmenso.",
    strengths: ["Sobrecarga el último tercio", "Base segura con 3 centrales", "Variedad en el ataque amplio", "Alta creación de ocasiones"],
    weaknesses: ["Expuesto en contraataques", "El mediocampo puede ser superado en número", "Exigencia física extrema"],
    bestAgainst: ["4-4-2", "4-4-1-1", "5-4-1"],
    worstAgainst: ["4-2-3-1", "5-3-2"],
    popularityRank: 7,
  },
  {
    id: "5-3-2",
    name: "5-3-2",
    description: "Configuración ultra defensiva con cinco defensores y mediocampo compacto. Diseñada para absorber presión y ganar al contragolpe.",
    strengths: ["Solidez defensiva", "Eficiencia en contragolpe", "Amenaza en pelota parada", "Difícil de romper"],
    weaknesses: ["Creatividad ofensiva limitada", "Dificultad vs equipos de posesión", "Depende de calidad individual arriba"],
    bestAgainst: ["4-3-3", "3-4-3", "4-2-3-1"],
    worstAgainst: ["3-5-2", "4-3-1-2"],
    popularityRank: 8,
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    description: "Variante defensiva estrecha del 4-4-2 o 4-3-3. El pivote único se sienta profundo, los cuatro mediocampistas son estrechos y centrales, con delantero presionando alto.",
    strengths: ["Compacidad central", "Presión desencadenada desde el delantero", "Buenas transiciones de mediocampo amplio", "Resistencia defensiva"],
    weaknesses: ["Amplitud limitada en ataque", "Delantero lucha solo", "Puede ser superado con juego rápido por bandas"],
    bestAgainst: ["4-5-1", "5-4-1"],
    worstAgainst: ["4-3-3", "3-4-3"],
    popularityRank: 9,
  },
  {
    id: "4-5-1",
    name: "4-5-1",
    description: "Variante defensiva con cinco mediocampistas protegiendo la línea de cuatro. Usada para mantener resultados o neutralizar rivales fuertes.",
    strengths: ["Control y cobertura del mediocampo", "Difícil de penetrar centralmente", "Solidez en pelota parada", "Agota energía del rival"],
    weaknesses: ["Bajo potencial anotador", "Delantero puede aislarse", "Escasa amenaza ofensiva directa"],
    bestAgainst: ["5-3-2", "5-4-1"],
    worstAgainst: ["4-3-3", "4-2-3-1", "3-4-3"],
    popularityRank: 10,
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1",
    description: "El \"Árbol de Navidad\": estrecho y jerárquico. Tres mediocampistas apoyan a dos medias puntas que alimentan a un delantero. Muy orientado a la posesión.",
    strengths: ["Mediocampo compacto", "Dos creativos detrás del delantero", "Buenas presiones", "Triángulos de pase corto"],
    weaknesses: ["Zonas amplias vulnerables", "Las bandas quedan descubiertas", "Puede ser estirado por la velocidad"],
    bestAgainst: ["4-4-2", "5-4-1"],
    worstAgainst: ["4-3-3", "3-5-2"],
    popularityRank: 11,
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    description: "Formación híbrida moderna con tres centrales y dos mediapuntas. Utilizada por Conte y Lippi en torneos mayores por su flexibilidad táctica.",
    strengths: ["Estabilidad con 3 centrales", "Dinamismo de carrileros", "Dos 10s para creatividad", "Formas de presión flexibles"],
    weaknesses: ["Sistema complejo que requiere jugadores inteligentes", "Puede perder forma al presionar alto", "Carrileros se cansan fácilmente"],
    bestAgainst: ["4-4-2", "4-4-1-1"],
    worstAgainst: ["4-3-3", "5-3-2"],
    popularityRank: 6,
  },
  {
    id: "4-4-1-1",
    name: "4-4-1-1",
    description: "Variante compacta del 4-4-2 donde un delantero cae más profundo detrás del delantero principal. Crea un sistema de delantero sombra.",
    strengths: ["Imprevisibilidad del delantero sombra", "Bloque defensivo 4-4", "Buena estructura de presión", "Amenaza al contragolpe"],
    weaknesses: ["Puede congestionar el centro", "El delantero sombra exige mucho trabajo", "Depende de los mediocampistas amplios defensivamente"],
    bestAgainst: ["5-3-2", "5-4-1"],
    worstAgainst: ["4-3-3", "3-4-3"],
    popularityRank: 12,
  },
  {
    id: "4-3-1-2",
    name: "4-3-1-2",
    description: "Formación atacante estrecha con clásico número 10 y dos delanteros. Muy central y congestionada — depende de la brillantez individual en espacios reducidos.",
    strengths: ["Sobrecargas centrales", "Asociación entre los dos delanteros", "El número 10 como pivote", "Triángulos de pase corto"],
    weaknesses: ["Amplitud casi inexistente", "Las bandas son fácilmente explotadas", "Limitado a los pasillos centrales"],
    bestAgainst: ["4-5-1", "4-4-1-1"],
    worstAgainst: ["4-3-3", "3-5-2"],
    popularityRank: 13,
  },
  {
    id: "5-4-1",
    name: "5-4-1",
    description: "Protección defensiva máxima con cinco defensores y cuatro mediocampistas. Sistema puro de contragolpe, usado para proteger ventajas o neutralizar élites.",
    strengths: ["Muro defensivo de cinco", "Muy difícil de descifrar", "Cobertura de anchura y profundidad", "Fortaleza en pelota parada defensiva"],
    weaknesses: ["Mínima amenaza ofensiva", "Delantero aislado sin apoyo", "Puede desmoralizar al equipo si está atrapado"],
    bestAgainst: ["4-5-1", "4-4-1-1"],
    worstAgainst: ["4-3-3", "4-4-2", "3-4-3"],
    popularityRank: 14,
  },
];

function computeWinRateAvg(formationId: string): number {
  const matchups = FORMATION_MATCHUP[formationId];
  if (!matchups) return 0.50;
  const entries = Object.entries(matchups).filter(([k]) => k !== formationId);
  if (entries.length === 0) return 0.50;
  return entries.reduce((a, [, v]) => a + v, 0) / entries.length;
}

export function getAllFormations(): Formation[] {
  return FORMATIONS_DATA.map((f) => ({
    ...f,
    winRateAvg: computeWinRateAvg(f.id),
    matchups: FORMATION_MATCHUP[f.id] ?? {},
  }));
}

export function getFormationMatchup(homeFormation: string, awayFormation: string) {
  const matrix = FORMATION_MATCHUP[homeFormation];
  const homeWinRate = matrix?.[awayFormation] ?? 0.50;
  const awayWinRate = parseFloat(Math.max(0, 1 - homeWinRate - 0.05).toFixed(4));
  const drawRate = parseFloat(Math.max(0, 1 - homeWinRate - awayWinRate).toFixed(4));

  const homeF = FORMATIONS_DATA.find((f) => f.id === homeFormation);
  const awayF = FORMATIONS_DATA.find((f) => f.id === awayFormation);

  let analysis = `${homeFormation} vs ${awayFormation}: `;
  if (homeWinRate > 0.52) {
    analysis += `El ${homeFormation} tiene una ventaja táctica del ${((homeWinRate - 0.50) * 100).toFixed(0)}%. ${homeF?.strengths[0] ?? "Ventaja posicional"} explota ${awayF?.weaknesses[0] ?? "los espacios defensivos"}.`;
  } else if (homeWinRate < 0.48) {
    analysis += `El ${awayFormation} neutraliza al ${homeFormation} efectivamente. ${awayF?.strengths[0] ?? "Ventaja estructural"} contrarresta ${homeF?.weaknesses[0] ?? "la disposición rival"}.`;
  } else {
    analysis += `Enfrentamiento tácticamente equilibrado. Ambas formaciones se anulan en las zonas clave.`;
  }

  return {
    homeFormation,
    awayFormation,
    homeWinRate: parseFloat(homeWinRate.toFixed(4)),
    awayWinRate,
    drawRate,
    analysis,
  };
}
