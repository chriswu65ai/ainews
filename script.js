const keywords = ["AI", "NVIDIA", "AI asset management", "LLM", "Semiconductors"];

const newsItems = [
  {
    title: "NVIDIA launches next-gen AI accelerator for enterprise deployments",
    summary: "Analysts expect faster inference workloads and improved energy efficiency in hyperscaler data centers.",
    score: 93,
  },
  {
    title: "Major bank pilots AI portfolio balancing with human oversight",
    summary: "The pilot reduced manual review time by 28% while preserving governance checks and risk constraints.",
    score: 90,
  },
  {
    title: "Open-source LLM benchmark introduces quality + safety composite",
    summary: "A new benchmark ranking now blends factuality, hallucination resilience, and policy compliance scores.",
    score: 88,
  },
  {
    title: "Cloud providers compete on AI inference pricing tiers",
    summary: "Per-token pricing pressure grows as enterprises shift from experimentation to production deployment.",
    score: 85,
  },
  {
    title: "AI chip supply chain stabilizes as lead times improve",
    summary: "Component suppliers report fewer bottlenecks for high-bandwidth memory and packaging capacity.",
    score: 84,
  },
  {
    title: "Asset managers increase allocation to AI infrastructure ETFs",
    summary: "Flows are rising toward firms linked to model hosting, networking hardware, and power optimization.",
    score: 82,
  },
  {
    title: "Regulators release draft framework for AI model risk disclosures",
    summary: "Proposed language asks firms to document training data provenance and scenario testing practices.",
    score: 79,
  },
  {
    title: "Startup unveils workflow agent for enterprise knowledge ops",
    summary: "Early adopters cite measurable gains in document triage and internal support response quality.",
    score: 76,
  },
  {
    title: "Global foundry capacity plans expand amid AI demand signals",
    summary: "Long-term contracts indicate sustained appetite for advanced-node manufacturing over the next cycle.",
    score: 74,
  },
  {
    title: "CIO survey shows AI tooling budget priorities for 2026",
    summary: "Security, observability, and orchestration tools rank highest as organizations scale model operations.",
    score: 71,
  },
];

const bets = [
  { market: "Polymarket", contract: "Will NVIDIA hit new ATH this quarter?", yes: "+4.2%", no: "-4.2%" },
  { market: "Kalshi", contract: "US AI regulation bill passes by Q4?", yes: "+1.1%", no: "-1.1%" },
  { market: "Polymarket", contract: "OpenAI GPT-6 announced this year?", yes: "-3.0%", no: "+3.0%" },
  { market: "Kalshi", contract: "Fed mentions AI risk in next statement?", yes: "+2.6%", no: "-2.6%" },
];

const trends = [
  { keyword: "AI", points: [38, 42, 50, 56, 63, 70, 66, 71, 78, 83] },
  { keyword: "NVIDIA", points: [41, 48, 47, 53, 58, 64, 72, 76, 79, 82] },
  { keyword: "AI asset management", points: [19, 24, 22, 28, 33, 36, 42, 40, 45, 52] },
  { keyword: "LLM", points: [29, 31, 35, 37, 46, 52, 49, 57, 63, 66] },
];

const stocks = [
  { ticker: "NVDA", price: 1224.14, change: +2.3, points: [1100, 1116, 1138, 1145, 1160, 1173, 1181, 1197, 1210, 1224] },
  { ticker: "MSFT", price: 453.88, change: +0.8, points: [438, 440, 443, 442, 447, 448, 449, 451, 452, 454] },
  { ticker: "GOOGL", price: 193.41, change: -0.6, points: [198, 199, 196, 197, 195, 194, 193, 194, 193, 193] },
  { ticker: "AMD", price: 179.62, change: +1.4, points: [166, 168, 169, 171, 172, 175, 176, 177, 178, 180] },
];

function renderKeywordPills() {
  const container = document.getElementById("keywordControls");
  container.innerHTML = keywords.map((keyword) => `<span class="keyword-pill">${keyword}</span>`).join("");
}

function renderNews() {
  const list = document.getElementById("newsList");
  list.innerHTML = newsItems
    .map(
      (item) => `
      <li class="news-item">
        <h3 class="news-title">${item.title}</h3>
        <p class="news-summary">${item.summary}</p>
        <span class="score-tag">Score ${item.score}/100</span>
      </li>
    `,
    )
    .join("");
}

function renderBets() {
  const list = document.getElementById("betsList");
  list.innerHTML = bets
    .map((bet) => {
      const yesDir = bet.yes.startsWith("+") ? "up" : "down";
      const noDir = bet.no.startsWith("+") ? "up" : "down";

      return `
        <li class="simple-item">
          <div class="market">${bet.market}</div>
          <div>${bet.contract}</div>
          <div>Yes: <span class="movement ${yesDir}">${bet.yes}</span> · No: <span class="movement ${noDir}">${bet.no}</span></div>
        </li>
      `;
    })
    .join("");
}

function svgSparkline(points, color = "#61dafb") {
  const width = 220;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="sparkline">
      <polyline fill="none" stroke="${color}" stroke-width="2.5" points="${coords}" />
    </svg>
  `;
}

function renderTrends() {
  const list = document.getElementById("trendsList");
  list.innerHTML = trends
    .map(
      ({ keyword, points }) => `
      <article class="trend-item">
        <div class="row">
          <strong>${keyword}</strong>
          <span>${points.at(-1)}</span>
        </div>
        ${svgSparkline(points)}
      </article>
    `,
    )
    .join("");
}

function renderStocks() {
  const list = document.getElementById("stocksList");
  list.innerHTML = stocks
    .map(({ ticker, price, change, points }) => {
      const dir = change >= 0 ? "up" : "down";
      const symbol = change >= 0 ? "+" : "";

      return `
        <article class="stock-item">
          <div class="row">
            <strong>${ticker} · $${price.toFixed(2)}</strong>
            <span class="movement ${dir}">${symbol}${change.toFixed(1)}%</span>
          </div>
          ${svgSparkline(points, dir === "up" ? "#52d273" : "#ff6b6b")}
        </article>
      `;
    })
    .join("");
}

renderKeywordPills();
renderNews();
renderBets();
renderTrends();
renderStocks();
