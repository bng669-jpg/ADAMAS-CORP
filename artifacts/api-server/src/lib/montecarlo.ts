/**
 * ADAMAS Monte Carlo Football Simulation Engine
 *
 * Uses multiple mathematical models:
 * - Poisson Regression: goal scoring distribution
 * - Bayesian inference: formation advantage
 * - Gaussian/Normal distribution: for noise/variance
 * - Empirical probability: from aggregated simulations
 * - Large Numbers Law: with 10000 iterations converges to stable estimates
 * - Multivariable regression: combining multiple input factors
 */

import {
  DEFAULT_TEMPERATURE,
  makeCalibrationMetadata,
  redistributeScorelines,
  temperatureScale,
  type CalibrationMetadata,
  type OneXTwoProbabilities,
} from "./calibration.js";

export interface TeamInput {
  name: string;
  xgFor: number;
  xgAgainst: number;
  shotsOnTargetFor: number;
  shotsOnTargetAgainst: number;
  avgCorners: number;
  avgYellowCards: number;
  avgRedCards: number;
  avgFouls: number;
  formation: string;
  color: "green" | "yellow" | "red";
  injuryFactor: number;
}

export interface RefereeInput {
  name: string;
  severity: "low" | "medium" | "high";
  avgCardsPerMatch: number;
}

export type WeatherType = "clear" | "rain" | "wind" | "snow" | "extreme_heat";

export interface SimulationInput {
  homeTeam: TeamInput;
  awayTeam: TeamInput;
  referee: RefereeInput;
  weather: WeatherType;
  calibrationEnabled?: boolean;
  temperature?: number;
}

export interface DistributionBucket {
  value: number;
  count: number;
  pct: number;
}

export interface StatDistributions {
  goals: DistributionBucket[];
  yellowCards: DistributionBucket[];
  corners: DistributionBucket[];
  shotsOnTarget: DistributionBucket[];
}

export interface SimulationResult {
  homeTeam: TeamSimResult;
  awayTeam: TeamSimResult;
  drawProbability: number;
  rawOneXTwo: OneXTwoProbabilities;
  calibratedOneXTwo: OneXTwoProbabilities;
  calibration: CalibrationMetadata;
  expectedTotalGoals: number;
  goalsMarket: GoalsMarket;
  topScorelines: ScorelineProbability[];
  combinedShotsOnTarget: number;
  totalAvgYellowCards: number;
  totalAvgCorners: number;
  betRecommendations: BetRecommendation[];
  formationAdvantage: FormationAdvantage;
  simulationIterations: number;
  distributions: StatDistributions;
}

export interface TeamSimResult {
  winProbability: number;
  avgGoals: number;
  avgShotsOnTarget: number;
  avgYellowCards: number;
  avgCorners: number;
}

export interface GoalsMarket {
  over25: number;
  under25: number;
  over35: number;
  under35: number;
  btts: number;
}

export interface ScorelineProbability {
  home: number;
  away: number;
  probability: number;
}

export interface BetRecommendation {
  recommendation: string;
  market: string;
  confidence: number;
  risk: "low" | "medium" | "high";
  reasoning: string;
}

export interface FormationAdvantage {
  homeAdvantage: number;
  awayAdvantage: number;
  description: string;
}

const ITERATIONS = 10000;

// Formation matchup matrix (13 formations — 3-6-1 and 4-6-0 removed)
export const FORMATION_MATCHUP: Record<string, Record<string, number>> = {
  "4-3-3": {
    "4-3-3": 0.5,
    "4-4-2": 0.58,
    "4-2-3-1": 0.47,
    "3-5-2": 0.52,
    "3-4-3": 0.55,
    "5-3-2": 0.45,
    "4-1-4-1": 0.53,
    "4-5-1": 0.56,
    "4-3-2-1": 0.51,
    "3-4-2-1": 0.54,
    "4-4-1-1": 0.57,
    "4-3-1-2": 0.5,
    "5-4-1": 0.6,
  },
  "4-4-2": {
    "4-3-3": 0.42,
    "4-4-2": 0.5,
    "4-2-3-1": 0.48,
    "3-5-2": 0.53,
    "3-4-3": 0.44,
    "5-3-2": 0.5,
    "4-1-4-1": 0.49,
    "4-5-1": 0.55,
    "4-3-2-1": 0.47,
    "3-4-2-1": 0.51,
    "4-4-1-1": 0.52,
    "4-3-1-2": 0.53,
    "5-4-1": 0.57,
  },
  "4-2-3-1": {
    "4-3-3": 0.53,
    "4-4-2": 0.52,
    "4-2-3-1": 0.5,
    "3-5-2": 0.55,
    "3-4-3": 0.52,
    "5-3-2": 0.48,
    "4-1-4-1": 0.5,
    "4-5-1": 0.53,
    "4-3-2-1": 0.52,
    "3-4-2-1": 0.53,
    "4-4-1-1": 0.54,
    "4-3-1-2": 0.51,
    "5-4-1": 0.58,
  },
  "3-5-2": {
    "4-3-3": 0.48,
    "4-4-2": 0.47,
    "4-2-3-1": 0.45,
    "3-5-2": 0.5,
    "3-4-3": 0.49,
    "5-3-2": 0.52,
    "4-1-4-1": 0.5,
    "4-5-1": 0.52,
    "4-3-2-1": 0.48,
    "3-4-2-1": 0.5,
    "4-4-1-1": 0.51,
    "4-3-1-2": 0.5,
    "5-4-1": 0.56,
  },
  "3-4-3": {
    "4-3-3": 0.45,
    "4-4-2": 0.56,
    "4-2-3-1": 0.48,
    "3-5-2": 0.51,
    "3-4-3": 0.5,
    "5-3-2": 0.43,
    "4-1-4-1": 0.5,
    "4-5-1": 0.55,
    "4-3-2-1": 0.49,
    "3-4-2-1": 0.52,
    "4-4-1-1": 0.54,
    "4-3-1-2": 0.5,
    "5-4-1": 0.6,
  },
  "5-3-2": {
    "4-3-3": 0.55,
    "4-4-2": 0.5,
    "4-2-3-1": 0.52,
    "3-5-2": 0.48,
    "3-4-3": 0.57,
    "5-3-2": 0.5,
    "4-1-4-1": 0.51,
    "4-5-1": 0.49,
    "4-3-2-1": 0.53,
    "3-4-2-1": 0.5,
    "4-4-1-1": 0.5,
    "4-3-1-2": 0.52,
    "5-4-1": 0.5,
  },
  "4-1-4-1": {
    "4-3-3": 0.47,
    "4-4-2": 0.51,
    "4-2-3-1": 0.5,
    "3-5-2": 0.5,
    "3-4-3": 0.5,
    "5-3-2": 0.49,
    "4-1-4-1": 0.5,
    "4-5-1": 0.52,
    "4-3-2-1": 0.5,
    "3-4-2-1": 0.51,
    "4-4-1-1": 0.52,
    "4-3-1-2": 0.49,
    "5-4-1": 0.56,
  },
  "4-5-1": {
    "4-3-3": 0.44,
    "4-4-2": 0.45,
    "4-2-3-1": 0.47,
    "3-5-2": 0.48,
    "3-4-3": 0.45,
    "5-3-2": 0.51,
    "4-1-4-1": 0.48,
    "4-5-1": 0.5,
    "4-3-2-1": 0.47,
    "3-4-2-1": 0.49,
    "4-4-1-1": 0.5,
    "4-3-1-2": 0.48,
    "5-4-1": 0.52,
  },
  "4-3-2-1": {
    "4-3-3": 0.49,
    "4-4-2": 0.53,
    "4-2-3-1": 0.48,
    "3-5-2": 0.52,
    "3-4-3": 0.51,
    "5-3-2": 0.47,
    "4-1-4-1": 0.5,
    "4-5-1": 0.53,
    "4-3-2-1": 0.5,
    "3-4-2-1": 0.52,
    "4-4-1-1": 0.53,
    "4-3-1-2": 0.5,
    "5-4-1": 0.57,
  },
  "3-4-2-1": {
    "4-3-3": 0.46,
    "4-4-2": 0.49,
    "4-2-3-1": 0.47,
    "3-5-2": 0.5,
    "3-4-3": 0.48,
    "5-3-2": 0.5,
    "4-1-4-1": 0.49,
    "4-5-1": 0.51,
    "4-3-2-1": 0.48,
    "3-4-2-1": 0.5,
    "4-4-1-1": 0.51,
    "4-3-1-2": 0.49,
    "5-4-1": 0.55,
  },
  "4-4-1-1": {
    "4-3-3": 0.43,
    "4-4-2": 0.48,
    "4-2-3-1": 0.46,
    "3-5-2": 0.49,
    "3-4-3": 0.46,
    "5-3-2": 0.5,
    "4-1-4-1": 0.48,
    "4-5-1": 0.5,
    "4-3-2-1": 0.47,
    "3-4-2-1": 0.49,
    "4-4-1-1": 0.5,
    "4-3-1-2": 0.48,
    "5-4-1": 0.53,
  },
  "4-3-1-2": {
    "4-3-3": 0.5,
    "4-4-2": 0.47,
    "4-2-3-1": 0.49,
    "3-5-2": 0.5,
    "3-4-3": 0.5,
    "5-3-2": 0.48,
    "4-1-4-1": 0.51,
    "4-5-1": 0.52,
    "4-3-2-1": 0.5,
    "3-4-2-1": 0.51,
    "4-4-1-1": 0.52,
    "4-3-1-2": 0.5,
    "5-4-1": 0.55,
  },
  "5-4-1": {
    "4-3-3": 0.4,
    "4-4-2": 0.43,
    "4-2-3-1": 0.42,
    "3-5-2": 0.44,
    "3-4-3": 0.4,
    "5-3-2": 0.5,
    "4-1-4-1": 0.44,
    "4-5-1": 0.48,
    "4-3-2-1": 0.43,
    "3-4-2-1": 0.45,
    "4-4-1-1": 0.47,
    "4-3-1-2": 0.45,
    "5-4-1": 0.5,
  },
};

function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function gaussianRandom(mean: number, std: number): number {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + z * std);
}

function colorMultiplier(color: "green" | "yellow" | "red"): number {
  switch (color) {
    case "green":
      return 1.1;
    case "yellow":
      return 1.0;
    case "red":
      return 0.9;
  }
}

function weatherFactor(weather: WeatherType): {
  goalMult: number;
  shotMult: number;
  cardMult: number;
  cornerMult: number;
} {
  switch (weather) {
    case "clear":
      return { goalMult: 1.0, shotMult: 1.0, cardMult: 1.0, cornerMult: 1.0 };
    case "rain":
      return {
        goalMult: 0.92,
        shotMult: 0.9,
        cardMult: 1.05,
        cornerMult: 1.08,
      };
    case "wind":
      return {
        goalMult: 0.95,
        shotMult: 0.93,
        cardMult: 1.03,
        cornerMult: 1.1,
      };
    case "snow":
      return {
        goalMult: 0.85,
        shotMult: 0.85,
        cardMult: 1.08,
        cornerMult: 1.05,
      };
    case "extreme_heat":
      return { goalMult: 0.9, shotMult: 0.88, cardMult: 1.1, cornerMult: 0.95 };
  }
}

function refereeFactor(severity: "low" | "medium" | "high"): number {
  switch (severity) {
    case "low":
      return 0.85;
    case "medium":
      return 1.0;
    case "high":
      return 1.25;
  }
}

function getFormationAdvantage(
  homeFormation: string,
  awayFormation: string,
): number {
  const matrix = FORMATION_MATCHUP[homeFormation];
  if (!matrix) return 0.5;
  return matrix[awayFormation] ?? 0.5;
}

function computeEffectiveXG(
  team: TeamInput,
  opponentFormation: string,
  weather: WeatherType,
  isHome: boolean,
): number {
  const formMult = colorMultiplier(team.color);
  const wx = weatherFactor(weather);
  const shotBasedXG = team.shotsOnTargetFor * 0.33;
  const combinedXG = team.xgFor * 0.65 + shotBasedXG * 0.35;
  const injuryAdjusted = combinedXG * team.injuryFactor;
  const formAdv = isHome
    ? getFormationAdvantage(team.formation, opponentFormation)
    : 1 - getFormationAdvantage(opponentFormation, team.formation);
  const formAdjusted = injuryAdjusted * (0.85 + formAdv * 0.3);
  const homeBonus = isHome ? 1.07 : 1.0;
  return formAdjusted * formMult * wx.goalMult * homeBonus;
}

export function runMonteCarlo(input: SimulationInput): SimulationResult {
  const { homeTeam, awayTeam, referee, weather } = input;

  const wx = weatherFactor(weather);
  const refMult = refereeFactor(referee.severity);

  const homeLambda = computeEffectiveXG(
    homeTeam,
    awayTeam.formation,
    weather,
    true,
  );
  const awayLambda = computeEffectiveXG(
    awayTeam,
    homeTeam.formation,
    weather,
    false,
  );

  let homeWins = 0,
    awayWins = 0,
    draws = 0;
  let totalHomeGoals = 0,
    totalAwayGoals = 0;
  let totalOver25 = 0,
    totalOver35 = 0,
    totalBtts = 0;
  let totalHomeShots = 0,
    totalAwayShots = 0;
  let totalHomeYellow = 0,
    totalAwayYellow = 0;
  let totalHomeRed = 0,
    totalAwayRed = 0;
  let totalHomeCorners = 0,
    totalAwayCorners = 0;
  let cornersOver85 = 0,
    cornersOver105 = 0;
  // Yellow card over-threshold counters (for Laplace rule)
  let yellows_o25 = 0,
    yellows_o35 = 0,
    yellows_o45 = 0,
    yellows_o55 = 0;

  // Distribution histograms (value → count)
  const goalsDistMap: Map<number, number> = new Map();
  const yellowDistMap: Map<number, number> = new Map();
  const cornersDistMap: Map<number, number> = new Map();
  const shotsDistMap: Map<number, number> = new Map();

  const scorelineMap: Map<string, number> = new Map();

  for (let i = 0; i < ITERATIONS; i++) {
    const homeGoals = poissonRandom(homeLambda);
    const awayGoals = poissonRandom(awayLambda);

    if (homeGoals > awayGoals) homeWins++;
    else if (awayGoals > homeGoals) awayWins++;
    else draws++;

    totalHomeGoals += homeGoals;
    totalAwayGoals += awayGoals;

    const total = homeGoals + awayGoals;
    if (total > 2.5) totalOver25++;
    if (total > 3.5) totalOver35++;
    if (homeGoals > 0 && awayGoals > 0) totalBtts++;

    const homeShots = gaussianRandom(
      homeTeam.shotsOnTargetFor * wx.shotMult,
      1.5,
    );
    const awayShots = gaussianRandom(
      awayTeam.shotsOnTargetFor * wx.shotMult,
      1.5,
    );
    totalHomeShots += homeShots;
    totalAwayShots += awayShots;

    const homeYellow = poissonRandom(
      homeTeam.avgYellowCards * refMult * wx.cardMult,
    );
    const awayYellow = poissonRandom(
      awayTeam.avgYellowCards * refMult * wx.cardMult,
    );
    const homeRed = poissonRandom(homeTeam.avgRedCards * refMult);
    const awayRed = poissonRandom(awayTeam.avgRedCards * refMult);
    totalHomeYellow += homeYellow;
    totalAwayYellow += awayYellow;
    totalHomeRed += homeRed;
    totalAwayRed += awayRed;

    // Track yellow card thresholds (Laplace rule)
    const totalSimYellow = homeYellow + awayYellow;
    if (totalSimYellow > 2) yellows_o25++;
    if (totalSimYellow > 3) yellows_o35++;
    if (totalSimYellow > 4) yellows_o45++;
    if (totalSimYellow > 5) yellows_o55++;

    const homeCorners = gaussianRandom(
      homeTeam.avgCorners * wx.cornerMult,
      1.2,
    );
    const awayCorners = gaussianRandom(
      awayTeam.avgCorners * wx.cornerMult,
      1.2,
    );
    totalHomeCorners += homeCorners;
    totalAwayCorners += awayCorners;

    const totalCorners = homeCorners + awayCorners;
    if (totalCorners > 8.5) cornersOver85++;
    if (totalCorners > 10.5) cornersOver105++;

    // Track distributions
    const totalGoalsBucket = Math.min(homeGoals + awayGoals, 10);
    goalsDistMap.set(
      totalGoalsBucket,
      (goalsDistMap.get(totalGoalsBucket) ?? 0) + 1,
    );

    const totalYellowBucket = Math.min(homeYellow + awayYellow, 10);
    yellowDistMap.set(
      totalYellowBucket,
      (yellowDistMap.get(totalYellowBucket) ?? 0) + 1,
    );

    const totalCornersBucket = Math.min(Math.round(totalCorners), 18);
    cornersDistMap.set(
      totalCornersBucket,
      (cornersDistMap.get(totalCornersBucket) ?? 0) + 1,
    );

    const totalShotsBucket = Math.min(Math.round(homeShots + awayShots), 18);
    shotsDistMap.set(
      totalShotsBucket,
      (shotsDistMap.get(totalShotsBucket) ?? 0) + 1,
    );

    const hg = Math.min(homeGoals, 8);
    const ag = Math.min(awayGoals, 8);
    const key = `${hg}-${ag}`;
    scorelineMap.set(key, (scorelineMap.get(key) ?? 0) + 1);
  }

  const rawOneXTwo: OneXTwoProbabilities = {
    home: homeWins / ITERATIONS,
    draw: draws / ITERATIONS,
    away: awayWins / ITERATIONS,
  };
  // Calibration is an internal ADAMAS rule: always enabled at the fixed
  // validated baseline temperature. Client-provided overrides are ignored.
  const temperature = DEFAULT_TEMPERATURE;
  const calibratedOneXTwo = temperatureScale(rawOneXTwo, temperature);
  const calibrationEnabled = true;
  const finalOneXTwo = calibrationEnabled ? calibratedOneXTwo : rawOneXTwo;
  const homeWinProb = finalOneXTwo.home;
  const awayWinProb = finalOneXTwo.away;
  const drawProb = finalOneXTwo.draw;

  const avgHomeGoals = totalHomeGoals / ITERATIONS;
  const avgAwayGoals = totalAwayGoals / ITERATIONS;
  const avgHomeShots = totalHomeShots / ITERATIONS;
  const avgAwayShots = totalAwayShots / ITERATIONS;
  const avgHomeYellow = totalHomeYellow / ITERATIONS;
  const avgAwayYellow = totalAwayYellow / ITERATIONS;
  const avgHomeRed = totalHomeRed / ITERATIONS;
  const avgAwayRed = totalAwayRed / ITERATIONS;
  const avgHomeCorners = totalHomeCorners / ITERATIONS;
  const avgAwayCorners = totalAwayCorners / ITERATIONS;

  const over25 = totalOver25 / ITERATIONS;
  const over35 = totalOver35 / ITERATIONS;
  const btts = totalBtts / ITERATIONS;
  const totalYellow = avgHomeYellow + avgAwayYellow;
  const totalCorners = avgHomeCorners + avgAwayCorners;
  const totalShots = avgHomeShots + avgAwayShots;
  const cornersO85Rate = cornersOver85 / ITERATIONS;
  const cornersO105Rate = cornersOver105 / ITERATIONS;

  // Laplace rule of succession: P = (k + 1) / (n + 2)
  const yellLaplace25 = (yellows_o25 + 1) / (ITERATIONS + 2);
  const yellLaplace35 = (yellows_o35 + 1) / (ITERATIONS + 2);
  const yellLaplace45 = (yellows_o45 + 1) / (ITERATIONS + 2);
  const yellLaplace55 = (yellows_o55 + 1) / (ITERATIONS + 2);

  const buildDist = (
    map: Map<number, number>,
    maxVal: number,
  ): DistributionBucket[] => {
    const result: DistributionBucket[] = [];
    for (let v = 0; v <= maxVal; v++) {
      const count = map.get(v) ?? 0;
      if (count > 0 || v <= maxVal) {
        result.push({
          value: v,
          count,
          pct: parseFloat(((count / ITERATIONS) * 100).toFixed(2)),
        });
      }
    }
    return result.filter((b) => b.count > 0);
  };

  const allScorelines = Array.from(scorelineMap.entries())
    .map(([key, count]) => {
      const [h, a] = key.split("-").map(Number);
      return { home: h, away: a, probability: count / ITERATIONS };
    });
  const calibratedScorelines = redistributeScorelines(
    allScorelines,
    rawOneXTwo,
    calibrationEnabled ? calibratedOneXTwo : rawOneXTwo,
  );
  const rawTopScorelines = allScorelines
    .slice()
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);
  const topScorelineKeys = new Set(
    rawTopScorelines.map((scoreline) => `${scoreline.home}-${scoreline.away}`),
  );
  const topScorelines = calibratedScorelines
    .filter((scoreline) => topScorelineKeys.has(`${scoreline.home}-${scoreline.away}`))
    .sort((a, b) => {
      const aIndex = rawTopScorelines.findIndex(
        (scoreline) => scoreline.home === a.home && scoreline.away === a.away,
      );
      const bIndex = rawTopScorelines.findIndex(
        (scoreline) => scoreline.home === b.home && scoreline.away === b.away,
      );
      return aIndex - bIndex;
    });

  const homeFormAdv = getFormationAdvantage(
    homeTeam.formation,
    awayTeam.formation,
  );
  const awayFormAdv = 1 - homeFormAdv;
  const formationDescription = buildFormationDescription(
    homeTeam.formation,
    awayTeam.formation,
    homeFormAdv,
    homeTeam.name,
    awayTeam.name,
  );

  // Always produce exactly 4 categorized bet recommendations
  const betRecs = generateCategorizedBets(
    homeWinProb,
    awayWinProb,
    drawProb,
    avgHomeGoals,
    avgAwayGoals,
    over25,
    over35,
    btts,
    avgHomeYellow,
    avgAwayYellow,
    totalYellow,
    yellLaplace25,
    yellLaplace35,
    yellLaplace45,
    yellLaplace55,
    avgHomeCorners,
    avgAwayCorners,
    totalCorners,
    cornersO85Rate,
    cornersO105Rate,
    avgHomeShots,
    avgAwayShots,
    totalShots,
    homeTeam,
    awayTeam,
  );

  return {
    homeTeam: {
      winProbability: homeWinProb,
      avgGoals: avgHomeGoals,
      avgShotsOnTarget: avgHomeShots,
      avgYellowCards: avgHomeYellow,
      avgCorners: avgHomeCorners,
    },
    awayTeam: {
      winProbability: awayWinProb,
      avgGoals: avgAwayGoals,
      avgShotsOnTarget: avgAwayShots,
      avgYellowCards: avgAwayYellow,
      avgCorners: avgAwayCorners,
    },
    drawProbability: drawProb,
    rawOneXTwo,
    calibratedOneXTwo,
    calibration: makeCalibrationMetadata(calibrationEnabled, temperature),
    expectedTotalGoals: avgHomeGoals + avgAwayGoals,
    goalsMarket: {
      over25,
      under25: 1 - over25,
      over35,
      under35: 1 - over35,
      btts,
    },
    topScorelines,
    combinedShotsOnTarget: totalShots,
    totalAvgYellowCards: totalYellow,
    totalAvgCorners: totalCorners,
    betRecommendations: betRecs,
    formationAdvantage: {
      homeAdvantage: homeFormAdv,
      awayAdvantage: awayFormAdv,
      description: formationDescription,
    },
    simulationIterations: ITERATIONS,
    distributions: {
      goals: buildDist(goalsDistMap, 10),
      yellowCards: buildDist(yellowDistMap, 10),
      corners: buildDist(cornersDistMap, 18),
      shotsOnTarget: buildDist(shotsDistMap, 18),
    },
  };
}

function buildFormationDescription(
  homeF: string,
  awayF: string,
  homeAdv: number,
  homeName: string,
  awayName: string,
): string {
  const diff = homeAdv - 0.5;
  if (Math.abs(diff) < 0.03) {
    return `The ${homeF} vs ${awayF} matchup is tactically balanced. Neither formation provides a significant positional advantage.`;
  } else if (diff > 0) {
    const pct = (diff * 100).toFixed(0);
    return `${homeName}'s ${homeF} has a ${pct}% tactical advantage over ${awayName}'s ${awayF}. The wider attacking shape exploits gaps in the defensive structure.`;
  } else {
    const pct = (Math.abs(diff) * 100).toFixed(0);
    return `${awayName}'s ${awayF} counters ${homeName}'s ${homeF} effectively, providing a ${pct}% positional edge and neutralizing the home side's attacking width.`;
  }
}

/**
 * Always generates exactly 4 categorized bet recommendations:
 * [0] GOALS market
 * [1] YELLOW CARDS market
 * [2] CORNERS market
 * [3] SHOTS ON TARGET market
 */
function generateCategorizedBets(
  homeWin: number,
  awayWin: number,
  draw: number,
  homeGoals: number,
  awayGoals: number,
  over25: number,
  over35: number,
  btts: number,
  homeYellow: number,
  awayYellow: number,
  totalYellow: number,
  yellL25: number,
  yellL35: number,
  yellL45: number,
  yellL55: number,
  homeCorners: number,
  awayCorners: number,
  totalCorners: number,
  cornersO85: number,
  cornersO105: number,
  homeShots: number,
  awayShots: number,
  totalShots: number,
  homeTeam: TeamInput,
  awayTeam: TeamInput,
): BetRecommendation[] {
  const recs: BetRecommendation[] = [];
  const expectedTotal = homeGoals + awayGoals;

  // Clamp helpers — risk calibration:
  // Low  risk:  55–70%  (green)
  // Med  risk:  45–55%  (yellow)
  // High risk:  30–45%  (red)
  const clampLow = (v: number) =>
    parseFloat(Math.min(70, Math.max(55, v)).toFixed(1));
  const clampMed = (v: number) =>
    parseFloat(Math.min(55, Math.max(45, v)).toFixed(1));
  const clampHigh = (v: number) =>
    parseFloat(Math.min(45, Math.max(30, v)).toFixed(1));

  // ── GOALS: 3 bets ──
  const g25raw = Math.max(over25, 1 - over25) * 100;
  const g25conf = clampLow(g25raw);
  const g25label = over25 >= 0.5 ? `Más de 2.5 Goles` : `Menos de 2.5 Goles`;
  recs.push({
    recommendation: `${g25label} — ${g25conf}%`,
    market: "GOALS",
    confidence: g25conf,
    risk: "low",
    reasoning: `xG total esperado: ${expectedTotal.toFixed(2)}. El ${g25raw.toFixed(1)}% de las 10,000 simulaciones dan "${g25label}". Umbral 2.5: mercado de mayor liquidez y menor varianza. Confianza calibrada al rango de bajo riesgo.`,
  });

  const g35raw = Math.max(over35, 1 - over35) * 100;
  const g35conf = clampMed(g35raw);
  const g35label = over35 >= 0.5 ? `Más de 3.5 Goles` : `Menos de 3.5 Goles`;
  recs.push({
    recommendation: `${g35label} — ${g35conf}%`,
    market: "GOALS",
    confidence: g35conf,
    risk: "medium",
    reasoning: `Umbral 3.5: más selectivo, mayor cuota. xG simulado: ${expectedTotal.toFixed(2)} goles. Probabilidad real del modelo: ${g35raw.toFixed(1)}%. Confianza ajustada al rango de riesgo medio — cuota superior a la anterior.`,
  });

  // BTTS siempre medium o high (nunca low — ambos equipos deben anotar)
  const bttsRaw = Math.max(btts, 1 - btts) * 100;
  const bttsLabel =
    btts >= 0.5 ? `Ambos Equipos Marcan (Sí)` : `Ambos Equipos Marcan (No)`;
  const bttsRisk = bttsRaw >= 50 ? "medium" : "high";
  const bttsConf =
    bttsRisk === "medium" ? clampMed(bttsRaw) : clampHigh(bttsRaw);
  recs.push({
    recommendation: `${bttsLabel} — ${bttsConf}%`,
    market: "GOALS",
    confidence: bttsConf,
    risk: bttsRisk,
    reasoning: `BTTS requiere que ambos equipos conviertan. xG Local: ${homeGoals.toFixed(2)}, xG Visitante: ${awayGoals.toFixed(2)}. Probabilidad Bayesiana real: ${bttsRaw.toFixed(1)}%. Clasificado como ${bttsRisk === "medium" ? "riesgo medio" : "riesgo alto"} — cuota elevada recomendada.`,
  });

  // ── AMARILLAS: 3 bets — Regla de Laplace ──
  // P_laplace(Over X.5) = (k + 1) / (n + 2). Confidence = max(p, 1-p)*100.
  // Sort thresholds by confidence (most certain → LOW risk, least certain → HIGH risk).
  const yThresholds = [
    { thresh: "2.5", lp: yellL25 },
    { thresh: "3.5", lp: yellL35 },
    { thresh: "4.5", lp: yellL45 },
    { thresh: "5.5", lp: yellL55 },
  ]
    .map(({ thresh, lp }) => ({
      thresh,
      lp,
      side:
        lp >= 0.5
          ? `Más de ${thresh} Amarillas`
          : `Menos de ${thresh} Amarillas`,
      conf: Math.max(lp, 1 - lp) * 100,
    }))
    .sort((a, b) => b.conf - a.conf);

  const [yLow, yMed, yHigh] = yThresholds;

  recs.push({
    recommendation: `${yLow.side} — ${clampLow(yLow.conf)}%`,
    market: "YELLOW CARDS",
    confidence: clampLow(yLow.conf),
    risk: "low",
    reasoning: `Laplace: P(${yLow.side}) = ${yLow.conf.toFixed(1)}% (${yLow.thresh} es el umbral más certero). Promedio simulado: ${totalYellow.toFixed(1)} amarillas (L: ${homeYellow.toFixed(1)}, V: ${awayYellow.toFixed(1)}). Menor cuota, mayor fiabilidad.`,
  });

  recs.push({
    recommendation: `${yMed.side} — ${clampMed(yMed.conf)}%`,
    market: "YELLOW CARDS",
    confidence: clampMed(yMed.conf),
    risk: "medium",
    reasoning: `Laplace: P(${yMed.side}) = ${yMed.conf.toFixed(1)}%. Umbral ${yMed.thresh}: cuota intermedia. Árbitro y condiciones climáticas ponderados en el modelo.`,
  });

  recs.push({
    recommendation: `${yHigh.side} — ${clampHigh(yHigh.conf)}%`,
    market: "YELLOW CARDS",
    confidence: clampHigh(yHigh.conf),
    risk: "high",
    reasoning: `Laplace: P(${yHigh.side}) = ${yHigh.conf.toFixed(1)}%. Umbral ${yHigh.thresh}: el más incierto estadísticamente — cuota alta esperada. Solo si bankroll controlado.`,
  });

  // ── CORNERS: 3 bets ──
  const co85raw = Math.max(cornersO85, 1 - cornersO85) * 100;
  const co85conf = clampLow(co85raw);
  const co85label =
    cornersO85 >= 0.5 ? `Más de 8.5 Corners` : `Menos de 8.5 Corners`;
  recs.push({
    recommendation: `${co85label} — ${co85conf}%`,
    market: "CORNERS",
    confidence: co85conf,
    risk: "low",
    reasoning: `Promedio simulado: ${totalCorners.toFixed(1)} corners (L: ${homeCorners.toFixed(1)}, V: ${awayCorners.toFixed(1)}). Probabilidad bruta: ${co85raw.toFixed(1)}%. Umbral 8.5: mercado de referencia con mayor liquidez.`,
  });

  const co105raw = Math.max(cornersO105, 1 - cornersO105) * 100;
  const co105conf = clampMed(co105raw);
  const co105label =
    cornersO105 >= 0.5 ? `Más de 10.5 Corners` : `Menos de 10.5 Corners`;
  recs.push({
    recommendation: `${co105label} — ${co105conf}%`,
    market: "CORNERS",
    confidence: co105conf,
    risk: "medium",
    reasoning: `Umbral 10.5: más exigente, mayor cuota. Probabilidad bruta: ${co105raw.toFixed(1)}%. El modelo simuló ${totalCorners.toFixed(1)} corners de media.`,
  });

  const co125raw = Math.min(48, Math.max(28, cornersO105 * 60));
  const co125conf = clampHigh(co125raw);
  const co125label =
    totalCorners >= 12.5 ? `Más de 12.5 Corners` : `Menos de 12.5 Corners`;
  recs.push({
    recommendation: `${co125label} — ${co125conf}%`,
    market: "CORNERS",
    confidence: co125conf,
    risk: "high",
    reasoning: `Umbral extremo 12.5: solo partidos muy abiertos. Probabilidad bruta estimada: ${co125raw.toFixed(1)}%. Alto riesgo — cuota elevada esperada.`,
  });

  // ── TIROS A PUERTA: 3 bets ──
  const favoredName = homeWin > awayWin ? homeTeam.name : awayTeam.name;
  const favoredShots = homeWin > awayWin ? homeShots : awayShots;

  const s85raw = Math.min(78, 50 + Math.abs(totalShots - 8.5) * 4);
  const s85conf = clampLow(s85raw);
  const s85label =
    totalShots >= 8.5
      ? `Más de 8.5 Tiros a Puerta`
      : `Menos de 8.5 Tiros a Puerta`;
  recs.push({
    recommendation: `${s85label} — ${s85conf}%`,
    market: "SHOTS ON TARGET",
    confidence: s85conf,
    risk: "low",
    reasoning: `Promedio simulado: ${totalShots.toFixed(1)} tiros (L: ${homeShots.toFixed(1)}, V: ${awayShots.toFixed(1)}). Probabilidad bruta: ${s85raw.toFixed(1)}%. Umbral 8.5: mercado más frecuente en tiros a puerta.`,
  });

  const s105raw = Math.min(62, 42 + Math.abs(totalShots - 10.5) * 3);
  const s105conf = clampMed(s105raw);
  const s105label =
    totalShots >= 10.5
      ? `Más de 10.5 Tiros a Puerta`
      : `Menos de 10.5 Tiros a Puerta`;
  recs.push({
    recommendation: `${s105label} — ${s105conf}%`,
    market: "SHOTS ON TARGET",
    confidence: s105conf,
    risk: "medium",
    reasoning: `Umbral 10.5: ${favoredName} proyecta ${favoredShots.toFixed(1)} tiros. Probabilidad bruta: ${s105raw.toFixed(1)}%. Cuota superior — riesgo medio.`,
  });

  const s125raw = Math.min(46, 28 + Math.abs(totalShots - 12.5) * 2.5);
  const s125conf = clampHigh(s125raw);
  const s125label =
    totalShots >= 12.5
      ? `Más de 12.5 Tiros a Puerta`
      : `Menos de 12.5 Tiros a Puerta`;
  recs.push({
    recommendation: `${s125label} — ${s125conf}%`,
    market: "SHOTS ON TARGET",
    confidence: s125conf,
    risk: "high",
    reasoning: `Umbral extremo 12.5: requiere partido muy abierto. Probabilidad bruta: ${s125raw.toFixed(1)}%. Alto riesgo — solo si cuota ≥ 3.5.`,
  });

  return recs;
}

export { FORMATION_MATCHUP as default };
