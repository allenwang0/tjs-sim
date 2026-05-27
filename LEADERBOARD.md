# Leaderboard System - Implementation Guide

## ✅ What's Been Implemented

Your TJS Simulator now has a complete leaderboard system with:

### 1. **Competitive Mode**
- 3 standardized challenges with fixed RNG seeds for fair competition
- SF 52-Week Challenge (standard endurance)
- NYC 26-Week Sprint (fast-paced)
- Houston Unlimited (open-ended survival)

### 2. **Sandbox Leaderboard**
- Submit scores from your regular sandbox games
- Track your best runs across any location

### 3. **Supabase Integration**
- Scores stored in cloud database
- Real-time leaderboard updates
- Separate leaderboards for each mode

### 4. **Score Calculation**
- Base score = Cumulative Profit
- Bonus: +10% of positive cash
- Penalty: Negative cash deducted
- Final score = max(0, cumulative profit + cash bonus)

---

## 🚀 How to Use

### Playing Competitive Mode

1. **From Main Menu** → Click "Competitive Mode"
2. **Select a Challenge** → Each has standardized conditions
3. **Play the Challenge** → All players face identical RNG
4. **Submit Your Score** → Button appears when challenge completes

### Submitting Sandbox Scores

1. **Play Sandbox Mode** → Select any location
2. **Reach Milestone** → Submit button appears at $100k+ profit
3. **Click "Submit Score"** → Enter your name
4. **View Leaderboard** → See your ranking

### Viewing Leaderboards

- Press **L** key anytime to open leaderboard
- Or click "Leaderboard" button in header
- Switch between tabs to view different categories

---

## 🔧 Technical Details

### Files Created

- `config.js` - Supabase credentials & challenge definitions
- `supabase-client.js` - Lightweight API client (no external dependencies)

### Files Modified

- `game.js` - Added competitive mode, seeded RNG, score calculation
- `ui.js` - Added leaderboard UI, score submission, challenge selection
- `index.html` - Added overlay modals and script imports
- `style.css` - Added challenge card & leaderboard tab styles

### Database Schema

```sql
Table: leaderboard
- id (UUID, primary key)
- player_name (TEXT)
- score (INTEGER)
- mode (TEXT) - 'sandbox' or 'competitive_{challenge_id}'
- location_id (TEXT)
- weeks_played (INTEGER)
- prestige_count (INTEGER)
- metadata (JSONB) - full game state for verification
- created_at (TIMESTAMP)
```

---

## 🧪 Testing Checklist

### Before Deploying

- [x] Supabase table created with correct schema
- [x] RLS policies enabled (public read/insert)
- [x] Config file has correct URL and API key
- [ ] Test score submission (try submitting a test score)
- [ ] Test leaderboard loading (view each tab)
- [ ] Test competitive mode (start a challenge)
- [ ] Test keyboard shortcut (press L)

### Testing Steps

1. **Open the game** in a browser
2. **Open browser console** (F12) - check for errors
3. **Start a sandbox game** → play a few weeks
4. **Click "Submit Score"** → enter a test name
5. **Check Supabase Dashboard** → verify entry in leaderboard table
6. **Open leaderboard** → should see your score

---

## 🐛 Troubleshooting

### "Failed to submit score"
- Check browser console for detailed error
- Verify Supabase URL and API key in `config.js`
- Ensure RLS policies are enabled on the table
- Check that table name is exactly `leaderboard`

### Leaderboard shows "Loading..." forever
- Check network tab in browser dev tools
- Verify Supabase project is running
- Check API key permissions (anon key should allow reads)

### Competitive mode RNG not working
- Scores should be identical for same challenge + same decisions
- If not, check that all `Math.random()` calls were replaced with `getRandom()`

### Submit button not appearing
- Competitive mode: Button shows when challenge completes
- Sandbox mode: Button shows at $100k+ cumulative profit
- Check `renderHeader()` function logic

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **L** | Toggle leaderboard overlay |
| **Space** | Pause/Resume game |
| **B** | Bulk accept suggestions |
| **S** | Toggle source panel |
| **?** | Show help |

---

## 📊 Adding New Challenges

Edit `config.js`:

```javascript
const COMPETITIVE_CHALLENGES = {
  'my-challenge': {
    id: 'my-challenge',
    name: 'My Custom Challenge',
    description: 'Description here',
    locationId: 'sf',
    weekLimit: 52, // or null for unlimited
    startingCash: 75000,
    seed: 12345, // any integer for reproducible RNG
    enabled: true
  }
};
```

Then add a leaderboard tab in `index.html`:

```html
<button class="leaderboard-tab"
  data-mode="competitive_my-challenge"
  onclick="switchLeaderboardTab('competitive_my-challenge')">
  My Challenge
</button>
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push all files to GitHub
2. Import repo to Vercel
3. Framework: **Other**
4. Output directory: `./`
5. Deploy!

### Other Static Hosts

Works on any static file host:
- Netlify
- GitHub Pages
- Cloudflare Pages
- Firebase Hosting

Just upload all files to the root directory.

---

## 🔐 Security Notes

### Current Setup
- Uses Supabase RLS (Row Level Security)
- Public insert/read access (anyone can submit scores)
- No authentication required

### Anti-Cheat (Not Implemented Yet)
Current system is **honor-based**. To add anti-cheat:

1. **Verification**: Store full game state in `metadata` field
2. **Replay System**: Recreate game from seed + decisions
3. **Hash Validation**: Compare replayed result vs submitted score
4. **Rate Limiting**: Limit submissions per IP/user
5. **Manual Review**: Flag suspicious scores for review

For most casual games, honor system is fine. Implement anti-cheat only if you see abuse.

---

## 📈 Future Enhancements

### Planned Features
- [ ] Weekly/monthly leaderboard seasons
- [ ] Personal best tracking
- [ ] Score history graph
- [ ] Player profiles
- [ ] Achievement badges on leaderboard
- [ ] Filter by date range
- [ ] Export leaderboard as CSV
- [ ] Social sharing (tweet your score)
- [ ] Replay system for top scores

### Advanced Features
- [ ] User authentication (Supabase Auth)
- [ ] Private leaderboards (friends only)
- [ ] Challenge creator (community challenges)
- [ ] Live spectator mode
- [ ] Tournament bracket system

---

## 📞 Support

If you encounter issues:

1. **Check browser console** for errors
2. **Verify Supabase dashboard** for data
3. **Test API directly** using browser network tab
4. **Check this guide** for troubleshooting steps

---

## 🎉 You're Done!

Your leaderboard system is ready to use. Players can now:
- ✅ Compete in standardized challenges
- ✅ Submit and track high scores
- ✅ View global leaderboards
- ✅ Compare performance across modes

Enjoy your competitive TJS Simulator! 🛒📊
