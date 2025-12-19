import { describe, expect, it } from 'vitest';
import { calculateROI } from './calculations';
import type { ExpenseAllocations, SolutionSelections } from '../types';

const expenses: ExpenseAllocations = {
  inventoryCarrying: 0.04,
  warehousingLogistics: 0.08,
  salesMarketingCS: 0.1,
  orderProcessing: 0.05,
  returnsObsolescence: 0.02,
  itCosts: 0.015,
  riskCompliance: 0.01,
};

const none: SolutionSelections = {
  demandForecasting: false,
  inventoryPlanning: false,
  supplierLeadTime: false,
  skuRationalization: false,
  warehouseSlotting: false,
  cycleCounting: false,
  orderOptimization: false,
  inventoryVisibility: false,
  obsolescenceControl: false,
};

describe('calculateROI', () => {
  it('returns zeros when no solutions selected', () => {
    const r = calculateROI(1_000_000_000, expenses, none, 'Moderate', 'Industrial Distribution');
    expect(r.totalSavingsLow).toBe(0);
    expect(r.totalSavingsHigh).toBe(0);
    expect(r.totalSavingsTarget).toBe(0);
    expect(r.totalCostReductionLow).toBe(0);
    expect(r.totalCostReductionHigh).toBe(0);
    expect(r.totalCostReductionTarget).toBe(0);
    expect(r.categories).toHaveLength(7);
    for (const c of r.categories) {
      expect(c.savingsLow).toBe(0);
      expect(c.savingsHigh).toBe(0);
      expect(c.savingsTarget).toBe(0);
      expect(c.efficiencyLow).toBe(0);
      expect(c.efficiencyHigh).toBe(0);
      expect(c.efficiencyTarget).toBe(0);
    }
  });

  it('produces bounded efficiencies and no NaNs', () => {
    const some: SolutionSelections = { ...none, demandForecasting: true, inventoryPlanning: true };
    const r = calculateROI(5_000_000_000, expenses, some, 'Moderate', 'Industrial Distribution');

    expect(Number.isFinite(r.totalSavingsLow)).toBe(true);
    expect(Number.isFinite(r.totalSavingsHigh)).toBe(true);
    expect(Number.isFinite(r.totalSavingsTarget)).toBe(true);

    for (const c of r.categories) {
      for (const eff of [c.efficiencyLow, c.efficiencyHigh, c.efficiencyTarget]) {
        expect(Number.isFinite(eff)).toBe(true);
        expect(eff).toBeGreaterThanOrEqual(-0.3);
        expect(eff).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('is monotonic across scenarios (low <= target <= high)', () => {
    const some: SolutionSelections = { ...none, inventoryVisibility: true, orderOptimization: true };
    const r = calculateROI(2_000_000_000, expenses, some, 'Moderate', 'Industrial Distribution');

    expect(r.totalSavingsLow).toBeLessThanOrEqual(r.totalSavingsTarget);
    expect(r.totalSavingsTarget).toBeLessThanOrEqual(r.totalSavingsHigh);

    for (const c of r.categories) {
      expect(c.savingsLow).toBeLessThanOrEqual(c.savingsTarget);
      expect(c.savingsTarget).toBeLessThanOrEqual(c.savingsHigh);
    }
  });

  it('can produce negative savings for sales/marketing (investment)', () => {
    const some: SolutionSelections = { ...none, orderOptimization: true, inventoryVisibility: true };
    const r = calculateROI(2_000_000_000, expenses, some, 'Moderate', 'Industrial Distribution');
    const sales = r.categories.find(c => c.categoryKey === 'salesMarketingCS');
    expect(sales).toBeTruthy();
    expect(sales!.savingsTarget).toBeLessThanOrEqual(0);
  });
});
