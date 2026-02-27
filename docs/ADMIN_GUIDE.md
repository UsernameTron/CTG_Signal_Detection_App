# CTG Sourcing Intelligence Platform — Administrator Deployment & Customization Guide

> Every section in this guide is an **executable task block**. Each block is self-contained and can be handed directly to Claude Code as a prompt. File paths, data schemas, and line references are exact.

---

## Table of Contents

1. [Prerequisites & Repository Overview](#1-prerequisites--repository-overview)
2. [Deployment (Netlify)](#2-deployment-netlify)
3. [Connect Live Data Sources](#3-connect-live-data-sources)
4. [API Key & Credential Management](#4-api-key--credential-management)
5. [Customize Branding & Design Tokens](#5-customize-branding--design-tokens)
6. [Add or Remove Modules](#6-add-or-remove-modules)
7. [Modify Prospect Scoring & Tier Logic](#7-modify-prospect-scoring--tier-logic)
8. [Status Bar Configuration](#8-status-bar-configuration)
9. [Verification Checklist](#9-verification-checklist)

---

## 1. Prerequisites & Repository Overview

### What This Is

A zero-dependency vanilla HTML/CSS/JS single-page application. No npm. No bundler. No framework. Files are served directly.

### File Tree

```
ctg-intel-platform/
├── index.html                  # SPA shell — sidebar, status bar, content areas
├── netlify.toml                # Deployment config — publish ".", SPA redirect, cache headers
├── css/
│   ├── obsidian.css            # Design tokens (42+ CSS custom properties)
│   ├── shell.css               # Sidebar + status bar + layout grid
│   ├── components.css          # Shared component styles (KPI cards, tables, badges)
│   ├── command-center.css      # Module: Command Center
│   ├── pipeline-intel.css      # Module: Pipeline Intel
│   ├── strain-simulator.css    # Module: Strain Simulator
│   ├── revenue-model.css       # Module: Revenue Model
│   ├── agent-architecture.css  # Module: Agent Architecture
│   ├── competitive-map.css     # Module: Competitive Map
│   └── build-roadmap.css       # Module: Build Roadmap
├── js/
│   ├── data.js                 # ALL application data (1,197 lines, 100% static)
│   ├── shared-components.js    # 11 reusable UI constructors (KPICard, DataTable, etc.)
│   ├── shell.js                # Sidebar nav tab activation
│   ├── app.js                  # Module registry, lazy loader, hash router
│   ├── command-center.js       # Module: prospect dashboard + intelligence feed
│   ├── pipeline-intel.js       # Module: pipeline analysis + filtering
│   ├── strain-simulator.js     # Module: Sourcing Strain Index visualization
│   ├── revenue-model.js        # Module: revenue projections + commission modeling
│   ├── agent-architecture.js   # Module: AI agent definitions + simulation
│   ├── competitive-map.js      # Module: competitive landscape analysis
│   └── build-roadmap.js        # Module: 4-phase build plan + Gantt view
```

### Architecture: 4 Global Objects

| Object | File | Purpose |
|---|---|---|
| `window.Data` | `js/data.js` | All application data. Every module reads from this. |
| `window.Components` | `js/shared-components.js` | 11 UI constructors (KPICard, TierBadge, DataTable, etc.) |
| `window.Shell` | `js/shell.js` | Sidebar nav management (`activateNavTab()`) |
| `window.App` | `js/app.js` | Programmatic navigation (`App.navigate('module-id')`) |

### Module Contract

Every view module must expose exactly two functions via `window.modules['module-id']`:

```javascript
window.modules = window.modules || {};
window.modules['module-id'] = {
  init: function(container, panel) { /* Build UI into container and panel */ },
  destroy: function() { /* Clean up timers, event listeners, DOM */ }
};
```

- `init(container, panel)` — receives the main content area and the right sidebar panel
- `destroy()` — must clean up all `setInterval`, `setTimeout`, and event listeners

### Constraint

**This is a zero-dependency project by design.** Never add npm packages, build tools, or framework imports. All code is vanilla HTML/CSS/JS.

---

## 2. Deployment (Netlify)

### Task Block: Deploy to Netlify

```
TASK: Deploy the CTG Intel Platform to Netlify.

FILE: ctg-intel-platform/netlify.toml (already configured)

STEPS:
1. Connect your Git repository to Netlify (https://app.netlify.com)
2. Set the following build settings:
   - Base directory: ctg-intel-platform
   - Build command: (leave blank — no build step)
   - Publish directory: ctg-intel-platform
3. Deploy. The site will serve index.html directly.

WHAT netlify.toml ALREADY PROVIDES:
- Publish directory: "." (relative to base)
- SPA redirect: /* → /index.html (status 200)
- Security headers: X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff
- Cache headers: CSS and JS files cached for 1 year (immutable)

CUSTOM DOMAIN:
- In Netlify dashboard → Domain settings → Add custom domain
- Configure DNS CNAME record pointing to your Netlify subdomain
- Netlify provides automatic HTTPS via Let's Encrypt

NO ENVIRONMENT VARIABLES NEEDED for POC mode (all data is static).
```

---

## 3. Connect Live Data Sources

This is the primary customization task. The entire data layer lives in one file: `ctg-intel-platform/js/data.js`.

### Option A: Replace Static Data (Simplest)

```
TASK: Replace hardcoded prospect data in data.js with real prospect records.

FILE: ctg-intel-platform/js/data.js

APPROACH: Keep the static file structure. Replace the hardcoded values with
real prospect data. No code architecture changes needed.

WHAT TO CHANGE: Replace the contents of each Data array with real records
matching the exact schemas below. Do NOT modify the helper functions at the
bottom of the file (getPipelineValue, getTierCounts, getPlatformDistribution).
```

### Option B: Replace with API Client (For Automated Pipeline)

```
TASK: Replace static data.js with an API client that fetches live data and
populates the same window.Data shape.

FILES TO MODIFY:
- ctg-intel-platform/js/data.js — rewrite to fetch from APIs
- ctg-intel-platform/index.html — add js/config.js before js/data.js in script load order
- ctg-intel-platform/js/config.js — new file for API endpoints and keys

CONSTRAINTS:
- window.Data must be fully populated BEFORE app.js runs
- All 7 modules read from window.Data synchronously — if switching to async,
  app.js must wait for data to load before calling loadModule()
- Preserve the 3 helper functions: getPipelineValue(), getTierCounts(), getPlatformDistribution()
- Keep the IIFE + 'use strict' pattern
```

### Data Schemas (Exact)

Every record below must match this exact shape. Modules depend on these field names.

#### `Data.prospects[]` — Prospect Records

```javascript
{
  id: Number,                    // Unique integer ID
  company: String,               // Company name
  industry: String,              // e.g., "Healthcare", "Financial Services", "Government"
  location: String,              // e.g., "Phoenix, AZ"
  score: Number,                 // 0-100 integer (Sourcing Strain Index)
  tier: String,                  // One of: "HOT", "WARM", "NURTURE", "STRATEGIC"
  signals: [String],             // Array of signal labels, e.g., ["CCAAS MIGRATION", "AI INITIATIVE"]
  signalColors: [String],        // Parallel array: color per signal. Values: "emerald", "amber", "gray"
  platform: String,              // Current CC platform, e.g., "Avaya", "Cisco UCCE", "Genesys Cloud"
  annualSpend: String,           // Formatted, e.g., "$1.5M" or "$250K"
  contractExpiry: String,        // e.g., "Sep 2026"
  agents: Number,                // Number of contact center agents
  cxLeader: String,              // Name + title, e.g., "Sarah Chen, VP Customer Operations"
  contactPath: String,           // e.g., "LinkedIn engagement", "Verified contact"
  strainFactors: {
    vendorUniverse: Number,      // 0-100
    evalComplexity: Number,      // 0-100
    expertiseGap: Number,        // 0-100
    timelinePressure: Number,    // 0-100
    complianceBurden: Number,    // 0-100
    stakeholders: Number         // 0-100
  },
  serviceAlignment: [String],    // e.g., ["CCaaS Migration", "AI Agent Assist", "QA Analytics"]
  notes: String,                 // Free-text intelligence notes
  keyIntelligence: [
    { label: String, value: String }  // Key-value pairs displayed in detail panel
  ]
}
```

**Current distribution**: 30 records — 9 HOT, 13 WARM, 5 NURTURE, 3 STRATEGIC. Pipeline ~$24.0M.

#### `Data.agents[]` — AI Agent Definitions

```javascript
{
  id: String,                    // e.g., "scout", "analyst", "strategist", "planner", "monitor"
  name: String,                  // Display name
  subtitle: String,              // e.g., "The Eyes", "The Brain"
  color: String,                 // CSS token name: "emerald", "blue", "violet", "amber", "red"
  badgeColor: String,            // Hex color, e.g., "#34D399"
  description: String,           // What the agent does
  stats: {                       // Key metrics (keys vary by agent)
    [key]: String                // e.g., { sources: "50+", latency: "2-6 hrs", signals: "10 types" }
  },
  simulationSteps: [
    { time: String, text: String }  // Simulation timeline entries
  ]
}
```

**Current agents**: Scout (emerald), Analyst (blue), Strategist (violet), Planner (amber), Monitor (red).

#### `Data.competitors[]` — Competitive Landscape

```javascript
{
  id: String,                    // e.g., "diy", "consultancies", "tsds", "bpo"
  name: String,                  // Display name
  threatLevel: String,           // "HIGH", "MEDIUM", or "LOW"
  marketShare: String,           // e.g., "60%"
  description: String,           // What the competitor does
  strengths: [String],           // Array of strengths
  vulnerabilities: [String],     // Array of weaknesses
  whereCtgWins: String,          // Competitive advantage narrative
  metrics: {
    time: String,                // e.g., "3-6 months"
    cost: String,                // e.g., "$50K-$500K+"
    coverage: String             // e.g., "10-20 vendors"
  }
}
```

#### `Data.roadmapPhases[]` — Build Roadmap

```javascript
{
  id: String,                    // e.g., "foundation", "intelligence", "platform", "optimization"
  name: String,                  // Phase name
  subtitle: String,              // Phase description
  weeks: String,                 // e.g., "Weeks 1-4"
  status: String,                // "READY", "PENDING", "FUTURE"
  statusColor: String,           // CSS token: "emerald", "amber", "text-muted"
  investment: String,            // e.g., "$12,000"
  tasks: [
    { name: String, hours: String }  // e.g., { name: "Data source integration", hours: "40H" }
  ],
  metrics: [
    { label: String, value: String }  // e.g., { label: "Data Sources", value: "15+" }
  ],
  deliverable: String            // Phase deliverable description
}
```

#### `Data.feedEntries[]` — Intelligence Feed

```javascript
{
  agent: String,                 // "SCOUT", "ANALYST", "STRATEGIST", or "PLANNER"
  color: String,                 // CSS token: "emerald", "blue", "violet", "amber"
  time: String,                  // e.g., "2 min ago"
  text: String                   // Feed entry text
}
```

### Helper Functions (Preserve These)

These three functions at the bottom of `data.js` compute derived values and are called by multiple modules. If you change the data schema, ensure these still work:

```javascript
// Sums annualSpend across all prospects. Parses "$1.5M" and "$250K" formats.
Data.getPipelineValue = function() { ... }

// Returns { ALL, HOT, WARM, NURTURE, STRATEGIC } counts.
Data.getTierCounts = function() { ... }

// Returns sorted array of [platform, count] pairs.
Data.getPlatformDistribution = function() { ... }
```

---

## 4. API Key & Credential Management

```
TASK: Add environment-based configuration for API keys and endpoints.

FILES:
- CREATE: ctg-intel-platform/js/config.js
- MODIFY: ctg-intel-platform/index.html (add config.js to script load order)

STEP 1 — Create config.js:

  File: ctg-intel-platform/js/config.js
  Pattern:
    (function() {
      'use strict';
      window.CONFIG = {
        // API endpoints
        ENDPOINTS: {
          PROSPECTS: '',       // URL to fetch prospect data
          ENRICHMENT: '',      // URL for firmographic enrichment
          SIGNALS: '',         // URL for signal detection feed
          CLAUDE_API: ''       // Claude API endpoint for brief generation
        },
        // API keys (for local dev only — use env vars in production)
        API_KEYS: {
          CLAUDE: '',
          LINKEDIN: '',
          CRUNCHBASE: ''
        },
        // Refresh intervals (milliseconds)
        REFRESH: {
          FEED: 60000,         // Intelligence feed poll interval
          PROSPECTS: 300000    // Prospect data refresh interval
        }
      };
    })();

STEP 2 — Add to index.html script load order:

  File: ctg-intel-platform/index.html
  Location: Before the existing script tags (currently at lines 82-85)
  Add this line FIRST in the script block:
    <script src="js/config.js"></script>

  Resulting order:
    <script src="js/config.js"></script>      <!-- NEW: configuration -->
    <script src="js/data.js"></script>
    <script src="js/shared-components.js"></script>
    <script src="js/shell.js"></script>
    <script src="js/app.js"></script>

STEP 3 — Netlify environment variables (production):

  In Netlify dashboard → Site settings → Environment variables:
  - Add each API key as an environment variable
  - Create a Netlify build plugin or _redirects-based approach to inject
    values at deploy time (since there is no build step, consider a
    Netlify Edge Function or a pre-deploy script)

SECURITY RULES:
- NEVER commit API keys to the repository
- Add config.js to .gitignore if it contains real credentials
- Use Netlify environment variables for production deployments
- The config.js checked into the repo should contain empty placeholder values only
```

### API Integrations Referenced in Codebase

The agent definitions in `data.js` describe these data source requirements:

| Agent | Role | Data Sources Needed |
|---|---|---|
| **Scout** | Signal detection | LinkedIn API, RFP databases, vendor EOL feeds, conference calendars, regulatory bulletins, job boards (50+ sources) |
| **Analyst** | Scoring & enrichment | Firmographic enrichment APIs (12 sources), company databases (Crunchbase, Apollo, Hunter, ZoomInfo) |
| **Strategist** | Brief generation | Claude API (outreach brief generation, Guru matching algorithm) |
| **Planner** | Revenue modeling | Internal pipeline data, commission rate tables, conversion probability models |
| **Monitor** | Feedback loop | CRM outcome data, engagement tracking, model performance metrics |

---

## 5. Customize Branding & Design Tokens

### Task Block: Change Brand Colors

```
TASK: Replace CTG brand colors with your organization's brand colors.

FILE: ctg-intel-platform/css/obsidian.css
LOCATION: Lines 1-60 (:root block)

TOKENS TO CHANGE:

  Background system:
    --bg:             #09090B     (page background)
    --surface:        #111113     (sidebar, cards, panels)
    --surface-alt:    #18181B     (table rows, inputs)

  Border system:
    --border:         #27272A     (default borders)
    --border-active:  #3F3F46     (hover/focus borders)

  Text hierarchy (must maintain WCAG AA contrast against --bg):
    --text:           #FAFAFA     (primary — 19.6:1 ratio)
    --text-secondary: #A1A1AA     (subtitles — 7.4:1)
    --text-muted:     #71717A     (labels — 4.6:1)
    --text-faint:     #52525B     (decorative — 3.2:1, large text only)
    --text-on-accent: #000000     (text on colored backgrounds)

  Brand accents:
    --emerald:        #34D399     (primary accent, CTG brand green)
    --red:            #EF4444     (HOT tier, critical)
    --amber:          #F59E0B     (WARM tier, warning)
    --blue:           #3B82F6     (informational)
    --violet:         #A78BFA     (strategic)
    --teal:           #14B8A6     (NURTURE tier)

  Tinted backgrounds (update alpha-channel versions to match new accents):
    --emerald-muted:  rgba(52, 211, 153, 0.09)
    --red-muted:      rgba(239, 68, 68, 0.09)
    --amber-muted:    rgba(245, 158, 11, 0.09)
    --blue-muted:     rgba(59, 130, 246, 0.09)
    --violet-muted:   rgba(167, 139, 250, 0.09)
    --teal-muted:     rgba(20, 184, 166, 0.09)

NOTE: If you change --emerald, also update --emerald-muted to use the same
RGB values at 0.09 alpha. Same for all accent colors.
```

### Task Block: Change Brand Name & Text

```
TASK: Replace CTG brand references with your organization's name.

FILE: ctg-intel-platform/index.html

LOCATIONS:
  Line 5:  <title>CTG Sourcing Intelligence Platform</title>
  Line 18: <span class="sidebar-brand-title">CTG</span>
  Line 19: <span class="sidebar-brand-sub">INTELLIGENCE</span>
  Line 48: <blockquote class="sidebar-quote">"Every company with a contact center..."</blockquote>
  Line 50: <span class="sidebar-attribution">THE MONEY LINE</span>
  Line 51: <span class="sidebar-credit">BUILT BY Pete Connor</span>
  Line 60: <span class="status-bar-title">SOURCING INTELLIGENCE PLATFORM</span>
  Line 61: <span class="status-bar-subtitle">Strategic Operating System</span>

Replace each occurrence with your organization's branding.
```

### Task Block: Change Fonts

```
TASK: Replace the default fonts with your organization's typography.

FILES:
  ctg-intel-platform/index.html — line 9 (Google Fonts import URL)
  ctg-intel-platform/css/obsidian.css — lines 39-40 (font-family tokens)

STEP 1 — Update Google Fonts URL in index.html line 9:
  Current: href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600;700&display=swap"
  Replace with your font families from Google Fonts (or remove this line entirely
  if using self-hosted fonts).

STEP 2 — Update CSS tokens in obsidian.css:
  Line 39: --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  Line 40: --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  Replace 'Plus Jakarta Sans' with your primary font family.
  Replace 'JetBrains Mono' with your monospace font (used for scores, data values).
```

---

## 6. Add or Remove Modules

### Task Block: Add a New View Module

```
TASK: Add a new view module to the platform.

FILES TO CREATE:
  ctg-intel-platform/js/{module-id}.js
  ctg-intel-platform/css/{module-id}.css

FILES TO MODIFY:
  ctg-intel-platform/js/app.js — add entry to MODULES registry (lines 4-12)
  ctg-intel-platform/index.html — add nav link in #sidebar-nav (lines 22-44)

STEP 1 — Create the JS module file: ctg-intel-platform/js/{module-id}.js

  Use this template:

    (function() {
      'use strict';

      // Private state
      var _timers = [];

      function init(container, panel) {
        // Build your UI here
        // container = main content area (left)
        // panel = right sidebar panel

        // Access data via: window.Data.prospects, window.Data.agents, etc.
        // Build UI with: window.Components.KPICard({...}), Components.DataTable({...}), etc.
      }

      function destroy() {
        // REQUIRED: Clean up all timers
        _timers.forEach(function(t) { clearInterval(t); clearTimeout(t); });
        _timers = [];
      }

      window.modules = window.modules || {};
      window.modules['{module-id}'] = { init: init, destroy: destroy };
    })();

STEP 2 — Create the CSS file: ctg-intel-platform/css/{module-id}.css

  Use design tokens from obsidian.css (var(--bg), var(--emerald), etc.)

STEP 3 — Register in app.js MODULES object:

  File: ctg-intel-platform/js/app.js
  Location: Inside the MODULES object (lines 4-12)
  Add:
    '{module-id}': { css: 'css/{module-id}.css', js: 'js/{module-id}.js', loaded: false, accent: 'emerald' },

STEP 4 — Add nav link in index.html:

  File: ctg-intel-platform/index.html
  Location: Inside <nav class="sidebar-nav" id="sidebar-nav"> (lines 22-44)
  Add:
    <a href="#{module-id}" class="nav-tab" data-module="{module-id}">
      <span class="nav-icon">&#9678;</span> {Module Display Name}
    </a>

VERIFICATION: Open index.html, click the new nav tab. Module should lazy-load
and render. Rapidly switch between tabs 10+ times to confirm no timer leaks.
```

### Task Block: Remove a Module

```
TASK: Remove an existing view module.

STEP 1 — Delete the files:
  ctg-intel-platform/js/{module-id}.js
  ctg-intel-platform/css/{module-id}.css

STEP 2 — Remove from MODULES registry:
  File: ctg-intel-platform/js/app.js
  Location: Lines 4-12
  Delete the line: '{module-id}': { css: '...', js: '...', loaded: false, accent: '...' },

STEP 3 — Remove nav link:
  File: ctg-intel-platform/index.html
  Location: Inside #sidebar-nav (lines 22-44)
  Delete the <a> element with data-module="{module-id}"

STEP 4 — If this was the DEFAULT_MODULE in app.js (line 14):
  Change DEFAULT_MODULE to another valid module ID.
```

---

## 7. Modify Prospect Scoring & Tier Logic

### Task Block: Adjust Strain Factor Weights or Thresholds

```
TASK: Modify the Sourcing Strain Index scoring model.

FILE: ctg-intel-platform/js/data.js

CURRENT SCORING MODEL:
  Each prospect has a strainFactors object with 6 axes (each 0-100):

    strainFactors: {
      vendorUniverse: Number,      // How many vendors the prospect must evaluate
      evalComplexity: Number,      // Complexity of the evaluation process
      expertiseGap: Number,        // Gap between needed and available expertise
      timelinePressure: Number,    // Urgency of the decision timeline
      complianceBurden: Number,    // Regulatory/compliance requirements
      stakeholders: Number         // Number of stakeholders involved in decision
    }

  The overall "score" field (0-100) is currently set statically per prospect.
  To make scoring dynamic, add a scoring function that computes score from
  strainFactors — e.g., weighted average of the 6 axes.

TIER ASSIGNMENT:
  The "tier" field is currently a static string per prospect:
    - "HOT"       (score >= 75 suggested threshold)
    - "WARM"      (score >= 40 suggested threshold)
    - "NURTURE"   (score >= 20 suggested threshold)
    - "STRATEGIC" (score < 20 — long-term watch)

  To make tiers dynamic, add a function that computes tier from score.

SIGNAL TYPES CURRENTLY IN USE:
  "CCAAS MIGRATION"        — Platform migration detected
  "AI INITIATIVE"          — AI project or hiring signal
  "QA COMPLIANCE"          — Quality/compliance pressure
  "PLATFORM RFP ACTIVE"    — Active RFP published
  "COST REDUCTION"         — Cost optimization signals
  "DIGITAL TRANSFORMATION" — Broad digital change signals
  "REMOTE AGENT"           — Remote workforce signals
  "VENDOR EOL"             — Vendor end-of-life announcement

SIGNAL COLORS:
  "emerald" — Primary/strong signal
  "amber"   — Warning/moderate signal
  "gray"    — Neutral/background signal

TO ADD NEW SIGNAL TYPES:
  Add the signal string to a prospect's signals[] array and the corresponding
  color to signalColors[] (parallel arrays — same index).
```

---

## 8. Status Bar Configuration

### Task Block: Make Status Bar Metrics Dynamic

```
TASK: Replace hardcoded status bar metrics with live computed values.

FILE: ctg-intel-platform/index.html
LOCATION: Lines 64-66

CURRENT (hardcoded):
  <span class="status-badge status-badge--red">&#9679; HOT <strong>9</strong></span>
  <span class="status-badge status-badge--amber">&#9679; WARM <strong>13</strong></span>
  <span class="status-badge status-badge--emerald">&#9679; PIPELINE <strong>$24.0M</strong></span>

TO MAKE DYNAMIC:
  Option 1 — Add a script block after the data.js load that updates the status bar:

    File: ctg-intel-platform/index.html
    After the script tags (after line 85), add:

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var counts = Data.getTierCounts();
        var pipeline = Data.getPipelineValue();
        var formatted = '$' + (pipeline / 1000000).toFixed(1) + 'M';

        var bar = document.getElementById('status-bar');
        var badges = bar.querySelectorAll('.status-badge strong');
        if (badges[0]) badges[0].textContent = counts.HOT;
        if (badges[1]) badges[1].textContent = counts.WARM;
        if (badges[2]) badges[2].textContent = formatted;
      });
    </script>

  Option 2 — Move the status bar update into app.js after data loads.

HELPER FUNCTIONS AVAILABLE:
  Data.getTierCounts()  → { ALL: 30, HOT: 9, WARM: 13, NURTURE: 5, STRATEGIC: 3 }
  Data.getPipelineValue() → 24000000 (raw number in dollars)
```

---

## 9. Verification Checklist

Run this checklist after any customization. Every item must pass.

```
TASK: Verify the platform after changes.

FUNCTIONAL CHECKS:
  [ ] Open ctg-intel-platform/index.html in a browser
  [ ] All 7 nav tabs load without console errors:
      - Command Center
      - Pipeline Intel
      - Strain Simulator
      - Revenue Model
      - Agent Architecture
      - Competitive Map
      - Build Roadmap
  [ ] KPI cards display correct values matching data.js
  [ ] Data tables render all prospect records
  [ ] Strain radar charts render 6 axes
  [ ] Intelligence feed displays entries in the right sidebar

TIMER LEAK TEST:
  [ ] Rapidly click between all 7 modules 10+ times
  [ ] Open browser DevTools → Console → confirm no errors accumulate
  [ ] Monitor memory (DevTools → Performance → Memory) — should not climb

DATA INTEGRITY:
  [ ] Tier counts in status bar match Data.getTierCounts()
  [ ] Pipeline value matches Data.getPipelineValue()
  [ ] All prospect detail panels show correct keyIntelligence entries

DESIGN TOKEN VERIFICATION:
  [ ] Brand colors applied consistently across all modules
  [ ] Text contrast meets WCAG AA (use browser accessibility tools)
  [ ] Fonts load correctly (check DevTools → Network → Fonts)

DEPLOYMENT VERIFICATION:
  [ ] Netlify deployment succeeds with no build errors
  [ ] SPA routing works (direct URL to /#pipeline-intel loads correctly)
  [ ] Cache headers present on CSS/JS files (check DevTools → Network → Headers)
  [ ] Security headers present (X-Frame-Options, X-Content-Type-Options)
```

---

## Quick Reference: Files by Modification Frequency

| When You Need To... | Modify This File |
|---|---|
| Change prospect data | `js/data.js` |
| Change colors, spacing, typography | `css/obsidian.css` |
| Change brand name, navigation | `index.html` |
| Add/remove modules | `js/app.js` + `index.html` + new JS/CSS files |
| Add API configuration | Create `js/config.js` + modify `index.html` |
| Change deployment settings | `netlify.toml` |
| Change shared UI components | `js/shared-components.js` (affects all modules) |
