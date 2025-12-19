import type { CalculationResult, ExpenseAllocations, IndustrySector, RiskTolerance, SolutionSelections } from '../types';
import { SOLUTIONS_LIST } from '../constants';

export type SupportedAiReportModel =
  | 'gpt-5.2-2025-12-11'
  | 'grok-4-1-fast'
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5'
  | 'gemini-3-flash-preview';

function companySizeFromRevenue(annualRevenue: number) {
  if (annualRevenue < 50_000_000) return 'Small ($10M-$50M)';
  if (annualRevenue < 500_000_000) return 'Mid-Market ($50M-$500M)';
  return 'Enterprise ($500M+)';
}

export type AiReportPayload = {
  companyProfile: {
    annualRevenue: number;
    industrySector: IndustrySector;
    companySize: string;
    riskTolerance: RiskTolerance;
  };
  expenseStructure: {
    inventoryCarrying: { percent: number; dollars: number };
    warehousingLogistics: { percent: number; dollars: number };
    salesMarketingCS: { percent: number; dollars: number };
    orderProcessing: { percent: number; dollars: number };
    returnsObsolescence: { percent: number; dollars: number };
    itCosts: { percent: number; dollars: number };
    riskCompliance: { percent: number; dollars: number };
  };
  selectedSolutions: string[];
  results: {
    totalSavings: number;
    savingsRange: { low: number; high: number };
    opexReductionPercent: number;
    categoryBreakdown: Array<{
      category: string;
      currentDollars: number;
      impactPercent: number;
      savingsDollars: number;
      savingsRange: { low: number; high: number };
    }>;
  };
};

export function buildAiReportPayload(params: {
  revenue: number;
  industry: IndustrySector;
  riskTolerance: RiskTolerance;
  allocations: ExpenseAllocations;
  solutions: SolutionSelections;
  results: CalculationResult;
}): AiReportPayload {
  const { revenue, industry, riskTolerance, allocations, solutions, results } = params;

  const selectedSolutionNames = SOLUTIONS_LIST.filter((s) => solutions[s.key]).map((s) => s.label);

  const categoryBreakdown = results.categories.map((c) => ({
    category: c.name,
    currentDollars: c.currentDollars,
    impactPercent: c.efficiencyTarget * 100,
    savingsDollars: c.savingsTarget,
    savingsRange: { low: c.savingsLow, high: c.savingsHigh },
  }));

  const expense = (key: keyof ExpenseAllocations) => {
    const frac = allocations[key];
    const percent = frac * 100;
    const dollars = revenue * frac;
    return { percent, dollars };
  };

  return {
    companyProfile: {
      annualRevenue: revenue,
      industrySector: industry,
      companySize: companySizeFromRevenue(revenue),
      riskTolerance,
    },
    expenseStructure: {
      inventoryCarrying: expense('inventoryCarrying'),
      warehousingLogistics: expense('warehousingLogistics'),
      salesMarketingCS: expense('salesMarketingCS'),
      orderProcessing: expense('orderProcessing'),
      returnsObsolescence: expense('returnsObsolescence'),
      itCosts: expense('itCosts'),
      riskCompliance: expense('riskCompliance'),
    },
    selectedSolutions: selectedSolutionNames,
    results: {
      totalSavings: results.totalSavingsTarget,
      savingsRange: { low: results.totalSavingsLow, high: results.totalSavingsHigh },
      opexReductionPercent: results.totalCostReductionTarget * 100,
      categoryBreakdown,
    },
  };
}
