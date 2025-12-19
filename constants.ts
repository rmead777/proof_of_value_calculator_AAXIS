import { ExpenseAllocations, SolutionSelections, IndustrySector } from './types';

export const EXPENSE_CATEGORIES: { key: keyof ExpenseAllocations; label: string; tooltip: string; benchmarkRange: [number, number] }[] = [
  { 
    key: 'inventoryCarrying', 
    label: 'Inventory Carrying / Holding Cost', 
    tooltip: 'Cost of capital, storage, insurance, and taxes associated with holding inventory.',
    benchmarkRange: [0.02, 0.06]
  },
  { 
    key: 'warehousingLogistics', 
    label: 'Warehousing & Logistics', 
    tooltip: 'Outbound transportation and internal warehousing operational costs.',
    benchmarkRange: [0.05, 0.10]
  },
  { 
    key: 'salesMarketingCS', 
    label: 'Sales, Marketing, & CX', 
    tooltip: 'Costs related to customer acquisition, retention, and support.',
    benchmarkRange: [0.06, 0.12]
  },
  { 
    key: 'orderProcessing', 
    label: 'Order Processing / Back-Office', 
    tooltip: 'Administrative costs for processing orders and managing data.',
    benchmarkRange: [0.03, 0.08]
  },
  { 
    key: 'returnsObsolescence', 
    label: 'Returns & Obsolescence', 
    tooltip: 'Costs from returned goods, shrinkage, and inventory write-offs.',
    benchmarkRange: [0.01, 0.03]
  },
  { 
    key: 'itCosts', 
    label: 'IT (Supply Chain)', 
    tooltip: 'Technology infrastructure expenses supporting supply chain operations.',
    benchmarkRange: [0.01, 0.03]
  },
  { 
    key: 'riskCompliance', 
    label: 'Risk & Compliance', 
    tooltip: 'Regulatory compliance, auditing, and risk mitigation costs.',
    benchmarkRange: [0.005, 0.02]
  },
];

export const SOLUTIONS_LIST: { key: keyof SolutionSelections; label: string; description: string }[] = [
  { key: 'demandForecasting', label: 'Demand Forecasting AI', description: 'AI-driven demand prediction.' },
  { key: 'inventoryPlanning', label: 'Inventory Planning', description: 'Automated replenishment and planning.' },
  { key: 'supplierLeadTime', label: 'Supplier Reliability', description: 'Lead time analytics and scoring.' },
  { key: 'skuRationalization', label: 'SKU Rationalization', description: 'Portfolio performance optimization.' },
  { key: 'warehouseSlotting', label: 'Warehouse Slotting', description: 'Optimized layout and pick paths.' },
  { key: 'cycleCounting', label: 'Cycle Counting', description: 'Inventory accuracy automation.' },
  { key: 'orderOptimization', label: 'Order Optimization', description: 'Order consolidation and routing.' },
  { key: 'inventoryVisibility', label: 'Real-Time Visibility', description: 'End-to-end stock tracking.' },
  { key: 'obsolescenceControl', label: 'Obsolescence Control', description: 'Aging stock management.' },
];

export const DEFAULT_EXPENSES: ExpenseAllocations = {
  inventoryCarrying: 0.04,
  warehousingLogistics: 0.08,
  salesMarketingCS: 0.10,
  orderProcessing: 0.05,
  returnsObsolescence: 0.02,
  itCosts: 0.015,
  riskCompliance: 0.01
};

// Industry multiplier applied to savings potential. Keep this narrow to avoid overfitting.
export const INDUSTRY_MULTIPLIERS: Record<IndustrySector, number> = {
  'Industrial Distribution': 1.0,
  'Food & Beverage': 1.03,
  'Retail/E-commerce': 1.06,
  'Pharmaceutical': 0.97,
  'Technology/Electronics': 1.02,
  'Fashion/Apparel': 1.04,
  'CPG': 1.01,
};

// Impact Matrix: [Conservative, Moderate, Aggressive]
// Values are POSITIVE representing REDUCTION percentage (e.g., 0.03 = 3% reduction)
// We invert the negative signs from the prompt for easier calculation (savings = cost * reduction)
export const SOLUTION_IMPACTS: Record<keyof SolutionSelections, Record<keyof ExpenseAllocations, { conservative: number; moderate: number; aggressive: number }>> = {
  demandForecasting: {
    inventoryCarrying: { conservative: 0.03, moderate: 0.065, aggressive: 0.10 },
    warehousingLogistics: { conservative: 0.02, moderate: 0.04, aggressive: 0.05 },
    salesMarketingCS: { conservative: -0.01, moderate: -0.025, aggressive: -0.03 }, // Cost INCREASE (investment)
    orderProcessing: { conservative: 0.02, moderate: 0.04, aggressive: 0.05 },
    returnsObsolescence: { conservative: 0.05, moderate: 0.125, aggressive: 0.15 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.02, moderate: 0.04, aggressive: 0.05 }
  },
  inventoryPlanning: {
    inventoryCarrying: { conservative: 0.05, moderate: 0.15, aggressive: 0.20 },
    warehousingLogistics: { conservative: 0.03, moderate: 0.075, aggressive: 0.10 },
    salesMarketingCS: { conservative: -0.01, moderate: -0.035, aggressive: -0.05 },
    orderProcessing: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 },
    returnsObsolescence: { conservative: 0.10, moderate: 0.20, aggressive: 0.25 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 }
  },
  supplierLeadTime: {
    inventoryCarrying: { conservative: 0.08, moderate: 0.15, aggressive: 0.18 },
    warehousingLogistics: { conservative: 0.10, moderate: 0.175, aggressive: 0.20 },
    salesMarketingCS: { conservative: -0.05, moderate: -0.10, aggressive: -0.12 },
    orderProcessing: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 },
    returnsObsolescence: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 }
  },
  skuRationalization: {
    inventoryCarrying: { conservative: 0.10, moderate: 0.20, aggressive: 0.25 },
    warehousingLogistics: { conservative: 0.08, moderate: 0.15, aggressive: 0.18 },
    salesMarketingCS: { conservative: 0.05, moderate: 0.04, aggressive: 0.0 },
    orderProcessing: { conservative: 0.05, moderate: 0.125, aggressive: 0.15 },
    returnsObsolescence: { conservative: 0.15, moderate: 0.25, aggressive: 0.30 },
    itCosts: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 },
    riskCompliance: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 }
  },
  warehouseSlotting: {
    inventoryCarrying: { conservative: 0.02, moderate: 0.06, aggressive: 0.08 },
    warehousingLogistics: { conservative: 0.05, moderate: 0.15, aggressive: 0.20 },
    salesMarketingCS: { conservative: -0.01, moderate: -0.025, aggressive: -0.03 },
    orderProcessing: { conservative: 0.03, moderate: 0.075, aggressive: 0.10 },
    returnsObsolescence: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.02, moderate: 0.04, aggressive: 0.05 }
  },
  cycleCounting: {
    inventoryCarrying: { conservative: 0.03, moderate: 0.075, aggressive: 0.10 },
    warehousingLogistics: { conservative: 0.20, moderate: 0.50, aggressive: 0.70 },
    salesMarketingCS: { conservative: -0.01, moderate: -0.03, aggressive: -0.04 },
    orderProcessing: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 },
    returnsObsolescence: { conservative: 0.05, moderate: 0.115, aggressive: 0.15 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.03, moderate: 0.075, aggressive: 0.10 }
  },
  orderOptimization: {
    inventoryCarrying: { conservative: 0.05, moderate: 0.125, aggressive: 0.15 },
    warehousingLogistics: { conservative: 0.10, moderate: 0.20, aggressive: 0.25 },
    salesMarketingCS: { conservative: -0.10, moderate: -0.20, aggressive: -0.25 },
    orderProcessing: { conservative: 0.15, moderate: 0.325, aggressive: 0.40 },
    returnsObsolescence: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.02, moderate: 0.05, aggressive: 0.06 }
  },
  inventoryVisibility: {
    inventoryCarrying: { conservative: 0.08, moderate: 0.15, aggressive: 0.18 },
    warehousingLogistics: { conservative: 0.10, moderate: 0.175, aggressive: 0.20 },
    salesMarketingCS: { conservative: -0.05, moderate: -0.10, aggressive: -0.12 },
    orderProcessing: { conservative: 0.15, moderate: 0.25, aggressive: 0.30 },
    returnsObsolescence: { conservative: 0.05, moderate: 0.115, aggressive: 0.15 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.03, moderate: 0.075, aggressive: 0.10 }
  },
  obsolescenceControl: {
    inventoryCarrying: { conservative: 0.05, moderate: 0.10, aggressive: 0.12 },
    warehousingLogistics: { conservative: 0.03, moderate: 0.065, aggressive: 0.08 },
    salesMarketingCS: { conservative: 0.0, moderate: -0.01, aggressive: -0.02 },
    orderProcessing: { conservative: 0.02, moderate: 0.04, aggressive: 0.05 },
    returnsObsolescence: { conservative: 0.20, moderate: 0.40, aggressive: 0.50 },
    itCosts: { conservative: 0, moderate: 0, aggressive: 0 },
    riskCompliance: { conservative: 0.02, moderate: 0.06, aggressive: 0.08 }
  }
};

export const CORRELATION_MATRIX: Partial<Record<keyof ExpenseAllocations, Partial<Record<keyof ExpenseAllocations, number>>>> = {
  inventoryCarrying: {
    warehousingLogistics: 0.04,
    salesMarketingCS: -0.02,
    orderProcessing: 0.05,
    returnsObsolescence: 0.15,
    riskCompliance: 0.03
  },
  warehousingLogistics: {
    inventoryCarrying: 0.08,
    salesMarketingCS: -0.03,
    orderProcessing: 0.05,
    returnsObsolescence: 0.05,
    riskCompliance: 0.04
  },
  salesMarketingCS: {
    inventoryCarrying: 0.02,
    warehousingLogistics: 0.01,
    orderProcessing: 0.03,
    returnsObsolescence: 0.02,
    riskCompliance: 0.01
  },
  orderProcessing: {
    inventoryCarrying: 0.03,
    warehousingLogistics: 0.02,
    salesMarketingCS: -0.01,
    returnsObsolescence: 0.02,
    riskCompliance: 0.02
  },
  returnsObsolescence: {
    inventoryCarrying: 0.05,
    warehousingLogistics: 0.03,
    salesMarketingCS: -0.01,
    orderProcessing: 0.02,
    riskCompliance: 0.02
  },
  riskCompliance: {
    inventoryCarrying: 0.02,
    warehousingLogistics: 0.02,
    salesMarketingCS: -0.01,
    orderProcessing: 0.02,
    returnsObsolescence: 0.02
  }
};
