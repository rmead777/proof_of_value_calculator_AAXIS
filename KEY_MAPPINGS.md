# Quick Reference: Key Mappings

Use this to map user-facing values to JSON block keys.

## Industry → Block Key

| User Selection | JSON Key Pattern |
|----------------|------------------|
| Food & Beverage | `industry_food_&_beverage_v{1-3}` |
| Industrial Distribution | `industry_industrial_distribution_v{1-3}` |
| Retail/E-commerce | `industry_retail_e-commerce_v{1-3}` |
| Pharmaceutical | `industry_pharmaceutical_v{1-3}` |
| Technology/Electronics | `industry_technology_electronics_v{1-3}` |
| Fashion/Apparel | `industry_fashion_apparel_v{1-3}` |
| CPG | `industry_cpg_v{1-3}` |

## Solution → Block Key

| User Selection | JSON Key |
|----------------|----------|
| Demand Forecasting AI | `solution_demand_forecasting_ai` |
| Inventory Planning & Replenishment | `solution_inventory_planning_and_replenishment` |
| Supplier Lead Time & Reliability | `solution_supplier_lead_time_and_reliability` |
| SKU Rationalization Analytics | `solution_sku_rationalization_analytics` |
| Warehouse Layout & Slotting | `solution_warehouse_layout_and_slotting` |
| Cycle Counting & Inventory Accuracy | `solution_cycle_counting_and_inventory_accuracy` |
| Order Pattern Optimization | `solution_order_pattern_optimization` |
| Inventory Visibility & Real-Time Data | `solution_inventory_visibility_and_real-time_data` |
| Obsolescence & Aging Control | `solution_obsolescence_and_aging_control` |

## Category → Block Key

| Category Name | JSON Key Pattern |
|---------------|------------------|
| Inventory Carrying Cost | `category_inventory_carrying_cost_v{1-2}` |
| Warehousing & Logistics | `category_warehousing_&_logistics_v{1-2}` |
| Sales/Marketing/Customer Service | `category_sales_marketing_customer_service_v{1-2}` |
| Order Processing & Back-Office | `category_order_processing_&_back-office_v{1-2}` |
| Returns/Obsolescence/Shrinkage | `category_returns_obsolescence_shrinkage_v{1-2}` |
| IT Costs (Supply Chain) | `category_it_costs_(supply_chain)_v{1-2}` |
| Risk & Compliance | `category_risk_&_compliance_v{1-2}` |

## Risk Tolerance → Block Keys

| Risk Level | Executive Summary | Methodology |
|------------|-------------------|-------------|
| Conservative | `executive_summary_conservative_v{1-4}` | `methodology_conservative` |
| Moderate | `executive_summary_moderate_v{1-4}` | `methodology_moderate` |
| Aggressive | `executive_summary_aggressive_v{1-4}` | `methodology_aggressive` |

## Complexity → Roadmap

| # Solutions | Complexity | Block Key |
|-------------|------------|-----------|
| 1-2 | Low | `roadmap_low` |
| 3-5 | Medium | `roadmap_medium` |
| 6-9 | High | `roadmap_high` |

## Synergy Pairs

| Solution A | Solution B | JSON Key |
|------------|------------|----------|
| Demand Forecasting AI | Inventory Planning & Replenishment | `synergy_demand_forecast_inventory_plann` |
| Warehouse Layout & Slotting | Cycle Counting & Inventory Accuracy | `synergy_warehouse_layou_cycle_counting_` |
| SKU Rationalization Analytics | Obsolescence & Aging Control | `synergy_sku_rationaliza_obsolescence_&_` |
| Inventory Visibility & Real-Time Data | Order Pattern Optimization | `synergy_inventory_visib_order_pattern_o` |
| Demand Forecasting AI | Obsolescence & Aging Control | `synergy_demand_forecast_obsolescence_&_` |
| Inventory Planning & Replenishment | Supplier Lead Time & Reliability | `synergy_inventory_plann_supplier_lead_t` |
| Warehouse Layout & Slotting | Order Pattern Optimization | `synergy_warehouse_layou_order_pattern_o` |
| Cycle Counting & Inventory Accuracy | Inventory Visibility & Real-Time Data | `synergy_cycle_counting__inventory_visib` |
| SKU Rationalization Analytics | Demand Forecasting AI | `synergy_sku_rationaliza_demand_forecast` |
| Supplier Lead Time & Reliability | Inventory Visibility & Real-Time Data | `synergy_supplier_lead_t_inventory_visib` |

## Impact Explanation Keys

Pattern: `impact_{solution_key}_{category_key}`

Example: For "Demand Forecasting AI" impacting "Inventory Carrying Cost":
→ `impact_demand_forecasting_ai_inventory_carrying_cost`

**Note:** Not all solution×category combinations exist. Only non-MINIMAL impacts were generated. If a key doesn't exist, skip that impact explanation.

## Strategic Blocks (Always Include)

| Block | JSON Key | Include In Report? |
|-------|----------|-------------------|
| Why Now | `why_now` | ✅ Yes (after exec summary) |
| DIY vs Partner | `diy_vs_partner` | ✅ Yes |
| Readiness Assessment | `readiness_assessment` | ✅ Yes |
| Risk Factors | `risk_factors` | ✅ Yes |
| Report Limitations | `report_limitations` | ✅ Yes |
| Next Steps | `next_steps` | ✅ Yes |
| Partner Acknowledgment | `partner_acknowledgment` | ✅ Yes |

## Sales Enablement (Internal Only)

These are for AAXIS sales team only — DO NOT include in customer-facing report.

| Combo | JSON Key |
|-------|----------|
| Demand Forecasting + Inventory Planning | `sales_enablement_demand_forecasting_ai___invent` |
| Demand Forecasting + Obsolescence | `sales_enablement_demand_forecasting_ai___obsole` |
| SKU Rationalization alone | `sales_enablement_sku_rationalization_analytics` |
| SKU Rationalization + Demand Forecasting | `sales_enablement_sku_rationalization___demand_f` |
| Cycle Counting + Inventory Visibility | `sales_enablement_cycle_counting___inventory_vis` |
| Inventory Visibility + Order Pattern | `sales_enablement_inventory_visibility___order_p` |
| Supplier Lead Time + Inventory Planning | `sales_enablement_supplier_lead_time___inventory` |
| Warehouse Slotting + Cycle Counting | `sales_enablement_warehouse_layout_&_slotting___` |
| Warehouse Slotting only | `sales_enablement_warehouse_slotting_only` |
| Full Suite (all 9) | `sales_enablement_full_suite_(all_9)` |

---

## Placeholder Reference

### Always Available (from user input)
- `{{industry}}`
- `{{company_size}}`
- `{{annual_revenue}}`
- `{{num_solutions}}`
- `{{selected_solutions}}`
- `{{risk_tolerance}}`

### From Calculator Output
- `{{total_savings}}`
- `{{savings_range_low}}`
- `{{savings_range_high}}`
- `{{opex_reduction_pct}}`

### Derived
- `{{complexity_level}}` — Low/Medium/High based on solution count

### Category-Specific (may need special handling)
- `{{category_current_spend}}` — Per-category from inputs
- `{{category_pct_revenue}}` — Per-category calculated
- `{{category_vs_benchmark}}` — Above/Below/Within typical

### Optional (may not have data)
- `{{user_inventory_turns}}`
- `{{user_opex_pct}}`
- `{{user_lead_time}}`
- `{{scheduling_link}}` — Static: `https://calendly.com/aaxis`
- `{{contact_email}}` — Static: `info@aaxis.com`

---

## Report Section Order

1. Executive Summary
2. Why Now
3. Company Profile (Industry Narrative)
4. Selected Solutions Analysis
   - Solution descriptions (only selected)
   - Synergies (if applicable)
5. Detailed Savings by Category
   - Category anchor
   - Impact explanations (per solution)
6. Methodology & Assumptions
7. Implementation Roadmap
8. DIY vs Partner
9. Readiness Assessment
10. Risk Factors
11. Report Limitations
12. Next Steps
13. Partner Acknowledgment
