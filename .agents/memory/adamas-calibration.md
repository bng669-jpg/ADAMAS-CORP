---
name: ADAMAS calibration
description: Product decision for calibrating ADAMAS 1X2 probabilities without changing the football simulation engine.
---

ADAMAS should calibrate only the final 1X2 probabilities after Monte Carlo simulation. Temperature Scaling is the initial method, with calibration enabled by default but exposed as an explicit comparison toggle.

**Why:** The historical review found weak 1X2 accuracy and overconfident favorites while correct scorelines remained useful. Changing xG, Poisson, weather, injuries, formations, or the scoreline generator would mix calibration and model changes.

**How to apply:** Keep original and calibrated 1X2 values visible for comparison. Use temperature values above 1 to soften confidence while preserving outcome ordering. Redistribute scoreline probability proportionally within home-win, draw, and away-win groups so the scoreline distribution stays coherent; preserve the existing Top 10 scoreline set and order. Fit or judge the temperature only against a historical dataset with actual outcomes using Brier, Log Loss, ECE, Accuracy, and Top 3/Top 6 coverage.