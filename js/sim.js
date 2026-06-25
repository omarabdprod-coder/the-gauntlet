/* ============================================================
   THE GAUNTLET — sim.js  (v3)
   One match. Your attack meets their defence (and vice-versa),
   then your decisions nudge it: the SHAPE you pick vs their style,
   the MENTALITY you set, and the underdog's counter-punch. Quality
   dominates; tactics are a real but bounded margin. The result
   reports exactly which of your choices moved the needle.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  function poisson(l, rng) { var L = Math.exp(-l), k = 0, p = rng(); while (p > L && k < 9) { k++; p *= rng(); } return k; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  var ATKW = { ST: 1, CF: 1, LW: .82, RW: .82, CAM: .68, LM: .5, RM: .5, CM: .34, CDM: .14, LWB: .2, RWB: .2, LB: .12, RB: .12, CB: .08, GK: 0 };
  function pickScorer(xi, rng) {
    var pool = [], t = 0; xi.forEach(function (p) { if (!p || p.pos === 'GK') return; var w = (ATKW[p.pos] || .3) * (0.5 + GA.effRating(p) / 80); pool.push({ p: p, w: w }); t += w; });
    if (!t) return null; var r = rng() * t; for (var i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) return pool[i].p; } return pool[pool.length - 1].p;
  }
  function spread(n, rng) { var m = []; for (var i = 0; i < n; i++) m.push(2 + Math.floor(rng() * 91)); m.sort(function (a, b) { return a - b; }); for (var j = 1; j < m.length; j++) if (m[j] <= m[j - 1]) m[j] = Math.min(93, m[j - 1] + 1); return m; }

  // a player's penalty nerve: real finishing (SHO sub-stat) if we have it, else
  // derived from overall — so picking your clinical strikers genuinely matters.
  function penSkill(p) { var sho = p && p.s && p.s[1]; return sho != null ? sho : Math.max(40, GA.ratingOf(p) - 6); }

  // a mid-match BIG MOMENT: a self-contained gamble whose two outcomes are
  // PRE-ROLLED (fair + deterministic), weighted by your quality vs theirs.
  function buildMoment(r, min, myAtk, myDefC, oppAtk, oppDef, xi, rung) {
    var attacking = r() < 0.58;
    if (attacking) {
      var pBase = clamp(0.30 + (myAtk - oppDef) * 0.011, 0.12, 0.6);
      var who = (pickScorer(xi, r) || {}).n || 'your striker';
      var aGoal = r() < (pBase + 0.13), bGoal = r() < Math.max(0.08, pBase - 0.05);
      return { min: min, side: 'atk', icon: '⚡', scorer: who,
        head: 'BIG CHANCE', prompt: 'Free-kick in a dangerous spot — ' + who + ' stands over it.',
        options: [
          { label: 'Go for goal', desc: 'High risk, high reward', out: aGoal ? { team: 'us', txt: who + ' bends it into the top corner!' } : { team: null, txt: who + '’s effort is turned away.' } },
          { label: 'Work it short', desc: 'Safer — keep the ball', out: bGoal ? { team: 'us', txt: 'The training-ground routine pays off — tucked in!' } : { team: null, txt: 'The move fizzles out. No harm done.' } }
        ] };
    }
    var pCon = clamp(0.30 + (oppAtk - myDefC) * 0.011, 0.12, 0.6), dm = rung.danger || 'their forward';
    var aCon = r() < (pCon + 0.1), bCon = r() < Math.max(0.06, pCon - 0.06), card = r() < 0.55;
    return { min: min, side: 'def', icon: '🛡️',
      head: 'DANGER', prompt: dm + ' is through on goal, one-on-one.',
      options: [
        { label: 'Stand him up', desc: 'Trust your keeper', out: aCon ? { team: 'them', txt: dm + ' slots it past the keeper.' } : { team: null, txt: 'Your keeper stands tall — huge stop!' } },
        { label: 'Take the foul', desc: 'Cynical — risk a card', out: bCon ? { team: 'them', txt: 'Mistimed — ' + dm + ' goes round him and scores!' } : { team: null, txt: 'Chopped down. ' + (card ? 'Booking, but the danger’s gone.' : 'No card — a smart professional foul.'), card: card } }
      ] };
  }

  GA.SIM_COH = 1.0; // team cohesion: each rung cleared gels the side (+atk/+def), capped — lets a
  GA.COH_CAP = 16;  // hot run snowball into the all-time tier without trivialising the final bosses

  /* opts: { xi, formation, rung, perks, cleared, mentality, seed } */
  GA.simMatch = function (opts) {
    var rng = GA.rngFrom('match-' + opts.seed);
    var perks = opts.perks || [], has = function (id) { return perks.indexOf(id) !== -1; };
    var rung = opts.rung, isBoss = !!rung.boss, style = GA.STYLES[rung.style] || GA.STYLES.balanced;
    var ment = GA.mentalityById(opts.mentality);
    var matchup = opts.formation ? GA.matchupAdvice(opts.formation, rung.style) : { atk: 0, def: 0, tip: '' };

    var ts = GA.teamStrength(opts.xi, true);
    var coh = Math.min(GA.COH_CAP, (opts.cleared || 0) * GA.SIM_COH);
    var depth = GA.depthBonus(opts.squadSize || 16); // a deep squad lifts the whole side
    var twelfth = (opts.perks || []).indexOf('twelfth') !== -1 ? 2 : 0; // Twelfth Man: flat lift both ends
    var myAtk = ts.atk + coh + depth + twelfth, myDef = ts.def + coh + depth + twelfth, myGk = ts.gk;
    var myDefC = myDef * 0.74 + myGk * 0.26;
    var oppAtk = rung.threat + (style.atk || 0), oppDef = rung.threat + (style.def || 0);

    var BASE = (GA.TUNE && GA.TUNE.base) || 1.25, SLOPE = (GA.TUNE && GA.TUNE.slope) || 0.105;
    var xgF = BASE + SLOPE * (myAtk - oppDef), xgA = BASE + SLOPE * (oppAtk - myDefC);

    var factors = [];
    // mentality
    xgF *= ment.gf; xgA *= ment.ga;
    if (ment.vsStrong && oppAtk > myAtk) { xgF *= ment.vsStrong; factors.push({ t: 'Counter-attack vs stronger opponent', good: true }); }
    // formation vs their style
    xgF *= (1 + matchup.atk); xgA *= (1 - matchup.def);
    if (matchup.tip) factors.push({ t: matchup.tip, good: (matchup.atk + matchup.def) >= 0 });
    // ---- permanent PERKS ----
    if (has('giant') && oppDef > myAtk) { xgF *= 1.18; factors.push({ t: 'Giant Killers — biting against the favourites', good: true }); }
    if (has('cavalry')) { xgF *= 1.12; factors.push({ t: 'Goal Machine — relentless going forward', good: true }); }
    if (has('wall')) { xgA *= 0.85; factors.push({ t: 'Brick Wall — a miserly back line', good: true }); }
    if (has('setpiece')) { xgF += 0.25; factors.push({ t: 'Set-Piece Kings — a constant dead-ball threat', good: true }); }
    if (twelfth) factors.push({ t: 'Twelfth Man — the support roars you on', good: true });
    // opponent style flavour
    if (style.strangle) xgF *= 0.92;
    if (style.setpiece) xgA += 0.18;

    xgF = clamp(xgF, 0.12, 4.6); xgA = clamp(xgA, 0.10, 4.6);

    // --- goals split into two halves on INDEPENDENT rng streams, so a
    //     half-time team-talk can re-roll ONLY the second half (opts.ht) ---
    var rngH1 = GA.rngFrom('match-' + opts.seed + '-h1'), rngH2 = GA.rngFrom('match-' + opts.seed + '-h2');
    var ht = opts.ht || { gf: 1, ga: 1 };
    var gf1 = Math.min(6, poisson(xgF / 2, rngH1)), ga1 = Math.min(6, poisson(xgA / 2, rngH1));
    var gf2 = Math.min(6, poisson(xgF / 2 * ht.gf, rngH2)), ga2 = Math.min(6, poisson(xgA / 2 * ht.ga, rngH2));
    var gf = Math.min(9, gf1 + gf2), ga = Math.min(9, ga1 + ga2);

    var events = [];
    function addGoals(n, team, lo, hi, r, half) {
      var mins = []; for (var i = 0; i < n; i++) mins.push(lo + Math.floor(r() * (hi - lo + 1)));
      mins.sort(function (a, b) { return a - b; });
      for (var j = 1; j < mins.length; j++) if (mins[j] <= mins[j - 1]) mins[j] = Math.min(hi, mins[j - 1] + 1);
      mins.forEach(function (m) {
        var who;
        if (team === 'us') { var s = pickScorer(opts.xi, r); who = s ? s.n : (opts.clubName || 'Dog & Duck'); }
        else { who = r() < 0.55 ? rung.danger : (GA.pick(rung.xi.filter(function (p) { return p.pos !== 'GK'; }), r) || {}).n || rung.danger; }
        events.push({ min: m, team: team, scorer: who, kind: 'goal', half: half });
      });
    }
    addGoals(gf1, 'us', 2, 44, rngH1, 1); addGoals(ga1, 'them', 2, 44, rngH1, 1);
    addGoals(gf2, 'us', 47, 90, rngH2, 2); addGoals(ga2, 'them', 47, 90, rngH2, 2);
    // flavour near-misses (cosmetic; main rng so the HT choice never alters them)
    var flav = 1 + Math.floor(rng() * 3);
    for (var fi = 0; fi < flav; fi++) {
      var fm = 3 + Math.floor(rng() * 88), mine = rng() < xgF / (xgF + xgA);
      var kinds = mine ? [['chance', 'spurns a glorious chance'], ['woodwork', 'rattles the woodwork'], ['save', 'forces a flying save']] : [['save', 'is denied by your keeper'], ['woodwork', 'strikes the post'], ['chance', 'blazes over']];
      var k = GA.pick(kinds, rng), who2 = mine ? (pickScorer(opts.xi, rng) || {}).n : rung.danger;
      events.push({ min: fm, team: mine ? 'us' : 'them', scorer: who2 || 'Someone', kind: k[0], txt: k[1], half: fm <= 45 ? 1 : 2 });
    }
    events.sort(function (a, b) { return a.min - b.min; });

    // penalty params — the shootout is RUN LATER (after the player picks takers,
    // or auto for the skip path); here we only expose what it needs.
    var needTwo = !!rung.fortress;
    var edge = clamp((myAtk + myDefC - oppAtk - oppDef) * 0.012, -0.22, 0.22);
    if (isBoss) edge -= 0.05; if (has('giant') && oppDef > myAtk) edge += 0.05;
    var penParams = {
      base: clamp(0.76 + edge + (has('setpiece') ? 0.07 : 0), 0.46, 0.96), // Set-Piece Kings: cooler from the spot
      themConv: clamp(0.76 - edge * 0.6, 0.46, 0.9),
      themTakers: rung.xi.filter(function (p) { return p.pos !== 'GK'; }).map(function (p) { return p.n; }),
      autoTakers: opts.xi.filter(function (p) { return p && p.pos !== 'GK'; }).sort(function (a, b) { return (ATKW[b.pos] || .3) - (ATKW[a.pos] || .3); }).map(function (p) { return { n: p.n, skill: penSkill(p) }; }),
      clubName: opts.clubName || 'Dog & Duck'
    };
    // a mid-match BIG MOMENT (2nd half only → never clashes with the HT re-roll)
    var moments = [], rngMo = GA.rngFrom('match-' + opts.seed + '-mom');
    if (rngMo() < 0.72) moments.push(buildMoment(rngMo, 54 + Math.floor(rngMo() * 28), myAtk, myDefC, oppAtk, oppDef, opts.xi, rung));

    var share0 = xgF / (xgF + xgA), momentum = [];
    for (var t = 0; t <= 90; t++) { var wob = (GA.rngFrom('mo-' + opts.seed + '-' + Math.floor(t / 6))() - 0.5) * 0.34; momentum.push(clamp(share0 + wob, 0.04, 0.96)); }
    var poss = Math.round(clamp(share0, 0.2, 0.8) * 100); if (style.strangle) poss = Math.min(poss, 40);
    var myScorers = events.filter(function (e) { return e.team === 'us' && e.kind === 'goal'; }).map(function (e) { return e.scorer; });

    var sim = {
      gf: gf, ga: ga, baseGf: gf, baseGa: ga, margin: gf - ga, needTwo: needTwo, penParams: penParams, moments: moments, seed: opts.seed,
      won: null, pens: false, penScore: null, penKicks: null, downgraded: false,
      xgF: Math.round(xgF * 100) / 100, xgA: Math.round(xgA * 100) / 100,
      myAtk: Math.round(myAtk), myDef: Math.round(myDef), oppAtk: Math.round(oppAtk), oppDef: Math.round(oppDef), isBoss: isBoss,
      possession: poss, shotsF: Math.max(gf, Math.round(xgF * 3.2)), shotsA: Math.max(ga, Math.round(xgA * 3.2)),
      events: events, momentum: momentum, myScorers: myScorers, manOfMatch: myScorers[0] || null,
      mentality: ment.id, factors: factors
    };
    // provisional result for the BASE score (auto takers) so skip / headless resolve
    GA.finalizeResult(sim, gf, ga);
    if (sim.pens) { var pr = GA.runShootout(penParams, penParams.autoTakers, opts.seed); sim.penKicks = pr.penKicks; sim.won = pr.won; sim.penScore = pr.penScore; }
    return sim;
  };

  /* ---- decide a finished match from its LIVE score (after HT + any moment).
     Sets gf/ga/won/pens on the sim; a draw routes to a shootout (run by the
     caller with the player's chosen takers, or auto). ---- */
  GA.finalizeResult = function (sim, us, them) {
    var margin = us - them; sim.gf = us; sim.ga = them; sim.margin = margin;
    sim.manOfMatch = sim.myScorers && sim.myScorers[0] || sim.manOfMatch || null;
    if (margin > 0 && (!sim.needTwo || margin >= 2)) { sim.won = true; sim.pens = false; sim.penKicks = null; sim.penScore = null; return 'win'; }
    if (margin < 0) { sim.won = false; sim.pens = false; sim.penKicks = null; sim.penScore = null; return 'loss'; }
    sim.downgraded = (margin === 1 && sim.needTwo); // a fortress side: a 1-goal win still only earns a shootout
    sim.pens = true; sim.won = null; sim.penScore = null; sim.penKicks = null;
    return 'pens';
  };

  /* ---- run a shootout: best-of-five with EARLY TERMINATION + sudden death
     until decisive (never a tie). Each of YOUR kicks converts on the taker's
     own nerve, so picking your finishers matters. ---- */
  GA.runShootout = function (P, youTakers, seed) {
    var rng = GA.rngFrom('pens-' + seed);
    youTakers = (youTakers && youTakers.length) ? youTakers : (P.autoTakers && P.autoTakers.length ? P.autoTakers : [{ n: P.clubName || 'Dog & Duck', skill: 50 }]);
    var themT = (P.themTakers && P.themTakers.length) ? P.themTakers : ['the opposition'];
    function convFor(t) { return clamp(P.base + ((t.skill != null ? t.skill : 60) - 74) * 0.0055, 0.40, 0.96); }
    var us = 0, them = 0, ku = 0, kt = 0, penKicks = [];
    function takePen(team) {
      if (team === 'us') { var tk = youTakers[ku % youTakers.length]; var sc = rng() < convFor(tk); ku++; penKicks.push({ team: 'us', scored: sc, sd: ku > 5, taker: tk.n }); if (sc) us++; }
      else { var nm = themT[kt % themT.length]; var st = rng() < P.themConv; kt++; penKicks.push({ team: 'them', scored: st, sd: kt > 5, taker: nm }); if (st) them++; }
    }
    function regDecided() { var ur = Math.max(0, 5 - ku), tr = Math.max(0, 5 - kt); return us > them + tr || them > us + ur; }
    while ((ku < 5 || kt < 5) && !regDecided()) { if (ku <= kt && ku < 5) takePen('us'); else if (kt < 5) takePen('them'); else takePen('us'); }
    var guard = 0; while (us === them && guard++ < 40) { takePen('us'); takePen('them'); }
    if (us === them) us++; // mathematically unreachable safety
    return { penKicks: penKicks, won: us > them, penScore: us + '–' + them, us: us, them: them };
  };

})(window.GA);
