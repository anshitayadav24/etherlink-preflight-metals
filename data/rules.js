/*
 * RULES: what each status means and how the overall result is chosen.
 * Edit this file to change the evaluation model. The UI and engine only read it.
 *
 * Statuses are assigned by hand in requirements.js, using these definitions.
 * Missing documentation is NEVER "unsupported": it is "insufficient" (we looked)
 * or "not_evaluated" (we did not look).
 */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else (root.Preflight = root.Preflight || {}).rules = value;
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    // Display order: most decision-relevant first.
    statusOrder: ['unsupported', 'insufficient', 'caveat', 'supported', 'not_evaluated'],

    statuses: {
      supported: {
        label: 'Documented as supported',
        rule: 'A primary source states support, and no documented limitation applies to the requirement as phrased.',
      },
      caveat: {
        label: 'Caveat',
        rule: 'A primary source documents support together with a limitation, a difference, or partial coverage.',
      },
      unsupported: {
        label: 'Unsupported',
        rule: 'A primary source explicitly says it is not supported, is ignored, or always returns nothing.',
      },
      insufficient: {
        label: 'Insufficient evidence',
        rule: 'We looked at primary sources and they are silent, they materially conflict, or the authoritative page could not be read.',
      },
      not_evaluated: {
        label: 'Not evaluated',
        rule: 'Outside V1 scope. We did not look, so no verdict is given or implied. Never treated as unsupported.',
      },
    },

    // Overall result: the first rule whose status appears among the EVALUATED
    // selected requirements wins. Not-evaluated items never take part.
    // Placeholders: {n} = number of matching items, {titles} = their short names.
    overall: [
      {
        status: 'unsupported',
        level: 'blocker',
        headline: 'Blocker found',
        detail: 'Documented as not supported, ignored, or empty on Etherlink EVM: {titles}.',
      },
      {
        status: 'insufficient',
        level: 'unknown',
        headline: "Can't decide from the docs",
        detail: 'The docs are silent or conflict on: {titles}. Test these in a spike before committing.',
      },
      {
        status: 'caveat',
        level: 'caveat',
        headline: 'No blockers documented, caveats to review',
        detail: '{n} documented caveat(s): {titles}. This reflects documentation only, not a guarantee.',
      },
    ],

    // Shown under every result that has evaluated requirements. {date} = oldest checked date among them.
    reverify: 'Re-verify critical requirements against the current docs and a test deploy before production use.',

    allClear: {
      level: 'clear',
      headline: 'No blockers documented as of {date}',
      detail: 'Among the {n} evaluated requirement(s) you selected. This reflects documentation only, not a guarantee.',
    },
    noSelection: {
      level: 'none',
      headline: 'Select the requirements that matter to your app',
      detail: 'Only the requirements you tick are evaluated.',
    },
    noEvaluated: {
      level: 'none',
      headline: 'No result',
      detail: 'None of the selected requirements are evaluated in V1. This is not a finding of support or non-support.',
    },
  };
});
