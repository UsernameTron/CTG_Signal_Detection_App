/* ═══ MODULE: build-roadmap ═══ */
(function() {
  'use strict';

  var _container = null;
  var _panel = null;
  var _timers = [];
  var _listeners = [];
  var _activePhase = 0;

  function _interval(fn, ms) { var id = setInterval(fn, ms); _timers.push(id); return id; }
  function _on(target, event, handler) {
    target.addEventListener(event, handler);
    _listeners.push({ target: target, event: event, handler: handler });
  }

  function statusBadgeHTML(status, color) {
    var bg = color === 'emerald' ? 'var(--emerald)' : color === 'amber' ? 'var(--amber)' : 'var(--text-faint)';
    var textColor = color === 'amber' ? 'var(--text-on-accent)' : 'var(--text)';
    return '<span style="display:inline-block;font:700 10px/1 var(--font-mono);padding:3px 8px;border-radius:var(--radius-sm);background:' + bg + ';color:' + textColor + '">' + status + '</span>';
  }

  function renderPhaseDetail(phase) {
    var detail = _container.querySelector('.br-detail');
    if (!detail) return;
    detail.innerHTML = '';

    // Status + Name
    var header = document.createElement('div');
    header.className = 'br-detail-header';
    header.innerHTML = statusBadgeHTML(phase.status, phase.statusColor);
    detail.appendChild(header);

    var name = document.createElement('div');
    name.className = 'heading-lg';
    name.textContent = phase.name;
    name.style.marginTop = 'var(--space-2)';
    detail.appendChild(name);

    var sub = document.createElement('div');
    sub.className = 'body-sm';
    sub.style.color = 'var(--text-secondary)';
    sub.textContent = phase.subtitle;
    detail.appendChild(sub);

    var weeks = document.createElement('div');
    weeks.className = 'mono-md';
    weeks.style.color = 'var(--emerald)';
    weeks.style.margin = 'var(--space-2) 0';
    weeks.textContent = phase.weeks;
    detail.appendChild(weeks);

    var invest = document.createElement('div');
    invest.className = 'label-lg';
    invest.textContent = 'INVESTMENT: ' + phase.investment;
    invest.style.marginBottom = 'var(--space-4)';
    detail.appendChild(invest);

    // Tasks (2x2 grid)
    var taskGrid = document.createElement('div');
    taskGrid.className = 'br-task-grid';
    phase.tasks.forEach(function(task) {
      var taskEl = document.createElement('div');
      taskEl.className = 'br-task';
      taskEl.innerHTML = '<span class="body-sm">' + task.name + '</span><span class="mono-sm" style="color:var(--emerald)">' + task.hours + '</span>';
      taskGrid.appendChild(taskEl);
    });
    detail.appendChild(taskGrid);

    // Metrics
    var metricsLabel = document.createElement('div');
    metricsLabel.className = 'label-lg';
    metricsLabel.textContent = 'KEY METRICS';
    metricsLabel.style.margin = 'var(--space-4) 0 var(--space-2)';
    detail.appendChild(metricsLabel);

    var metricsRow = document.createElement('div');
    metricsRow.className = 'br-metrics-row';
    phase.metrics.forEach(function(m) {
      metricsRow.innerHTML += '<div class="br-metric"><span class="label-sm">' + m.label.toUpperCase() + '</span><span class="mono-md" style="color:var(--emerald)">' + m.value + '</span></div>';
    });
    detail.appendChild(metricsRow);

    // Deliverable
    var delLabel = document.createElement('div');
    delLabel.className = 'label-lg';
    delLabel.textContent = 'DELIVERABLE';
    delLabel.style.margin = 'var(--space-4) 0 var(--space-2)';
    detail.appendChild(delLabel);
    var delText = document.createElement('p');
    delText.className = 'body-sm';
    delText.textContent = phase.deliverable;
    detail.appendChild(delText);
  }

  function init(container, panel) {
    _container = container;
    _panel = panel;
    _activePhase = 0;

    // Title
    var title = document.createElement('div');
    title.className = 'heading-lg';
    title.textContent = 'Build Roadmap';
    container.appendChild(title);
    var sub = document.createElement('div');
    sub.className = 'body-sm';
    sub.style.color = 'var(--text-secondary)';
    sub.style.marginBottom = 'var(--space-4)';
    sub.textContent = '26-week build plan from foundation to fully autonomous intelligence system.';
    container.appendChild(sub);

    // Layout: sub-nav + detail
    var layout = document.createElement('div');
    layout.className = 'br-layout';

    // Sub-nav (timeline)
    var nav = document.createElement('div');
    nav.className = 'br-timeline-nav';
    Data.roadmapPhases.forEach(function(phase, i) {
      var item = document.createElement('div');
      item.className = 'br-timeline-item' + (i === _activePhase ? ' active' : '');
      item.innerHTML =
        '<div class="br-timeline-dot" style="background:var(--' + phase.statusColor + ')"></div>' +
        '<div class="br-timeline-text">' +
          '<span class="heading-sm">' + phase.name + '</span>' +
          '<span class="body-sm" style="color:var(--text-muted)">' + phase.weeks + '</span>' +
        '</div>';
      if (i < Data.roadmapPhases.length - 1) {
        item.innerHTML += '<div class="br-timeline-line"></div>';
      }
      _on(item, 'click', function() {
        _activePhase = i;
        nav.querySelectorAll('.br-timeline-item').forEach(function(el, j) {
          el.classList.toggle('active', j === i);
        });
        renderPhaseDetail(Data.roadmapPhases[i]);
      });
      nav.appendChild(item);
    });
    layout.appendChild(nav);

    // Detail panel
    var detail = document.createElement('div');
    detail.className = 'br-detail';
    layout.appendChild(detail);

    container.appendChild(layout);
    renderPhaseDetail(Data.roadmapPhases[0]);

    // ── Panel: Investment Summary ──
    var investLabel = document.createElement('div');
    investLabel.className = 'label-lg';
    investLabel.textContent = 'TOTAL INVESTMENT';
    investLabel.style.marginBottom = 'var(--space-3)';
    panel.appendChild(investLabel);

    var total = 0;
    Data.roadmapPhases.forEach(function(phase) {
      total += parseInt(phase.investment.replace(/[$,]/g, ''));
      var row = document.createElement('div');
      row.className = 'br-invest-row';
      row.innerHTML = '<span class="body-sm">' + phase.name + '</span><span class="mono-md">' + phase.investment + '</span>';
      panel.appendChild(row);
    });

    var totalRow = document.createElement('div');
    totalRow.className = 'br-invest-row br-invest-total';
    totalRow.innerHTML = '<span class="heading-sm">TOTAL</span><span class="mono-lg" style="color:var(--emerald)">$' + total.toLocaleString() + '</span>';
    panel.appendChild(totalRow);

    panel.appendChild(Components.CalloutBox({
      title: 'ROI PROJECTION',
      text: 'At $90K total investment and $900K+ projected Year 1 commission, the platform delivers 10x ROI in the first year alone.',
      color: 'emerald'
    }));
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
  window.modules['build-roadmap'] = { init: init, destroy: destroy };
})();
