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
    description: "The dominant modern formation, popularized by Guardiola's Barcelona. High pressing, wide attacking play with three forwards demanding positional perfection.",
    strengths: ["Width in attack", "High press capability", "Midfield triangle control", "Overlapping fullbacks"],
    weaknesses: ["Vulnerable to counterattacks", "Requires high fitness", "Wide defensive gaps if wingers don't track back"],
    bestAgainst: ["4-4-2", "4-4-1-1", "5-4-1", "4-6-0"],
    worstAgainst: ["4-2-3-1", "5-3-2"],
    popularityRank: 1,
  },
  {
    id: "4-4-2",
    name: "4-4-2",
    description: "The classic English formation. Two banks of four providing defensive solidity with a striking partnership up front. Simple and effective.",
    strengths: ["Defensive compactness", "Physical midfield presence", "Direct striker partnerships", "Easy to organize"],
    weaknesses: ["Outnumbered in midfield vs 3-man systems", "Lacks creativity centrally", "Predictable patterns"],
    bestAgainst: ["3-5-2", "5-4-1"],
    worstAgainst: ["4-3-3", "4-2-3-1", "3-4-3"],
    popularityRank: 3,
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    description: "The chess master's formation. A double pivot shields the defense while the number 10 creates behind a lone striker. Control-oriented.",
    strengths: ["Double pivot security", "Number 10 creativity", "Compact defensive block", "Transition speed"],
    weaknesses: ["Lone striker isolation", "Relies on 10's quality", "Wide areas can be exposed"],
    bestAgainst: ["4-3-3", "4-4-2", "3-4-3"],
    worstAgainst: ["3-5-2", "4-3-1-2"],
    popularityRank: 2,
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    description: "A wing-back system with three center-backs and a loaded midfield. Creates superiority in central areas with the wing-backs providing attacking width.",
    strengths: ["Midfield dominance", "Wing-back dynamism", "Defensive depth with 3 CBs", "Flexible in transition"],
    weaknesses: ["Wide areas vulnerable when wing-backs push up", "Requires specialist wing-backs", "Can be stretched wide"],
    bestAgainst: ["4-4-2", "4-3-3", "5-4-1"],
    worstAgainst: ["5-3-2", "4-3-3"],
    popularityRank: 5,
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    description: "Aggressive attacking formation with three front players and three center-backs. Maximum offensive threat with high risk — requires immense athleticism.",
    strengths: ["Overloads final third", "Three CB security base", "Wide attack variety", "High chance creation"],
    weaknesses: ["Exposed on counterattacks", "Midfield can be outnumbered", "Physical demand extreme"],
    bestAgainst: ["4-4-2", "4-4-1-1", "5-4-1"],
    worstAgainst: ["4-2-3-1", "5-3-2"],
    popularityRank: 7,
  },
  {
    id: "5-3-2",
    name: "5-3-2",
    description: "Ultra-defensive setup with five defenders and a compact midfield. Designed to absorb pressure and win on the counter. Popular in knockout matches.",
    strengths: ["Defensive solidity", "Counter-attack efficiency", "Set-piece threat", "Hard to break down"],
    weaknesses: ["Limited attacking creativity", "Struggles against possession teams", "Relies on individual quality up front"],
    bestAgainst: ["4-3-3", "3-4-3", "4-2-3-1"],
    worstAgainst: ["3-5-2", "4-3-1-2"],
    popularityRank: 8,
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    description: "A narrow defensive variant of 4-4-2 or 4-3-3. The single pivot sits deep, the four midfielders are narrow and central, with a lone striker pressing high.",
    strengths: ["Central compactness", "Press triggering from striker", "Good wide midfield transitions", "Defensive resilience"],
    weaknesses: ["Width in attack limited", "Lone striker struggles alone", "Can be bypassed with quick wide play"],
    bestAgainst: ["4-5-1", "5-4-1"],
    worstAgainst: ["4-3-3", "3-4-3"],
    popularityRank: 9,
  },
  {
    id: "4-5-1",
    name: "4-5-1",
    description: "Defensive variant with five midfielders protecting the back four. Used to hold results or neutralize strong opponents. The lone striker must be technically excellent.",
    strengths: ["Midfield control and coverage", "Difficult to penetrate centrally", "Set-piece solidity", "Energy sapping for opponents"],
    weaknesses: ["Low scoring potential", "Striker can become isolated", "Lacks direct offensive threat"],
    bestAgainst: ["5-3-2", "5-4-1"],
    worstAgainst: ["4-3-3", "4-2-3-1", "3-4-3"],
    popularityRank: 10,
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1",
    description: "The \"Christmas Tree\" formation — narrow and hierarchical. Three midfielders support two attacking mids who feed a striker. Very possession-oriented.",
    strengths: ["Packed midfield", "Two creative players behind striker", "Good pressing triggers", "Short passing triangles"],
    weaknesses: ["Vulnerable wide areas", "Wing-backs must work intensely", "Can be stretched by pace on flanks"],
    bestAgainst: ["4-4-2", "5-4-1"],
    worstAgainst: ["4-3-3", "3-5-2"],
    popularityRank: 11,
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    description: "Modern hybrid formation combining a back three with two attacking midfielders. Used by Conte and Lippi at major tournaments for tactical flexibility.",
    strengths: ["Three-CB stability", "Wing-back dynamism", "Two 10s for creativity", "Flexible pressing shapes"],
    weaknesses: ["Complex system requiring intelligent players", "Can lose shape when pressing high", "Wing-backs tire easily"],
    bestAgainst: ["4-4-2", "4-4-1-1"],
    worstAgainst: ["4-3-3", "5-3-2"],
    popularityRank: 6,
  },
  {
    id: "4-4-1-1",
    name: "4-4-1-1",
    description: "A compact 4-4-2 variant where one striker drops deeper behind the main striker. Creates a shadow striker system with high midfield discipline.",
    strengths: ["Shadow striker unpredictability", "Defensive 4-4 block", "Good pressing structure", "Counter-attack threat"],
    weaknesses: ["Can crowd the center", "Shadow striker role demands high work rate", "Relies on wide midfielders defensively"],
    bestAgainst: ["5-3-2", "5-4-1"],
    worstAgainst: ["4-3-3", "3-4-3"],
    popularityRank: 12,
  },
  {
    id: "4-3-1-2",
    name: "4-3-1-2",
    description: "A narrow attacking formation with a classical number 10 and two strikers. Very central and congested — relies on individual brilliance in tight spaces.",
    strengths: ["Central overloads", "Two striker combination play", "Number 10 as pivot", "Short passing triangles"],
    weaknesses: ["Width almost nonexistent", "Wide areas easily exploited", "Limited to central corridors"],
    bestAgainst: ["4-5-1", "4-4-1-1"],
    worstAgainst: ["4-3-3", "3-5-2"],
    popularityRank: 13,
  },
  {
    id: "5-4-1",
    name: "5-4-1",
    description: "Maximum defensive protection with five defenders and four midfielders. Pure counter-attacking system, often used to protect leads or neutralize elite opponents.",
    strengths: ["Five-man defensive wall", "Very hard to break down", "Width and depth coverage", "Set-piece defending strength"],
    weaknesses: ["Minimal attacking threat", "Striker isolated with no support", "Can demoralize the team if pinned back"],
    bestAgainst: ["4-6-0", "3-6-1"],
    worstAgainst: ["4-3-3", "4-4-2", "3-4-3"],
    popularityRank: 14,
  },
  {
    id: "3-6-1",
    name: "3-6-1",
    description: "Ultra-attacking formation with six midfielders and a lone striker. Creates absolute midfield control and overwhelming numerical superiority in the middle third.",
    strengths: ["Unmatched midfield control", "Wide and central coverage", "High pressing from 6 midfielders", "Flexible attack contributions"],
    weaknesses: ["Three CBs can be exposed by fast breaks", "Lone striker overworked", "Extremely demanding fitness-wise"],
    bestAgainst: ["4-4-2", "4-5-1", "4-1-4-1"],
    worstAgainst: ["5-3-2", "4-3-3"],
    popularityRank: 15,
  },
  {
    id: "4-6-0",
    name: "4-6-0",
    description: "The most extreme formation: no traditional strikers. Six midfielders flood the pitch with fluid movement and late runners from deep positions replacing a striker.",
    strengths: ["Midfield dominance", "Fluid positional play", "All players can arrive in attacking areas", "Unpredictable movement"],
    weaknesses: ["No natural finisher in the box", "Requires exceptional technical quality across all 6 midfielders", "Can lack the cutting edge in the final third"],
    bestAgainst: ["5-4-1", "4-5-1"],
    worstAgainst: ["4-3-3", "3-4-3", "4-2-3-1"],
    popularityRank: 4,
  },
];

function computeWinRateAvg(formationId: string): number {
  const matchups = FORMATION_MATCHUP[formationId];
  if (!matchups) return 0.50;
  const values = Object.values(matchups).filter((_, k) => Object.keys(matchups)[k] !== formationId);
  if (values.length === 0) return 0.50;
  return values.reduce((a, b) => a + b, 0) / values.length;
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
  const awayWinRate = 1 - homeWinRate - 0.05; // rough draw adjustment
  const drawRate = 1 - homeWinRate - awayWinRate;

  const homeF = FORMATIONS_DATA.find((f) => f.id === homeFormation);
  const awayF = FORMATIONS_DATA.find((f) => f.id === awayFormation);

  let analysis = `${homeFormation} vs ${awayFormation}: `;
  if (homeWinRate > 0.52) {
    analysis += `The ${homeFormation} has a ${((homeWinRate - 0.50) * 100).toFixed(0)}% tactical edge. ${homeF?.strengths[0] ?? "Positional advantage"} exploits ${awayF?.weaknesses[0] ?? "defensive gaps"}.`;
  } else if (homeWinRate < 0.48) {
    analysis += `The ${awayFormation} neutralizes ${homeFormation} effectively. ${awayF?.strengths[0] ?? "Structural advantage"} counters ${homeF?.weaknesses[0] ?? "the setup"}.`;
  } else {
    analysis += `A tactically balanced matchup. Both formations cancel each other out in key areas.`;
  }

  return {
    homeFormation,
    awayFormation,
    homeWinRate: parseFloat(homeWinRate.toFixed(4)),
    awayWinRate: parseFloat(Math.max(0, awayWinRate).toFixed(4)),
    drawRate: parseFloat(Math.max(0, drawRate).toFixed(4)),
    analysis,
  };
}
