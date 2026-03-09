/* ═══ MODULE: strain-simulator ═══ */
(function() {
  'use strict';

  var _container = null;
  var _panel = null;
  var _timers = [];
  var _listeners = [];
  var _sliders = [];
  var _weights = [0.20, 0.20, 0.15, 0.20, 0.15, 0.10];

  function _interval(fn, ms) { var id = setInterval(fn, ms); _timers.push(id); return id; }
  function _timeout(fn, ms) { var id = setTimeout(fn, ms); _timers.push(id); return id; }
  function _on(target, event, handler) {
    target.addEventListener(event, handler);
    _listeners.push({ target: target, event: event, handler: handler });
  }

  var PRESETS = {
    'Enterprise CCaaS': [90, 85, 80, 85, 60, 75],
    'AI-First CC':      [75, 90, 95, 70, 50, 65],
    'Healthcare':       [85, 80, 75, 90, 95, 80],
    'BPO Consolidation':[70, 75, 65, 80, 55, 85]
  };

  function computeScore() {
    var score = 0;
    _sliders.forEach(function(s, i) {
      score += s.val * _weights[i];
    });
    return Math.round(score);
  }

  function updatePanel() {
    if (!_panel) return;
    _panel.innerHTML = '';
    var score = computeScore();

    // Circular score
    var scoreWrap = document.createElement('div');
    scoreWrap.style.textAlign = 'center';
    scoreWrap.style.marginBottom = 'var(--space-4)';
    scoreWrap.appendChild(Components.CircularScore({ score: score, size: 120 }));
    _panel.appendChild(scoreWrap);

    // Severity badge
    var severity, sevColor;
    if (score >= 75) { severity = 'CRITICAL'; sevColor = 'red'; }
    else if (score >= 50) { severity = 'HIGH'; sevColor = 'amber'; }
    else if (score >= 25) { severity = 'MODERATE'; sevColor = 'teal'; }
    else { severity = 'LOW'; sevColor = 'text-muted'; }

    var badge = document.createElement('div');
    badge.style.textAlign = 'center';
    badge.style.marginBottom = 'var(--space-4)';
    badge.innerHTML = '<span class="tier-badge tier-badge--' + (sevColor === 'text-muted' ? 'strategic' : severity.toLowerCase()) + '" style="background:var(--' + sevColor + ');font-size:12px;padding:4px 12px">' + severity + '</span>';
    _panel.appendChild(badge);

    // KPIs
    var kpiGrid = document.createElement('div');
    kpiGrid.className = 'ss-kpi-grid';
    kpiGrid.appendChild(Components.KPICard({ label: 'HOURS SAVED', value: String(Math.round(score * 3.5)), size: 'md', valueColor: 'emerald' }));
    kpiGrid.appendChild(Components.KPICard({ label: 'DEMOS AVOIDED', value: String(Math.floor(score * 1.8)), size: 'md', valueColor: 'emerald' }));
    _panel.appendChild(kpiGrid);

    // Radar chart
    var values = _sliders.map(function(s) { return s.val; });
    var radarWrap = document.createElement('div');
    radarWrap.style.textAlign = 'center';
    radarWrap.style.marginTop = 'var(--space-4)';
    radarWrap.appendChild(Components.RadarChart({ values: values, size: 200, color: sevColor === 'red' ? 'red' : sevColor === 'amber' ? 'amber' : 'emerald' }));
    _panel.appendChild(radarWrap);

    // Recommendation callout
    var recText = score >= 75 ? 'IMMEDIATE CTG ENGAGEMENT RECOMMENDED. This prospect faces critical sourcing strain. CTG can reduce evaluation time by 80% and eliminate vendor fatigue.' :
                  score >= 50 ? 'CTG engagement strongly recommended. High evaluation complexity makes independent assessment risky. CTG expertise dramatically improves outcomes.' :
                  score >= 25 ? 'Monitor for escalation. Current strain is manageable but could increase. CTG value proposition strengthens as evaluation timeline compresses.' :
                  'Low immediate need. Prospect can likely self-evaluate. Maintain relationship for future engagement as complexity grows.';
    _panel.appendChild(Components.CalloutBox({ title: 'RECOMMENDED ACTION', text: recText, color: sevColor === 'text-muted' ? 'emerald' : sevColor }));
  }

  function init(container, panel) {
    _container = container;
    _panel = panel;
    _sliders = [];

    // Title
    var title = document.createElement('div');
    title.className = 'heading-lg';
    title.textContent = 'Sourcing Strain Simulator';
    container.appendChild(title);
    var sub = document.createElement('div');
    sub.className = 'body-sm';
    sub.style.color = 'var(--text-secondary)';
    sub.style.marginBottom = 'var(--space-4)';
    sub.textContent = 'Model evaluation complexity across 6 weighted dimensions to assess CTG engagement value.';
    container.appendChild(sub);

    // Preset buttons
    var presetRow = document.createElement('div');
    presetRow.className = 'ss-preset-row';
    Object.keys(PRESETS).forEach(function(name) {
      var btn = document.createElement('button');
      btn.className = 'ss-preset-btn';
      btn.textContent = name;
      _on(btn, 'click', function() {
        presetRow.querySelectorAll('.ss-preset-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var vals = PRESETS[name];
        _sliders.forEach(function(s, i) { s.el.setValue(vals[i]); s.val = vals[i]; });
        updatePanel();
      });
      presetRow.appendChild(btn);
    });
    container.appendChild(presetRow);

    // 6 Sliders
    var labels = ['Vendor Universe', 'Evaluation Complexity', 'Internal Expertise Gap', 'Timeline Pressure', 'Compliance Burden', 'Stakeholder Complexity'];
    var defaults = [65, 70, 60, 75, 55, 50];

    labels.forEach(function(label, i) {
      var sliderObj = { val: defaults[i], el: null };
      var slider = Components.RangeSlider({
        label: label + ' (' + (_weights[i] * 100) + '%)',
        min: 0, max: 100, value: defaults[i],
        onChange: function(v) { sliderObj.val = v; updatePanel(); }
      });
      sliderObj.el = slider;
      _sliders.push(sliderObj);
      container.appendChild(slider);
    });

    updatePanel();
  }

  function destroy() {
    _timers.forEach(function(id) { clearInterval(id); clearTimeout(id); });
    _timers = [];
    _listeners.forEach(function(l) { l.target.removeEventListener(l.event, l.handler); });
    _listeners = [];
    _sliders = [];
    _container = null;
    _panel = null;
  }

  window.modules = window.modules || {};
  window.modules['strain-simulator'] = { init: init, destroy: destroy };
})();
