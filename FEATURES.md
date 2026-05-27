# Feature Ideas & Future Improvements

This document tracks potential enhancements for the Trader Joe's Simulator.

## Recently Implemented ✅

### Leaderboard System (Latest) 🎉
- **Competitive Mode**: 3 standardized challenges with fixed RNG seeds for fair competition
  - SF 52-Week Challenge (endurance test)
  - NYC 26-Week Sprint (fast-paced)
  - Houston Unlimited (survival mode)
- **Sandbox Leaderboard**: Submit high scores from any sandbox game
- **Supabase Integration**: Cloud-hosted global leaderboards
- **Multiple Categories**: Separate rankings for each mode
- **Score Submission**: Submit scores with player name
- **Real-time Rankings**: View top 100 scores per category
- **Keyboard Shortcut**: Press 'L' to open leaderboard anytime
- **Seeded RNG**: Reproducible randomness for fair competitive play

### Previous Features
- **Pause/Play Control**: Toggle game with button or SPACE key
- **Keyboard Shortcuts**: Full keyboard navigation (1/2/3 for speed, B for bulk accept, S for source toggle, L for leaderboard, ? for help)
- **Export Game Data**: Download save files as JSON
- **Improved Prestige Modal**: Replaced prompt() with proper UI
- **Help System**: In-game help modal with tips and shortcuts
- **Better .gitignore**: Comprehensive ignore patterns
- **Price Input Hints**: Show minimum cost price on inventory table

## High Priority Features

### Analytics & Reporting
- [ ] **Profit/Loss Charts by Category**: See which categories drive the most revenue
- [ ] **Weekly Comparison Dashboard**: Compare this week vs last week metrics
- [ ] **Product Performance Report**: Top/bottom performers with recommendations
- [ ] **Trend History Log**: Track all trend events and how you capitalized on them

### Quality of Life
- [ ] **Auto-save Indicator**: Visual confirmation when game saves
- [ ] **Undo Last Action**: Revert last discontinue or major decision
- [ ] **Batch Operations**: Select multiple SKUs for bulk price/order changes
- [ ] **Custom Notes**: Add notes to products (e.g., "order conservatively")
- [ ] **Sound Effects**: Optional audio for events (trend spike, stockout, etc.)
- [ ] **Dark/Light Theme Toggle**: User preference for color scheme

### Gameplay Features
- [ ] **Challenges/Achievements**: Unlock badges for milestones
  - "Pumpkin King": Max out all pumpkin items in one season
  - "Zero Waste": Complete a year with <2% waste rate
  - "Trend Master": Capitalize on 10 trend events
  - "Hall of Fame": Stock all Hall of Fame items simultaneously
- [ ] **Scenarios/Campaigns**: Pre-designed challenges with specific goals
- [ ] **Random Events**: Surprise events (supply chain issues, viral moments, local festivals)
- [ ] **Competitor Actions**: Nearby stores affect your traffic
- [ ] **Weather Effects**: Heat waves boost cold items, storms reduce traffic

### Advanced Mechanics
- [ ] **Employee System**: Individual crew members with skills/specialties
- [ ] **Store Upgrades**: Invest in expanded shelf space, better cooling, etc.
- [ ] **Marketing Campaigns**: Spend cash to boost awareness of specific products
- [ ] **Private Label Products**: Create custom Trader Joe's branded items
- [ ] **Supplier Relationships**: Build loyalty with suppliers for better prices
- [ ] **Multi-Store Management**: Run multiple locations simultaneously (endgame)

## Medium Priority Features

### UI/UX Improvements
- [ ] **Mobile Responsive Layout**: Proper mobile/tablet support
- [ ] **Drag & Drop Ordering**: Reorder inventory table by dragging rows
- [ ] **Column Customization**: Show/hide columns in inventory table
- [ ] **Filters Saved**: Remember last used filter/sort settings
- [ ] **Quick Actions Menu**: Right-click context menu on products
- [ ] **Tooltips**: Hover explanations for all mechanics

### Data & Analytics
- [ ] **Year-over-Year Comparison**: Compare current week to same week last year
- [ ] **Seasonal Forecasting**: AI predictions for upcoming demand
- [ ] **Waste Breakdown**: See which products contribute most to waste
- [ ] **Customer Satisfaction Score**: Track customer sentiment over time
- [✅] **Leaderboard**: Optional online leaderboard for high scores (IMPLEMENTED!)

### Content Expansion
- [ ] **More Locations**: Add 5-10 additional cities with unique characteristics
- [ ] **Regional Exclusives**: Location-specific products
- [ ] **More Seasonal Products**: Expand catalog with 20+ more limited items
- [ ] **Recipe Cards**: Combine products for bonus sales (e.g., party platters)
- [ ] **Vendor Stories**: Flavor text about product origins

## Low Priority / Nice to Have

### Social Features
- [ ] **Share Screenshots**: Share your P&L or achievements on social media
- [ ] **Cloud Saves**: Optional account system for cross-device saves
- [ ] **Community Catalog**: User-submitted product ideas
- [ ] **Multiplayer Mode**: Compete with friends for highest profit

### Advanced Analytics
- [ ] **Price Optimization AI**: Suggest optimal prices based on elasticity
- [ ] **Demand Forecasting Model**: ML-based predictions
- [ ] **A/B Testing Mode**: Test two strategies side-by-side
- [ ] **What-If Scenarios**: Preview impact of decisions before committing

### Accessibility
- [ ] **Screen Reader Support**: Full ARIA labels and navigation
- [ ] **Colorblind Mode**: Alternative color schemes for status indicators
- [ ] **Font Size Options**: Adjustable text size
- [ ] **High Contrast Mode**: Improved visibility for low vision users

### Technical Improvements
- [ ] **Performance Optimization**: Reduce memory footprint for long sessions
- [ ] **Save File Versioning**: Import saves from older versions
- [ ] **Modding Support**: Allow community-created content
- [ ] **API for External Tools**: Let developers build companion apps

## Bug Fixes & Polish

### Known Issues
- [ ] **Price Input Validation**: Better UX when invalid price entered (currently shows alert)
- [ ] **Long Product Names**: Truncation in charts could be improved
- [ ] **Rapid Clicking**: Prevent double-sourcing if button clicked twice fast
- [ ] **Mobile Safari**: Test and fix any iOS-specific issues

### Polish Items
- [ ] **Loading States**: Show spinners during long operations
- [ ] **Empty States**: Better messaging when no data available
- [ ] **Error Messages**: More helpful error text with recovery suggestions
- [ ] **Animations**: Smooth transitions for UI changes
- [ ] **Onboarding Tutorial**: Guide new players through first few weeks

## Community Requests

Track user-requested features here as they come in.

---

## Contributing Ideas

Have a feature suggestion? Consider:
1. **Impact**: How many users benefit?
2. **Effort**: How complex to implement?
3. **Alignment**: Does it fit the game's strategic simulation focus?

Open an issue on GitHub to discuss!
