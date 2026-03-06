# AI-Powered Daily News Site

Milestone 1 implementation: a single JavaScript webpage with 4 columns under a top heading.

## Included columns

1. **Top 10 news** with title, short summary, and score tag (`x/100`).
2. **Live bets** mock feed for Polymarket and Kalshi yes/no movement.
3. **Google trends** keyword sparklines.
4. **Stock prices** with simple sparkline charts.

## Run locally

Open `index.html` directly in your browser.

## Milestone 2 plan

- Replace mock arrays in `script.js` with API responses.
- Add backend config for keyword list and preferred sources.
- Integrate Polymarket + Kalshi APIs for live contracts.
- Integrate Google Trends endpoint for keyword momentum.
- Integrate stock API (e.g., Twelve Data, Alpha Vantage, or Polygon).
- Add scheduled job (daily) to score and rank stories.
