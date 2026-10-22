/* UI only: renders the catalog and the engine's result. No verdict logic lives here. */
(function () {
  const { rules, requirements, engine } = window.Preflight;

  const problems = engine.validate(requirements, rules);
  const listEl = document.getElementById('req-list');
  const resultsEl = document.getElementById('results');

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === 'class') node.className = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(child));
    }
    return node;
  }

  if (problems.length) {
    resultsEl.replaceChildren(
      h('div', { class: 'overall level-blocker' },
        h('strong', {}, 'Catalog is invalid'),
        h('ul', {}, problems.map((p) => h('li', {}, p))))
    );
    return;
  }

  // Picker
  for (const r of requirements) {
    const inputId = `req-${r.id}`;
    listEl.append(
      h('li', {},
        h('label', { for: inputId },
          h('input', { type: 'checkbox', id: inputId, value: r.id }),
          h('span', {}, r.title)))
    );
  }

  function field(label, content, extraClass) {
    return h('div', { class: `field ${extraClass || ''}` },
      h('div', { class: 'field-label' }, label),
      h('div', { class: 'field-body' }, content));
  }

  function sourceLine(s) {
    return h('li', {},
      h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.label),
      ` (page last updated: ${s.pageUpdated || 'not shown on page'})`);
  }

  function card(r) {
    const status = rules.statuses[r.status];
    const head = h('div', { class: 'card-head' },
      h('span', { class: `badge status-${r.status}` }, status.label),
      h('h3', {}, r.title));

    if (r.status === 'not_evaluated') {
      return h('article', { class: `card status-${r.status}` }, head, field('Scope', r.scopeNote));
    }

    return h('article', { class: `card status-${r.status}` },
      head,
      field('Documented fact', r.fact),
      field('Likely implementation implication (our interpretation, not documented)', r.implication, 'inference'),
      r.status === 'insufficient' && field('What we checked', r.checked),
      r.status === 'insufficient' && field('How to settle this cheaply', r.settle),
      field('Sources', h('ul', {}, r.sources.map(sourceLine))),
      h('div', { class: 'checked' }, `Documentation checked as of ${r.checkedOn}`));
  }

  function render() {
    const ids = [...listEl.querySelectorAll('input:checked')].map((i) => i.value);
    const out = engine.evaluate(ids, requirements, rules);

    const nodes = [
      h('div', { class: `overall level-${out.overall.level}` },
        h('div', { class: 'overall-headline' }, out.overall.headline),
        h('p', {}, out.overall.detail),
        out.asOf && h('p', { class: 'asof' },
          `Documentation checked as of ${out.asOf} (snapshot, not a live chain test). ${out.reverify}`)),
    ];

    if (out.selectedCount > 0) {
      nodes.push(
        h('div', { class: 'counts', role: 'list' },
          rules.statusOrder.map((s) =>
            h('span', { class: `chip status-${s}`, role: 'listitem' },
              `${rules.statuses[s].label}: ${out.counts[s]}`))),
        h('p', { class: 'coverage' },
          `Coverage: evaluated ${out.evaluatedCount} of ${out.selectedCount} selected requirement(s).`)
      );
      if (out.notEvaluatedNotice) nodes.push(h('p', { class: 'notice' }, out.notEvaluatedNotice));

      if (out.settleList.length) {
        nodes.push(
          h('section', { class: 'settle' },
            h('h3', {}, 'Test these in a spike'),
            h('ul', {}, out.settleList.map((s) =>
              h('li', {}, h('strong', {}, `${s.short}: `), s.settle))))
        );
      }
      nodes.push(h('div', { class: 'cards' }, out.items.map(card)));
    }

    resultsEl.replaceChildren(...nodes);
  }

  listEl.addEventListener('change', render);
  render();
})();
