/* ═══ MODULE: pipeline-intel ═══ */
(function() {
  'use strict';

  var _container = null;
  var _panel = null;
  var _timers = [];
  var _listeners = [];

  function _interval(fn, ms) { var id = setInterval(fn, ms); _timers.push(id); return id; }
  function _timeout(fn, ms) { var id = setTimeout(fn, ms); _timers.push(id); return id; }
  function _on(target, event, handler) {
    target.addEventListener(event, handler);
    _listeners.push({ target: target, event: event, handler: handler });
  }

  function tierColor(tier) {
    return tier === 'HOT' ? 'red' : tier === 'WARM' ? 'amber' : tier === 'NURTURE' ? 'teal' : 'text-faint';
  }

  function buildCard(prospect) {
    var card = document.createElement('div');
    card.className = 'pi-card';
    card.style.borderTopColor = 'var(--' + tierColor(prospect.tier) + ')';

    var scoreEl = Components.CircularScore({ score: prospect.score, size: 50, tier: prospect.tier });
    card.appendChild(scoreEl);

    var name = document.createElement('div');
    name.className = 'heading-md pi-card-name';
    name.textContent = prospect.company;
    card.appendChild(name);

    var loc = document.createElement('div');
    loc.className = 'body-sm pi-card-location';
    loc.textContent = prospect.location;
    card.appendChild(loc);

    var badges = document.createElement('div');
    badges.className = 'pi-card-badges';
    badges.appendChild(Components.TierBadge(prospect.tier));
    if (prospect.signals) {
      prospect.signals.slice(0, 2).forEach(function(sig, i) {
        badges.appendChild(Components.SignalBadge(sig, prospect.signalColors[i]));
      });
    }
    card.appendChild(badges);

    var stats = document.createElement('div');
    stats.className = 'pi-card-stats body-sm';
    stats.innerHTML =
      '<div>Agents: <span class="mono-md">' + prospect.agents.toLocaleString() + '</span></div>' +
      '<div>Platform: ' + prospect.platform + '</div>' +
      '<div>Annual Spend: <span class="mono-md" style="color:var(--emerald)">' + prospect.annualSpend + '</span></div>' +
      '<div>Expiry: <span style="color:var(--red)">' + prospect.contractExpiry + '</span></div>';
    card.appendChild(stats);

    _on(card, 'click', function() { openDetail(prospect); });
    return card;
  }

  function openDetail(p) {
    _panel.innerHTML = '';
    _panel.classList.add('pi-panel-open');

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'pi-close-btn';
    closeBtn.innerHTML = '&times;';
    _on(closeBtn, 'click', function() {
      _panel.classList.remove('pi-panel-open');
      _panel.innerHTML = '';
    });
    _panel.appendChild(closeBtn);

    // Company + location
    var heading = document.createElement('div');
    heading.className = 'heading-lg';
    heading.textContent = p.company;
    _panel.appendChild(heading);
    var loc = document.createElement('div');
    loc.className = 'body-sm';
    loc.style.color = 'var(--text-secondary)';
    loc.textContent = p.location;
    loc.style.marginBottom = 'var(--space-4)';
    _panel.appendChild(loc);

    // Score ring
    var scoreWrap = document.createElement('div');
    scoreWrap.style.textAlign = 'center';
    scoreWrap.style.marginBottom = 'var(--space-4)';
    scoreWrap.appendChild(Components.CircularScore({ score: p.score, size: 120, tier: p.tier }));
    _panel.appendChild(scoreWrap);

    // Tier badge centered
    var tierWrap = document.createElement('div');
    tierWrap.style.textAlign = 'center';
    tierWrap.style.marginBottom = 'var(--space-4)';
    tierWrap.appendChild(Components.TierBadge(p.tier));
    _panel.appendChild(tierWrap);

    // Radar chart
    var radarColor = p.tier === 'HOT' ? 'red' : p.tier === 'WARM' ? 'amber' : 'emerald';
    var sf = p.strainFactors;
    var radarWrap = document.createElement('div');
    radarWrap.style.textAlign = 'center';
    radarWrap.style.marginBottom = 'var(--space-4)';
    radarWrap.appendChild(Components.RadarChart({
      values: [sf.vendorUniverse, sf.evalComplexity, sf.expertiseGap, sf.timelinePressure, sf.complianceBurden, sf.stakeholders],
      size: 200,
      color: radarColor
    }));
    _panel.appendChild(radarWrap);

    // Strain factor bars
    var factorLabel = document.createElement('div');
    factorLabel.className = 'label-lg';
    factorLabel.textContent = 'STRAIN FACTOR BREAKDOWN';
    factorLabel.style.marginBottom = 'var(--space-3)';
    _panel.appendChild(factorLabel);

    var factorNames = ['Vendor Universe', 'Eval Complexity', 'Expertise Gap', 'Timeline Pressure', 'Compliance Burden', 'Stakeholders'];
    var factorVals = [sf.vendorUniverse, sf.evalComplexity, sf.expertiseGap, sf.timelinePressure, sf.complianceBurden, sf.stakeholders];
    factorNames.forEach(function(name, i) {
      var val = factorVals[i];
      var barColor = val >= 75 ? 'var(--red)' : val >= 50 ? 'var(--amber)' : val >= 25 ? 'var(--teal)' : 'var(--text-muted)';
      var row = document.createElement('div');
      row.className = 'pi-factor-row';
      row.innerHTML =
        '<span class="body-sm pi-factor-name">' + name + '</span>' +
        '<div class="pi-factor-bar-track"><div class="pi-factor-bar-fill" style="width:' + val + '%;background:' + barColor + '"></div></div>' +
        '<span class="mono-md pi-factor-val">' + val + '</span>';
      _panel.appendChild(row);
    });

    // Service alignment
    if (p.serviceAlignment && p.serviceAlignment.length) {
      var svcLabel = document.createElement('div');
      svcLabel.className = 'label-lg';
      svcLabel.textContent = 'CTG SERVICE ALIGNMENT';
      svcLabel.style.margin = 'var(--space-4) 0 var(--space-2)';
      _panel.appendChild(svcLabel);
      var svcWrap = document.createElement('div');
      svcWrap.className = 'pi-svc-tags';
      p.serviceAlignment.forEach(function(svc) {
        svcWrap.appendChild(Components.SignalBadge(svc, 'emerald'));
      });
      _panel.appendChild(svcWrap);
    }

    // Key intelligence
    if (p.keyIntelligence && p.keyIntelligence.length) {
      var kiLabel = document.createElement('div');
      kiLabel.className = 'label-lg';
      kiLabel.textContent = 'KEY INTELLIGENCE';
      kiLabel.style.margin = 'var(--space-4) 0 var(--space-2)';
      _panel.appendChild(kiLabel);
      var kiTable = document.createElement('div');
      kiTable.className = 'pi-ki-table';
      p.keyIntelligence.forEach(function(item) {
        kiTable.innerHTML += '<div class="pi-ki-row"><span class="body-sm" style="color:var(--text-muted)">' + item.label + '</span><span class="body-sm">' + item.value + '</span></div>';
      });
      _panel.appendChild(kiTable);
    }

    // Notes
    if (p.notes) {
      var notesLabel = document.createElement('div');
      notesLabel.className = 'label-lg';
      notesLabel.textContent = 'NOTES';
      notesLabel.style.margin = 'var(--space-4) 0 var(--space-2)';
      _panel.appendChild(notesLabel);
      var notesPara = document.createElement('p');
      notesPara.className = 'body-sm';
      notesPara.textContent = p.notes;
      _panel.appendChild(notesPara);
    }

    // Action buttons
    var btnWrap = document.createElement('div');
    btnWrap.style.marginTop = 'var(--space-4)';
    btnWrap.appendChild(Components.ActionButton({ label: 'Assign Guru', variant: 'ghost' }));
    btnWrap.appendChild(Components.ActionButton({ label: 'Generate Outreach Brief', variant: 'ghost' }));
    btnWrap.appendChild(Components.ActionButton({ label: 'Flag for Darren', variant: 'ghost-red' }));
    _panel.appendChild(btnWrap);
  }

  function renderCards(prospects) {
    var grid = _container.querySelector('.pi-card-grid');
    if (!grid) return;
    grid.innerHTML = '';
    prospects.slice().sort(function(a, b) { return b.score - a.score; }).forEach(function(p) { grid.appendChild(buildCard(p)); });
  }

  function init(container, panel) {
    _container = container;
    _panel = panel;

    var counts = Data.getTierCounts();

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
        renderCards(filtered);
      }
    });
    container.appendChild(filterBar);

    // Card grid
    var grid = document.createElement('div');
    grid.className = 'pi-card-grid';
    container.appendChild(grid);

    renderCards(Data.prospects.slice());
  }

  function destroy() {
    _timers.forEach(function(id) { clearInterval(id); clearTimeout(id); });
    _timers = [];
    _listeners.forEach(function(l) { l.target.removeEventListener(l.event, l.handler); });
    _listeners = [];
    _container = null;
    _panel = null;
  }

  window.modules = window.modules || {};
  window.modules['pipeline-intel'] = { init: init, destroy: destroy };
})();
