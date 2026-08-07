export interface OneXTwoProbabilities {
  home: number;
  draw: number;
  away: number;
}

export interface CalibrationMetadata {
  enabled: boolean;
  method: "temperature-scaling";
  temperature: number;
  description: string;
}

export interface ScorelineLike {
  home: number;
  away: number;
  probability: number;
}

export const DEFAULT_TEMPERATURE = 1.3;

function normalize(probabilities: OneXTwoProbabilities): OneXTwoProbabilities {
  const total = probabilities.home + probabilities.draw + probabilities.away;
  if (!Number.isFinite(total) || total <= 0) {
    return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 };
  }

  return {
    home: probabilities.home / total,
    draw: probabilities.draw / total,
    away: probabilities.away / total,
  };
}

/**
 * Temperature scaling applies softmax(log(p) / T) to an already-computed
 * categorical probability distribution. T > 1 reduces overconfidence while
 * preserving the ordering of the three outcomes.
 */
export function temperatureScale(
  probabilities: OneXTwoProbabilities,
  temperature = DEFAULT_TEMPERATURE,
): OneXTwoProbabilities {
  const safeTemperature =
    Number.isFinite(temperature) && temperature > 0 ? temperature : DEFAULT_TEMPERATURE;
  const normalized = normalize(probabilities);
  const values = [normalized.home, normalized.draw, normalized.away].map((probability) =>
    Math.pow(Math.max(probability, Number.EPSILON), 1 / safeTemperature),
  );
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    home: values[0] / total,
    draw: values[1] / total,
    away: values[2] / total,
  };
}

function outcomeForScoreline(scoreline: ScorelineLike): keyof OneXTwoProbabilities {
  if (scoreline.home > scoreline.away) return "home";
  if (scoreline.away > scoreline.home) return "away";
  return "draw";
}

/**
 * Redistributes every scoreline's probability inside its 1X2 group. The
 * multiplier is constant within a group, so scoreline ordering is unchanged
 * and the complete distribution remains coherent with the calibrated 1X2.
 */
export function redistributeScorelines(
  scorelines: ScorelineLike[],
  raw: OneXTwoProbabilities,
  calibrated: OneXTwoProbabilities,
): ScorelineLike[] {
  const groupTotals: OneXTwoProbabilities = { home: 0, draw: 0, away: 0 };
  for (const scoreline of scorelines) {
    groupTotals[outcomeForScoreline(scoreline)] += scoreline.probability;
  }

  return scorelines.map((scoreline) => {
    const outcome = outcomeForScoreline(scoreline);
    const rawGroupTotal = groupTotals[outcome] || raw[outcome];
    const factor = rawGroupTotal > 0 ? calibrated[outcome] / rawGroupTotal : 1;
    return {
      ...scoreline,
      probability: scoreline.probability * factor,
    };
  });
}

export function makeCalibrationMetadata(
  enabled: boolean,
  temperature: number,
): CalibrationMetadata {
  return {
    enabled,
    method: "temperature-scaling",
    temperature,
    description:
      "Recalibra únicamente las probabilidades 1X2 después de la simulación; no modifica el motor Monte Carlo.",
  };
}