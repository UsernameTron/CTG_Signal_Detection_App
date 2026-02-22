/* ═══ MODULE: agent-architecture ═══ */
(function() {
  'use strict';

  var _container = null;
  var _panel = null;
  var _timers = [];
  var _listeners = [];
  var _simRunning = false;
  var _simPaused = false;
  var _simIndex = 0;
  var _allSteps = [];

  function _interval(fn, ms) { var id = setInterval(fn, ms); _timers.push(id); return id; }
  function _timeout(fn, ms) { var id = setTimeout(fn, ms); _timers.push(id); return id; }
  function _on(target, event, handler) {
    target.addEventListener(event, handler);
    _listeners.push({ target: target, event: event, handler: handler });
  }

  function buildAgentCard(agent) {
    var card = document.createElement('div');
    card.className = 'aa-agent-card';
    card.style.borderLeftColor = 'var(--' + agent.color + ')';

    var badge = document.createElement('span');
    badge.className = 'aa-agent-badge mono-sm';
    badge.style.color = 'var(--' + agent.color + ')';
    badge.style.background = 'var(--' + agent.color + '-muted)';
    badge.textContent = agent.name.toUpperCase();
    card.appendChild(badge);

    var subtitle = document.createElement('div');
    subtitle.className = 'body-sm';
    subtitle.style.color = 'var(--text-muted)';
    subtitle.textContent = agent.subtitle;
    subtitle.style.marginBottom = 'var(--space-2)';
    card.appendChild(subtitle);

    var desc = document.createElement('p');
    desc.className = 'body-sm';
    desc.textContent = agent.description;
    desc.style.marginBottom = 'var(--space-3)';
    card.appendChild(desc);

    var statsRow = document.createElement('div');
    statsRow.className = 'aa-stats-row';
    Object.keys(agent.stats).forEach(function(key) {
      statsRow.innerHTML += '<div class="aa-stat"><span class="label-sm">' + key.toUpperCase() + '</span><span class="mono-md" style="color:var(--' + agent.color + ')">' + agent.stats[key] + '</span></div>';
    });
    card.appendChild(statsRow);

    return card;
  }

  function runSimulation() {
    if (_simIndex >= _allSteps.length || !_simRunning || _simPaused) return;
    var step = _allSteps[_simIndex];
    var entry = Components.FeedEntry({ agent: step.agent.toUpperCase(), color: step.color, time: step.time, text: step.text });
    entry.style.opacity = '0';
    entry.style.transition = 'opacity 300ms var(--ease-out)';
    var feed = _panel.querySelector('.aa-sim-feed');
    if (feed) {
      feed.insertBefore(entry, feed.firstChild);
      requestAnimationFrame(function() { entry.style.opacity = '1'; });
    }
    _simIndex++;
    if (_simIndex < _allSteps.length) {
      _timeout(runSimulation, 1500);
    }
  }

  function buildPanel() {
    _panel.innerHTML = '';

    var label = document.createElement('div');
    label.className = 'label-lg';
    label.textContent = 'AGENT CHAIN SIMULATION';
    label.style.marginBottom = 'var(--space-3)';
    _panel.appendChild(label);

    var btnRow = document.createElement('div');
    btnRow.className = 'aa-btn-row';

    var runBtn = Components.ActionButton({
      label: !_simRunning ? 'Run Agent Chain' : _simPaused ? 'Resume' : 'Pause',
      variant: 'primary',
      onClick: function() {
        if (!_simRunning) {
          _simRunning = true;
          _simPaused = false;
          _simIndex = 0;
          buildPanel();
          runSimulation();
        } else if (!_simPaused) {
          _simPaused = true;
          runBtn.textContent = 'Resume';
        } else {
          _simPaused = false;
          runBtn.textContent = 'Pause';
          runSimulation();
        }
      }
    });
    btnRow.appendChild(runBtn);

    if (_simRunning) {
      var resetBtn = Components.ActionButton({
        label: 'Reset',
        variant: 'ghost',
        onClick: function() {
          _simRunning = false;
          _simPaused = false;
          _simIndex = 0;
          _timers.forEach(function(id) { clearTimeout(id); });
          _timers = [];
          buildPanel();
        }
      });
      btnRow.appendChild(resetBtn);
    }
    _panel.appendChild(btnRow);

    if (_simRunning) {
      var liveHeader = document.createElement('div');
      liveHeader.className = 'aa-live-header';
      liveHeader.innerHTML = '<span class="live-dot"></span><span class="label-sm">LIVE SIMULATION</span>';
      _panel.appendChild(liveHeader);
    }

    var feed = document.createElement('div');
    feed.className = 'aa-sim-feed';
    _panel.appendChild(feed);
  }

  function init(container, panel) {
    _container = container;
    _panel = panel;
    _simRunning = false;
    _simPaused = false;
    _simIndex = 0;

    // Build all simulation steps from agent data
    _allSteps = [];
    Data.agents.forEach(function(agent) {
      agent.simulationSteps.forEach(function(step) {
        _allSteps.push({ agent: agent.name, color: agent.color, time: step.time, text: step.text });
      });
    });

    // Title
    var title = document.createElement('div');
    title.className = 'heading-lg';
    title.textContent = 'Agent Architecture';
    container.appendChild(title);
    var sub = document.createElement('div');
    sub.className = 'body-sm';
    sub.style.color = 'var(--text-secondary)';
    sub.style.marginBottom = 'var(--space-4)';
    sub.textContent = '5-agent intelligence pipeline: detect, analyze, strategize, plan, and learn.';
    container.appendChild(sub);

    // Agent cards
    Data.agents.forEach(function(agent) {
      container.appendChild(buildAgentCard(agent));
    });

    buildPanel();
  }

  function destroy() {
    _simRunning = false;
    _simPaused = false;
    _timers.forEach(function(id) { clearInterval(id); clearTimeout(id); });
    _timers = [];
    _listeners.forEach(function(l) { l.target.removeEventListener(l.event, l.handler); });
    _listeners = [];
    _allSteps = [];
    _container = null;
    _panel = null;
  }

  window.modules = window.modules || {};
  window.modules['agent-architecture'] = { init: init, destroy: destroy };
})();
