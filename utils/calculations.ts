
import { 
  ExpenseAllocations, 
  SolutionSelections, 
  CategoryResult, 
  CalculationResult, 
  RiskTolerance,
  IndustrySector
} from '../types';
import { 
  EXPENSE_CATEGORIES, 
  SOLUTION_IMPACTS, 
  CORRELATION_MATRIX, 
  DEFAULT_EXPENSES,
  INDUSTRY_MULTIPLIERS
} from '../constants';

const getCompanySizeMultiplier = (revenue: number): number => {
  if (revenue < 50000000) return 0.50; // Small
  if (revenue < 500000000) return 0.70; // Mid
  return 0.80; // Enterprise
};

const getCompoundDiscount = (scenario: RiskTolerance): number => {
  switch (scenario) {
    case 'Conservative': return 0.70;
    case 'Moderate': return 0.78;
    case 'Aggressive': return 0.85;
    default: return 0.70;
  }
};

const getIndustryMultiplier = (industry: IndustrySector): number => {
  const m = INDUSTRY_MULTIPLIERS[industry] ?? 1.0;
  // Hard clamp for safety.
  return Math.min(1.15, Math.max(0.85, m));
};

const calculateScenario = (
  scenario: RiskTolerance,
  expenses: ExpenseAllocations,
  selectedSolutions: (keyof SolutionSelections)[],
  sizeMultiplier: number
): Record<keyof ExpenseAllocations, number> => {
  
  const compoundDiscount = getCompoundDiscount(scenario);
  const selectedCount = selectedSolutions.length;
  const impactKey = scenario.toLowerCase() as 'conservative' | 'moderate' | 'aggressive';
  
  // 1. Calculate Raw Direct Impact
  const directImpacts: Record<keyof ExpenseAllocations, number> = { ...DEFAULT_EXPENSES };
  (Object.keys(expenses) as (keyof ExpenseAllocations)[]).forEach(k => directImpacts[k] = 0);

  (Object.keys(expenses) as (keyof ExpenseAllocations)[]).forEach(cat => {
    let sumImpact = 0;
    selectedSolutions.forEach(sol => {
      const impactVal = SOLUTION_IMPACTS[sol][cat][impactKey];
      sumImpact += impactVal;
    });
    directImpacts[cat] = sumImpact;
  });

  // 2. Apply Compound Discount
  const adjustedDirectImpacts = { ...directImpacts };
  if (selectedCount > 1) {
    (Object.keys(adjustedDirectImpacts) as (keyof ExpenseAllocations)[]).forEach(k => {
      adjustedDirectImpacts[k] = adjustedDirectImpacts[k] * compoundDiscount;
    });
  }

  // 3. Apply Size Multiplier
  (Object.keys(adjustedDirectImpacts) as (keyof ExpenseAllocations)[]).forEach(k => {
    adjustedDirectImpacts[k] = adjustedDirectImpacts[k] * sizeMultiplier;
  });

  // 4. Calculate Spillover
  const spilloverImpacts: Record<keyof ExpenseAllocations, number> = { ...DEFAULT_EXPENSES };
  (Object.keys(expenses) as (keyof ExpenseAllocations)[]).forEach(k => spilloverImpacts[k] = 0);

  (Object.keys(adjustedDirectImpacts) as (keyof ExpenseAllocations)[]).forEach(source => {
    const sourceImpact = adjustedDirectImpacts[source];
    if (Math.abs(sourceImpact) > 0.001) {
       const correlations = CORRELATION_MATRIX[source];
       if (correlations) {
         (Object.keys(correlations) as (keyof ExpenseAllocations)[]).forEach(target => {
            const factor = correlations[target] || 0;
            const spillover = (sourceImpact / 0.10) * factor;
            spilloverImpacts[target] += spillover;
         });
       }
    }
  });

  // 5. Cap Spillover & Total
  const finalImpacts = { ...adjustedDirectImpacts };
  const SPILLOVER_CAP_RATIO = 0.50;
  const MAX_CATEGORY_IMPACT = scenario === 'Conservative' ? 0.20 : scenario === 'Moderate' ? 0.40 : 0.60;
  const MIN_CATEGORY_IMPACT = scenario === 'Conservative' ? -0.10 : scenario === 'Moderate' ? -0.20 : -0.30;

  (Object.keys(finalImpacts) as (keyof ExpenseAllocations)[]).forEach(cat => {
    const direct = adjustedDirectImpacts[cat];
    const rawSpill = spilloverImpacts[cat];

    // Only allow positive spillover benefits, and cap them relative to direct impact.
    const positiveSpill = Math.max(0, rawSpill);
    const cappedSpill = Math.min(positiveSpill, Math.max(0, direct) * SPILLOVER_CAP_RATIO);

    let total = direct + cappedSpill;
    total = Math.min(total, MAX_CATEGORY_IMPACT);
    finalImpacts[cat] = Math.max(MIN_CATEGORY_IMPACT, total);
  });

  return finalImpacts;
};

export const calculateROI = (
  revenue: number,
  expenses: ExpenseAllocations,
  solutionFlags: SolutionSelections,
  riskTolerance: RiskTolerance,
  industry: IndustrySector
): CalculationResult => {
  const selectedSolutions = (Object.keys(solutionFlags) as (keyof SolutionSelections)[])
    .filter(k => solutionFlags[k]);

  const sizeMultiplier = getCompanySizeMultiplier(revenue);
  const industryMultiplier = getIndustryMultiplier(industry);
  const combinedMultiplier = sizeMultiplier * industryMultiplier;

  // Run three scenarios
  const conservativeImpacts = calculateScenario('Conservative', expenses, selectedSolutions, combinedMultiplier);
  const aggressiveImpacts = calculateScenario('Aggressive', expenses, selectedSolutions, combinedMultiplier);
  const targetImpacts = calculateScenario(riskTolerance, expenses, selectedSolutions, combinedMultiplier);

  const categories: CategoryResult[] = EXPENSE_CATEGORIES.map(cat => {
    const categoryKey = cat.key;
    const currentDollars = revenue * expenses[categoryKey];

    const efficiencyConservative = conservativeImpacts[categoryKey];
    const efficiencyAggressive = aggressiveImpacts[categoryKey];
    const efficiencyTarget = targetImpacts[categoryKey];

    const efficiencyLow = Math.min(efficiencyConservative, efficiencyAggressive);
    const efficiencyHigh = Math.max(efficiencyConservative, efficiencyAggressive);

    const savingsConservative = currentDollars * efficiencyConservative;
    const savingsAggressive = currentDollars * efficiencyAggressive;
    const savingsTarget = currentDollars * efficiencyTarget;

    const savingsLow = Math.min(savingsConservative, savingsAggressive);
    const savingsHigh = Math.max(savingsConservative, savingsAggressive);

    return {
      categoryKey,
      name: cat.label,
      currentDollars,
      allocationPercent: expenses[categoryKey],
      savingsLow,
      savingsHigh,
      savingsTarget,
      efficiencyLow,
      efficiencyHigh,
      efficiencyTarget
    };
  });

  const totalSavingsLow = categories.reduce((sum, c) => sum + c.savingsLow, 0);
  const totalSavingsHigh = categories.reduce((sum, c) => sum + c.savingsHigh, 0);
  const totalSavingsTarget = categories.reduce((sum, c) => sum + c.savingsTarget, 0);
  
  const totalOpEx = Object.values(expenses).reduce((sum, val) => sum + val, 0) * revenue;
  
  return {
    totalSavingsLow,
    totalSavingsHigh,
    totalSavingsTarget,
    totalCostReductionLow: totalOpEx > 0 ? totalSavingsLow / totalOpEx : 0,
    totalCostReductionHigh: totalOpEx > 0 ? totalSavingsHigh / totalOpEx : 0,
    totalCostReductionTarget: totalOpEx > 0 ? totalSavingsTarget / totalOpEx : 0,
    categories
  };
};
