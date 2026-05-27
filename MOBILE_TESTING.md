# Mobile Testing Guide - Trader Joe's Simulator

## Quick Test on Your Phone

1. **Open the site** on your phone's browser (Safari/Chrome)
   - Navigate to: `file:///Users/allenwang/Desktop/tjs-sim/index.html`
   - Or deploy to Vercel and test the live URL

2. **Initial Setup Screen Tests:**
   - ✅ Title and tagline are readable
   - ✅ Location cards stack vertically
   - ✅ Tapping location cards selects them (visual feedback)
   - ✅ "Establish Store" button is easy to tap
   - ✅ No horizontal scrolling

3. **Main Game Screen Tests:**
   - ✅ Header stacks vertically (title, then controls)
   - ✅ All sections stack: Financial → Inventory → Charts
   - ✅ Text is readable without zooming
   - ✅ No horizontal overflow anywhere

4. **Touch Interaction Tests:**
   - ✅ Pause button taps easily
   - ✅ Speed buttons (Slow/Normal/Fast) tap easily
   - ✅ Filter buttons tap easily (All/Frozen/Snacks/etc)
   - ✅ Enable Autopilot button taps easily
   - ✅ No double-tap zoom delay on buttons

5. **Form Input Tests:**
   - ✅ Tap crew headcount input → numeric keyboard appears
   - ✅ Tap hourly wage input → decimal keyboard appears
   - ✅ Tap price input → decimal keyboard appears
   - ✅ Tap order input → numeric keyboard appears
   - ✅ Inputs are easy to tap (36px+ height)

6. **Table Scroll Tests:**
   - ✅ Inventory table scrolls horizontally smoothly
   - ✅ Sourcing table scrolls horizontally smoothly
   - ✅ No sticky/janky scrolling

7. **Modal Tests:**
   - ✅ Help modal (?) opens and fits on screen
   - ✅ Modal scrolls if content is too tall
   - ✅ Can close modals easily
   - ✅ Prestige modal works properly

8. **Screen Size Tests:**
   - Portrait mode (typical phone): All sections stack properly
   - Landscape mode: Still readable and usable
   - Small phones (<600px): Extra optimizations kick in

## Using Chrome DevTools (Desktop)

1. Open Chrome: `http://localhost:8000` or `file://` path
2. Press F12 → Click Toggle Device Toolbar (phone icon)
3. Select devices to test:
   - iPhone SE (375px) - Small phone
   - iPhone 12/13 Pro (390px) - Standard phone
   - iPhone 12/13 Pro Max (428px) - Large phone
   - iPad Mini (768px) - Tablet
   - Pixel 5 (393px) - Android phone
   - Samsung Galaxy S20 (360px) - Compact phone

4. Test both Portrait and Landscape orientations

## Specific Features to Verify

### ✅ Autopilot Section (New)
- Button stretches full width on mobile
- Description text is readable
- Active indicator is visible
- Easy to toggle on/off

### ✅ Typography
- Minimum text size: 10px (help text)
- Body text: 14px on mobile (up from 13px)
- Table text: 12px on mobile (up from 11px)
- All text readable without zooming

### ✅ Touch Targets
- Buttons: 36-44px minimum height
- Inputs: 36px minimum height
- Filter buttons: 32px minimum height
- Location cards: Full card is tappable

### ✅ No Mobile Issues
- No horizontal overflow
- No text cutoff
- No overlapping elements
- No tiny unreadable text
- No impossibly small buttons
- No double-tap zoom on buttons
- Tables scroll when needed

## Known Working Behaviors

1. **Keyboard shortcuts** (Space, 1-3, B, S, ?) work on desktop only - this is expected
2. **Hover effects** visible on desktop only - this is expected and doesn't affect functionality
3. **Click events** work for both mouse clicks and touch taps
4. **Number inputs** show appropriate keyboards on mobile (numeric/decimal)

## Performance Notes

- Game runs at same speed on mobile and desktop
- Auto-save indicator appears in bottom-right on mobile (moved from top-right)
- All game mechanics work identically on both platforms

## If You Find Issues

Common fixes:
- **Horizontal scroll**: Report which screen/element
- **Text too small**: Report which section
- **Button too hard to tap**: Report which button
- **Input keyboard wrong**: Report which input field

---

Last Updated: 2026-05-26
