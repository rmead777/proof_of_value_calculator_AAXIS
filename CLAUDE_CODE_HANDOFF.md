# Report Generator Integration - Handoff for Claude Code

## Context

You're picking up an ROI calculator project for AAXIS, an AI transformation consultancy. The calculator is built in React/Next.js and computes supply chain savings based on user inputs. We've pre-generated 144 content blocks using AI that need to be assembled into dynamic reports based on user selections.

**What exists:**
- Working ROI calculator app (React/Next.js) with calculation engine
- `report_blocks.json` — 144 pre-generated content blocks (~90K tokens of high-quality prose with tables, callouts, and markdown formatting)
- User inputs: industry, company size, risk tolerance, annual revenue, expense percentages, selected solutions (1-9)
- Calculator outputs: savings by category, total savings, ranges, percentages

**What needs to be built:**
1. Report assembly logic — stitch blocks together based on user selections
2. Placeholder injection — replace `{{placeholders}}` with calculated values
3. Markdown rendering — display tables, callouts, headers properly
4. PDF export — generate downloadable report
5. "Magic feeling" UX — progressive reveal with subtle delay (NOT instant)

---

## The JSON Structure

```javascript
// report_blocks.json structure
{
  "metadata": {
    "generated_at": "2025-12-18T...",
    "total_blocks": 144,
    "errors": 0,
    "total_tokens": 89697
  },
  
  "executive_summaries": {
    // 12 blocks: 4 variations × 3 risk levels
    "executive_summary_conservative_v1": "## Executive Summary\n\n> | Metric | Value |...",
    "executive_summary_conservative_v2": "...",
    "executive_summary_moderate_v1": "...",
    "executive_summary_aggressive_v1": "...",
    // etc.
  },
  
  "industry_narratives": {
    // 21 blocks: 3 variations × 7 industries
    "industry_food_&_beverage_v1": "## Company Profile: Food & Beverage...",
    "industry_industrial_distribution_v1": "...",
    "industry_retail_e-commerce_v1": "...",
    // etc.
  },
  
  "solution_descriptions": {
    // 9 blocks: 1 per solution
    "solution_demand_forecasting_ai": "## Demand Forecasting AI\n\n### What It Does...",
    "solution_inventory_planning_and_replenishment": "...",
    "solution_sku_rationalization_analytics": "...",
    // etc.
  },
  
  "category_anchors": {
    // 14 blocks: 2 variations × 7 categories
    "category_inventory_carrying_cost_v1": "### Inventory Carrying Cost\n\n| Metric |...",
    "category_warehousing_&_logistics_v1": "...",
    // etc.
  },
  
  "impact_explanations": {
    // 55 blocks: solution × category (non-MINIMAL only)
    "impact_demand_forecasting_ai_inventory_carrying_cost": "...",
    "impact_sku_rationalization_analytics_returns_obsolescence_shrinkage": "...",
    // etc.
  },
  
  "synergies": {
    // 10 blocks: common solution pairs
    "synergy_demand_forecast_inventory_plann": "When Demand Forecasting AI and Inventory Planning...",
    // etc.
  },
  
  "methodology": {
    // 3 blocks: 1 per risk tolerance
    "methodology_conservative": "## Methodology & Assumptions...",
    "methodology_moderate": "...",
    "methodology_aggressive": "..."
  },
  
  "roadmaps": {
    // 3 blocks: by complexity
    "roadmap_low": "## Implementation Roadmap...",    // 1-2 solutions
    "roadmap_medium": "...",                          // 3-5 solutions
    "roadmap_high": "..."                             // 6+ solutions
  },
  
  "strategic_blocks": {
    // 7 blocks: always included
    "why_now": "## Why Now: The Supply Chain AI Inflection Point...",
    "diy_vs_partner": "## Build vs. Buy vs. Partner...",
    "readiness_assessment": "## Implementation Readiness Assessment...",
    "report_limitations": "## What This Report Doesn't Include...",
    "risk_factors": "## Risk Factors & Limitations...",
    "next_steps": "## Recommended Next Steps...",
    "partner_acknowledgment": "## Partner Ecosystem..."
  },
  
  "sales_enablement": {
    // 10 blocks: internal use only (don't include in customer report)
    "sales_enablement_demand_forecasting_ai___invent": "# Internal Sales Enablement Notes...",
    // etc.
  }
}
```

---

## Assembly Logic

Here's the pseudocode for assembling a report. Implement this as a function that takes user inputs + calculator outputs and returns assembled markdown.

```javascript
function assembleReport(userInputs, calculatorOutputs, blocks) {
  const sections = [];
  
  // Helper: get random variation
  const randomVariation = (prefix, maxVariations) => {
    const v = Math.floor(Math.random() * maxVariations) + 1;
    return `${prefix}_v${v}`;
  };
  
  // Helper: sanitize key (lowercase, replace spaces/special chars)
  const sanitizeKey = (str) => str.toLowerCase()
    .replace(/\//g, '_')
    .replace(/&/g, '_')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  
  // 1. EXECUTIVE SUMMARY (random variation for selected risk level)
  const riskKey = userInputs.riskTolerance.toLowerCase();
  const execVar = Math.floor(Math.random() * 4) + 1;
  const execKey = `executive_summary_${riskKey}_v${execVar}`;
  sections.push(blocks.executive_summaries[execKey]);
  
  // 2. WHY NOW (always include)
  sections.push(blocks.strategic_blocks.why_now);
  
  // 3. COMPANY PROFILE / INDUSTRY NARRATIVE (random variation)
  const industryKey = sanitizeKey(userInputs.industry);
  const industryVar = Math.floor(Math.random() * 3) + 1;
  const industryBlockKey = `industry_${industryKey}_v${industryVar}`;
  sections.push(blocks.industry_narratives[industryBlockKey]);
  
  // 4. SELECTED SOLUTIONS (only include selected ones)
  const solutionKeyMap = {
    "Demand Forecasting AI": "solution_demand_forecasting_ai",
    "Inventory Planning & Replenishment": "solution_inventory_planning_and_replenishment",
    "Supplier Lead Time & Reliability": "solution_supplier_lead_time_and_reliability",
    "SKU Rationalization Analytics": "solution_sku_rationalization_analytics",
    "Warehouse Layout & Slotting": "solution_warehouse_layout_and_slotting",
    "Cycle Counting & Inventory Accuracy": "solution_cycle_counting_and_inventory_accuracy",
    "Order Pattern Optimization": "solution_order_pattern_optimization",
    "Inventory Visibility & Real-Time Data": "solution_inventory_visibility_and_real-time_data",
    "Obsolescence & Aging Control": "solution_obsolescence_and_aging_control"
  };
  
  // Add section header for solutions
  sections.push("# Selected Solutions Analysis\n\nThe following solutions were selected for analysis based on your operational priorities:\n");
  
  for (const solution of userInputs.selectedSolutions) {
    const solKey = solutionKeyMap[solution];
    if (solKey && blocks.solution_descriptions[solKey]) {
      sections.push(blocks.solution_descriptions[solKey]);
    }
  }
  
  // 5. CHECK FOR SYNERGIES between selected solutions
  const synergyCombos = [
    { a: "Demand Forecasting AI", b: "Inventory Planning & Replenishment", key: "synergy_demand_forecast_inventory_plann" },
    { a: "Warehouse Layout & Slotting", b: "Cycle Counting & Inventory Accuracy", key: "synergy_warehouse_layou_cycle_counting_" },
    { a: "SKU Rationalization Analytics", b: "Obsolescence & Aging Control", key: "synergy_sku_rationaliza_obsolescence_&_" },
    { a: "Inventory Visibility & Real-Time Data", b: "Order Pattern Optimization", key: "synergy_inventory_visib_order_pattern_o" },
    { a: "Demand Forecasting AI", b: "Obsolescence & Aging Control", key: "synergy_demand_forecast_obsolescence_&_" },
    { a: "Inventory Planning & Replenishment", b: "Supplier Lead Time & Reliability", key: "synergy_inventory_plann_supplier_lead_t" },
    { a: "Warehouse Layout & Slotting", b: "Order Pattern Optimization", key: "synergy_warehouse_layou_order_pattern_o" },
    { a: "Cycle Counting & Inventory Accuracy", b: "Inventory Visibility & Real-Time Data", key: "synergy_cycle_counting__inventory_visib" },
    { a: "SKU Rationalization Analytics", b: "Demand Forecasting AI", key: "synergy_sku_rationaliza_demand_forecast" },
    { a: "Supplier Lead Time & Reliability", b: "Inventory Visibility & Real-Time Data", key: "synergy_supplier_lead_t_inventory_visib" },
  ];
  
  const selectedSet = new Set(userInputs.selectedSolutions);
  const applicableSynergies = synergyCombos.filter(s => 
    selectedSet.has(s.a) && selectedSet.has(s.b)
  );
  
  if (applicableSynergies.length > 0) {
    sections.push("## Solution Synergies\n\nThe following solution combinations create compounding benefits:\n");
    for (const syn of applicableSynergies) {
      if (blocks.synergies[syn.key]) {
        sections.push(blocks.synergies[syn.key]);
      }
    }
  }
  
  // 6. SAVINGS BREAKDOWN BY CATEGORY
  sections.push("# Detailed Savings Analysis by Category\n");
  
  const categoryKeyMap = {
    "Inventory Carrying Cost": "category_inventory_carrying_cost",
    "Warehousing & Logistics": "category_warehousing_&_logistics",
    "Sales/Marketing/Customer Service": "category_sales_marketing_customer_service",
    "Order Processing & Back-Office": "category_order_processing_&_back-office",
    "Returns/Obsolescence/Shrinkage": "category_returns_obsolescence_shrinkage",
    "IT Costs (Supply Chain)": "category_it_costs_(supply_chain)",
    "Risk & Compliance": "category_risk_&_compliance"
  };
  
  // Only include categories with non-zero impact
  for (const [categoryName, categoryResults] of Object.entries(calculatorOutputs.categorySavings)) {
    if (categoryResults.totalSavings === 0) continue;
    
    // Category anchor (random variation)
    const catKey = categoryKeyMap[categoryName];
    const catVar = Math.floor(Math.random() * 2) + 1;
    const catBlockKey = `${catKey}_v${catVar}`;
    
    if (blocks.category_anchors[catBlockKey]) {
      sections.push(blocks.category_anchors[catBlockKey]);
    }
    
    // Impact explanations for each solution affecting this category
    for (const solution of userInputs.selectedSolutions) {
      const impactKey = `impact_${sanitizeKey(solution)}_${sanitizeKey(categoryName)}`;
      if (blocks.impact_explanations[impactKey]) {
        sections.push(blocks.impact_explanations[impactKey]);
      }
    }
  }
  
  // 7. METHODOLOGY (based on risk tolerance)
  const methodKey = `methodology_${riskKey}`;
  sections.push(blocks.methodology[methodKey]);
  
  // 8. IMPLEMENTATION ROADMAP (based on complexity)
  const numSolutions = userInputs.selectedSolutions.length;
  let complexityKey;
  if (numSolutions <= 2) complexityKey = "roadmap_low";
  else if (numSolutions <= 5) complexityKey = "roadmap_medium";
  else complexityKey = "roadmap_high";
  sections.push(blocks.roadmaps[complexityKey]);
  
  // 9. STRATEGIC BLOCKS (most of them, in order)
  sections.push(blocks.strategic_blocks.diy_vs_partner);
  sections.push(blocks.strategic_blocks.readiness_assessment);
  sections.push(blocks.strategic_blocks.risk_factors);
  sections.push(blocks.strategic_blocks.report_limitations);
  sections.push(blocks.strategic_blocks.next_steps);
  sections.push(blocks.strategic_blocks.partner_acknowledgment);
  
  // 10. JOIN AND RETURN
  return sections.join("\n\n---\n\n");
}
```

---

## Placeholder Injection

After assembly, replace placeholders with actual values. Here's the placeholder map:

```javascript
function injectPlaceholders(markdown, userInputs, calculatorOutputs) {
  const replacements = {
    // User inputs
    '{{industry}}': userInputs.industry,
    '{{company_size}}': userInputs.companySize,
    '{{annual_revenue}}': formatCurrency(userInputs.annualRevenue),
    '{{num_solutions}}': userInputs.selectedSolutions.length.toString(),
    '{{selected_solutions}}': userInputs.selectedSolutions.join(', '),
    '{{risk_tolerance}}': userInputs.riskTolerance,
    
    // Calculator outputs
    '{{total_savings}}': formatCurrency(calculatorOutputs.totalSavings),
    '{{savings_range_low}}': formatCurrency(calculatorOutputs.savingsRangeLow),
    '{{savings_range_high}}': formatCurrency(calculatorOutputs.savingsRangeHigh),
    '{{opex_reduction_pct}}': calculatorOutputs.opexReductionPct.toFixed(1),
    
    // Derived values
    '{{complexity_level}}': getComplexityLevel(userInputs.selectedSolutions.length),
    
    // Category-specific (loop through)
    // These need special handling per category...
  };
  
  let result = markdown;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  
  // Handle remaining unmatched placeholders gracefully
  // Option 1: Remove them
  // result = result.replace(/\{\{[^}]+\}\}/g, '[TBD]');
  
  // Option 2: Leave them (for debugging)
  // (do nothing)
  
  return result;
}

function formatCurrency(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function getComplexityLevel(numSolutions) {
  if (numSolutions <= 2) return 'Low';
  if (numSolutions <= 5) return 'Medium';
  return 'High';
}
```

**Note on category-specific placeholders:** Some blocks have placeholders like `{{category_current_spend}}` or `{{user_inventory_turns}}`. You'll need to:
1. Build a more comprehensive replacement map from calculator outputs
2. Or do a second pass specifically for category sections with category-specific data
3. Or leave some as `[Calculated in discovery]` if you don't have the data

---

## Markdown Rendering

The blocks contain rich markdown including:
- `## Headers` and `### Subheaders`
- `**Bold text**`
- Tables with `| Column |` syntax
- Blockquote callouts with `> **Title**`
- Bullet lists

**Recommended library:** `react-markdown` with `remark-gfm` for GitHub-flavored markdown (tables).

```bash
npm install react-markdown remark-gfm
```

```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ReportViewer({ markdown }) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
```

**Styling considerations:**
- Use Tailwind's `prose` class for nice typography
- Style blockquotes (callout boxes) with a left border and background
- Ensure tables are responsive and don't overflow
- Consider a print-friendly stylesheet for PDF

---

## The "Magic Feeling" UX

**IMPORTANT:** We want the report to feel AI-generated (because it was), not instant (which feels cheap). Implement:

### 1. Delay (3-8 seconds, randomized)
```javascript
const delay = 3000 + Math.random() * 5000; // 3-8 seconds
await new Promise(resolve => setTimeout(resolve, delay));
```

### 2. Progressive Status Messages (MUST BE TRUE)
```javascript
const statusMessages = [
  "Assembling your custom report...",        // TRUE - we are assembling
  "Applying industry benchmarks...",         // TRUE - selecting industry block
  "Calculating savings projections...",      // TRUE - injecting numbers
  "Formatting analysis...",                  // TRUE - markdown processing
  "Preparing download...",                   // TRUE - generating PDF
];
```

**DO NOT USE** false messages like:
- ❌ "Analyzing your expense structure..." (not happening in real-time)
- ❌ "AI is processing your data..." (already processed)
- ❌ "Running machine learning models..." (nope)

### 3. Progressive Section Reveal
Instead of showing the whole report at once, reveal sections with a cascade:

```javascript
const [visibleSections, setVisibleSections] = useState([]);

useEffect(() => {
  sections.forEach((section, index) => {
    setTimeout(() => {
      setVisibleSections(prev => [...prev, section]);
    }, index * 400); // 400ms between each section
  });
}, [sections]);
```

### 4. Headline Number Animation (Optional)
For the big savings number, consider a count-up animation:

```javascript
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { duration: 1500 }
  });
  
  return (
    <animated.span>
      {number.to(n => formatCurrency(n))}
    </animated.span>
  );
}
```

---

## PDF Generation

**Recommended approach:** Use `@react-pdf/renderer` for high-quality PDFs, or `html2pdf.js` for quick wins.

### Option A: html2pdf.js (simpler)
```bash
npm install html2pdf.js
```

```javascript
import html2pdf from 'html2pdf.js';

function downloadPDF() {
  const element = document.getElementById('report-content');
  const opt = {
    margin: 0.5,
    filename: `AAXIS_ROI_Report_${userInputs.industry}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
```

### Option B: @react-pdf/renderer (better quality, more work)
This requires rebuilding the report as React-PDF components, but produces much better output.

### Branding
- Add AAXIS logo to header
- Include Palantir/AWS partner logos in footer (small, tasteful)
- Use consistent brand colors
- Add page numbers
- Include generation date

---

## File Structure Suggestion

```
/app
  /report
    /components
      ReportViewer.jsx       # Markdown rendering
      ReportGenerator.jsx    # Assembly + placeholder injection
      ProgressIndicator.jsx  # "Magic feeling" loading states
      PDFExport.jsx          # PDF generation
    /lib
      assembleReport.js      # Assembly logic
      injectPlaceholders.js  # Placeholder replacement
      reportBlocks.json      # The 144 pre-generated blocks
    page.jsx                 # Report page
```

---

## Testing Checklist

After implementation, verify:

- [ ] All 7 industries render correctly
- [ ] All 3 risk tolerances work
- [ ] All 9 solutions can be selected individually
- [ ] Multi-solution selection shows synergies when applicable
- [ ] Placeholders are replaced (no `{{remaining}}` in output)
- [ ] Tables render properly (not broken markdown)
- [ ] Callout boxes are styled
- [ ] PDF generates and downloads
- [ ] Loading states feel authentic (3-8 second delay)
- [ ] Status messages are technically true
- [ ] Progressive reveal works smoothly
- [ ] Mobile responsive

---

## Edge Cases

1. **Single solution selected:** No synergies section, low complexity roadmap
2. **All 9 solutions selected:** Many synergies, high complexity roadmap
3. **Missing placeholder data:** Gracefully show `[TBD]` or hide section
4. **Very long reports:** Consider pagination or collapsible sections
5. **Print view:** Ensure tables don't break across pages

---

## Key Files to Reference

- `report_blocks.json` — The 144 content blocks
- The existing calculator component — For understanding data flow
- `sample_blocks.md` — Examples of what good output looks like

---

## Questions?

The human (Ryan) has full context on this project. Key things to know:
- This is for AAXIS, preparing for a 2-year exit
- Palantir and AWS are strategic partners — mentions should feel natural, not forced
- The audience is CFOs and VP Supply Chain — tone should be McKinsey-professional
- "Conspicuously conservative" is the financial philosophy — don't overpromise

Good luck! This should take 4-6 hours to wire up completely. The hard part (content generation) is done.
