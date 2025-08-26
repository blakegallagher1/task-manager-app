/**
 * Simulator for Legacy Vision
 * Contains functions to run Monte Carlo simulations for portfolio allocations,
 * generate pillar recommendations and 3-year action plan.
 */

function simulatePortfolio(portfolio, riskTolerance, horizonYears = 20, trials = 500) {
  const sectors = {
    industrial: { mean: 0.08, volatility: 0.12 },
    multifamily: { mean: 0.07, volatility: 0.1 },
    hospitality: { mean: 0.1, volatility: 0.2 },
    office: { mean: 0.05, volatility: 0.09 },
    retail: { mean: 0.06, volatility: 0.11 }
  };

  function normalRandom() {
    // Box-Muller transform to generate standard normal random number
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const results = [];
  for (let t = 0; t < trials; t++) {
    let value = 1.0;
    for (let year = 0; year < horizonYears; year++) {
      let annualReturn = 0;
      for (const sector in portfolio) {
        const weight = portfolio[sector] / 100;
        const params = sectors[sector] || sectors['industrial'];
        const shock = normalRandom() * params.volatility;
        annualReturn += weight * (params.mean + shock);
      }
      value *= 1 + annualReturn;
    }
    // compute internal rate of return (approx)
    const irr = Math.pow(value, 1 / horizonYears) - 1;
    results.push({ finalValue: value, irr });
  }
  // summarise statistics
  results.sort((a, b) => a.finalValue - b.finalValue);
  const avgIRR = results.reduce((acc, r) => acc + r.irr, 0) / results.length;
  const best = results[results.length - 1].finalValue;
  const worst = results[0].finalValue;
  const meanMultiple = results.reduce((acc, r) => acc + r.finalValue, 0) / results.length;
  return {
    results,
    summary: {
      averageIRR: avgIRR,
      bestMultiple: best,
      worstMultiple: worst,
      meanMultiple
    }
  };
}

function generateActionPlan(riskTolerance) {
  const lowPlan = [
    "Focus on stable income-producing assets.",
    "Increase cash reserves and reduce leverage.",
    "Seek partnerships with experienced operators."
  ];
  const mediumPlan = [
    "Pursue balanced expansion into new sectors.",
    "Invest in operational efficiency upgrades.",
    "Build pipeline of future development sites."
  ];
  const highPlan = [
    "Aggressively acquire value-add and opportunistic deals.",
    "Experiment with new sectors and technologies.",
    "Secure flexible capital sources to capitalise on dislocations."
  ];
  if (riskTolerance === 'low') return lowPlan;
  if (riskTolerance === 'high') return highPlan;
  return mediumPlan;
}

function generatePillarRecommendations(portfolio, riskTolerance) {
  // Example recommendations across strategy pillars
  const rec = {
    industryRole: [],
    growth: [],
    profitability: [],
    organization: [],
    capital: [],
    riskManagement: [],
    implementation: []
  };
  // Example logic: emphasise diversification
  if (portfolio.hospitality > 0) {
    rec.industryRole.push("Hospitality exposure: build expertise in operations and marketing.");
    rec.growth.push("Leverage tourism trends and lifestyle branding.");
  }
  if (portfolio.industrial > 0) {
    rec.industryRole.push("Industrial presence: capitalise on e-commerce logistics.");
    rec.growth.push("Develop or acquire last-mile distribution centers.");
  }
  if (riskTolerance === 'low') {
    rec.riskManagement.push("Prioritise downside protection and long-term leases.");
    rec.capital.push("Maintain conservative leverage and target lower-cost debt.");
  } else if (riskTolerance === 'high') {
    rec.growth.push("Consider opportunistic land development and adaptive reuse.");
    rec.capital.push("Use higher leverage and flexible financing.");
  }
  rec.profitability.push("Implement operational efficiencies and technology upgrades.");
  rec.organization.push("Build a leadership team with expertise across target sectors.");
  rec.implementation.push("Set quarterly targets and assign accountability for each initiative.");
  return rec;
}

module.exports = {
  simulatePortfolio,
  generateActionPlan,
  generatePillarRecommendations
};
