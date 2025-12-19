
export type IndustrySector = 
  | 'Food & Beverage'
  | 'Industrial Distribution'
  | 'Retail/E-commerce'
  | 'Pharmaceutical'
  | 'Technology/Electronics'
  | 'Fashion/Apparel'
  | 'CPG';

export type CompanySize = 
  | 'Small ($10M-$50M)'
  | 'Mid-Market ($50M-$500M)'
  | 'Enterprise ($500M+)';

export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';

// Keys match the logic requirements
export interface ExpenseAllocations {
  inventoryCarrying: number;
  warehousingLogistics: number;
  salesMarketingCS: number;
  orderProcessing: number;
  returnsObsolescence: number;
  itCosts: number;
  riskCompliance: number;
}

export interface SolutionSelections {
  demandForecasting: boolean;
  inventoryPlanning: boolean;
  supplierLeadTime: boolean;
  skuRationalization: boolean;
  warehouseSlotting: boolean;
  cycleCounting: boolean;
  orderOptimization: boolean;
  inventoryVisibility: boolean;
  obsolescenceControl: boolean;
}

export interface CategoryResult {
  categoryKey: keyof ExpenseAllocations;
  name: string;
  currentDollars: number;
  allocationPercent: number;

  // Range (min/max) Estimates across scenarios
  savingsLow: number;
  efficiencyLow: number;

  savingsHigh: number;
  efficiencyHigh: number;

  // Selected Risk Tolerance Target
  savingsTarget: number;
  efficiencyTarget: number;
}

export interface CalculationResult {
  totalSavingsLow: number;
  totalSavingsHigh: number;
  totalSavingsTarget: number;
  totalCostReductionLow: number;
  totalCostReductionHigh: number;
  totalCostReductionTarget: number;
  categories: CategoryResult[];
}
