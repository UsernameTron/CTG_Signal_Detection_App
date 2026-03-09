/* ═══ MODULE: command-center ═══ */
(function() {
  'use strict';

  var _container = null;
  var _panel = null;
  var _timers = [];
  var _listeners = [];
  var _tableEl = null;

  function _interval(fn, ms) { var id = setInterval(fn, ms); _timers.push(id); return id; }
  function _timeout(fn, ms) { var id = setTimeout(fn, ms); _timers.push(id); return id; }
  function _on(target, event, handler) {
    target.addEventListener(event, handler);
    _listeners.push({ target: target, event: event, handler: handler });
  }

  function init(container, panel) {
    _container = container;
    _panel = panel;

    var counts = Data.getTierCounts();

    // ── Hero KPIs ──
    var heroGrid = document.createElement('div');
    heroGrid.className = 'cc-hero-grid';
    heroGrid.appendChild(Components.KPICard({ label: 'TOTAL ADDRESSABLE MARKET', value: '$47B', subtitle: 'Enterprise CC Market 2024' }));
    heroGrid.appendChild(Components.KPICard({ label: 'HOT PROSPECTS', value: String(counts.HOT), subtitle: 'Active engagement targets', valueColor: 'red' }));
    heroGrid.appendChild(Components.KPICard({ label: 'DECISION WINDOW', value: 'Q2-Q3', subtitle: 'Peak evaluation period', valueColor: 'amber' }));
    heroGrid.appendChild(Components.KPICard({ label: 'PROJECTED COMMISSION', value: '$900K', subtitle: 'Year 1 pipeline value' }));
    container.appendChild(heroGrid);

    // ── Market Pulse ──
    var pulseLabel = document.createElement('div');
    pulseLabel.className = 'label-lg cc-section-label';
    pulseLabel.textContent = 'MARKET PULSE';
    container.appendChild(pulseLabel);

    var pulseGrid = document.createElement('div');
    pulseGrid.className = 'cc-pulse-grid';
    pulseGrid.appendChild(Components.KPICard({ label: 'VENDORS', value: '200+', size: 'md' }));
    pulseGrid.appendChild(Components.KPICard({ label: 'CATEGORIES', value: '50+', size: 'md' }));
    pulseGrid.appendChild(Components.KPICard({ label: 'EVALUATION HOURS', value: '3,000', size: 'md' }));
    container.appendChild(pulseGrid);

    // ── Pipeline Overview ──
    var pipeLabel = document.createElement('div');
    pipeLabel.className = 'label-lg cc-section-label';
    pipeLabel.textContent = 'PIPELINE OVERVIEW';
    container.appendChild(pipeLabel);

    // Filter tabs
    var filterBar = Components.FilterTabBar({
      tabs: [
        { label: 'ALL', count: counts.ALL },
        { label: 'HOT', count: counts.HOT, color: 'red' },
        { label: 'WARM', count: counts.WARM, color: 'amber' },
        { label: 'NURTURE', count: counts.NURTURE, color: 'teal' },
        { label: 'STRATEGIC', count: counts.STRATEGIC, color: 'text-faint' }
      ],
      onSelect: function(tier) {
        var filtered = tier === 'ALL' ? Data.prospects.slice() : Data.prospects.filter(function(p) { return p.tier === tier; });
        filtered.sort(function(a, b) { return b.score - a.score; });
        if (_tableEl) _tableEl.updateRows(filtered);
      }
    });
    container.appendChild(filterBar);

    // Data table
    var sorted = Data.prospects.slice().sort(function(a, b) { return b.score - a.score; });
    _tableEl = Components.DataTable({
      columns: [
        { key: 'score', label: 'Score', width: '60px', align: 'center', format: function(v, row) {
          var color = row.tier === 'HOT' ? 'var(--red)' : row.tier === 'WARM' ? 'var(--amber)' : row.tier === 'NURTURE' ? 'var(--teal)' : 'var(--text-muted)';
          return '<span class="mono-md" style="color:' + color + '">' + v + '</span>';
        }},
        { key: 'company', label: 'Company' },
        { key: 'industry', label: 'Industry' },
        { key: 'agents', label: 'Agents', align: 'right', format: function(v) { return '<span class="mono-md">' + v.toLocaleString() + '</span>'; }},
        { key: 'platform', label: 'Platform' },
        { key: 'signals', label: 'Signal', format: function(v, row) {
          if (!v || !v.length) return '';
          return Components.SignalBadge(v[0], row.signalColors[0]).outerHTML;
        }},
        { key: 'contractExpiry', label: 'Expiry' },
        { key: 'tier', label: 'Tier', format: function(v) { return Components.TierBadge(v).outerHTML; }}
      ],
      rows: sorted
    });
    container.appendChild(_tableEl);

    // ── Panel: Technology Mix ──
    var techLabel = document.createElement('div');
    techLabel.className = 'label-lg cc-section-label';
    techLabel.textContent = 'TECHNOLOGY MIX';
    panel.appendChild(techLabel);

    var platDist = Data.getPlatformDistribution();
    var maxCount = platDist[0] ? platDist[0][1] : 1;
    var techChart = document.createElement('div');
    techChart.className = 'cc-tech-chart';
    platDist.forEach(function(entry) {
      var row = document.createElement('div');
      row.className = 'cc-tech-row';
      var pct = (entry[1] / maxCount) * 100;
      row.innerHTML =
        '<span class="cc-tech-name body-sm">' + entry[0] + '</span>' +
        '<div class="cc-tech-bar-track"><div class="cc-tech-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="cc-tech-count mono-sm">' + entry[1] + '</span>';
      techChart.appendChild(row);
    });
    panel.appendChild(techChart);

    // ── Panel: Intelligence Feed ──
    var feedHeader = document.createElement('div');
    feedHeader.className = 'cc-feed-header';
    feedHeader.innerHTML = '<span class="live-dot"></span><span class="label-sm">LIVE</span>';
    panel.appendChild(feedHeader);

    var feedLabel = document.createElement('div');
    feedLabel.className = 'label-lg cc-section-label';
    feedLabel.textContent = 'INTELLIGENCE FEED';
    panel.appendChild(feedLabel);

    var feedContainer = document.createElement('div');
    feedContainer.className = 'cc-feed-container';
    Data.feedEntries.forEach(function(entry) {
      feedContainer.appendChild(Components.FeedEntry(entry));
    });
    panel.appendChild(feedContainer);
  }

  function destroy() {
    _timers.forEach(function(id) { clearInterval(id); clearTimeout(id); });
    _timers = [];
    _listeners.forEach(function(l) { l.target.removeEventListener(l.event, l.handler); });
    _listeners = [];
    _tableEl = null;
    _container = null;
    _panel = null;
  }

  window.modules = window.modules || {};
  window.modules['command-center'] = { init: init, destroy: destroy };
})();
