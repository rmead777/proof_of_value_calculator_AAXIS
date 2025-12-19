"""
AAXIS Proof of Value Calculator - Report Block Generation Suite
================================================================

This script generates all pre-built content blocks for the ROI report generator.
Blocks are assembled dynamically based on user selections.

Estimated cost: ~$2.00 (one-time generation)
Estimated time: ~2-3 minutes with parallelization

Output: report_blocks.json
"""

import anthropic
import asyncio
import json
from datetime import datetime

# =============================================================================
# SHARED SYSTEM PROMPT (Will be cached across all API calls)
# =============================================================================

SYSTEM_PROMPT = """
You are a senior supply chain consultant at AAXIS, an AI transformation consultancy, 
writing content blocks for an automated Proof of Value report generator. Your audience 
is CFOs and VP-level supply chain executives at distribution companies evaluating 
AI-powered supply chain solutions.

═══════════════════════════════════════════════════════════════════════════════
VOICE & TONE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

AUTHORITATIVE BUT ACCESSIBLE:
- Write like a McKinsey partner who respects the reader's intelligence
- No jargon without explanation, no dumbing down
- Confident assertions backed by evidence
- Direct sentences, active voice

CONSPICUOUSLY CONSERVATIVE:
- CFOs respect restraint more than enthusiasm
- Always present ranges, not point estimates
- Acknowledge limitations before being asked
- Undersell and overdeliver

DATA-DRIVEN:
- Every major claim needs a source
- Tier 1 sources (McKinsey, Bain, CSCMP, Accenture, IBF) for key figures
- Specific numbers > vague claims ("35% reduction" not "significant improvement")
- Case studies with named companies when available

URGENCY WITHOUT SLEAZE:
- Market timing and competitive pressure are real — mention them
- Never "ACT NOW" or artificial scarcity
- Frame as "here's what leading companies are doing" not "you're falling behind"

═══════════════════════════════════════════════════════════════════════════════
FORMATTING STANDARDS
═══════════════════════════════════════════════════════════════════════════════

DOCUMENT STRUCTURE:
- Use ## for major section headers
- Use ### for subsection headers  
- Use **bold** for key numbers, company names, and critical emphasis
- Use *italics* sparingly for technical terms on first use
- Use em-dashes for emphasis — like this

VISUAL DENSITY MANAGEMENT (CRITICAL):
- No paragraph should exceed 4 sentences
- Include a visual element (table, list, or callout) every 300-400 words
- Break up analysis sections with summary tables
- Readers are busy executives — make it scannable

NUMBER FORMATTING:
- Millions: $X.XM (e.g., "$4.2M")
- Thousands: $XXX.XK (e.g., "$847.3K")  
- Percentages: One decimal (e.g., "12.5%")
- Ranges: "X% to Y%" or "$XM–$YM"

TABLES (use liberally for):
- Benchmark comparisons (user vs. industry)
- Solution impact summaries (category × impact level)
- Timeline/phase breakdowns
- Before/after comparisons
- Risk factor matrices
- Key metrics dashboards

Format tables in markdown:
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |

CALLOUT BOXES (for key metrics and standout stats):
Use blockquote formatting with bold headers:

> **Key Finding**
> 
> Statistic or important takeaway here.

Or for metric summaries:

> | Metric | Value |
> |--------|-------|
> | Savings | $4.2M |
> | Reduction | 12.5% |

BULLET LISTS (use for):
- Checklists (readiness assessment items)
- Feature/benefit lists (max 5-7 items)
- Phase deliverables
- Success factors
- Quick-reference lists

DO NOT use bullets for:
- Narrative explanations (use prose)
- Analysis paragraphs
- Anything exceeding 7 items (use table instead)

TIMELINE REPRESENTATIONS:
Always use table format for implementation phases:

| Phase | Timeline | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 1 - Foundation | 0-6 months | Data & Quick Wins | ... |
| 2 - Core | 6-12 months | Primary Solutions | ... |
| 3 - Advanced | 12-18 months | Optimization | ... |

IMPACT MATRICES:
When showing solution impacts across categories:

| Category | Impact Level | Savings Range | Confidence |
|----------|--------------|---------------|------------|
| Inventory Carrying | PRIMARY | 15-25% | HIGH |
| Warehousing | SECONDARY | 8-12% | HIGH |

SECTION-SPECIFIC VISUAL REQUIREMENTS:
- Executive Summary: MUST include key metrics callout box
- Industry Narrative: MUST include benchmark comparison table
- Solution Description: MUST include impact matrix and timeline
- Category Breakdown: MUST include before/after or benchmark table
- Methodology: MUST include parameter table
- Implementation: MUST include phase timeline table
- Readiness Assessment: MUST use checklist format
- Risk Factors: MUST include risk matrix table

CITATIONS:
- Inline, natural: "McKinsey research indicates that..."
- Not footnotes or brackets
- Tier 1 for headline claims, Tier 2 for supporting evidence

PLACEHOLDERS (for dynamic content):
- Use double braces: {{total_savings}}, {{industry}}, {{company_size}}
- Document all placeholders at end of each block
- Placeholders can appear in tables and callouts

═══════════════════════════════════════════════════════════════════════════════
PARTNER & BRAND POSITIONING
═══════════════════════════════════════════════════════════════════════════════

AAXIS POSITIONING:
- AI transformation consultancy, not IT body shop
- Value-based delivery, not time-and-materials
- "We do in weeks what traditional consultancies do in months"
- Deep supply chain domain expertise + AI fluency

PALANTIR INTEGRATION:
- Foundry platform for enterprise data integration
- Mention naturally when discussing: data visibility, real-time analytics, 
  cross-functional integration
- "AAXIS implementations leverage Palantir Foundry for..." (where relevant)

AWS INTEGRATION:
- Cloud infrastructure, ML/AI services
- Mention naturally when discussing: scalability, forecasting models, 
  real-time processing
- "Built on AWS infrastructure for..." (where relevant)

TONE FOR PARTNERS:
- They're capabilities, not crutches
- AAXIS provides the domain expertise and implementation methodology
- Partners provide the platform and scale
- Frame as "best-of-breed ecosystem"

═══════════════════════════════════════════════════════════════════════════════
MODEL SPECIFICATION DATA
═══════════════════════════════════════════════════════════════════════════════

SOLUTIONS (9):
1. Demand Forecasting AI (12-18 months ROI)
   - ML-driven demand prediction at SKU/location level
   - Sources: McKinsey (50% error reduction), Sunsweet (30% spoilage reduction)
   
2. Inventory Planning & Replenishment (12-18 months ROI)
   - Automated reorder points, safety stock optimization
   - Sources: McKinsey Supply Chain 4.0 (-35% inventory)
   
3. Supplier Lead Time & Reliability (12-18 months ROI)
   - Supplier performance scoring, lead time analytics
   - Sources: Sparex ($5M savings), Gartner (20% logistics reduction)
   
4. SKU Rationalization Analytics (90 days - 18 months ROI)
   - Portfolio analysis, tail SKU identification
   - Sources: P&G ($1B savings), Mattel ($797M over 2 years)
   
5. Warehouse Layout & Slotting (4-6 weeks ROI)
   - AI-driven slot optimization, pick path efficiency
   - Sources: Plant Therapy (300% productivity), GEODIS (15-60% efficiency)
   
6. Cycle Counting & Inventory Accuracy (2-3 months ROI)
   - Automated counting, accuracy improvement
   - Sources: Vimaan (75% labor reduction), Auburn RFID Lab
   
7. Order Pattern Optimization (6-12 months ROI)
   - Order consolidation, fulfillment logic
   - Sources: Gartner (40% manual reduction), KIBO (30% CS cost reduction)
   
8. Inventory Visibility & Real-Time Data (12-18 months ROI)
   - Cross-network inventory tracking, ATP/CTP
   - Sources: McKinsey (35% stockout reduction)
   
9. Obsolescence & Aging Control (6-12 months ROI)
   - Aging alerts, markdown optimization
   - Sources: Race Winning Brands (€3.5M excess eliminated)

EXPENSE CATEGORIES (7):
1. Inventory Carrying Cost (benchmark: 2.5-4% of revenue)
2. Warehousing & Logistics (benchmark: 5-10% of revenue)
3. Sales/Marketing/Customer Service (benchmark: 6-12% of revenue)
4. Order Processing & Back-Office (benchmark: 3-6% of revenue)
5. Returns/Obsolescence/Shrinkage (benchmark: 1-4% of revenue)
6. IT Costs - Supply Chain (benchmark: 1.5-4% of revenue)
7. Risk & Compliance (benchmark: 0.5-2% of revenue)

INDUSTRIES (7):
1. Food & Beverage - High obsolescence, 8-15x turnover, spoilage critical
2. Industrial Distribution - Stable demand, 2-4x turnover, long lead times
3. Retail/E-commerce - High velocity, sub-24hr fulfillment, 16-18% returns
4. Pharmaceutical - Regulatory constraints, >98% service levels, serialization
5. Technology/Electronics - Rapid obsolescence, 12-18mo lifecycles
6. Fashion/Apparel - 6-12 week cycles, markdown critical, 20-30% obsolescence
7. CPG - Baseline/standard multipliers

COMPANY SIZES (3):
- Small ($10M-$50M): 1.05x multiplier - quick wins, limited IT capacity
- Mid-Market ($50M-$500M): 1.10x multiplier - sweet spot for transformation
- Enterprise ($500M+): 1.00x multiplier - already optimized, incremental gains

RISK TOLERANCES (3):
- Conservative: 70% compound discount, 20% max cap
- Moderate: 80% compound discount, 40% max cap  
- Aggressive: 85% compound discount, 60% max cap

IMPACT TYPES:
- PRIMARY: Direct, strong evidence, 3-4 sentence explanation
- SECONDARY: Indirect/spillover, 2-3 sentence explanation
- TERTIARY: Minor correlation, 1 sentence mention
- MINIMAL: Skip entirely

═══════════════════════════════════════════════════════════════════════════════
TIER 1 SOURCES (Use for key claims)
═══════════════════════════════════════════════════════════════════════════════

McKinsey: AI Supply-Chain Revolution (2021)
- Logistics costs -15%, Inventory levels -35%, Service levels +65%

Bain: Reinventing Consumer Products Supply Chain (2023-24)
- Logistics -10% to -25%, Inventory -15%+, Margins +5-10pp

CSCMP State of Logistics 2025
- $2.58T total US logistics (8.8% GDP)
- Optimized supply chains achieve -15% cost reduction

Institute of Business Forecasting (IBF)
- 10-20% forecast accuracy improvement → 5% inventory reduction
- 1 percentage point improvement = $1.3-1.5M savings for $50M company

Accenture: Next-Gen Supply Chain (2024)
- Mature supply chains: +23% profitability (11.8% vs 9.6% margins)
- Sample: 1,148 companies across 15 countries

McKinsey: Supply Chain 4.0
- Comprehensive transformation: -30% operational costs
- -75% inventory, -75% lost sales over 2-3 years

═══════════════════════════════════════════════════════════════════════════════
TIER 2 SOURCES (Use for supporting evidence)
═══════════════════════════════════════════════════════════════════════════════

- Plant Therapy: 300% picking productivity, 92%→99.7% accuracy
- GEODIS: 15-60% warehouse efficiency improvements
- P&G: $1B annual savings through SKU automation
- Mattel: 30% SKU reduction = $797M over 2 years
- Sunsweet: 30% spoilage reduction, 28→8 warehouses
- Vimaan: 75% labor reduction in cycle counting
- Lenovo: 20% surplus inventory reduction
- Walmart: $86M food waste reduction
- Race Winning Brands: €3.5M excess stock eliminated
- Sparex: $5M annual savings, 20% transportation reduction

═══════════════════════════════════════════════════════════════════════════════
SPECIAL HANDLING NOTES
═══════════════════════════════════════════════════════════════════════════════

SALES/MARKETING COST INCREASES:
When operational efficiency improves, Sales/Marketing often INCREASES.
This is INTENTIONAL — represent as "strategic reinvestment":
- Better fulfillment → confidence to expand marketing
- Reduced stockouts → can make promises to new accounts
- Frame as positive, not negative

IT COSTS:
IT is an enabler/investment, not a savings category.
Benefits flow through operational improvements, not IT cost reduction.
Minimal/zero direct impact in most solutions.

COMPOUND DISCOUNT:
When 2+ solutions selected, benefits don't stack linearly.
Explain as: organizational capacity, integration complexity, diminishing returns.
NOT as "we're being conservative" — frame as realistic modeling.

IMPLEMENTATION COSTS:
NEVER include specific implementation costs or payback periods.
This is intentional — preserves pricing flexibility.
If asked, frame as "ROI shown is gross; net ROI discussed in discovery."
"""


# =============================================================================
# BLOCK GENERATION PROMPTS
# =============================================================================

PROMPTS = {
    
    # =========================================================================
    # EXECUTIVE SUMMARY TEMPLATES (12 total: 4 variations × 3 risk levels)
    # =========================================================================
    
    "executive_summary": """
Generate an Executive Summary section for the Proof of Value report.

RISK TOLERANCE: {risk_tolerance}
VARIATION: {variation} of 4 (vary sentence structure and word choice)

REQUIREMENTS:
- 200-250 words total
- Start with ## Executive Summary header
- First element: Key metrics callout box (table in blockquote) showing:
  * Projected Annual Savings
  * Savings Range  
  * OPEX Reduction %
  * Solutions Selected
  * Implementation Complexity
- Second element: 2-3 sentence paragraph on what this means
- Third element: "Timeline to Value" table with phases
- Final element: 1-2 sentences on methodology credibility and next step

REQUIRED VISUAL ELEMENTS:
1. Key metrics summary table (in blockquote)
2. Timeline to value table (3 phases)

PLACEHOLDERS TO USE:
- {{total_savings}} - e.g., "$4.2M"
- {{savings_range_low}} - e.g., "$2.1M"
- {{savings_range_high}} - e.g., "$5.8M"
- {{opex_reduction_pct}} - e.g., "12.5%"
- {{num_solutions}} - e.g., "4"
- {{industry}} - e.g., "Industrial Distribution"
- {{company_size}} - e.g., "Mid-Market"
- {{annual_revenue}} - e.g., "$85M"
- {{complexity_level}} - e.g., "Medium"

VARIATION GUIDANCE:
- Variation 1: Lead with the dollar figure in opening sentence
- Variation 2: Lead with the percentage reduction
- Variation 3: Lead with industry context
- Variation 4: Lead with the transformation opportunity

OUTPUT: Complete section with headers, tables, and placeholders.
""",

    # =========================================================================
    # INDUSTRY NARRATIVE BLOCKS (21 total: 3 variations × 7 industries)
    # =========================================================================
    
    "industry_narrative": """
Generate a Company Profile Analysis section for the {industry} sector.

VARIATION: {variation} of 3

REQUIREMENTS:
- 500-600 words (4-5 paragraphs plus visual elements)
- Start with ## Company Profile: {industry} header
- First element: "Industry Benchmarks" table comparing user metrics to industry typical
- Paragraph 1: Industry characteristics that affect supply chain economics
- Second element: "Solution Impact by Sector" table showing which solutions have amplified/reduced impact
- Paragraph 2: Typical benchmarks and how this industry differs from baseline
- Paragraph 3: Which solutions matter most for this industry and why
- Callout box: Case study highlight with specific company and numbers
- Paragraph 4: Common pitfalls and success factors specific to this sector

REQUIRED VISUAL ELEMENTS:
1. Industry Benchmarks comparison table (4-5 rows)
2. Solution Impact by Sector table (4-5 key solutions)
3. Case study callout box (blockquote with company name and results)

INDUSTRY-SPECIFIC DATA TO INCORPORATE:
{industry_factors}

PARTNER MENTIONS (integrate naturally, 1-2 per block):
- For data/visibility challenges: mention Palantir Foundry capabilities
- For scale/ML needs: mention AWS infrastructure
- Frame AAXIS as the domain expert orchestrating these capabilities

VARIATION GUIDANCE:
- Variation 1: Lead with the biggest industry challenge
- Variation 2: Lead with a specific company example or case study
- Variation 3: Lead with benchmark comparison to other industries

PLACEHOLDERS TO USE:
- {{company_size}} - for implementation capacity context
- {{annual_revenue}} - for scale context
- {{user_inventory_turns}} - user's inventory turnover
- {{user_opex_pct}} - user's OPEX as % of revenue

OUTPUT: Complete section with headers, tables, callouts, and placeholders.
""",

    # =========================================================================
    # SOLUTION DESCRIPTION BLOCKS (9 total: 1 per solution)
    # =========================================================================
    
    "solution_description": """
Generate a Solution Impact Analysis block for: {solution_name}

REQUIREMENTS:
- 700-900 words total
- Start with ## {solution_name} header

STRUCTURE WITH VISUAL ELEMENTS:

### What It Does
- 150 words: Plain-language explanation of the solution

### Impact Summary
- TABLE: Show impact by expense category
| Category | Impact Level | Savings Range | Timeline |
|----------|--------------|---------------|----------|
| ... | PRIMARY/SECONDARY/TERTIARY | X-Y% | X months |

### How It Works  
- 150 words: Technical approach without jargon

### Expected Timeline
- CALLOUT BOX: ROI timeline highlight
- 100 words: When benefits materialize, what drives the timeline

> **Time to Value**
> - First measurable impact: X weeks/months
> - Full run-rate: X months
> - Payback period: X months

### Evidence Base
- TABLE: Case study summary
| Company | Industry | Result | Source |
|---------|----------|--------|--------|
| ... | ... | ... | Tier X |

- 150 words: Context on the evidence and why it's applicable

SOLUTION DATA:
- Name: {solution_name}
- ROI Timeline: {roi_timeline}
- Primary impacts: {primary_impacts}
- Key sources: {sources}

IMPACT DATA BY CATEGORY:
{impact_matrix}

PARTNER INTEGRATION (where relevant):
- Demand Forecasting: AWS SageMaker / ML infrastructure
- Inventory Visibility: Palantir Foundry for cross-system integration
- Real-Time Data: AWS IoT / streaming infrastructure
- Order Optimization: Palantir AIP for decision automation

REQUIRED VISUAL ELEMENTS:
1. Impact by category table
2. Time to value callout box
3. Case study evidence table

OUTPUT: Full block with headers, tables, and callouts.
""",

    # =========================================================================
    # CATEGORY ANCHOR BLOCKS (14 total: 2 variations × 7 categories)
    # =========================================================================
    
    "category_anchor": """
Generate an introductory anchor section for the {category} savings breakdown.

VARIATION: {variation} of 2

REQUIREMENTS:
- 300-400 words
- Start with ### {category} header

STRUCTURE WITH VISUAL ELEMENTS:

First element: Benchmark comparison table
| Metric | Your Company | Industry Typical | Assessment |
|--------|--------------|------------------|------------|
| Spend | {{category_current_spend}} | X-Y% of revenue | Above/Below/Within |
| As % Revenue | {{category_pct_revenue}} | X-Y% | ... |

Paragraph 1: Define what this expense category includes (specific cost components)

Cost components callout:
> **What's Included**
> - Component 1
> - Component 2
> - Component 3
> - Component 4

Paragraph 2: What drives costs higher or lower in this category

Paragraph 3: Set up the reader for the solution-specific explanations that follow (DO NOT discuss specific solutions yet — those come after this anchor)

CATEGORY DATA:
- Name: {category}
- Benchmark range: {benchmark_range}
- Cost components: {cost_components}

REQUIRED VISUAL ELEMENTS:
1. Benchmark comparison table
2. Cost components callout box

VARIATION GUIDANCE:
- Variation 1: Lead with the benchmark data, then explain components
- Variation 2: Lead with a "most companies don't realize..." insight

PLACEHOLDERS TO USE:
- {{category_current_spend}} - e.g., "$2.4M"
- {{category_pct_revenue}} - e.g., "4.2%"
- {{category_vs_benchmark}} - e.g., "above typical range"
- {{industry}} - for industry-specific context

OUTPUT: Complete section with header, tables, callouts, and placeholders.
""",

    # =========================================================================
    # PRIMARY IMPACT EXPLANATIONS (~12 blocks)
    # =========================================================================
    
    "impact_primary": """
Generate a PRIMARY impact explanation for how {solution} affects {category}.

REQUIREMENTS:
- 300-400 words
- Explain the direct mechanism of impact (cause → effect chain)
- Quantify the typical improvement range
- Cite 1-2 supporting sources
- Include a specific example or case study if available
- Acknowledge any dependencies or prerequisites

IMPACT DATA:
- Solution: {solution}
- Category: {category}
- Impact Type: PRIMARY
- Conservative range: {conservative_range}
- Moderate range: {moderate_range}
- Aggressive range: {aggressive_range}
- Sources: {sources}

OUTPUT: Explanation paragraph. Will be concatenated with other solution impacts.
""",

    # =========================================================================
    # SECONDARY IMPACT EXPLANATIONS (~25 blocks)
    # =========================================================================
    
    "impact_secondary": """
Generate a SECONDARY impact explanation for how {solution} affects {category}.

REQUIREMENTS:
- 150-250 words
- Explain the indirect or spillover mechanism
- Quantify the typical improvement range (more conservative than PRIMARY)
- One supporting data point or logical explanation
- Frame as "in addition to direct benefits..."

IMPACT DATA:
- Solution: {solution}
- Category: {category}
- Impact Type: SECONDARY
- Conservative range: {conservative_range}
- Moderate range: {moderate_range}
- Sources: {sources}

OUTPUT: Explanation paragraph. Will be concatenated with other solution impacts.
""",

    # =========================================================================
    # TERTIARY IMPACT MENTIONS (~30 blocks)
    # =========================================================================
    
    "impact_tertiary": """
Generate a TERTIARY impact mention for how {solution} affects {category}.

REQUIREMENTS:
- 50-100 words (1-2 sentences)
- Brief mention of minor correlation
- No detailed mechanism needed
- Frame as "additionally" or "minor improvements in"

IMPACT DATA:
- Solution: {solution}
- Category: {category}
- Impact Type: TERTIARY
- Typical range: {typical_range}

OUTPUT: Brief mention. Will be concatenated with other impacts.
""",

    # =========================================================================
    # SYNERGY PARAGRAPHS (~20 blocks for common combinations)
    # =========================================================================
    
    "synergy": """
Generate a synergy explanation for when BOTH {solution_a} AND {solution_b} are selected.

REQUIREMENTS:
- 200-300 words
- Explain why combined impact differs from sum of parts
- If AMPLIFYING: explain the multiplier effect
- If OVERLAPPING: explain why compound discount is applied
- If SEQUENTIAL: explain the dependency/ordering benefit
- Specific mechanism, not generic "they work well together"

SYNERGY DATA:
- Solution A: {solution_a}
- Solution B: {solution_b}
- Interaction type: {interaction_type}
- Affected categories: {affected_categories}

OUTPUT: Synergy paragraph. Inserted after individual solution impacts when both selected.
""",

    # =========================================================================
    # METHODOLOGY BLOCKS (3 total: 1 per risk tolerance)
    # =========================================================================
    
    "methodology": """
Generate the Methodology & Assumptions section for {risk_tolerance} risk tolerance.

REQUIREMENTS:
- 600-800 words (5-6 paragraphs plus visual elements)
- Start with ## Methodology & Assumptions header

STRUCTURE WITH VISUAL ELEMENTS:

Paragraph 1: Overview of calculation approach and why it's defensible

### Model Parameters

Parameter table:
| Parameter | {risk_tolerance} Value | Purpose |
|-----------|------------------------|---------|
| Compound Discount | {discount}% | Prevents unrealistic benefit stacking |
| Max Category Cap | {cap}% | No single category exceeds this reduction |
| Spillover Cap | 50% | Indirect effects capped at half of direct |
| Size Multiplier | Varies | Adjusts for company scale |

Paragraph 2: Compound discount factor explanation — why benefits don't stack linearly

### How Savings Are Calculated

Step-by-step callout:
> **Calculation Steps**
> 1. Sum raw impacts from selected solutions
> 2. Apply compound discount if 2+ solutions selected
> 3. Calculate spillover effects between categories
> 4. Apply category caps
> 5. Apply size multiplier
> 6. Convert percentages to dollars

Paragraph 3: Spillover effects — how improvements in one area affect others

### Evidence Foundation

Source credibility table:
| Source | Key Finding | Confidence |
|--------|-------------|------------|
| McKinsey | -35% inventory possible | HIGH |
| Bain | -10-25% logistics | HIGH |
| CSCMP | $2.58T market context | HIGH |

Paragraph 4: What {risk_tolerance} means for interpretation and budgeting

FRAMING FOR THIS RISK LEVEL:
- Conservative: "Appropriate for budget approvals and board presentations"
- Moderate: "Expected outcome with competent execution"
- Aggressive: "Achievable with strong execution and organizational alignment"

CALCULATION CONSTANTS:
- Compound discount: {discount}%
- Max category cap: {cap}%
- Spillover cap: 50% of direct impact

REQUIRED VISUAL ELEMENTS:
1. Model parameters table
2. Calculation steps callout box
3. Source credibility table

OUTPUT: Full methodology section with headers, tables, and callouts.
""",

    # =========================================================================
    # IMPLEMENTATION ROADMAP BLOCKS (3 total: by implementation complexity)
    # =========================================================================
    
    "implementation_roadmap": """
Generate an Implementation Roadmap section for {complexity} implementation complexity.

COMPLEXITY LEVEL: {complexity}
- Low (1-2 solutions, quick wins): 3-6 month horizon
- Medium (3-5 solutions, mixed timelines): 6-12 month horizon  
- High (6+ solutions, full transformation): 12-24 month horizon

REQUIREMENTS:
- 500-600 words
- Start with ## Implementation Roadmap header

STRUCTURE WITH VISUAL ELEMENTS:

### Phased Approach

Main timeline table:
| Phase | Timeline | Focus Area | Solutions | Key Deliverables | Success Metrics |
|-------|----------|------------|-----------|------------------|-----------------|
| 1 - Foundation | 0-X mo | ... | ... | ... | ... |
| 2 - Core | X-Y mo | ... | ... | ... | ... |
| 3 - Optimization | Y-Z mo | ... | ... | ... | ... |

Paragraph explaining the phasing logic and dependencies

### Phase 1: Foundation
- 100 words on what happens in Phase 1
- Deliverables list (bullets OK here)

### Phase 2: Core Implementation  
- 100 words on what happens in Phase 2
- Deliverables list

### Phase 3: Optimization & Scale
- 100 words on what happens in Phase 3
- Deliverables list

### Critical Success Factors

Callout box:
> **What Makes or Breaks Implementation**
> - Data foundation (accuracy before analytics)
> - Executive sponsorship
> - Phased approach (avoid big bang)
> - Change management investment
> - Continuous measurement

### Start Tomorrow

Final paragraph: "What to start tomorrow" — one concrete action item the reader can take immediately

SOLUTIONS TYPICALLY IN EACH PHASE:
- Foundation (0-6 months): Cycle Counting, Warehouse Slotting, Visibility
- Core (6-12 months): Demand Forecasting, Inventory Planning, SKU Rationalization
- Advanced (12-24 months): Order Optimization, Supplier Reliability, Obsolescence Control

PARTNER MENTIONS:
- Foundation phase: "Data foundation work often leverages Palantir Foundry..."
- Core phase: "ML models deployed on AWS infrastructure..."
- Frame AAXIS as implementation partner throughout

PLACEHOLDER:
- {{selected_solutions}} - list of solutions user selected
- {{num_solutions}} - count of solutions

REQUIRED VISUAL ELEMENTS:
1. Main phase timeline table
2. Critical success factors callout box

OUTPUT: Full roadmap section with headers, tables, and callouts.
""",

    # =========================================================================
    # "WHY NOW" MARKET TIMING BLOCK (1 block, critical for urgency)
    # =========================================================================
    
    "why_now": """
Generate a "Why Now" market timing section.

REQUIREMENTS:
- 300-400 words
- NOT artificial urgency or "ACT NOW" energy
- Real market dynamics that create timing relevance:
  * AI/ML maturity curve — tools are production-ready, not experimental
  * Competitor adoption — "50% of mid-market distributors are investing in SC AI"
  * Cost of delay — compound effect of waiting
  * Technology convergence — cloud + AI + IoT hitting inflection point
- Reference recent (2024-2025) market data
- Frame as "here's what leading companies are doing"

SOURCES TO REFERENCE:
- Accenture 2024: 23% profitability gap for mature supply chains
- CSCMP 2025: $2.58T logistics market under pressure
- McKinsey 2024: AI adoption accelerating across supply chain functions

PARTNER CONTEXT:
- Palantir/AWS ecosystems maturing
- Implementation patterns now proven, not experimental
- AAXIS has refined methodology through multiple deployments

OUTPUT: "Why Now" section. Will appear after Executive Summary.
""",

    # =========================================================================
    # "DIY VS. PARTNER" COMPARISON BLOCK (1 block, justifies AAXIS)
    # =========================================================================
    
    "diy_vs_partner": """
Generate a "Build vs. Buy vs. Partner" comparison section.

REQUIREMENTS:
- 400-500 words
- Three options compared honestly:
  1. DIY (internal team builds): When it works, when it doesn't
  2. Big consultancy (Accenture/McKinsey): Capabilities vs. cost vs. timeline
  3. Specialized partner (AAXIS model): Sweet spot positioning
  
- For each option:
  * Typical timeline
  * Cost structure (no specific numbers, but relative)
  * Risk profile
  * Best fit scenarios

- NOT a hard sell for AAXIS — honest comparison that happens to favor AAXIS for mid-market

KEY DIFFERENTIATORS FOR AAXIS:
- Domain expertise + AI fluency (rare combination)
- Value-based delivery, not T&M billing
- Palantir/AWS partnerships for enterprise capability without enterprise cost
- "Weeks not months" implementation velocity

PLACEHOLDER:
- {{company_size}} - affects which option makes sense

OUTPUT: Comparison section. Positioned to inform, not sell.
""",

    # =========================================================================
    # IMPLEMENTATION READINESS ASSESSMENT (1 block, qualifies leads)
    # =========================================================================
    
    "readiness_assessment": """
Generate an Implementation Readiness Assessment section.

REQUIREMENTS:
- 400-500 words
- Start with ## Implementation Readiness Assessment header

STRUCTURE WITH VISUAL ELEMENTS:

Opening paragraph: Frame as "questions to consider before our discovery call"

### Readiness Checklist

Main assessment table:
| Area | Key Question | Green (Ready) | Yellow (Gaps) | Red (Blockers) |
|------|--------------|---------------|---------------|----------------|
| Data Quality | Is inventory accuracy >95%? | >95% accuracy | 85-95% | <85% |
| Systems | Do ERP/WMS have APIs? | Modern, integrated | Legacy but stable | Disconnected |
| Sponsorship | Is there exec champion? | C-level sponsor | Director-level | No clear owner |
| Resources | Is PM capacity available? | Dedicated PM | Shared resources | No bandwidth |
| Change Readiness | Has org done transformations? | Recent success | Mixed history | Change fatigue |

### Data Readiness
Checklist callout:
> **Data Foundation Questions**
> - [ ] Inventory accuracy measured and >95%?
> - [ ] 24+ months of transaction history available?
> - [ ] Item master data clean and complete?
> - [ ] Lead times documented and accurate?

### Organizational Readiness
Checklist callout:
> **Organizational Questions**
> - [ ] Executive sponsor identified?
> - [ ] Cross-functional support (ops, finance, IT)?
> - [ ] Bandwidth for 10-20% dedicated project time?
> - [ ] Previous transformation experience?

### Technical Readiness
Checklist callout:
> **Technical Questions**
> - [ ] ERP/WMS on supported versions?
> - [ ] API access or integration capability?
> - [ ] Data warehouse or analytics platform?
> - [ ] IT resources for integration work?

Closing paragraph: Frame gaps as "areas we'll address in discovery" not blockers

PURPOSE (internal to AAXIS):
- Helps AAXIS qualify leads based on responses
- Sets expectations for discovery conversation
- Surfaces blockers early

PLACEHOLDER:
- {{selected_solutions}} - affects which readiness factors matter most

REQUIRED VISUAL ELEMENTS:
1. Main readiness assessment table
2. Three checklist callout boxes (data, org, technical)

OUTPUT: Complete assessment section with headers, tables, and checklists.
""",

    # =========================================================================
    # "WHAT THIS REPORT DOESN'T INCLUDE" (1 block, teases engagement)
    # =========================================================================
    
    "report_limitations": """
Generate a "What This Report Doesn't Include" section.

REQUIREMENTS:
- 150-200 words
- Honest about scope limitations
- Each limitation is a tease for deeper engagement:
  * Implementation cost modeling (requires discovery)
  * Competitive benchmarking (proprietary data)
  * Technical architecture design (requires system assessment)
  * Change management planning (requires org assessment)
  * Detailed project timeline (requires scoping)
- Frame as "next steps in the conversation" not "things we won't tell you"
- End with clear CTA for discovery call

OUTPUT: Limitations section with embedded CTA.
""",

    # =========================================================================
    # RISK FACTORS & DISCLAIMERS (1 block)
    # =========================================================================
    
    "risk_factors": """
Generate a Risk Factors & Limitations section.

REQUIREMENTS:
- 300-400 words
- Categories of risk:
  * Execution risk (organizational adoption, change management)
  * Data quality risk (garbage in, garbage out)
  * Technology risk (integration complexity, vendor dependencies)
  * Market risk (external factors affecting projections)
- Model limitations:
  * IT cost correlations have limited empirical data
  * Risk/Compliance savings are conservative estimates
  * Industry-specific factors may shift projections
- Sensitivity analysis reference (ranges already shown)
- Frame as "professional due diligence" not "reasons this won't work"

TONE:
- Honest without undermining confidence
- CFOs expect risk sections — absence would be suspicious
- Shows maturity and credibility

OUTPUT: Risk factors section.
""",

    # =========================================================================
    # NEXT STEPS / CTA (1 block)
    # =========================================================================
    
    "next_steps": """
Generate a Recommended Next Steps section.

REQUIREMENTS:
- 150-200 words
- 3-4 concrete next steps:
  1. Review report with internal stakeholders (24-48 hours)
  2. Identify questions and priority areas
  3. Schedule discovery call with AAXIS (include scheduling link placeholder)
  4. Optional: Request additional materials (case studies, references)
- Clear primary CTA: Schedule discovery call
- Secondary CTA: Download supplementary materials
- Timeframe suggestions (not pressure)

PLACEHOLDERS:
- {{scheduling_link}} - calendar link
- {{contact_email}} - AAXIS contact

OUTPUT: Next steps section with CTAs.
""",

    # =========================================================================
    # PARTNER ACKNOWLEDGMENT BLOCK (1 block)
    # =========================================================================
    
    "partner_acknowledgment": """
Generate a Partner Ecosystem acknowledgment block.

REQUIREMENTS:
- 100-150 words
- Brief acknowledgment of technology partners:
  * Palantir: Data integration and analytics platform
  * AWS: Cloud infrastructure and ML services
- Frame as "best-of-breed ecosystem" that AAXIS orchestrates
- Not a sales pitch for partners — context for reader
- Explains why these partnerships benefit the client

POSITIONING:
- AAXIS = domain expertise + implementation methodology
- Partners = platform capabilities + scale
- Together = enterprise results at mid-market accessibility

OUTPUT: Brief partner acknowledgment.
""",

    # =========================================================================
    # SALES ENABLEMENT NOTES (internal, not shown to prospects)
    # =========================================================================
    
    "sales_enablement": """
Generate internal sales enablement notes for when a prospect selects: {solution_combo}

REQUIREMENTS:
- 200-300 words (for internal AAXIS use only)
- Key talking points for follow-up call
- Relevant case studies to reference
- Potential objections to anticipate
- Qualification signals (what to listen for)
- Recommended next steps based on profile
- Red flags to watch for

SOLUTION COMBINATION: {solution_combo}
INDUSTRY: {industry}
COMPANY SIZE: {company_size}

OUTPUT: Internal notes formatted as bullet points.
""",

}


# =============================================================================
# DATA DEFINITIONS
# =============================================================================

INDUSTRIES = [
    {
        "name": "Food & Beverage",
        "factors": """
- Inventory turnover: 8-15x per year (highest of all sectors)
- Spoilage/obsolescence: +30-50% above baseline risk
- Forecasting ROI: +20-30% above baseline due to perishability
- Key challenge: Balancing freshness with availability
- Example companies: Sunsweet (30% spoilage reduction), Walmart ($86M food waste savings)
- Temperature-controlled logistics adds complexity
- Promotional volatility higher than other sectors
"""
    },
    {
        "name": "Industrial Distribution",
        "factors": """
- Inventory turnover: 2-4x per year (slowest, highest value per SKU)
- Demand patterns: Stable, predictable, project-driven
- Lead times: Often 4-12 weeks from international suppliers
- Forecast benefits: -10-15% vs baseline (stable demand means less forecast value)
- Supplier optimization: +20-25% above baseline (long lead times = bigger impact)
- Carrying costs: 25-35% of inventory value (higher due to capital intensity)
- Example: Sparex ($5M savings through supplier visibility)
"""
    },
    {
        "name": "Retail/E-commerce",
        "factors": """
- Fulfillment speed: Sub-24 hour expectations
- Returns rate: 16.5-17.9% (online), highest of all sectors
- Warehouse optimization: +25-35% ROI above baseline
- Obsolescence risk: +20-30% for fashion/seasonal segments
- Order complexity: Multi-channel, split shipments, click-and-collect
- Peak seasonality: 30-40% of volume in Q4
- Real-time visibility critical for available-to-promise
"""
    },
    {
        "name": "Pharmaceutical",
        "factors": """
- Service level requirements: >98% (regulatory mandated)
- Serialization/track-trace: Required for compliance
- Automation benefits: -10-20% vs baseline (regulatory constraints limit flexibility)
- Cold chain: Adds 15-25% to logistics costs
- Shelf life management: Critical for compliance
- Logistics costs: ~2% of sales, 7-8% of COGS (lower due to outsourcing)
- Risk/compliance: Higher weighting than other sectors
"""
    },
    {
        "name": "Technology/Electronics",
        "factors": """
- Product lifecycle: 12-18 months (rapid obsolescence)
- Obsolescence risk: HIGHEST priority — 1pp over-forecast = $1.58M loss
- Forecast accuracy: >95% target (critical for component planning)
- Example: Lenovo (20% surplus inventory reduction, 25% forecast accuracy gain)
- Component lead times: Highly variable (chip shortages)
- Reverse logistics: Growing importance (sustainability, refurbishment)
- New product introduction: Frequent, high-stakes inventory positioning
"""
    },
    {
        "name": "Fashion/Apparel",
        "factors": """
- Product lifecycle: 6-12 weeks (fastest turns)
- Obsolescence rate: 20-30% of inventory without controls
- Markdown strategy: Critical — typical 10%/20%/50% at 30/60/90 days
- Key solutions: Obsolescence control, demand forecasting, SKU rationalization
- Size/color proliferation: Compounds inventory complexity
- Seasonality: Extreme (2-4 major seasons)
- Return rates: 15-20% for online
"""
    },
    {
        "name": "CPG",
        "factors": """
- Baseline/reference industry for model calibration
- Standard multipliers apply
- Promotional lift: 3-5x baseline during promotions
- Trade spend optimization: Adjacent opportunity
- Demand sensing: Real-time POS data increasingly available
- Retailer collaboration: VMI/CPFR programs common
- Example: P&G ($1B savings through SKU rationalization)
"""
    }
]

SOLUTIONS = [
    {
        "name": "Demand Forecasting AI",
        "roi_timeline": "12-18 months",
        "primary_impacts": "Returns/Obsolescence, Inventory Carrying",
        "sources": "McKinsey (50% error reduction), Sunsweet (30% spoilage reduction), Lenovo (25% accuracy improvement), IBM AI studies"
    },
    {
        "name": "Inventory Planning & Replenishment",
        "roi_timeline": "12-18 months",
        "primary_impacts": "Returns/Obsolescence, Inventory Carrying, Order Processing",
        "sources": "McKinsey Supply Chain 4.0 (-35% inventory), IDC (25% reduction in one year), Bain distribution studies"
    },
    {
        "name": "Supplier Lead Time & Reliability",
        "roi_timeline": "12-18 months",
        "primary_impacts": "Warehousing, Inventory Carrying, Risk/Compliance",
        "sources": "Sparex ($5M savings, 20% transportation reduction), Gartner (20% logistics reduction), KPMG supplier studies"
    },
    {
        "name": "SKU Rationalization Analytics",
        "roi_timeline": "90 days - 18 months",
        "primary_impacts": "Returns/Obsolescence, Inventory Carrying, Warehousing",
        "sources": "P&G ($1B savings), Mattel ($797M over 2 years), Distributor case study (bottom 36% SKUs = 3% sales)"
    },
    {
        "name": "Warehouse Layout & Slotting",
        "roi_timeline": "4-6 weeks",
        "primary_impacts": "Warehousing, Order Processing",
        "sources": "Plant Therapy (300% productivity), GEODIS (15-60% efficiency), enVista (5-15% pick improvement), FORTNA"
    },
    {
        "name": "Cycle Counting & Inventory Accuracy",
        "roi_timeline": "2-3 months",
        "primary_impacts": "Warehousing, Order Processing, Returns/Obsolescence",
        "sources": "Vimaan (75% labor reduction, 100% accuracy), Auburn RFID Lab (70%→95% accuracy), WERC benchmarks"
    },
    {
        "name": "Order Pattern Optimization",
        "roi_timeline": "6-12 months",
        "primary_impacts": "Order Processing, Warehousing, Sales/Marketing",
        "sources": "Gartner (40% manual reduction), KIBO (30% CS cost reduction), Komar case (8 hours → 8 minutes)"
    },
    {
        "name": "Inventory Visibility & Real-Time Data",
        "roi_timeline": "12-18 months",
        "primary_impacts": "Order Processing, Warehousing, Risk/Compliance",
        "sources": "McKinsey (35% stockout reduction), 93% cost savings survey, RFID/IoT research"
    },
    {
        "name": "Obsolescence & Aging Control",
        "roi_timeline": "6-12 months",
        "primary_impacts": "Returns/Obsolescence, Inventory Carrying",
        "sources": "Race Winning Brands (€3.5M excess eliminated), Avery Dennison (8% perish rate → <3% target)"
    }
]

CATEGORIES = [
    {
        "name": "Inventory Carrying Cost",
        "benchmark_range": "2.5-4% of revenue",
        "cost_components": "Cost of capital, storage costs, insurance, shrinkage, obsolescence risk, handling"
    },
    {
        "name": "Warehousing & Logistics",
        "benchmark_range": "5-10% of revenue", 
        "cost_components": "Facility costs, labor (picking/packing/shipping), equipment, transportation, 3PL fees"
    },
    {
        "name": "Sales/Marketing/Customer Service",
        "benchmark_range": "6-12% of revenue",
        "cost_components": "Customer acquisition, retention programs, service center operations, returns processing"
    },
    {
        "name": "Order Processing & Back-Office",
        "benchmark_range": "3-6% of revenue",
        "cost_components": "Order entry, invoicing, exception handling, EDI/integration, customer communication"
    },
    {
        "name": "Returns/Obsolescence/Shrinkage",
        "benchmark_range": "1-4% of revenue",
        "cost_components": "Returned goods processing, markdown losses, write-offs, disposal, shrinkage/theft"
    },
    {
        "name": "IT Costs (Supply Chain)",
        "benchmark_range": "1.5-4% of revenue",
        "cost_components": "ERP/WMS licenses, integration costs, maintenance, development, cloud infrastructure"
    },
    {
        "name": "Risk & Compliance",
        "benchmark_range": "0.5-2% of revenue",
        "cost_components": "Audit costs, regulatory compliance, insurance, quality control, traceability systems"
    }
]

SYNERGY_PAIRS = [
    ("Demand Forecasting AI", "Inventory Planning & Replenishment", "amplifying",
     "Forecasting provides the demand signal that Planning uses to optimize. Better forecasts → more aggressive inventory policies without service risk."),
    
    ("Warehouse Layout & Slotting", "Cycle Counting & Inventory Accuracy", "amplifying", 
     "Accurate inventory data enables optimal slotting. Slotting improvements increase count efficiency. Virtuous cycle."),
    
    ("SKU Rationalization Analytics", "Obsolescence & Aging Control", "overlapping",
     "Both target inventory quality. Rationalization prevents future obsolescence; Aging Control manages current exposure. Some benefit overlap."),
    
    ("Inventory Visibility & Real-Time Data", "Order Pattern Optimization", "sequential",
     "Visibility provides the data foundation. Order optimization uses that data to improve fulfillment. Must sequence correctly."),
    
    ("Demand Forecasting AI", "Obsolescence & Aging Control", "sequential",
     "Forecasting prevents over-ordering. Aging Control manages existing excess. Together they address both prevention and cure."),
    
    ("Inventory Planning & Replenishment", "Supplier Lead Time & Reliability", "amplifying",
     "Better supplier data enables tighter planning parameters. Reliable suppliers allow lower safety stock. Multiplicative effect."),
    
    ("Warehouse Layout & Slotting", "Order Pattern Optimization", "amplifying",
     "Slotting optimizes physical layout. Order optimization improves logical fulfillment. Together they maximize throughput."),
    
    ("Cycle Counting & Inventory Accuracy", "Inventory Visibility & Real-Time Data", "sequential",
     "Counting establishes accuracy baseline. Visibility maintains it in real-time. Foundation then scale."),
    
    ("SKU Rationalization Analytics", "Demand Forecasting AI", "amplifying",
     "Fewer SKUs = easier to forecast. Better forecasts inform rationalization decisions. Reinforcing loop."),
    
    ("Supplier Lead Time & Reliability", "Inventory Visibility & Real-Time Data", "amplifying",
     "Supplier visibility enables proactive exception management. Reliability data improves planning parameters."),
]

RISK_TOLERANCES = [
    {"name": "Conservative", "discount": 70, "cap": 20},
    {"name": "Moderate", "discount": 80, "cap": 40},
    {"name": "Aggressive", "discount": 85, "cap": 60}
]

COMPLEXITY_LEVELS = ["Low", "Medium", "High"]


# =============================================================================
# SOLUTION IMPACT MATRIX (for generating impact explanations)
# =============================================================================

# Format: solution -> category -> {impact_type, conservative, moderate, aggressive}
IMPACT_MATRIX = {
    "Demand Forecasting AI": {
        "Inventory Carrying Cost": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-10% to -15%"},
        "Warehousing & Logistics": {"type": "TERTIARY", "cons": "-2% to -3%", "mod": "-3% to -5%", "agg": "-5% to -8%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "+1% to +2%", "mod": "+2% to +3%", "agg": "+3% to +5%"},
        "Order Processing & Back-Office": {"type": "TERTIARY", "cons": "-2% to -3%", "mod": "-3% to -5%", "agg": "-5% to -7%"},
        "Returns/Obsolescence/Shrinkage": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-10% to -15%", "agg": "-15% to -25%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-2% to -3%", "mod": "-3% to -5%", "agg": "-5% to -8%"}
    },
    "Inventory Planning & Replenishment": {
        "Inventory Carrying Cost": {"type": "SECONDARY", "cons": "-5% to -10%", "mod": "-10% to -20%", "agg": "-20% to -35%"},
        "Warehousing & Logistics": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -10%", "agg": "-10% to -15%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "0% to +2%", "mod": "+2% to +5%", "agg": "+5% to +10%"},
        "Order Processing & Back-Office": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -20%"},
        "Returns/Obsolescence/Shrinkage": {"type": "PRIMARY", "cons": "-10% to -15%", "mod": "-15% to -25%", "agg": "-25% to -40%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"}
    },
    "Supplier Lead Time & Reliability": {
        "Inventory Carrying Cost": {"type": "SECONDARY", "cons": "-8% to -12%", "mod": "-12% to -18%", "agg": "-18% to -25%"},
        "Warehousing & Logistics": {"type": "SECONDARY", "cons": "-10% to -15%", "mod": "-15% to -20%", "agg": "-20% to -25%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "+5% to +8%", "mod": "+8% to +12%", "agg": "+12% to +15%"},
        "Order Processing & Back-Office": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"},
        "Returns/Obsolescence/Shrinkage": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -18%"}
    },
    "SKU Rationalization Analytics": {
        "Inventory Carrying Cost": {"type": "PRIMARY", "cons": "-10% to -15%", "mod": "-15% to -25%", "agg": "-25% to -40%"},
        "Warehousing & Logistics": {"type": "SECONDARY", "cons": "-8% to -12%", "mod": "-12% to -18%", "agg": "-18% to -25%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "-5% to -8%", "mod": "-3% to -5%", "agg": "0%"},
        "Order Processing & Back-Office": {"type": "SECONDARY", "cons": "-5% to -10%", "mod": "-10% to -15%", "agg": "-15% to -20%"},
        "Returns/Obsolescence/Shrinkage": {"type": "PRIMARY", "cons": "-15% to -20%", "mod": "-20% to -30%", "agg": "-30% to -50%"},
        "IT Costs (Supply Chain)": {"type": "TERTIARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -18%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"}
    },
    "Warehouse Layout & Slotting": {
        "Inventory Carrying Cost": {"type": "TERTIARY", "cons": "-2% to -4%", "mod": "-4% to -8%", "agg": "-8% to -12%"},
        "Warehousing & Logistics": {"type": "PRIMARY", "cons": "-5% to -10%", "mod": "-10% to -20%", "agg": "-20% to -50%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "+1% to +2%", "mod": "+2% to +3%", "agg": "+3% to +5%"},
        "Order Processing & Back-Office": {"type": "SECONDARY", "cons": "-3% to -5%", "mod": "-5% to -10%", "agg": "-10% to -20%"},
        "Returns/Obsolescence/Shrinkage": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-2% to -3%", "mod": "-3% to -5%", "agg": "-5% to -8%"}
    },
    "Cycle Counting & Inventory Accuracy": {
        "Inventory Carrying Cost": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -10%", "agg": "-10% to -15%"},
        "Warehousing & Logistics": {"type": "PRIMARY", "cons": "-20% to -30%", "mod": "-40% to -60%", "agg": "-70% to -75%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "+1% to +2%", "mod": "+2% to +4%", "agg": "+4% to +6%"},
        "Order Processing & Back-Office": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -20%"},
        "Returns/Obsolescence/Shrinkage": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-8% to -15%", "agg": "-15% to -25%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -10%", "agg": "-10% to -15%"}
    },
    "Order Pattern Optimization": {
        "Inventory Carrying Cost": {"type": "SECONDARY", "cons": "-5% to -10%", "mod": "-10% to -15%", "agg": "-15% to -20%"},
        "Warehousing & Logistics": {"type": "SECONDARY", "cons": "-10% to -15%", "mod": "-15% to -25%", "agg": "-25% to -35%"},
        "Sales/Marketing/Customer Service": {"type": "SECONDARY", "cons": "+10% to +15%", "mod": "+15% to +25%", "agg": "+25% to +35%"},
        "Order Processing & Back-Office": {"type": "PRIMARY", "cons": "-15% to -25%", "mod": "-25% to -40%", "agg": "-40% to -60%"},
        "Returns/Obsolescence/Shrinkage": {"type": "TERTIARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -18%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-2% to -4%", "mod": "-4% to -6%", "agg": "-6% to -10%"}
    },
    "Inventory Visibility & Real-Time Data": {
        "Inventory Carrying Cost": {"type": "SECONDARY", "cons": "-8% to -12%", "mod": "-12% to -18%", "agg": "-18% to -25%"},
        "Warehousing & Logistics": {"type": "SECONDARY", "cons": "-10% to -15%", "mod": "-15% to -20%", "agg": "-20% to -25%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "+5% to +8%", "mod": "+8% to +12%", "agg": "+12% to +15%"},
        "Order Processing & Back-Office": {"type": "PRIMARY", "cons": "-15% to -20%", "mod": "-20% to -30%", "agg": "-30% to -40%"},
        "Returns/Obsolescence/Shrinkage": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-8% to -15%", "agg": "-15% to -25%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -10%", "agg": "-10% to -15%"}
    },
    "Obsolescence & Aging Control": {
        "Inventory Carrying Cost": {"type": "SECONDARY", "cons": "-5% to -8%", "mod": "-8% to -12%", "agg": "-12% to -20%"},
        "Warehousing & Logistics": {"type": "TERTIARY", "cons": "-3% to -5%", "mod": "-5% to -8%", "agg": "-8% to -12%"},
        "Sales/Marketing/Customer Service": {"type": "TERTIARY", "cons": "0%", "mod": "0% to +2%", "agg": "+2% to +5%"},
        "Order Processing & Back-Office": {"type": "TERTIARY", "cons": "-2% to -3%", "mod": "-3% to -5%", "agg": "-5% to -8%"},
        "Returns/Obsolescence/Shrinkage": {"type": "PRIMARY", "cons": "-20% to -30%", "mod": "-30% to -50%", "agg": "-50% to -70%"},
        "IT Costs (Supply Chain)": {"type": "MINIMAL", "cons": "0%", "mod": "0%", "agg": "0%"},
        "Risk & Compliance": {"type": "TERTIARY", "cons": "-2% to -4%", "mod": "-4% to -8%", "agg": "-8% to -12%"}
    }
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_impact_blocks_to_generate():
    """Returns list of (solution, category, impact_type) tuples for non-MINIMAL impacts."""
    blocks = []
    for solution, categories in IMPACT_MATRIX.items():
        for category, data in categories.items():
            if data["type"] != "MINIMAL":
                blocks.append({
                    "solution": solution,
                    "category": category,
                    "impact_type": data["type"],
                    "conservative_range": data["cons"],
                    "moderate_range": data["mod"],
                    "aggressive_range": data["agg"]
                })
    return blocks


def build_all_generation_tasks():
    """Build the complete list of generation tasks."""
    tasks = []
    
    # Executive summaries: 4 variations × 3 risk levels = 12
    for risk in RISK_TOLERANCES:
        for var in range(1, 5):
            tasks.append({
                "block_type": "executive_summary",
                "params": {"risk_tolerance": risk["name"], "variation": var},
                "output_key": f"executive_summary_{risk['name'].lower()}_v{var}"
            })
    
    # Industry narratives: 3 variations × 7 industries = 21
    for industry in INDUSTRIES:
        for var in range(1, 4):
            tasks.append({
                "block_type": "industry_narrative",
                "params": {
                    "industry": industry["name"],
                    "variation": var,
                    "industry_factors": industry["factors"]
                },
                "output_key": f"industry_{industry['name'].lower().replace('/', '_').replace(' ', '_')}_v{var}"
            })
    
    # Solution descriptions: 9
    for solution in SOLUTIONS:
        # Get impact matrix for this solution
        impact_data = IMPACT_MATRIX.get(solution["name"], {})
        impact_matrix_str = "\n".join([
            f"- {cat}: {data['type']} impact, {data['mod']} (moderate)"
            for cat, data in impact_data.items()
        ])
        tasks.append({
            "block_type": "solution_description",
            "params": {
                "solution_name": solution["name"],
                "roi_timeline": solution["roi_timeline"],
                "primary_impacts": solution["primary_impacts"],
                "sources": solution["sources"],
                "impact_matrix": impact_matrix_str
            },
            "output_key": f"solution_{solution['name'].lower().replace(' ', '_').replace('&', 'and')}"
        })
    
    # Category anchors: 2 variations × 7 categories = 14
    for category in CATEGORIES:
        for var in range(1, 3):
            tasks.append({
                "block_type": "category_anchor",
                "params": {
                    "category": category["name"],
                    "variation": var,
                    "benchmark_range": category["benchmark_range"],
                    "cost_components": category["cost_components"]
                },
                "output_key": f"category_{category['name'].lower().replace('/', '_').replace(' ', '_')}_v{var}"
            })
    
    # Impact explanations (PRIMARY, SECONDARY, TERTIARY)
    for block in get_impact_blocks_to_generate():
        prompt_type = f"impact_{block['impact_type'].lower()}"
        # Get sources for this solution
        solution_data = next((s for s in SOLUTIONS if s["name"] == block["solution"]), {})
        tasks.append({
            "block_type": prompt_type,
            "params": {
                "solution": block["solution"],
                "category": block["category"],
                "conservative_range": block["conservative_range"],
                "moderate_range": block["moderate_range"],
                "aggressive_range": block.get("aggressive_range", block["moderate_range"]),
                "typical_range": block["moderate_range"],
                "sources": solution_data.get("sources", "")
            },
            "output_key": f"impact_{block['solution'].lower().replace(' ', '_')}_{block['category'].lower().replace('/', '_').replace(' ', '_')}"
        })
    
    # Synergy paragraphs: 10+ pairs
    for sol_a, sol_b, interaction, description in SYNERGY_PAIRS:
        tasks.append({
            "block_type": "synergy",
            "params": {
                "solution_a": sol_a,
                "solution_b": sol_b,
                "interaction_type": interaction,
                "affected_categories": description
            },
            "output_key": f"synergy_{sol_a.lower().replace(' ', '_')[:15]}_{sol_b.lower().replace(' ', '_')[:15]}"
        })
    
    # Methodology: 3 (one per risk tolerance)
    for risk in RISK_TOLERANCES:
        tasks.append({
            "block_type": "methodology",
            "params": {
                "risk_tolerance": risk["name"],
                "discount": risk["discount"],
                "cap": risk["cap"]
            },
            "output_key": f"methodology_{risk['name'].lower()}"
        })
    
    # Implementation roadmaps: 3 (one per complexity)
    for complexity in COMPLEXITY_LEVELS:
        tasks.append({
            "block_type": "implementation_roadmap",
            "params": {"complexity": complexity},
            "output_key": f"roadmap_{complexity.lower()}"
        })
    
    # Single blocks
    single_blocks = [
        ("why_now", {}, "why_now"),
        ("diy_vs_partner", {}, "diy_vs_partner"),
        ("readiness_assessment", {}, "readiness_assessment"),
        ("report_limitations", {}, "report_limitations"),
        ("risk_factors", {}, "risk_factors"),
        ("next_steps", {}, "next_steps"),
        ("partner_acknowledgment", {}, "partner_acknowledgment"),
    ]
    for block_type, params, output_key in single_blocks:
        tasks.append({
            "block_type": block_type,
            "params": params,
            "output_key": output_key
        })
    
    # Sales enablement notes: Generate for common combinations
    # Top 10 most likely combinations
    common_combos = [
        ("Demand Forecasting AI + Inventory Planning", "Industrial Distribution", "Mid-Market"),
        ("SKU Rationalization Analytics", "Retail/E-commerce", "Small"),
        ("Warehouse Layout & Slotting + Cycle Counting", "Industrial Distribution", "Mid-Market"),
        ("Demand Forecasting AI + Obsolescence & Aging Control", "Food & Beverage", "Mid-Market"),
        ("Full Suite (all 9)", "Enterprise", "Enterprise"),
        ("Inventory Visibility + Order Pattern Optimization", "Retail/E-commerce", "Mid-Market"),
        ("SKU Rationalization + Demand Forecasting", "CPG", "Enterprise"),
        ("Supplier Lead Time + Inventory Planning", "Industrial Distribution", "Enterprise"),
        ("Cycle Counting + Inventory Visibility", "Pharmaceutical", "Mid-Market"),
        ("Warehouse Slotting only", "Industrial Distribution", "Small"),
    ]
    for combo, industry, size in common_combos:
        tasks.append({
            "block_type": "sales_enablement",
            "params": {
                "solution_combo": combo,
                "industry": industry,
                "company_size": size
            },
            "output_key": f"sales_enablement_{combo.lower().replace(' ', '_').replace('+', '_')[:30]}"
        })
    
    return tasks


# =============================================================================
# ASYNC GENERATION FUNCTIONS
# =============================================================================

async def generate_block(client, task, semaphore):
    """Generate a single block with rate limiting."""
    async with semaphore:
        prompt_template = PROMPTS.get(task["block_type"])
        if not prompt_template:
            return {"key": task["output_key"], "content": f"ERROR: Unknown block type {task['block_type']}", "error": True}
        
        # Fill in the prompt template
        try:
            prompt = prompt_template.format(**task["params"])
        except KeyError as e:
            return {"key": task["output_key"], "content": f"ERROR: Missing param {e}", "error": True}
        
        try:
            response = await asyncio.to_thread(
                client.messages.create,
                model="claude-sonnet-4-5",
                max_tokens=4000,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"}
                    }
                ],
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            return {
                "key": task["output_key"],
                "content": content,
                "block_type": task["block_type"],
                "params": task["params"],
                "tokens_used": response.usage.output_tokens
            }
            
        except Exception as e:
            return {"key": task["output_key"], "content": f"ERROR: {str(e)}", "error": True}


async def generate_all_blocks(max_concurrent=10):
    """Generate all blocks with parallel execution."""
    client = anthropic.Anthropic()
    semaphore = asyncio.Semaphore(max_concurrent)
    
    tasks = build_all_generation_tasks()
    print(f"Generating {len(tasks)} blocks...")
    print(f"Max concurrent requests: {max_concurrent}")
    
    # Create async tasks
    async_tasks = [generate_block(client, task, semaphore) for task in tasks]
    
    # Execute with progress tracking
    results = []
    for i, coro in enumerate(asyncio.as_completed(async_tasks)):
        result = await coro
        results.append(result)
        if (i + 1) % 10 == 0:
            print(f"  Completed {i + 1}/{len(tasks)} blocks...")
    
    return results


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def organize_results(results):
    """Organize results into structured JSON."""
    organized = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_blocks": len(results),
            "errors": sum(1 for r in results if r.get("error")),
            "total_tokens": sum(r.get("tokens_used", 0) for r in results)
        },
        "executive_summaries": {},
        "industry_narratives": {},
        "solution_descriptions": {},
        "category_anchors": {},
        "impact_explanations": {},
        "synergies": {},
        "methodology": {},
        "roadmaps": {},
        "strategic_blocks": {},
        "sales_enablement": {}
    }
    
    for result in results:
        key = result["key"]
        content = result["content"]
        
        if key.startswith("executive_summary_"):
            organized["executive_summaries"][key] = content
        elif key.startswith("industry_"):
            organized["industry_narratives"][key] = content
        elif key.startswith("solution_"):
            organized["solution_descriptions"][key] = content
        elif key.startswith("category_"):
            organized["category_anchors"][key] = content
        elif key.startswith("impact_"):
            organized["impact_explanations"][key] = content
        elif key.startswith("synergy_"):
            organized["synergies"][key] = content
        elif key.startswith("methodology_"):
            organized["methodology"][key] = content
        elif key.startswith("roadmap_"):
            organized["roadmaps"][key] = content
        elif key.startswith("sales_enablement_"):
            organized["sales_enablement"][key] = content
        else:
            organized["strategic_blocks"][key] = content
    
    return organized


def main():
    """Main execution function."""
    print("=" * 60)
    print("AAXIS Proof of Value - Report Block Generator")
    print("=" * 60)
    
    # Build task list first to show what we're generating
    tasks = build_all_generation_tasks()
    
    print(f"\nBlock types to generate:")
    block_type_counts = {}
    for task in tasks:
        bt = task["block_type"]
        block_type_counts[bt] = block_type_counts.get(bt, 0) + 1
    for bt, count in sorted(block_type_counts.items()):
        print(f"  - {bt}: {count}")
    
    print(f"\nTotal blocks: {len(tasks)}")
    print(f"Estimated cost: ~$2-3")
    print(f"Estimated time: ~2-3 minutes")
    
    confirm = input("\nProceed? (y/n): ")
    if confirm.lower() != 'y':
        print("Aborted.")
        return
    
    print("\nStarting generation...")
    start_time = datetime.now()
    
    # Run async generation
    results = asyncio.run(generate_all_blocks(max_concurrent=10))
    
    # Organize results
    organized = organize_results(results)
    
    # Save to file
    output_file = "report_blocks.json"
    with open(output_file, "w") as f:
        json.dump(organized, f, indent=2)
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Total blocks generated: {organized['metadata']['total_blocks']}")
    print(f"Errors: {organized['metadata']['errors']}")
    print(f"Total output tokens: {organized['metadata']['total_tokens']:,}")
    print(f"Estimated cost: ${organized['metadata']['total_tokens'] * 15 / 1_000_000:.2f}")
    print(f"Time elapsed: {elapsed:.1f} seconds")
    print(f"Output saved to: {output_file}")


if __name__ == "__main__":
    main()
