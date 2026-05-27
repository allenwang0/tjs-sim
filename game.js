// ============================================================
// TRADER JOE'S SIMULATOR — game.js
// All game data, state, and simulation logic.
// ============================================================

// ============================================================
// STATIC DATA
// ============================================================

const LOCATIONS = [
  { id:'sf',        name:"Hayes Valley, SF",     traffic:1800, rent:14000, demo:1.4,  comp:'Low',    rentHoliday:0.30 },
  { id:'nyc',       name:"Upper West Side, NYC",  traffic:2400, rent:22000, demo:1.3,  comp:'Medium', rentHoliday:0.30 },
  { id:'houston',   name:"Suburban Houston, TX",  traffic:1400, rent:7500,  demo:0.95, comp:'High',   rentHoliday:0.20 },
  { id:'cambridge', name:"Cambridge, MA",          traffic:1600, rent:11000, demo:1.2,  comp:'Low',    rentHoliday:0.25 },
  { id:'pasadena',  name:"Pasadena, CA",           traffic:1700, rent:9500,  demo:1.1,  comp:'Medium', rentHoliday:0.25 },
  { id:'atlanta',   name:"Midtown Atlanta, GA",    traffic:1200, rent:8000,  demo:1.0,  comp:'Medium', rentHoliday:0.20 },
  { id:'annarbor',  name:"Ann Arbor, MI",          traffic:1100, rent:6000,  demo:1.05, comp:'Low',    rentHoliday:0.15 },
  { id:'portland',  name:"Portland, OR",           traffic:1500, rent:8500,  demo:1.15, comp:'Low',    rentHoliday:0.20 },
];

// priceSensitivity label derived from elasticity at render time:
// <=0.7 INELASTIC | 0.71-0.95 LOW | 0.96-1.15 NEUTRAL | 1.16-1.35 ELASTIC | >1.35 HIGHLY ELASTIC
function elasticityLabel(e) {
  if (e <= 0.70) return 'INELASTIC';
  if (e <= 0.95) return 'LOW';
  if (e <= 1.15) return 'NEUTRAL';
  if (e <= 1.35) return 'ELASTIC';
  return 'HI-ELASTIC';
}

const CATALOG = [
  // FROZEN
  { id:'f1',  name:'Mandarin Orange Chicken',           cat:'Frozen',    cost:5.99,  baseRetail:8.99,  baseDemand:45, elasticity:0.80, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'Hall of Fame. The anchor. Exceptionally resilient demand; nearly impossible to overstock.', fee:200 },
  { id:'f2',  name:'Steamed Pork & Ginger Soup Dumplings', cat:'Frozen', cost:4.49, baseRetail:6.99,  baseDemand:38, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.0,winter:1.2},   note:'Best Overall 2025 Customer Choice. Exceptional throughput. Winter spike.', fee:200 },
  { id:'f3',  name:'Butternut Squash Mac & Cheese',      cat:'Frozen',   cost:3.99,  baseRetail:5.99,  baseDemand:30, elasticity:1.10, perishable:false, trendSensitive:true,  limited:false, startWk:null, endWk:null, season:{spring:0.6,summer:0.4,fall:2.2,winter:1.2},   note:'Fall rocket. Trend-sensitive. Demand triples in pumpkin season.', fee:200 },
  { id:'f4',  name:'Steamed Chicken Soup Dumplings',     cat:'Frozen',   cost:4.49,  baseRetail:6.99,  baseDemand:32, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.8,fall:1.1,winter:1.2},   note:'Predictable baseline asset. Pairs well with pork dumplings.', fee:200 },
  { id:'f5',  name:'Butter Chicken with Basmati Rice',   cat:'Frozen',   cost:5.49,  baseRetail:7.99,  baseDemand:28, elasticity:1.00, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.0,winter:1.1},   note:'Stable ready-meal. Inelastic downward. Good winter comfort bump.', fee:200 },
  { id:'f6',  name:'Cauliflower Gnocchi',                cat:'Frozen',   cost:3.49,  baseRetail:5.49,  baseDemand:25, elasticity:1.20, perishable:false, trendSensitive:true,  limited:false, startWk:null, endWk:null, season:{spring:1.1,summer:1.0,fall:0.9,winter:0.9},   note:'Highly trend-reactive. Price carefully — elastic upward and down.', fee:200 },
  { id:'f7',  name:'Spinach & Artichoke Dip',            cat:'Frozen',   cost:3.99,  baseRetail:5.59,  baseDemand:22, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.1,fall:1.0,winter:1.3},   note:'Holiday gathering staple. Winter peak is reliable.', fee:200 },
  { id:'f8',  name:'Hold the Cone! Mini Ice Cream Cones',cat:'Frozen',   cost:4.99,  baseRetail:6.99,  baseDemand:35, elasticity:0.80, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.2,summer:1.8,fall:0.8,winter:0.5},   note:'Summer driver. Perish carefully in winter — waste risk is real.', fee:200 },
  // SNACKS
  { id:'s1',  name:'Chili & Lime Rolled Tortilla Chips', cat:'Snacks',   cost:2.49,  baseRetail:3.99,  baseDemand:55, elasticity:0.70, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.1,fall:1.0,winter:0.9},   note:'#1 overall 2024. Dominant. Nearly impossible to price wrong. Start here.', fee:200 },
  { id:'s2',  name:'Dark Chocolate Peanut Butter Cups',  cat:'Snacks',   cost:3.49,  baseRetail:4.99,  baseDemand:48, elasticity:0.70, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.1,winter:1.2},   note:'Hall of Fame. High loyalty. Absolute cash margin per unit is strong.', fee:200 },
  { id:'s3',  name:'Peanut Butter Filled Pretzel Nuggets',cat:'Snacks',  cost:2.99,  baseRetail:4.49,  baseDemand:52, elasticity:0.70, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'Hall of Fame. Perfect linear demand across all seasons. Set and forget.', fee:200 },
  { id:'s4',  name:'Everything But the Bagel Seasoning', cat:'Snacks',   cost:1.99,  baseRetail:3.49,  baseDemand:40, elasticity:0.60, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'High margin headroom. Inelastic — you can push price here.', fee:200 },
  { id:'s5',  name:'Unexpected Cheddar (block)',         cat:'Snacks',   cost:5.49,  baseRetail:7.99,  baseDemand:35, elasticity:0.80, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.1,winter:1.3},   note:'Hall of Fame. Winter charcuterie anchor. Outstanding absolute margin.', fee:200 },
  { id:'s6',  name:'Kimbap',                             cat:'Snacks',   cost:3.49,  baseRetail:5.49,  baseDemand:28, elasticity:1.10, perishable:false, trendSensitive:true,  limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'Trend-sensitive. When it goes viral it really goes viral. Keep safety stock.', fee:200 },
  { id:'s7',  name:"Joe-Joe's Sandwich Cookies",         cat:'Snacks',   cost:2.99,  baseRetail:4.49,  baseDemand:30, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'Steady. Seasonal variants cannibalize this slightly during fall/winter.', fee:200 },
  { id:'s8',  name:'Himalayan Pink Salt Dark Choc Bar',  cat:'Snacks',   cost:1.99,  baseRetail:3.49,  baseDemand:25, elasticity:1.00, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.8,fall:1.1,winter:1.2},   note:'Reliable impulse buy. Low footprint, consistent margin.', fee:200 },
  { id:'s9',  name:'Protein Pancakes',                   cat:'Snacks',   cost:4.99,  baseRetail:6.99,  baseDemand:22, elasticity:1.10, perishable:false, trendSensitive:true,  limited:false, startWk:null, endWk:null, season:{spring:1.2,summer:1.0,fall:0.9,winter:0.9},   note:'Best New 2025. Trend-sensitive — health content cycles can spike this.', fee:200 },
  // PRODUCE
  { id:'p1',  name:'Mini Avocados (bag)',                cat:'Produce',  cost:3.99,  baseRetail:5.99,  baseDemand:30, elasticity:1.20, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.2,summer:1.3,fall:0.8,winter:0.7},   note:'High waste risk in fall/winter. Summer is the window. Order conservatively.', fee:200 },
  { id:'p2',  name:'Organic Persian Cucumbers',         cat:'Produce',  cost:1.49,  baseRetail:2.49,  baseDemand:35, elasticity:1.10, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.3,summer:1.4,fall:0.8,winter:0.5},   note:'Summer asset. Fast decay in cold months. Order only what you can move.', fee:200 },
  { id:'p3',  name:'Honeycrisp Apples (bag)',           cat:'Produce',  cost:3.99,  baseRetail:5.99,  baseDemand:28, elasticity:0.90, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:0.7,summer:0.6,fall:2.0,winter:1.2},   note:'Exceptional fall expansion. Pairs with every pumpkin item in the catalog.', fee:200 },
  { id:'p4',  name:'Fresh Blueberries (pint)',           cat:'Produce',  cost:2.99,  baseRetail:4.49,  baseDemand:32, elasticity:1.00, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.2,summer:1.6,fall:0.7,winter:0.5},   note:'Summer anchor. Consistent demographics appeal. High turn in warm months.', fee:200 },
  { id:'p5',  name:'Baby Arugula (clamshell)',           cat:'Produce',  cost:2.49,  baseRetail:3.99,  baseDemand:22, elasticity:1.10, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.3,summer:1.1,fall:0.8,winter:0.8},   note:'Spring anchor. Consistent shopper base. Low waste risk if ordered carefully.', fee:200 },
  // DAIRY
  { id:'d1',  name:'Fine Goat Cheese Log',              cat:'Dairy',    cost:3.49,  baseRetail:5.49,  baseDemand:20, elasticity:0.90, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.1,summer:1.1,fall:1.0,winter:1.2},   note:'Consistent. Complements wine, seasonal crackers. Reliable contributor.', fee:200 },
  { id:'d2',  name:'Unexpected Cheddar (sliced)',       cat:'Dairy',    cost:4.99,  baseRetail:6.99,  baseDemand:22, elasticity:0.80, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.1,fall:1.0,winter:1.0},   note:'Solid iteration. Lower wastage profile than soft dairy variants.', fee:200 },
  { id:'d3',  name:'Plain Whole Milk Greek Yogurt 32oz',cat:'Dairy',    cost:4.49,  baseRetail:6.49,  baseDemand:25, elasticity:1.00, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.1,summer:1.1,fall:0.9,winter:0.9},   note:'Stable daily recurring consumption. Reliable turn across demographics.', fee:200 },
  { id:'d4',  name:'Organic Vitamin D Whole Milk',      cat:'Dairy',    cost:3.49,  baseRetail:5.49,  baseDemand:30, elasticity:0.90, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.0,winter:1.1},   note:'Household necessity. Inelastic downward. Foundation item.', fee:200 },
  // PANTRY
  { id:'pa1', name:'Soy Chorizo',                       cat:'Pantry',   cost:2.49,  baseRetail:3.99,  baseDemand:28, elasticity:0.80, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'Hall of Fame. Vegan anchor with loyal repeat customer base.', fee:200 },
  { id:'pa2', name:'Organic Tomato Basil Marinara',     cat:'Pantry',   cost:2.49,  baseRetail:3.99,  baseDemand:25, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:0.9,summer:0.9,fall:1.1,winter:1.1},   note:'Excellent ambient storage. Winter comfort food driver.', fee:200 },
  { id:'pa3', name:"Trader Giotto's Roasted Garlic Linguine", cat:'Pantry', cost:1.99, baseRetail:2.99, baseDemand:22, elasticity:1.00, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:0.9,summer:0.8,fall:1.1,winter:1.2}, note:'Winter pairing item. Low cost, steady throughput.', fee:200 },
  { id:'pa4', name:'Artisan Sourdough Bread',           cat:'Pantry',   cost:3.49,  baseRetail:4.99,  baseDemand:35, elasticity:0.80, perishable:true,  trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.9,fall:1.1,winter:1.1},   note:'Fast decay — order 3-4 days of supply max. High velocity when stocked.', fee:200 },
  { id:'pa5', name:'Speculoos Cookie Butter',           cat:'Pantry',   cost:3.49,  baseRetail:4.99,  baseDemand:30, elasticity:0.70, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:0.9,summer:0.8,fall:1.2,winter:1.4},   note:'Legendary brand component. Holiday season multiplier is strong.', fee:200 },
  { id:'pa6', name:'21 Seasoning Salute',               cat:'Pantry',   cost:1.99,  baseRetail:3.49,  baseDemand:28, elasticity:0.60, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:1.0,fall:1.0,winter:1.0},   note:'High margin headroom. Similar inelasticity profile to EBTB seasoning.', fee:200 },
  // BEVERAGES
  { id:'b1',  name:'Cold Brew Coffee Concentrate',      cat:'Beverages', cost:4.49, baseRetail:6.99,  baseDemand:22, elasticity:1.00, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.3,summer:1.7,fall:0.8,winter:0.6},   note:'Summer accelerator. Cold season floor is significant — order carefully Nov-Mar.', fee:200 },
  { id:'b2',  name:'Organic Sparkling Lemonade (4pk)', cat:'Beverages', cost:3.49,  baseRetail:5.49,  baseDemand:25, elasticity:1.00, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.2,summer:1.8,fall:0.7,winter:0.5},   note:'Summer volume driver. Strong spring pickup.', fee:200 },
  { id:'b3',  name:'Organic Fair Trade French Roast',   cat:'Beverages', cost:7.99, baseRetail:11.99, baseDemand:18, elasticity:0.80, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:1.0,summer:0.8,fall:1.1,winter:1.3},   note:'High absolute dollar per unit. Strong winter demand. Low unit risk.', fee:200 },
  { id:'b4',  name:'Sparkling Honeycrisp Apple Juice',  cat:'Beverages', cost:3.49, baseRetail:4.99,  baseDemand:28, elasticity:0.90, perishable:false, trendSensitive:false, limited:false, startWk:null, endWk:null, season:{spring:0.8,summer:0.7,fall:1.8,winter:1.2},   note:'Fall/winter performer. Customer Choice runner-up. Low risk.', fee:200 },
  // SEASONAL / LIMITED
  { id:'sea1', name:'Spiced Apple Cider (gallon)',         cat:'Seasonal', cost:3.99, baseRetail:5.99, baseDemand:60, elasticity:0.80, perishable:true,  trendSensitive:false, limited:true, startWk:27, endWk:35, season:{spring:0,summer:0,fall:1,winter:0}, note:'#1 Beverage Customer Choice. Massive volume. Perishable — hard wipe at week 35. Pre-order aggressively.', fee:500 },
  { id:'sea2', name:"Pumpkin Joe-Joe's Cookies",           cat:'Seasonal', cost:3.49, baseRetail:4.99, baseDemand:45, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:27, endWk:33, season:{spring:0,summer:0,fall:1,winter:0}, note:'Seasonal classic. Non-perishable but window is only 6 weeks. Order early.', fee:500 },
  { id:'sea3', name:'Pumpkin Bread & Muffin Mix',          cat:'Seasonal', cost:2.99, baseRetail:4.49, baseDemand:38, elasticity:0.80, perishable:false, trendSensitive:false, limited:true, startWk:27, endWk:35, season:{spring:0,summer:0,fall:1,winter:0}, note:'High early-season velocity. Non-perishable; holdover inventory not a major risk.', fee:500 },
  { id:'sea4', name:'Pumpkin Butter (jar)',                cat:'Seasonal', cost:2.99, baseRetail:4.49, baseDemand:35, elasticity:0.70, perishable:false, trendSensitive:false, limited:true, startWk:27, endWk:35, season:{spring:0,summer:0,fall:1,winter:0}, note:'Inelastic. Solid margin. Fan favorite year after year.', fee:500 },
  { id:'sea5', name:'Pumpkin Bisque Soup',                 cat:'Seasonal', cost:3.49, baseRetail:5.49, baseDemand:30, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:28, endWk:35, season:{spring:0,summer:0,fall:1,winter:0}, note:'Reliable fall item. Non-perishable. Pre-winter consolidation.', fee:500 },
  { id:'sea6', name:'Pumpkin Spice Mini Sheet Cake',       cat:'Seasonal', cost:5.99, baseRetail:8.99, baseDemand:40, elasticity:1.10, perishable:true,  trendSensitive:false, limited:true, startWk:27, endWk:31, season:{spring:0,summer:0,fall:1,winter:0}, note:'4-week window. Perishable. High demand, high waste risk. Auto-markdown fires wk 30.', fee:500 },
  { id:'sea7', name:'Jingle Jangle Chocolate Mix (tin)',   cat:'Seasonal', cost:9.99, baseRetail:14.99,baseDemand:65, elasticity:0.70, perishable:false, trendSensitive:false, limited:true, startWk:40, endWk:46, season:{spring:0,summer:0,fall:0,winter:1}, note:'Revenue flagship. Inelastic. Miss this and you miss the quarter.', fee:500 },
  { id:'sea8', name:"Peppermint Joe-Joe's Cookies",        cat:'Seasonal', cost:3.49, baseRetail:4.99, baseDemand:50, elasticity:0.80, perishable:false, trendSensitive:false, limited:true, startWk:40, endWk:46, season:{spring:0,summer:0,fall:0,winter:1}, note:'Holiday essential. High predictability. Order generously.', fee:500 },
  { id:'sea9', name:'Traditional Italian Panettone',       cat:'Seasonal', cost:8.99, baseRetail:12.99,baseDemand:30, elasticity:1.20, perishable:true,  trendSensitive:false, limited:true, startWk:41, endWk:46, season:{spring:0,summer:0,fall:0,winter:1}, note:'High cost, perishable. Auto-markdown fires wk 45. Order precisely.', fee:500 },
  { id:'sea10',name:'Watermelon Agua Fresca',              cat:'Seasonal', cost:2.49, baseRetail:3.99, baseDemand:40, elasticity:1.00, perishable:true,  trendSensitive:false, limited:true, startWk:14, endWk:22, season:{spring:0,summer:1,fall:0,winter:0}, note:'Summer perishable. Fast turn when it is in season. Waste risk at window close.', fee:500 },
  { id:'sea11',name:'Sparkling Pamplemousse',              cat:'Seasonal', cost:1.99, baseRetail:2.99, baseDemand:45, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:14, endWk:22, season:{spring:0,summer:1,fall:0,winter:0}, note:'Summer evergreen. Low shelf footprint. Non-perishable. Safe first seasonal pick.', fee:500 },
  { id:'sea12',name:'Strawberry Rhubarb Jam',              cat:'Seasonal', cost:2.99, baseRetail:4.49, baseDemand:28, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:1,  endWk:12, season:{spring:1,summer:0,fall:0,winter:0}, note:'Spring opener. Non-perishable. Modest but reliable demand.', fee:500 },
  { id:'sea13',name:"TJ's Charles Shaw Rosé",              cat:'Seasonal', cost:2.99, baseRetail:4.99, baseDemand:30, elasticity:0.80, perishable:false, trendSensitive:false, limited:true, startWk:1,  endWk:26, season:{spring:1,summer:1,fall:0,winter:0}, note:'Long spring/summer window. Two-Buck Chuck legacy. Reliable low-risk addition.', fee:500 },
  { id:'sea14',name:'Maple Brown Butter Almonds',          cat:'Seasonal', cost:4.49, baseRetail:6.49, baseDemand:28, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:30, endWk:39, season:{spring:0,summer:0,fall:1,winter:0}, note:'Late fall. Non-perishable. Premium gift-adjacent positioning.', fee:500 },
  { id:'sea15',name:'Fall Harvest Salsa',                  cat:'Seasonal', cost:2.99, baseRetail:4.49, baseDemand:25, elasticity:0.90, perishable:false, trendSensitive:false, limited:true, startWk:27, endWk:35, season:{spring:0,summer:0,fall:1,winter:0}, note:'Crowd-pleaser. Complements chips cross-sell. Non-perishable. Safe add.', fee:500 },
];

// Seeds: pre-stocked items for new store (player inherits a running store)
const SEED_SKUS = [
  { id:'s1', order:50, price:3.99, onHand:120 },
  { id:'s2', order:40, price:4.99, onHand:100 },
  { id:'f1', order:40, price:8.99, onHand:80  },
  { id:'pa4',order:25, price:4.99, onHand:50  },
];

// Trend signal vocabulary (shown 1-2 wks before trend fires)
const TREND_SIGNALS = [
  'Chatter rising on social feeds around {cat} items.',
  'Influencer content featuring {cat} products has spiked this week.',
  'Customer basket analysis shows growing interest in {cat}.',
  'Word is spreading. Something in {cat} is about to move.',
];

// ============================================================
// STATE
// ============================================================

const DEFAULT_STATE = () => ({
  version: 3,
  cash: 75000,
  cumulativeProfit: 0,
  week: 1,
  year: 1,
  season: 'spring',
  locationId: 'sf',
  crew: 8,
  wage: 22,
  morale: 100,
  skuLimit: 20,
  // { [catalogId]: { onHand, order, lastSold, consStockouts, price, arrivalWk } }
  inventory: {},
  profitHistory: [],       // last 12 net profits
  cogsAccum: 0,
  wasteAccum: 0,
  pl: { revenue:0, cogs:0, gross:0, waste:0, labor:0, rent:0, net:0 },
  trend: null,             // { id, mult, weeksLeft, signalFired }
  pendingTrendSignal: null,// { id, firesInWk } — fires signal 2 wks early
  annualViral: null,
  stockoutRatePct: 0,
  logs: [],
  // Degradation disabled for first 8 weeks
  degradationActive: false,
  // Price trust tracker: running avg markup vs base over last 4 weeks
  markupHistory: [],       // last 4 weekly avg markup ratios
  filter: 'all',
  sort:   'status',
  gamePhase: 'setup',      // 'setup' | 'play'
  // Fan favorite badges persist across prestige
  fanFavorites: {},        // { [id]: boolean }
  prestigePerks: {
    loyalCrew: false,
    supplierDiscount: false,
    dataAnalyst: false,
  },
  prestigeCount: 0,
});

let S = DEFAULT_STATE();

// ============================================================
// SAVE / LOAD
// ============================================================

function saveGame() {
  try { localStorage.setItem('tjs_sim_v3', JSON.stringify(S)); } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem('tjs_sim_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 3) {
        S = parsed;
        return true;
      }
    }
  } catch(e) {}
  return false;
}

function hardReset() {
  localStorage.removeItem('tjs_sim_v3');
  S = DEFAULT_STATE();
  saveGame();
}

// ============================================================
// HELPERS
// ============================================================

function getLoc()  { return LOCATIONS.find(l => l.id === S.locationId); }
function getCat(id){ return CATALOG.find(c => c.id === id); }

function currentSeason() {
  const w = S.week;
  if (w >= 40) return 'winter';
  if (w >= 27) return 'fall';
  if (w >= 14) return 'summer';
  return 'spring';
}

function seasonTrafficMod() {
  switch(S.season) {
    case 'summer': return 1.15;
    case 'fall':   return 1.10;
    case 'winter': return 1.05;
    default:       return 1.00;
  }
}

function suggestedCrew() {
  const loc = getLoc();
  return Math.max(4, Math.round((loc.traffic * seasonTrafficMod()) / 200));
}

function throughputMult() {
  const sc = suggestedCrew();
  let t = S.crew >= sc ? 1.0 : Math.max(0.5, S.crew / sc);
  t *= (0.70 + (S.morale / 100) * 0.30);
  return Math.min(1.10, t);
}

function shrinkageRate() {
  const sc = suggestedCrew();
  let base = 0.01;
  if (S.crew < sc) base += Math.min(0.12, (sc - S.crew) * 0.025);
  return base;
}

function operationalState() {
  const sc = suggestedCrew();
  if (S.crew < Math.ceil(sc * 0.60)) return 'UNDERSTAFFED';
  if (S.morale < 45) return 'EXHAUSTED CREW';
  if (S.crew < sc)   return 'LEAN';
  if (S.morale > 80 && S.crew >= sc) return 'HIGH MORALE';
  return 'NOMINAL';
}

function formatMoney(n, sign=false) {
  const abs = Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  if (sign) return (n >= 0 ? '+$' : '-$') + abs;
  return (n < 0 ? '-$' : '$') + abs;
}

function isSeasonalAvailable(cat) {
  if (!cat.limited) return true;
  return S.week >= cat.startWk && S.week <= cat.endWk;
}

// ============================================================
// PRESTIGE
// ============================================================

function prestigeEligible() {
  return S.cash >= 500000 || S.cumulativeProfit >= 500000;
}

function doPrestige(newLocId) {
  const carryFanFaves = { ...S.fanFavorites };
  const carryPerks = { ...S.prestigePerks };
  const carryCount = S.prestigeCount + 1;
  const carryCash = Math.max(75000, S.cash * 0.20);

  // Unlock perks per prestige count
  const newPerks = { ...carryPerks };
  if (carryCount >= 1) newPerks.loyalCrew = true;
  if (carryCount >= 2) newPerks.supplierDiscount = true;
  if (carryCount >= 3) newPerks.dataAnalyst = true;

  S = DEFAULT_STATE();
  S.cash = carryCash;
  S.locationId = newLocId;
  S.fanFavorites = carryFanFaves;
  S.prestigePerks = newPerks;
  S.prestigeCount = carryCount;
  S.gamePhase = 'play';

  seedStartingInventory();
  rollAnnualViral();
  log(`New store opened: ${getLoc().name}. Carry-forward: ${formatMoney(carryCash)}. Prestige perks active.`);
  saveGame();
}

// ============================================================
// INVENTORY HELPERS
// ============================================================

function seedStartingInventory() {
  S.inventory = {};
  const loc = getLoc();
  SEED_SKUS.forEach(seed => {
    const cat = getCat(seed.id);
    if (!cat) return;
    let price = cat.baseRetail;
    S.inventory[seed.id] = {
      onHand: seed.onHand,
      order: seed.order,
      lastSold: 0,
      consStockouts: 0,
      price: price,
      arrivalWk: null,
      demandDegradation: 1.0,
    };
  });
  if (S.prestigePerks.loyalCrew) S.morale = Math.min(100, S.morale + 20);
  S.crew = suggestedCrew();
}

function stockCount() {
  return Object.keys(S.inventory).length;
}

function sourceProduct(id) {
  const cat = getCat(id);
  if (!cat) return { ok:false, msg:'Unknown product.' };
  if (stockCount() >= S.skuLimit) return { ok:false, msg:`SKU limit of ${S.skuLimit} reached. Discontinue something first.` };
  if (S.inventory[id]) return { ok:false, msg:'Already stocked.' };
  const fee = S.prestigePerks.supplierDiscount ? Math.round(cat.fee * 0.90) : cat.fee;
  if (S.cash < fee) return { ok:false, msg:`Need ${formatMoney(fee)} for sourcing fee. Cash: ${formatMoney(S.cash)}.` };
  S.cash -= fee;
  S.inventory[id] = {
    onHand: 0,
    order: Math.round(cat.baseDemand * 1.2),
    lastSold: 0,
    consStockouts: 0,
    price: cat.baseRetail,
    arrivalWk: S.week + 1,
    demandDegradation: 1.0,
  };
  log(`[SOURCING] ${cat.name} contracted. Arrives week ${S.week + 1}. Fee: ${formatMoney(fee)}.`);
  saveGame();
  return { ok:true };
}

function discontinueProduct(id) {
  const cat = getCat(id);
  delete S.inventory[id];
  log(`[SKU DROP] ${cat ? cat.name : id} discontinued. Slot freed.`);
  saveGame();
}

function setPrice(id, val) {
  const cat = getCat(id);
  const n = parseFloat(val);
  if (isNaN(n) || n < cat.cost) return false;
  S.inventory[id].price = n;
  saveGame();
  return true;
}

function setOrder(id, val) {
  const n = parseInt(val);
  if (isNaN(n) || n < 0) return;
  S.inventory[id].order = n;
  saveGame();
}

// Suggested order: perishable = expected demand (no safety stock); non-perishable = 1.2x last demand - onHand
function suggestedOrder(id) {
  const cat = getCat(id);
  const inv = S.inventory[id];
  if (!cat || !inv) return 0;
  const lastSold = inv.lastSold || cat.baseDemand;
  if (cat.perishable) {
    return Math.max(0, Math.round(lastSold) - inv.onHand);
  } else {
    return Math.max(0, Math.round(lastSold * 1.2) - inv.onHand);
  }
}

function bulkAcceptSuggestions() {
  Object.keys(S.inventory).forEach(id => {
    S.inventory[id].order = suggestedOrder(id);
  });
  log('[BULK] All order quantities set to suggested values.');
  saveGame();
}

// ============================================================
// TREND ENGINE
// ============================================================

function rollAnnualViral() {
  const pool = CATALOG.filter(c => c.trendSensitive);
  if (pool.length > 0) {
    S.annualViral = pool[Math.floor(Math.random() * pool.length)].id;
  } else {
    S.annualViral = null;
  }
}

function processTrendEngine() {
  // Advance pending signal
  if (S.pendingTrendSignal && S.week >= S.pendingTrendSignal.firesInWk) {
    const cat = getCat(S.pendingTrendSignal.id);
    if (cat) {
      const sig = TREND_SIGNALS[Math.floor(Math.random() * TREND_SIGNALS.length)];
      log(`[SIGNAL] ${sig.replace('{cat}', cat.cat)} Keep an eye on ${cat.cat} this week.`);
    }
    S.pendingTrendSignal = null;
  }

  // Decay active trend
  if (S.trend) {
    S.trend.weeksLeft--;
    if (S.trend.weeksLeft <= 0) {
      const cat = getCat(S.trend.id);
      log(`[TREND FADES] Market normalizing for ${cat ? cat.name : 'item'}.`);
      S.trend = null;
    } else if (S.trend.weeksLeft === 2) {
      S.trend.mult = 1.5;
    }
    return;
  }

  // Roll new trend
  const trendFreq = 11;
  if (Math.random() < (1 / trendFreq)) {
    const pool = CATALOG.filter(c => c.trendSensitive || c.cat === 'Snacks' || c.cat === 'Frozen');
    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      S.trend = { id: chosen.id, mult: 2.5, weeksLeft: 5 };
      // Schedule signal 2 weeks prior (already past, so just log now)
      const cat = getCat(chosen.id);
      log(`[TREND] Customers asking for ${cat.name} by name. Demand +150% for 5 weeks.`);
    }
  }
}

// ============================================================
// TRUST MODIFIER
// (Slowly erodes demand ceiling if average markup > 85% above base)
// ============================================================
function computeTrustMod(id, playerPrice) {
  const cat = getCat(id);
  const ratio = playerPrice / cat.baseRetail;
  // Trust penalty: if you consistently price >1.25x base retail, demand softens
  const avgMarkup = S.markupHistory.length > 0
    ? S.markupHistory.reduce((a,b)=>a+b,0) / S.markupHistory.length
    : 1.0;
  if (avgMarkup > 1.25) return Math.max(0.6, 1.0 - (avgMarkup - 1.25) * 0.8);
  return 1.0;
}

// ============================================================
// GAME TICK
// ============================================================

function gameTick() {
  const loc = getLoc();

  // Update season BEFORE demand calculations
  S.season = currentSeason();

  // Phase-based SKU limit
  if      (S.week >= 27) S.skuLimit = 40;
  else if (S.week >= 13) S.skuLimit = 30;
  else                   S.skuLimit = 20;

  // Activate demand degradation after week 8
  if (S.week >= 8) S.degradationActive = true;

  // Trend engine
  processTrendEngine();

  // Morale model: Morale_t = Morale_{t-1}*0.7 + target*0.3
  const sc = suggestedCrew();
  let targetMorale = 100;
  targetMorale += (S.wage - 20) * 5;
  if (S.crew < sc) targetMorale -= (sc - S.crew) * 12;
  S.morale = Math.max(10, Math.min(100, Math.round(S.morale * 0.70 + targetMorale * 0.30)));

  // Turnover event
  if (S.morale < 40 && Math.random() < 0.20 && S.crew > 2) {
    S.crew = Math.max(1, S.crew - 2);
    S.cash -= 1000;
    log('[LABOR] Two crew members quit. -$1,000 replacement cost.');
  }

  const tp = throughputMult();
  const shrink = shrinkageRate();

  let revenue = 0, cogs = 0, waste = 0;
  let stockouts = 0, totalItems = 0;
  let weekMarkupSum = 0, weekMarkupCount = 0;

  for (const id in S.inventory) {
    const inv = S.inventory[id];
    const cat = getCat(id);
    if (!cat) continue;

    // Pending arrival
    if (inv.arrivalWk !== null && S.week < inv.arrivalWk) continue;
    if (inv.arrivalWk !== null && S.week === inv.arrivalWk) {
      inv.arrivalWk = null;
      log(`[DELIVERY] ${cat.name} arrived on shelves.`);
    }

    totalItems++;

    // Check seasonal window
    const inWindow = isSeasonalAvailable(cat);

    // End-of-season auto-markdown for perishable seasonals on last week
    let effectivePrice = inv.price;
    if (cat.limited && cat.perishable && S.week === cat.endWk) {
      effectivePrice = Math.min(cat.cost * 0.90, cat.cost); // markdown to near cost
      if (inv.onHand > 0) log(`[MARKDOWN] ${cat.name} end-of-season auto-marked down to ${formatMoney(effectivePrice)} to clear shelf.`);
    }

    if (!inWindow) {
      // Wipe expired seasonal inventory
      if (cat.limited && inv.onHand > 0) {
        const wipeCost = inv.onHand * cat.cost * (cat.perishable ? 1.0 : 0.10);
        waste += wipeCost;
        log(`[SEASONAL CLOSE] ${cat.name} window closed. ${inv.onHand} units cleared. Cost: ${formatMoney(wipeCost)}.`);
        inv.onHand = 0;
      }
      continue;
    }

    // Demand calculation
    const seasonMult = cat.season[S.season] || 1.0;
    const priceRatio = effectivePrice > 0 ? cat.baseRetail / effectivePrice : 1.0;
    const priceEffect = Math.min(3.0, Math.pow(Math.max(0.1, priceRatio), cat.elasticity));
    const collapseMult = effectivePrice > cat.cost * 3 ? 0.05 : 1.0;
    const footMult = (loc.traffic / 1600) * tp * seasonTrafficMod();

    let trendMult = 1.0;
    if (S.trend && S.trend.id === id) trendMult = S.trend.mult;
    if (S.annualViral === id) trendMult *= 1.5;

    // Scarcity urgency for limited items
    let urgencyMult = 1.0;
    if (cat.limited) {
      const progress = S.week - cat.startWk;
      if (progress <= 2) urgencyMult = 1.50;
      else if (progress <= 5) urgencyMult = 1.20;
    }

    // Fan favorite bonus
    const ffBonus = S.fanFavorites[id] ? 1.20 : 1.0;

    // Trust modifier
    const trustMod = computeTrustMod(id, effectivePrice);

    // Demand degradation from repeated stockouts
    const degradationMult = inv.demandDegradation || 1.0;

    const noise = 0.85 + Math.random() * 0.30;

    const demand = Math.round(
      cat.baseDemand * seasonMult * priceEffect * collapseMult *
      footMult * trendMult * urgencyMult * ffBonus * trustMod * degradationMult * noise
    );

    // Shrinkage
    const lostToShrink = Math.round(inv.onHand * shrink * (0.75 + Math.random() * 0.5));
    const available = Math.max(0, inv.onHand - lostToShrink);
    const sold = Math.min(demand, available);

    // Financials
    revenue += sold * effectivePrice;
    cogs    += sold * cat.cost;

    // Track markup for trust model
    if (cat.baseRetail > 0) {
      weekMarkupSum += effectivePrice / cat.baseRetail;
      weekMarkupCount++;
    }

    inv.onHand = Math.max(0, available - sold);
    inv.lastSold = sold;

    // Stockout tracking
    if (demand > sold) {
      stockouts++;
      inv.consStockouts++;
      if (S.degradationActive && inv.consStockouts >= 2) {
        inv.demandDegradation = Math.max(0.20, inv.demandDegradation * 0.98);
        if (inv.consStockouts === 2) log(`[BRAND DAMAGE] ${cat.name} repeated stockouts are eroding customer loyalty.`);
      }
      if (S.trend && S.trend.id === id) {
        log(`[MISSED TREND] ${cat.name} stocked out during trend event. Revenue lost.`);
      }
    } else {
      inv.consStockouts = 0;
    }

    // Perishable waste (20% of unsold cost)
    if (cat.perishable && inv.onHand > 0) {
      waste += inv.onHand * cat.cost * 0.20;
    } else if (!cat.perishable && inv.onHand > sold * 3) {
      // Non-perishable holding cost for heavy overstock
      waste += inv.onHand * cat.cost * 0.005;
    }

    // Fan favorite badge: if sold out 2+ weeks in window
    if (cat.limited && inv.onHand === 0 && sold > 0) {
      if (!S.fanFavorites[id]) {
        S.fanFavorites[id] = true;
        log(`[FAN FAVORITE] ${cat.name} earned a fan favorite badge. +20% demand next year.`);
      }
    }

    // Replenishment order (costs cash immediately)
    if (inWindow && inv.order > 0) {
      const costAdj = S.prestigePerks.supplierDiscount ? 0.90 : 1.0;
      const orderCost = inv.order * cat.cost * costAdj;
      const canAfford = Math.min(inv.order, Math.floor(S.cash / (cat.cost * costAdj)));
      if (canAfford > 0) {
        S.cash -= canAfford * cat.cost * costAdj;
        inv.onHand += canAfford;
      }
    }
  }

  // Update markup trust history
  if (weekMarkupCount > 0) {
    S.markupHistory.push(weekMarkupSum / weekMarkupCount);
    if (S.markupHistory.length > 4) S.markupHistory.shift();
  }

  // Fixed costs
  const labor = (S.wage * 32 * S.crew) + 1400;
  const loc2 = getLoc();
  // Year 1 rent holiday
  const rentHolidayActive = S.year === 1 && S.week <= 13;
  const rentMult = rentHolidayActive ? (1 - loc2.rentHoliday) : 1.0;
  const rent = loc2.rent * rentMult;

  const net = revenue - cogs - waste - labor - rent;

  S.cash += net;
  S.cumulativeProfit += net;
  S.cogsAccum += cogs;
  S.wasteAccum += waste;
  S.pl = { revenue, cogs, gross: revenue - cogs, waste, labor, rent, net };

  S.profitHistory.push(net);
  if (S.profitHistory.length > 12) S.profitHistory.shift();

  S.stockoutRatePct = totalItems > 0 ? Math.round((stockouts / totalItems) * 100) : 0;

  // Seasonal transition / advance time
  advanceTime();

  // KPI alerts
  triggerAlerts(waste, cogs, rent, revenue);

  // Game over condition: cash < 0 AND inventory insufficient to cover fixed costs
  if (S.cash < 0) {
    const invValue = Object.keys(S.inventory).reduce((acc, id) => {
      const cat = getCat(id);
      return acc + (S.inventory[id].onHand * (cat ? cat.cost : 0));
    }, 0);
    const weeklyFixed = labor + rent;
    if (S.cash < -25000 || invValue < weeklyFixed * 0.5) {
      log('[BANKRUPTCY] Store has closed. Cash depleted and inventory cannot cover fixed costs.');
      return 'bankrupt';
    }
    if (invValue < weeklyFixed * 2) {
      log('[CRITICAL] Cash negative and inventory reserves low. Liquidation risk.');
    }
  }

  saveGame();
  return 'ok';
}

function advanceTime() {
  const prevSeason = S.season;
  S.week++;
  if (S.week > 52) {
    S.week = 1;
    S.year++;
    rollAnnualViral();
    log(`[YEAR ${S.year}] New year. Annual viral product re-assigned.`);
  }

  S.season = currentSeason();

  if (S.season !== prevSeason) {
    log(`[SEASON] ${S.season.toUpperCase()} begins. Demand profiles shifting.`);
  }

  // Forward-looking seasonal advisories
  if (S.week === 12) log('[ADVISORY] Summer begins in 2 weeks. Cold items and beverages incoming.');
  if (S.week === 25) log('[ADVISORY] The pumpkin armada approaches. Fall begins in 2 weeks. Pre-order seasonals.');
  if (S.week === 38) log('[ADVISORY] Winter in 2 weeks. Jingle Jangle and holiday items available soon.');
  if (S.week === 8 && S.year === 1) log('[NOTE] Demand degradation protection lifted. Stockouts now permanently erode demand.');
  if (S.week === 13) log('[UNLOCK] 30 SKU slots now available.');
  if (S.week === 27) log('[UNLOCK] All 40 SKU slots now available.');
}

function triggerAlerts(waste, cogs, rent, revenue) {
  if (S.cash < 10000) log('[WARNING] Cash below $10,000. Reduce orders or discontinue slow SKUs.');
  const wasteRate = S.cogsAccum > 0 ? S.wasteAccum / S.cogsAccum : 0;
  if (wasteRate > 0.08 && S.week % 4 === 0) log(`[WASTE] Running waste rate ${(wasteRate*100).toFixed(1)}% — above 8% target. Review perishable order quantities.`);
  if (rent / revenue > 0.35 && revenue > 0) log('[RENT] Rent exceeds 35% of revenue this week. Consider whether this location is right.');
  if (S.morale < 45 && S.week % 3 === 0) log(`[MORALE] Crew morale at ${S.morale}%. Strike risk is real. Raise wages or hire more crew.`);
}

// ============================================================
// LOG
// ============================================================

function log(msg) {
  S.logs.unshift({ wk: S.week, yr: S.year, text: msg });
  if (S.logs.length > 80) S.logs.pop();
}

// ============================================================
// EXPORTS (accessed by ui.js via window.Game)
// ============================================================

window.Game = {
  S,
  LOCATIONS,
  CATALOG,
  getLoc,
  getCat,
  suggestedCrew,
  throughputMult,
  operationalState,
  formatMoney,
  elasticityLabel,
  suggestedOrder,
  bulkAcceptSuggestions,
  isSeasonalAvailable,
  prestigeEligible,
  doPrestige,
  sourceProduct,
  discontinueProduct,
  setPrice,
  setOrder,
  seedStartingInventory,
  rollAnnualViral,
  log,
  gameTick,
  loadGame,
  saveGame,
  hardReset,
};
