/*
 * ENGINE: pure, deterministic functions. No DOM, no network, no randomness.
 * Same selection + same data always gives the same result.
 */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else (root.Preflight = root.Preflight || {}).engine = value;
})(typeof self !== 'undefined' ? self : this, function () {
  const DATE = /^\d{4}-\d{2}-\d{2}$/;

  // Returns a list of problems with the catalog. Empty list means it is valid.
  function validate(requirements, rules) {
    const errors = [];
    const seen = new Set();
    for (const r of requirements) {
      const where = `requirement "${r.id}"`;
      if (!r.id || seen.has(r.id)) errors.push(`${where}: missing or duplicate id`);
      seen.add(r.id);
      if (!r.title || !r.short) errors.push(`${where}: needs title and short`);
      if (!rules.statuses[r.status]) {
        errors.push(`${where}: unknown status "${r.status}"`);
        continue;
      }
      if (r.status === 'not_evaluated') {
        if (!r.scopeNote) errors.push(`${where}: not_evaluated needs scopeNote`);
        if (r.fact || (r.sources && r.sources.length)) {
          errors.push(`${where}: not_evaluated must not carry a fact or sources`);
        }
        continue;
      }
      if (!r.fact) errors.push(`${where}: needs a documented fact`);
      if (!r.implication) errors.push(`${where}: needs an implication`);
      if (!Array.isArray(r.sources) || r.sources.length === 0) errors.push(`${where}: needs at least one source`);
      for (const s of r.sources || []) {
        if (!/^https:\/\//.test(s.url || '')) errors.push(`${where}: source needs an https url`);
        if (!s.label) errors.push(`${where}: source needs a label`);
      }
      if (!DATE.test(r.checkedOn || '')) errors.push(`${where}: checkedOn must be YYYY-MM-DD`);
      if (r.status === 'insufficient' && (!r.settle || !r.checked)) {
        errors.push(`${where}: insufficient needs both "checked" and "settle"`);
      }
    }
    return errors;
  }

  function fill(template, n, titles, date) {
    return template
      .replace('{n}', String(n))
      .replace('{titles}', titles.join('; '))
      .replace('{date}', date || '');
  }

  // selectedIds: ids ticked by the developer. Throws on an unknown id.
  function evaluate(selectedIds, requirements, rules) {
    const byId = new Map(requirements.map((r, index) => [r.id, { ...r, order: index }]));
    const rank = (r) => rules.statusOrder.indexOf(r.status);

    const items = [];
    for (const id of new Set(selectedIds)) {
      const r = byId.get(id);
      if (!r) throw new Error(`Unknown requirement id: ${id}`);
      items.push(r);
    }
    items.sort((a, b) => rank(a) - rank(b) || a.order - b.order);

    const counts = Object.fromEntries(rules.statusOrder.map((s) => [s, 0]));
    for (const r of items) counts[r.status] += 1;

    const evaluated = items.filter((r) => r.status !== 'not_evaluated');
    const notEvaluated = items.filter((r) => r.status === 'not_evaluated');

    // Oldest checked date among the evaluated selection: the result is only as fresh as this.
    const asOf = evaluated.map((r) => r.checkedOn).sort()[0] || null;

    let overall;
    if (items.length === 0) {
      overall = { ...rules.noSelection, ids: [] };
    } else if (evaluated.length === 0) {
      overall = { ...rules.noEvaluated, ids: [] };
    } else {
      const hit = rules.overall.find((rule) => counts[rule.status] > 0);
      if (hit) {
        const matching = evaluated.filter((r) => r.status === hit.status);
        overall = {
          level: hit.level,
          headline: hit.headline,
          detail: fill(hit.detail, matching.length, matching.map((r) => r.short), asOf),
          ids: matching.map((r) => r.id),
        };
      } else {
        overall = {
          level: rules.allClear.level,
          headline: fill(rules.allClear.headline, evaluated.length, [], asOf),
          detail: fill(rules.allClear.detail, evaluated.length, [], asOf),
          ids: [],
        };
      }
    }

    return {
      items,
      counts,
      selectedCount: items.length,
      evaluatedCount: evaluated.length,
      notEvaluatedCount: notEvaluated.length,
      overall,
      asOf,
      reverify: asOf ? rules.reverify : null,
      settleList: evaluated
        .filter((r) => r.status === 'insufficient')
        .map((r) => ({ id: r.id, short: r.short, settle: r.settle })),
      notEvaluatedNotice:
        notEvaluated.length > 0
          ? `${notEvaluated.length} selected requirement(s) not evaluated and excluded from the result: ${notEvaluated
              .map((r) => r.short)
              .join('; ')}. Not evaluated does not mean unsupported.`
          : null,
    };
  }

  return { validate, evaluate };
});
