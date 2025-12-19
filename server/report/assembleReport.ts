/**
 * Report Assembly Module
 * 
 * Assembles pre-generated content blocks from report_blocks.json into a 
 * dynamic report based on user selections (industry, solutions, risk tolerance, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the pre-generated blocks
const blocksPath = path.join(__dirname, '../../ReportRunner/report_blocks.json');
let BLOCKS: ReportBlocks | null = null;

interface ReportBlocks {
  metadata: {
    generated_at: string;
    total_blocks: number;
    errors: number;
    total_tokens: number;
  };
  executive_summaries: Record<string, string>;
  industry_narratives: Record<string, string>;
  solution_descriptions: Record<string, string>;
  category_anchors: Record<string, string>;
  impact_explanations: Record<string, string>;
  synergies: Record<string, string>;
  methodology: Record<string, string>;
  roadmaps: Record<string, string>;
  strategic_blocks: Record<string, string>;
  sales_enablement: Record<string, string>;
}

function loadBlocks(): ReportBlocks {
  if (BLOCKS) return BLOCKS;
  
  if (!fs.existsSync(blocksPath)) {
    throw new Error(`Report blocks file not found at ${blocksPath}. Run prompt_suite.py first.`);
  }
  
  const raw = fs.readFileSync(blocksPath, 'utf-8');
  BLOCKS = JSON.parse(raw) as ReportBlocks;
  return BLOCKS;
}

// Key mapping helpers
const sanitizeKey = (str: string): string => 
  str.toLowerCase()
    .replace(/\//g, '_')
    .replace(/&/g, '_')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[()]/g, '');

// Solution key mapping (user-facing name -> JSON key)
const SOLUTION_KEY_MAP: Record<string, string> = {
  'Demand Forecasting AI': 'solution_demand_forecasting_ai',
  'Inventory Planning & Replenishment': 'solution_inventory_planning_and_replenishment',
  'Supplier Lead Time & Reliability': 'solution_supplier_lead_time_and_reliability',
  'SKU Rationalization Analytics': 'solution_sku_rationalization_analytics',
  'Warehouse Layout & Slotting': 'solution_warehouse_layout_and_slotting',
  'Cycle Counting & Inventory Accuracy': 'solution_cycle_counting_and_inventory_accuracy',
  'Order Pattern Optimization': 'solution_order_pattern_optimization',
  'Inventory Visibility & Real-Time Data': 'solution_inventory_visibility_and_real-time_data',
  'Obsolescence & Aging Control': 'solution_obsolescence_and_aging_control',
};

// Map internal solution keys to user-facing names
const INTERNAL_TO_SOLUTION_NAME: Record<string, string> = {
  demandForecasting: 'Demand Forecasting AI',
  inventoryPlanning: 'Inventory Planning & Replenishment',
  supplierLeadTime: 'Supplier Lead Time & Reliability',
  skuRationalization: 'SKU Rationalization Analytics',
  warehouseSlotting: 'Warehouse Layout & Slotting',
  cycleCounting: 'Cycle Counting & Inventory Accuracy',
  orderOptimization: 'Order Pattern Optimization',
  inventoryVisibility: 'Inventory Visibility & Real-Time Data',
  obsolescenceControl: 'Obsolescence & Aging Control',
};

// Category key mapping
const CATEGORY_KEY_MAP: Record<string, string> = {
  'Inventory Carrying Cost': 'category_inventory_carrying_cost',
  'Warehousing & Logistics': 'category_warehousing___logistics',
  'Sales/Marketing/Customer Service': 'category_sales_marketing_customer_service',
  'Order Processing & Back-Office': 'category_order_processing___back_office',
  'Returns/Obsolescence/Shrinkage': 'category_returns_obsolescence_shrinkage',
  'IT Costs (Supply Chain)': 'category_it_costs__supply_chain_',
  'Risk & Compliance': 'category_risk___compliance',
};

// Synergy pairs for lookup
const SYNERGY_COMBOS = [
  { a: 'Demand Forecasting AI', b: 'Inventory Planning & Replenishment', key: 'synergy_demand_forecast_inventory_plann' },
  { a: 'Warehouse Layout & Slotting', b: 'Cycle Counting & Inventory Accuracy', key: 'synergy_warehouse_layou_cycle_counting_' },
  { a: 'SKU Rationalization Analytics', b: 'Obsolescence & Aging Control', key: 'synergy_sku_rationaliza_obsolescence___' },
  { a: 'Inventory Visibility & Real-Time Data', b: 'Order Pattern Optimization', key: 'synergy_inventory_visib_order_pattern_o' },
  { a: 'Demand Forecasting AI', b: 'Obsolescence & Aging Control', key: 'synergy_demand_forecast_obsolescence___' },
  { a: 'Inventory Planning & Replenishment', b: 'Supplier Lead Time & Reliability', key: 'synergy_inventory_plann_supplier_lead_t' },
  { a: 'Warehouse Layout & Slotting', b: 'Order Pattern Optimization', key: 'synergy_warehouse_layou_order_pattern_o' },
  { a: 'Cycle Counting & Inventory Accuracy', b: 'Inventory Visibility & Real-Time Data', key: 'synergy_cycle_counting__inventory_visib' },
  { a: 'SKU Rationalization Analytics', b: 'Demand Forecasting AI', key: 'synergy_sku_rationaliza_demand_forecast' },
  { a: 'Supplier Lead Time & Reliability', b: 'Inventory Visibility & Real-Time Data', key: 'synergy_supplier_lead_t_inventory_visib' },
];

export interface AssembleReportInput {
  // User inputs
  industry: string;
  companySize?: string;
  annualRevenue: number;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  selectedSolutions: string[]; // Internal keys like 'demandForecasting'
  
  // Calculator outputs
  totalSavings: number;
  savingsRangeLow: number;
  savingsRangeHigh: number;
  opexReductionPct: number;
  
  // Category breakdowns (optional, for detailed injection)
  categorySavings?: Record<string, {
    currentDollars: number;
    savingsTarget: number;
    allocationPercent: number;
  }>;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Get complexity level based on number of solutions
 */
function getComplexityLevel(numSolutions: number): string {
  if (numSolutions <= 2) return 'Low';
  if (numSolutions <= 5) return 'Medium';
  return 'High';
}

/**
 * Random integer in range [1, max]
 */
function randomVariation(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Inject placeholders into markdown content
 */
function injectPlaceholders(
  markdown: string,
  input: AssembleReportInput
): string {
  const solutionNames = input.selectedSolutions.map(k => INTERNAL_TO_SOLUTION_NAME[k] || k);
  
  // Derive industry benchmarks (reasonable defaults based on revenue)
  const inventoryTurns = input.annualRevenue >= 500_000_000 ? '4-6x' : 
                         input.annualRevenue >= 100_000_000 ? '3-5x' : '2-4x';
  const marginPct = '25-35';
  const opexPct = Math.round(input.opexReductionPct * 10) / 10;
  const locations = input.annualRevenue >= 500_000_000 ? '15-25' : 
                    input.annualRevenue >= 100_000_000 ? '5-15' : '1-5';
  
  const replacements: Record<string, string> = {
    // User inputs - double braces
    '{{industry}}': input.industry,
    '{{company_size}}': input.companySize || 'Mid-Market',
    '{{annual_revenue}}': formatCurrency(input.annualRevenue),
    '{{num_solutions}}': input.selectedSolutions.length.toString(),
    '{{selected_solutions}}': solutionNames.join(', '),
    '{{risk_tolerance}}': input.riskTolerance,
    
    // Calculator outputs - double braces
    '{{total_savings}}': formatCurrency(input.totalSavings),
    '{{savings_range_low}}': formatCurrency(input.savingsRangeLow),
    '{{savings_range_high}}': formatCurrency(input.savingsRangeHigh),
    '{{opex_reduction_pct}}': input.opexReductionPct.toFixed(1) + '%',
    
    // Derived - double braces
    '{{complexity_level}}': getComplexityLevel(input.selectedSolutions.length),
    
    // Static values
    '{{scheduling_link}}': 'https://calendly.com/aaxis-discovery',
    '{{contact_email}}': 'solutions@aaxis.com',
    '{{company_name}}': 'AAXIS',
    
    // User metrics placeholders (with sensible defaults)
    '{{user_inventory_turns}}': inventoryTurns,
    '{{user_margin_pct}}': marginPct,
    '{{user_opex_pct}}': opexPct.toString(),
    '{{user_locations}}': locations,
    
    // Single braces variants (some blocks use these)
    '{industry}': input.industry,
    '{company_size}': input.companySize || 'Mid-Market',
    '{annual_revenue}': formatCurrency(input.annualRevenue),
    '{num_solutions}': input.selectedSolutions.length.toString(),
    '{selected_solutions}': solutionNames.join(', '),
    '{risk_tolerance}': input.riskTolerance,
    '{total_savings}': formatCurrency(input.totalSavings),
    '{savings_range_low}': formatCurrency(input.savingsRangeLow),
    '{savings_range_high}': formatCurrency(input.savingsRangeHigh),
    '{opex_reduction_pct}': input.opexReductionPct.toFixed(1) + '%',
    '{complexity_level}': getComplexityLevel(input.selectedSolutions.length),
    '{user_inventory_turns}': inventoryTurns,
    '{user_margin_pct}': marginPct,
    '{user_opex_pct}': opexPct.toString(),
    '{user_locations}': locations,
    '{scheduling_link}': 'https://calendly.com/aaxis-discovery',
    '{contact_email}': 'solutions@aaxis.com',
    '{company_name}': 'AAXIS',
  };
  
  let result = markdown;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.split(placeholder).join(value);
  }
  
  // Strip out all "Placeholder(s)" sections - various formats used in blocks:
  // "**Placeholders Used:**", "**PLACEHOLDERS USED:**", "**Placeholders:**", "**Placeholder:**"
  // These appear at end of blocks after "---" separator or inline
  result = result.replace(/\n*---\n+\*\*(?:PLACEHOLDERS?|Placeholders?)(?: Used)?:?\*\*[\s\S]*?(?=\n---\n|\n#|$)/gi, '');
  result = result.replace(/\n+\*\*(?:PLACEHOLDERS?|Placeholders?)(?: Used)?:?\*\*\n[\s\S]*?(?=\n---|\n#|$)/gi, '');
  
  // Fix double percent signs (some blocks have % after placeholder)
  result = result.replace(/%%/g, '%');
  
  // Fix typos in blocks (like "4-6xx" should be "4-6x")
  result = result.replace(/(\d+-\d+)xx/g, '$1x');
  
  // Remove any remaining unmatched placeholders - use em-dash for cleaner look
  result = result.replace(/\{\{[^}]+\}\}/g, '—');
  result = result.replace(/\{[a-z_]+\}/g, '—');
  
  // Clean up table rows that are mostly dashes (optional: makes tables cleaner)
  // If a table row has 3+ consecutive cells with just "—", hide the row
  result = result.replace(/^\|[^|]*\|\s*—\s*\|\s*—\s*\|\s*—\s*\|\s*$/gm, '');
  
  // Fix broken prose with em-dashes from missing placeholders
  // "For a company operating — locations with — in revenue" → generic phrasing
  result = result.replace(/For a company operating — locations with — in revenue/gi, 'For a company at your scale');
  result = result.replace(/operating — locations/gi, 'operating multiple locations');
  result = result.replace(/with — in revenue/gi, 'at your revenue level');
  
  // Fix redundant "Distribution distribution" (happens when {{industry}} = "Industrial Distribution")
  result = result.replace(/Distribution distribution/gi, 'Distribution');
  result = result.replace(/distribution distribution/gi, 'distribution');
  
  // Fix bold lead-ins that have line breaks after them (causes rendering issues)
  // Pattern: **Bold text:**\n followed by content should be on same line
  result = result.replace(/\*\*([^*]+):\*\*\s*\n+(?=[A-Z])/g, '**$1:** ');
  
  // Also fix patterns like "**Bottom line**: Gaps" (colon outside bold)
  result = result.replace(/\*\*([^*]+)\*\*:\s*\n+(?=[A-Z])/g, '**$1:** ');
  
  // Fix bold text followed by em-dash and newline: "**text** —\n" or "**text** —\nMore"
  result = result.replace(/\*\*([^*]+)\*\*\s*—\s*\n+/g, '**$1** — ');
  
  // Fix paragraphs that start with bold text followed by double newline
  // This prevents bold phrases from being isolated as their own paragraph
  // BUT: Don't do this if followed by a table (|) or list (- or *) or header (#)
  result = result.replace(/\n\n\*\*([^*]+)\*\*\s*\n\n(?=[A-Za-z])/g, '\n\n**$1** ');
  
  // Consolidate multiple blank lines into double (paragraph break)
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // CRITICAL FIX: Prevent Setext-style header interpretation
  // In Markdown, text followed immediately by "---" becomes an H2 header (Setext style)
  // We need to ensure "---" horizontal rules are always preceded by a blank line
  // Pattern: any non-blank line followed by \n--- should become \n\n---
  result = result.replace(/([^\n])\n---(\n|$)/g, '$1\n\n---$2');
  
  // Also handle === which creates H1 headers in Setext style
  result = result.replace(/([^\n])\n===(\n|$)/g, '$1\n\n===$2');
  
  return result;
}

/**
 * Main assembly function - stitches blocks together based on user selections
 */
export function assembleReport(input: AssembleReportInput): string {
  const blocks = loadBlocks();
  const sections: string[] = [];
  
  const riskKey = input.riskTolerance.toLowerCase();
  const solutionNames = input.selectedSolutions.map(k => INTERNAL_TO_SOLUTION_NAME[k] || k);
  const selectedSet = new Set(solutionNames);
  
  // 1. EXECUTIVE SUMMARY (random variation for selected risk level)
  const execVar = randomVariation(4);
  const execKey = `executive_summary_${riskKey}_v${execVar}`;
  if (blocks.executive_summaries[execKey]) {
    sections.push(blocks.executive_summaries[execKey]);
  }
  
  // 2. WHY NOW (always include)
  if (blocks.strategic_blocks.why_now) {
    sections.push(blocks.strategic_blocks.why_now);
  }
  
  // 3. COMPANY PROFILE / INDUSTRY NARRATIVE (random variation)
  const industryKey = sanitizeKey(input.industry);
  const industryVar = randomVariation(3);
  const industryBlockKey = `industry_${industryKey}_v${industryVar}`;
  if (blocks.industry_narratives[industryBlockKey]) {
    sections.push(blocks.industry_narratives[industryBlockKey]);
  }
  
  // 4. SELECTED SOLUTIONS (only include selected ones)
  if (solutionNames.length > 0) {
    sections.push('# Selected Solutions Analysis\n\nThe following solutions were selected for analysis based on your operational priorities:\n');
    
    for (const solution of solutionNames) {
      const solKey = SOLUTION_KEY_MAP[solution];
      if (solKey && blocks.solution_descriptions[solKey]) {
        sections.push(blocks.solution_descriptions[solKey]);
      }
    }
  }
  
  // 5. CHECK FOR SYNERGIES between selected solutions
  const applicableSynergies = SYNERGY_COMBOS.filter(s => 
    selectedSet.has(s.a) && selectedSet.has(s.b)
  );
  
  if (applicableSynergies.length > 0) {
    sections.push('## Solution Synergies\n\nThe following solution combinations create compounding benefits:\n');
    for (const syn of applicableSynergies) {
      if (blocks.synergies[syn.key]) {
        sections.push(blocks.synergies[syn.key]);
      }
    }
  }
  
  // 6. METHODOLOGY (based on risk tolerance)
  const methodKey = `methodology_${riskKey}`;
  if (blocks.methodology[methodKey]) {
    sections.push(blocks.methodology[methodKey]);
  }
  
  // 7. IMPLEMENTATION ROADMAP (based on complexity)
  const numSolutions = input.selectedSolutions.length;
  let complexityKey: string;
  if (numSolutions <= 2) complexityKey = 'roadmap_low';
  else if (numSolutions <= 5) complexityKey = 'roadmap_medium';
  else complexityKey = 'roadmap_high';
  
  if (blocks.roadmaps[complexityKey]) {
    sections.push(blocks.roadmaps[complexityKey]);
  }
  
  // 8. STRATEGIC BLOCKS (in order)
  const strategicOrder = [
    'diy_vs_partner',
    'readiness_assessment',
    'risk_factors',
    'report_limitations',
    'next_steps',
    'partner_acknowledgment',
  ];
  
  for (const blockName of strategicOrder) {
    if (blocks.strategic_blocks[blockName]) {
      sections.push(blocks.strategic_blocks[blockName]);
    }
  }
  
  // 9. JOIN AND INJECT PLACEHOLDERS
  const assembled = sections.join('\n\n---\n\n');
  return injectPlaceholders(assembled, input);
}

/**
 * Get available industries from the blocks
 */
export function getAvailableIndustries(): string[] {
  const blocks = loadBlocks();
  const industries = new Set<string>();
  
  for (const key of Object.keys(blocks.industry_narratives)) {
    // Extract industry name from key like "industry_food_&_beverage_v1"
    const match = key.match(/^industry_(.+)_v\d+$/);
    if (match) {
      industries.add(match[1]);
    }
  }
  
  return Array.from(industries);
}

/**
 * Check if blocks are loaded and available
 */
export function areBlocksAvailable(): boolean {
  try {
    loadBlocks();
    return true;
  } catch {
    return false;
  }
}
