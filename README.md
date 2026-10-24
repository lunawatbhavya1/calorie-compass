# Calorie Compass

A responsive, installable-ready calorie tracking starter built with React + Vite. The code is split into small components and pure calculation modules to make changes easy to maintain.

## What works now
- Responsive dashboard for phone and desktop
- Food and activity entries, edits and deletes
- Local persistence in the current browser via `localStorage`
- Profile settings and Mifflin-St Jeor BMR estimate
- TDEE estimate based on an activity multiplier
- Daily intake target progress
- Grouped bar chart and line chart with 7/14/30 day filters
- JSON export for backups
- Basic transparent local food estimate examples for common foods
- PWA service-worker setup for a production build

## Not connected yet
- OpenAI API / photo analysis
- User accounts and cloud sync between devices
- Wearable / step counter integrations
- Nutrition database API

The “Estimate” button uses a small local rule-based sample, **not ChatGPT**. To add real AI, create a server-side API endpoint and keep the API key on the server in an environment variable. Never place a secret API key in frontend code. For cross-device sync, connect Supabase authentication and a database table.

## Run locally
Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build
```bash
npm run build
npm run preview
```

Deploy the built app to a static hosting provider that supports Vite. Configure HTTPS for PWA installation.

## Maintenance map
- `src/App.jsx` — page composition and app state
- `src/components/` — UI pieces
- `src/lib/calculations.js` — BMR, TDEE and daily balance math
- `src/lib/foodEstimates.js` — starter estimate rules; replace with AI/database integration
- `src/lib/storage.js` — browser storage and default profile
- `src/styles.css` — all design tokens and responsive styling

## Calculation notes
- BMR uses the Mifflin-St Jeor equation.
- TDEE is BMR multiplied by a selected activity factor.
- TDEE uses the selected activity multiplier. Manually logged activity calories are shown separately and are not added again to TDEE, preventing accidental double-counting.
- Daily balance = estimated TDEE − intake. Positive is estimated deficit; negative is estimated surplus.
- Estimates are not medical advice and can be inaccurate.
