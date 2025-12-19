# AAXIS Proof of Value Calculator - Report Block Generation

## Overview

This suite generates all pre-built content blocks for the automated ROI report generator. Instead of calling AI for every report (expensive, slow, variable), we pre-generate all possible content variations and assemble them dynamically based on user selections.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Inputs                               │
│  Industry │ Size │ Risk │ Solutions │ Revenue │ Expenses    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Report Assembly Logic                      │
│                                                             │
│  1. Select executive_summary[risk][random_variation]        │
│  2. Select industry_narrative[industry][random_variation]   │
│  3. Include solution_descriptions[selected_solutions]       │
│  4. For each impacted category:                             │
│     - Include category_anchor[category]                     │
│     - Include impact_explanations[solution][category]       │
│     - If synergy pair selected, include synergy block       │
│  5. Include methodology[risk]                               │
│  6. Select roadmap[complexity_level]                        │
│  7. Include strategic blocks (why_now, diy_vs_partner, etc) │
│  8. Inject calculated numbers into {{placeholders}}         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Final Report PDF                          │
│                                                             │
│  Looks AI-generated (because it was)                        │
│  Feels personalized (because blocks selected dynamically)   │
│  Costs $0.00 per report (pre-generated)                     │
│  Loads instantly (no API call)                              │
└─────────────────────────────────────────────────────────────┘
```

## Block Inventory

| Block Type | Count | Variations | Purpose | Visual Elements |
|------------|-------|------------|---------|-----------------|
| Executive Summary | 12 | 4 per risk level | Opening hook, headline numbers | Key metrics table, timeline table |
| Industry Narratives | 21 | 3 per industry | Sector-specific context | Benchmark table, solution impact table, case study callout |
| Solution Descriptions | 9 | 1 each | What each solution does | Impact matrix, timeline callout, evidence table |
| Category Anchors | 14 | 2 per category | Intro to each savings category | Benchmark table, cost components callout |
| Impact Explanations | ~60 | By solution×category | Why savings occur | Scenario range table, mechanism callout |
| Synergy Paragraphs | 10+ | By solution pairs | Combined effects | — |
| Methodology | 3 | 1 per risk level | Calculation explanation | Parameters table, steps callout, source table |
| Implementation Roadmaps | 3 | By complexity | Phase-based plan | Phase timeline table, success factors callout |
| Strategic Blocks | 7 | 1 each | Why Now, DIY vs Partner, etc. | Various tables and callouts |
| Sales Enablement | 10 | Top combos | Internal notes (not shown) | — |
| **TOTAL** | **~140** | | |

## Running the Generator

### Prerequisites

```bash
pip install anthropic
```

### Environment

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### Execution

```bash
python prompt_suite.py
```

The script will:
1. Show you what blocks will be generated
2. Ask for confirmation
3. Generate all blocks with parallel API calls (10 concurrent)
4. Save results to `report_blocks.json`
5. Report total cost and time

### Expected Output

- **Time**: 2-3 minutes
- **Cost**: ~$2-3
- **Output**: `report_blocks.json` (~500KB)

## Output Structure

```json
{
  "metadata": {
    "generated_at": "2025-12-18T...",
    "total_blocks": 140,
    "errors": 0,
    "total_tokens": 85000
  },
  
  "executive_summaries": {
    "executive_summary_conservative_v1": "For this {{annual_revenue}} {{industry}} company...",
    "executive_summary_conservative_v2": "Based on {{num_solutions}} selected solutions...",
    "executive_summary_moderate_v1": "...",
    ...
  },
  
  "industry_narratives": {
    "industry_food_and_beverage_v1": "In the Food & Beverage sector...",
    "industry_food_and_beverage_v2": "Consider Sunsweet Growers...",
    "industry_industrial_distribution_v1": "...",
    ...
  },
  
  "solution_descriptions": {
    "solution_demand_forecasting_ai": "**What It Does**\n\nDemand Forecasting AI uses...",
    "solution_inventory_planning_and_replenishment": "...",
    ...
  },
  
  "category_anchors": {
    "category_inventory_carrying_cost_v1": "Inventory carrying costs represent...",
    "category_warehousing_and_logistics_v1": "...",
    ...
  },
  
  "impact_explanations": {
    "impact_demand_forecasting_ai_returns_obsolescence_shrinkage": "Demand forecasting directly reduces obsolescence by...",
    "impact_sku_rationalization_analytics_inventory_carrying_cost": "...",
    ...
  },
  
  "synergies": {
    "synergy_demand_forecas_inventory_plan": "When Demand Forecasting AI and Inventory Planning...",
    ...
  },
  
  "methodology": {
    "methodology_conservative": "This analysis uses a compound discount methodology...",
    "methodology_moderate": "...",
    "methodology_aggressive": "..."
  },
  
  "roadmaps": {
    "roadmap_low": "For a focused implementation of 1-2 solutions...",
    "roadmap_medium": "...",
    "roadmap_high": "..."
  },
  
  "strategic_blocks": {
    "why_now": "The supply chain technology landscape has reached...",
    "diy_vs_partner": "Organizations evaluating supply chain transformation...",
    "readiness_assessment": "Before implementation, assess your organization...",
    "report_limitations": "This analysis provides a financial framework...",
    "risk_factors": "As with any projection, several factors...",
    "next_steps": "To move forward with this analysis...",
    "partner_acknowledgment": "AAXIS implementations leverage a best-of-breed..."
  },
  
  "sales_enablement": {
    "sales_enablement_demand_forecasting_ai": "**Key Talking Points**\n- Lead with McKinsey...",
    ...
  }
}
```

## Placeholder Reference

These placeholders should be replaced with calculated values at report assembly time:

| Placeholder | Example Value | Source |
|-------------|---------------|--------|
| `{{total_savings}}` | `$4.2M` | Calculator output |
| `{{savings_range_low}}` | `$2.1M` | Calculator output |
| `{{savings_range_high}}` | `$5.8M` | Calculator output |
| `{{opex_reduction_pct}}` | `12.5%` | Calculator output |
| `{{num_solutions}}` | `4` | Count of selected |
| `{{industry}}` | `Industrial Distribution` | User selection |
| `{{company_size}}` | `Mid-Market` | User selection |
| `{{annual_revenue}}` | `$85M` | User input |
| `{{complexity_level}}` | `Medium` | Derived from solution count |
| `{{category_current_spend}}` | `$2.4M` | Calculator |
| `{{category_pct_revenue}}` | `4.2%` | Calculator |
| `{{category_vs_benchmark}}` | `above typical range` | Calculator |
| `{{user_inventory_turns}}` | `3.2x` | User input or derived |
| `{{user_opex_pct}}` | `24%` | Derived from inputs |
| `{{selected_solutions}}` | `Demand Forecasting AI, SKU Rationalization` | User selection |
| `{{scheduling_link}}` | `https://calendly.com/aaxis` | Static |
| `{{contact_email}}` | `info@aaxis.com` | Static |

## Visual Elements Guide

Every block includes visual elements to break up text density and enable scanning. The app should render these markdown elements appropriately:

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |
```

### Callout Boxes (Blockquotes)
```markdown
> **Key Finding**
> 
> Important statistic or takeaway here.
```

### Nested Tables in Callouts
```markdown
> **Summary**
> 
> | Metric | Value |
> |--------|-------|
> | Savings | $4.2M |
```

### Section Headers
```markdown
## Major Section
### Subsection
```

### Checklists
```markdown
> **Checklist Title**
> - [ ] Item one
> - [ ] Item two
> - [ ] Item three
```

### Visual Density Target
- No more than 4 sentences between visual elements
- Every 300-400 words should have a table, callout, or list
- Tables preferred for comparisons and multi-dimensional data
- Callouts preferred for key metrics and highlights
- Lists preferred for checklists and short enumerations

## Assembly Logic (Pseudocode)

```javascript
function assembleReport(userInputs, calculatorOutputs, blocks) {
  let report = [];
  
  // 1. Executive Summary (random variation)
  const riskLevel = userInputs.riskTolerance.toLowerCase();
  const variation = randomInt(1, 4);
  report.push(
    injectPlaceholders(
      blocks.executive_summaries[`executive_summary_${riskLevel}_v${variation}`],
      calculatorOutputs
    )
  );
  
  // 2. Why Now (always include)
  report.push(blocks.strategic_blocks.why_now);
  
  // 3. Company Profile / Industry Narrative
  const industryKey = sanitizeKey(userInputs.industry);
  const industryVariation = randomInt(1, 3);
  report.push(
    injectPlaceholders(
      blocks.industry_narratives[`industry_${industryKey}_v${industryVariation}`],
      calculatorOutputs
    )
  );
  
  // 4. Solution Descriptions (only selected)
  for (const solution of userInputs.selectedSolutions) {
    const solutionKey = sanitizeKey(solution);
    report.push(blocks.solution_descriptions[`solution_${solutionKey}`]);
    
    // Check for synergies with other selected solutions
    for (const otherSolution of userInputs.selectedSolutions) {
      if (solution !== otherSolution) {
        const synergyKey = getSynergyKey(solution, otherSolution);
        if (blocks.synergies[synergyKey]) {
          report.push(blocks.synergies[synergyKey]);
        }
      }
    }
  }
  
  // 5. Savings Breakdown by Category
  for (const category of getImpactedCategories(calculatorOutputs)) {
    const categoryKey = sanitizeKey(category.name);
    const categoryVariation = randomInt(1, 2);
    
    // Category anchor
    report.push(
      injectPlaceholders(
        blocks.category_anchors[`category_${categoryKey}_v${categoryVariation}`],
        { ...calculatorOutputs, ...category }
      )
    );
    
    // Impact explanations for each solution affecting this category
    for (const solution of userInputs.selectedSolutions) {
      const impactKey = `impact_${sanitizeKey(solution)}_${categoryKey}`;
      if (blocks.impact_explanations[impactKey]) {
        report.push(blocks.impact_explanations[impactKey]);
      }
    }
  }
  
  // 6. Methodology
  report.push(blocks.methodology[`methodology_${riskLevel}`]);
  
  // 7. Implementation Roadmap
  const complexity = getComplexityLevel(userInputs.selectedSolutions.length);
  report.push(
    injectPlaceholders(
      blocks.roadmaps[`roadmap_${complexity}`],
      calculatorOutputs
    )
  );
  
  // 8. Strategic Blocks
  report.push(blocks.strategic_blocks.diy_vs_partner);
  report.push(blocks.strategic_blocks.readiness_assessment);
  report.push(blocks.strategic_blocks.risk_factors);
  report.push(blocks.strategic_blocks.report_limitations);
  report.push(blocks.strategic_blocks.next_steps);
  report.push(blocks.strategic_blocks.partner_acknowledgment);
  
  return report.join('\n\n---\n\n');
}
```

## Regeneration

If you need to regenerate specific blocks (e.g., after updating messaging):

1. Modify the relevant prompt in `PROMPTS` dict
2. Run the generator with a filter (modify `build_all_generation_tasks()`)
3. Merge new blocks into existing `report_blocks.json`

## Partner Integration Notes

### Palantir Mentions
- Data integration, real-time visibility sections
- Foundry platform for cross-system data
- AIP for decision automation (Order Optimization)

### AWS Mentions
- ML/AI infrastructure (Demand Forecasting)
- Cloud scalability (Enterprise deployments)
- IoT/streaming (Real-Time Visibility)

### AAXIS Positioning
- Domain expertise + AI fluency combination
- Value-based delivery model
- "Weeks not months" implementation velocity
- Best-of-breed ecosystem orchestrator

## Cost Tracking

After generation, check actual costs in Anthropic dashboard. Expected:

| Component | Tokens | Rate | Cost |
|-----------|--------|------|------|
| System prompt (cached, written once) | 10,000 | $0.30/M | $0.003 |
| System prompt (cached, read 140×) | 1,400,000 | $0.03/M | $0.042 |
| Variable prompts (140 calls) | 70,000 | $3/M | $0.21 |
| Output tokens (140 calls) | 150,000 | $15/M | $2.25 |
| **Total** | | | **~$2.50** |

