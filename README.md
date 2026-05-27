# TRADER JOE'S SIMULATOR

A strategic inventory management game featuring seasonal cycles, demand economics, and crew management inspired by Trader Joe's retail operations.

![Game Screenshot](https://img.shields.io/badge/Status-Live-brightgreen) ![Version](https://img.shields.io/badge/Version-3.0-blue)

## Overview

Manage your own Trader Joe's location across multiple cities. Balance inventory orders, pricing strategy, crew morale, and seasonal demand to maximize profit over 52 weeks. Navigate the challenges of perishable goods, trend-driven demand spikes, and the legendary seasonal product releases.

## Core Gameplay

### Store Management
- **8 Locations**: Choose from SF, NYC, Houston, Cambridge, Pasadena, Atlanta, Ann Arbor, or Portland
- **Financial Position**: Start with $75,000 and manage cash flow carefully
- **Staffing**: Hire crew, set wages, maintain morale to maximize throughput
- **SKU Limits**: Start with 20 slots, expand to 30 (week 13), then 40 (week 27)

### Product Categories
- **Frozen**: Hall of fame items like Mandarin Orange Chicken, dumplings, and cauliflower gnocchi
- **Snacks**: Customer favorites including Chili Lime Chips, PB Cups, and Everything But The Bagel seasoning
- **Produce**: Fresh items with high perishability (avocados, cucumbers, berries)
- **Dairy**: Cheeses, yogurt, and milk with careful waste management
- **Pantry**: Stable items like Soy Chorizo, marinara, and Cookie Butter
- **Beverages**: Cold brew, sparkling drinks, and premium coffee
- **Seasonal**: Limited-time items (Pumpkin everything, Jingle Jangle, seasonal beverages)

### Seasonal Cycles
- **Spring** (Weeks 1-13): Base traffic, moderate demand
- **Summer** (Weeks 14-26): +15% traffic, cold items and beverages surge
- **Fall** (Weeks 27-39): +10% traffic, pumpkin season arrives
- **Winter** (Weeks 40-52): +5% traffic, holiday items and comfort foods

### Economic Systems

**Price Elasticity**
- Products have varying price sensitivity (inelastic to highly elastic)
- Smart pricing maximizes revenue without collapsing demand
- Over-pricing erodes customer trust over time

**Demand Factors**
- Seasonal multipliers (e.g., ice cream +80% in summer, -50% in winter)
- Trend events: Social media-driven demand spikes (2.5x for 3 weeks)
- Scarcity urgency: Early-season seasonal items get +50% demand
- Fan Favorites: Sell out seasonal items to earn +20% demand next year

**Operational Constraints**
- **Morale System**: Understaffing and low wages hurt throughput
- **Shrinkage**: Poor staffing increases loss rates
- **Perishable Waste**: 20% cost on unsold perishables each week
- **Stockout Damage**: Repeated stockouts permanently erode demand (after week 8)

## Key Mechanics

### Sourcing Products
- Pay a one-time sourcing fee ($200-500)
- Product arrives next week
- Seasonal items only available during their window

### Order Management
- Set weekly replenishment quantities per SKU
- Perishable items: order conservatively (high waste risk)
- Non-perishable items: can build safety stock
- Auto-suggestions based on last week's sales

### Crew Management
- Suggested crew size scales with foot traffic
- Throughput multiplier: 0.5x (severely understaffed) to 1.1x (high morale)
- Wage range: $18-60/hour
- Morale affects throughput: low morale = slow operations

### Prestige System
Reach $500,000 cash or cumulative profit to unlock prestige mode:
- **Prestige 1**: Loyal Crew (+20 starting morale)
- **Prestige 2**: Supplier Discount (10% off all costs and fees)
- **Prestige 3**: Data Analyst (better analytics and insights)
- Keep 20% of cash and all Fan Favorite badges

## Winning Strategies

1. **Start Conservative**: Source proven Hall of Fame items first (Mandarin Orange Chicken, Chili Lime Chips)
2. **Watch Seasonality**: Pre-order pumpkin and holiday items aggressively
3. **Manage Perishables**: Order only what you can sell to minimize waste
4. **Monitor Trends**: React quickly to social media signals
5. **Staff Appropriately**: Match suggested crew to maintain throughput
6. **Price Strategically**: Test elasticity but don't erode trust
7. **Avoid Stockouts**: After week 8, they permanently damage demand

## Technical Details

### Tech Stack
- Pure JavaScript (ES6+)
- No build process required
- Local storage for save persistence
- Responsive CSS Grid layout

### Files
- `index.html` - UI structure
- `game.js` - Game logic and state management
- `ui.js` - UI rendering and event handling
- `style.css` - Styling and layout

### Running Locally
1. Clone the repository
2. Copy `config.example.js` to `config.js`
3. Fill in your Supabase credentials in `config.js` (optional - required for leaderboard features)
4. Open `index.html` in any modern browser
5. No server or build step required

**Note**: The game works without Supabase configuration. Leaderboard features require valid credentials.

### Deployment
Deploy as a static site to Vercel, Netlify, or GitHub Pages:
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=.

# GitHub Pages
# Just push to gh-pages branch
```

## Game Progression

**Year 1 Benefits**
- Rent holiday: 15-30% rent discount for first 13 weeks (varies by location)
- Demand degradation protection: First 8 weeks, stockouts don't cause permanent damage

**Milestones**
- Week 8: Demand protection ends
- Week 13: 30 SKU slots unlock
- Week 14: Summer begins, seasonal beverages available
- Week 25: Pumpkin season advisory
- Week 27: 40 SKU slots unlock, fall seasonals available
- Week 38: Holiday season advisory
- Week 40: Winter holiday items available

## Known Items & Stats

See the full catalog in `game.js` for detailed stats on:
- 50+ unique products
- Price elasticity ratings
- Seasonal demand multipliers
- Perishability flags
- Trend sensitivity markers

## Credits

Created as a strategic inventory management simulation inspired by Trader Joe's retail operations and customer favorite products.

## License

MIT License - Feel free to fork and modify!
