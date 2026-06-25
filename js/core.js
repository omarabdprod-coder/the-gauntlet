/* ============================================================
   THE GAUNTLET — core.js
   Shared football primitives, ported from the Relegation Heist:
   deterministic PRNG, position eligibility, rating power, and a
   real maximum-matching formation fitter. The roguelike layers
   (run state, single-match sim, loot) build on top of this.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';

  /* ---- deterministic PRNG (xfnv1a seed + mulberry32) ---- */
  function xfnv1a(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  GA.rngFrom = function (seedStr) { return mulberry32(xfnv1a(String(seedStr))); };
  // a non-deterministic source for the slot-machine spins
  GA.rng = function () { return Math.random(); };
  GA.pick = function (arr, rng) { return arr[Math.floor((rng || Math.random)() * arr.length)]; };
  GA.shuffle = function (arr, rng) {
    var r = rng || Math.random, a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  /* ---- position -> line bucket ---- */
  GA.LINE = {
    GK: 'GK',
    CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF',
    CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
    LW: 'ATT', RW: 'ATT', ST: 'ATT', CF: 'ATT'
  };

  /* ---- rating: players carry `ovr` (the v3 real-database field), with a
     fallback to legacy `rt`. ---- */
  GA.ratingOf = function (p) {
    var r = p.ovr != null ? p.ovr : (p.rt != null ? p.rt : 55);
    return Math.round(Math.max(35, Math.min(99, r)));
  };

  /* ---- FITNESS BATTERY: every player carries 0-3 charge blocks. Playing a
     match burns one (two against bruisers); a match on the bench recharges to
     full. A flat, readable, tactical fuel gauge — no percentages, no spreadsheet.
     Three blocks = fresh; zero = legs gone and a heavy rating hit. ---- */
  GA.BATTERY_MAX = 3;
  GA.BATTERY_MULT = [0.84, 0.96, 0.99, 1.00]; // index by blocks 0..3 — full for 2 games, then exhaustion bites
  GA.blocksOf = function (p) { var b = p.blocks != null ? p.blocks : GA.BATTERY_MAX; return Math.max(0, Math.min(GA.BATTERY_MAX, b)); };
  GA.effRating = function (p) { return GA.ratingOf(p) * GA.BATTERY_MULT[GA.blocksOf(p)]; };

  /* ---- RATING POWER: attacking / defensive / keeper quality an XI
     carries, weighted by the slot each man occupies. Mirrors the heist
     so a strong CB moves dDef and a star ST moves dAtk. Uses effective
     (fatigue-adjusted) rating. ---- */
  var POSW = {
    ST: [.9, .1], CF: [.9, .1], LW: [.85, .15], RW: [.85, .15], CAM: [.7, .3],
    LM: [.6, .4], RM: [.6, .4], CM: [.5, .5], CDM: [.2, .8],
    LWB: [.35, .65], RWB: [.35, .65], LB: [.2, .8], RB: [.2, .8], CB: [.08, .92]
  };
  GA.ratingPower = function (xi, useEff) {
    var atk = 0, def = 0, gk = 0, sum = 0, n = 0;
    xi.forEach(function (p) {
      if (!p) return;
      var r = useEff ? GA.effRating(p) : GA.ratingOf(p);
      sum += r; n++;
      if (p.pos === 'GK') { gk = r - 55; return; }
      var w = POSW[p.pos] || [.5, .5];
      atk += (r - 55) * w[0]; def += (r - 55) * w[1];
    });
    return { atk: atk, def: def, gk: gk, avg: n ? sum / n : 0 };
  };

  /* ---- ATTACK / DEFENCE indices on the 0-99 scale: a weighted average of
     the XI's ratings by attacking / defensive contribution. A drafted striker
     lifts `atk`, a drafted CB lifts `def`, so squad shape genuinely matters and
     a single legend in the right slot carries the side. ---- */
  GA.teamStrength = function (xi, useEff) {
    var watk = 0, wdef = 0, satk = 0, sdef = 0, gk = 55;
    xi.forEach(function (p) {
      if (!p) return;
      var r = useEff ? GA.effRating(p) : GA.ratingOf(p);
      if (p.pos === 'GK') { gk = r; return; }
      var w = POSW[p.pos] || [.5, .5];
      watk += w[0]; satk += w[0] * r; wdef += w[1]; sdef += w[1] * r;
    });
    return { atk: watk ? satk / watk : 55, def: wdef ? sdef / wdef : 55, gk: gk };
  };

  /* ---- team overall: average of the best XI by rating ---- */
  GA.teamOVR = function (squadOrXI) {
    if (!squadOrXI || !squadOrXI.length) return 0;
    var xi = squadOrXI.slice().sort(function (a, b) { return GA.ratingOf(b) - GA.ratingOf(a); }).slice(0, 11);
    var s = 0; xi.forEach(function (p) { s += GA.ratingOf(p); });
    return Math.round(s / xi.length);
  };

  /* ---- curated multi-position players (recognisable real names that
     genuinely played several roles). Anyone not listed falls back to the
     generic eligibility map below. ---- */
  GA.NATURAL = {
    'Thierry Henry': ['ST', 'LW', 'CF'],
    'Dennis Bergkamp': ['CF', 'CAM', 'ST'],
    'Cristiano Ronaldo': ['LW', 'ST', 'RW', 'CF'],
    'Gareth Bale': ['RW', 'LW', 'ST', 'LWB'],
    'Ángel Di María': ['RW', 'LW', 'RM', 'LM', 'CAM'],
    'Karim Benzema': ['ST', 'CF'],
    'Lionel Messi': ['RW', 'CF', 'ST', 'CAM'],
    'Andrés Iniesta': ['CM', 'CAM', 'LM'],
    'Xavi': ['CM', 'CDM', 'CAM'],
    'Dani Alves': ['RB', 'RWB', 'RM'],
    'Javier Zanetti': ['RB', 'RWB', 'CM', 'CDM'],
    'Wesley Sneijder': ['CAM', 'CM'],
    'Samuel Eto\'o': ['ST', 'RW', 'CF'],
    'Sergio Ramos': ['CB', 'RB'],
    'David Alaba': ['LB', 'CB', 'CM'],
    'Philipp Lahm': ['RB', 'LB', 'CDM'],
    'Bastian Schweinsteiger': ['CM', 'CDM'],
    'Steven Gerrard': ['CM', 'CAM', 'CDM'],
    'Frank Lampard': ['CM', 'CAM'],
    'Patrick Vieira': ['CM', 'CDM'],
    'Ashley Cole': ['LB', 'LWB', 'LM'],
    'Robert Pirès': ['LW', 'LM', 'CAM'],
    'Freddie Ljungberg': ['RM', 'RW', 'CM'],
    'Riyad Mahrez': ['RW', 'RM', 'CAM'],
    'Marc Albrighton': ['RM', 'LM', 'RW', 'LW'],
    'James Milner': ['CM', 'RM', 'LM', 'RB', 'LB'],
    'Matthew Etherington': ['LM', 'LW'],
    'Jermaine Pennant': ['RM', 'RW'],
    'Jonathan Walters': ['ST', 'RW', 'RM'],
    'Pascal Groß': ['CM', 'CAM', 'RM'],
    'Trent Alexander-Arnold': ['RB', 'RWB', 'CM']
  };

  /* ---- generic eligibility: a couple of football-sane roles per
     position, all at full rating (binary, like the heist's v8). ---- */
  GA.ELIG = {
    GK: ['GK'],
    CB: ['CB', 'CDM'],
    LB: ['LB', 'LWB'], RB: ['RB', 'RWB'],
    LWB: ['LWB', 'LB', 'LM'], RWB: ['RWB', 'RB', 'RM'],
    CDM: ['CDM', 'CM', 'CB'], CM: ['CM', 'CDM', 'CAM'], CAM: ['CAM', 'CM'],
    LM: ['LM', 'LW', 'LWB'], RM: ['RM', 'RW', 'RWB'],
    LW: ['LW', 'LM'], RW: ['RW', 'RM'],
    ST: ['ST', 'CF'], CF: ['CF', 'ST']
  };
  GA.eligiblePos = function (p) {
    return p.elig || GA.NATURAL[p.n] || GA.ELIG[p.pos] || [p.pos];
  };
  GA.canPlay = function (p, pos) {
    if (p.pos === pos) return true;
    return GA.eligiblePos(p).indexOf(pos) !== -1;
  };

  /* ---- legal formation read ---- */
  GA.formationOf = function (xi) {
    var lines = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
    xi.forEach(function (p) { if (p) lines[GA.LINE[p.pos]]++; });
    return { gk: lines.GK, def: lines.DEF, mid: lines.MID, att: lines.ATT,
             label: lines.DEF + '-' + lines.MID + '-' + lines.ATT,
             legal: lines.GK === 1 && lines.DEF >= 3 && lines.MID >= 2 && lines.ATT >= 1 };
  };

  /* ---- fit a squad into a chosen formation by maximum bipartite
     matching (augmenting paths). Exact-position pairs are seeded first so
     players keep their true roles; quality-first input biases good seats. ---- */
  GA.autoAssign = function (players, formation) {
    var slots = formation.slots.map(function (s) { return { pos: s.pos, x: s.x, y: s.y, player: null }; });
    var n = players.length, m = slots.length;
    var adj = players.map(function (p) { return slots.map(function (s) { return GA.canPlay(p, s.pos); }); });
    var slotOf = [], playerOf = [];
    for (var i = 0; i < n; i++) slotOf.push(-1);
    for (var j = 0; j < m; j++) playerOf.push(-1);
    players.forEach(function (p, pi) {
      for (var sj = 0; sj < m; sj++) {
        if (playerOf[sj] === -1 && slots[sj].pos === p.pos) { slotOf[pi] = sj; playerOf[sj] = pi; return; }
      }
    });
    function augment(pi, seen) {
      for (var sj = 0; sj < m; sj++) {
        if (!adj[pi][sj] || seen[sj]) continue;
        seen[sj] = true;
        if (playerOf[sj] === -1 || augment(playerOf[sj], seen)) {
          slotOf[pi] = sj; playerOf[sj] = pi; return true;
        }
      }
      return false;
    }
    for (var k = 0; k < n; k++) {
      if (slotOf[k] === -1) augment(k, slots.map(function () { return false; }));
    }
    var bench = [];
    players.forEach(function (p, pi) {
      if (slotOf[pi] >= 0) slots[slotOf[pi]].player = p; else bench.push(p);
    });
    var holes = 0; slots.forEach(function (s) { if (!s.player) holes++; });
    return { slots: slots, bench: bench, holes: holes };
  };

  /* ---- best shape for a squad: most quality fielded, fewest holes.
     useEff seats by fatigue-adjusted rating, so a deep squad fields fresh
     legs instead of exhausted stars. ---- */
  GA.bestFormation = function (players, preferName, useEff) {
    var key = useEff ? GA.effRating : GA.ratingOf;
    var byRt = players.slice().sort(function (a, b) { return key(b) - key(a); });
    var best = null, bestScore = -Infinity;
    GA.FORMATIONS.forEach(function (f) {
      var a = GA.autoAssign(byRt, f), score = 0;
      a.slots.forEach(function (s) { if (s.player) score += 1000 + key(s.player); });
      a.slots.forEach(function (s) { if (!s.player) score -= 5000; });
      if (f.name === preferName) score += 1;
      if (score > bestScore) { bestScore = score; best = { f: f, a: a }; }
    });
    return best || { f: GA.FORMATIONS[0], a: GA.autoAssign(byRt, GA.FORMATIONS[0]) };
  };

  /* ---- the formation an opponent actually lines up in: their declared
     shape if it seats all eleven, otherwise the best fit (display only) ---- */
  GA.oppFormation = function (rung) {
    var decl = null;
    for (var i = 0; i < GA.FORMATIONS.length; i++) if (GA.FORMATIONS[i].name === rung.formation) decl = GA.FORMATIONS[i];
    if (decl && GA.autoAssign(rung.xi, decl).holes === 0) return decl;
    return GA.bestFormation(rung.xi).f;
  };

  /* ---- formations: 11 positioned slots (x,y as % of pitch). `info` carries
     the real-football traits the matchup adviser reads. ---- */
  function F(name, slots, info) { return { name: name, slots: slots.map(function (s) { return { pos: s[0], x: s[1], y: s[2] }; }), info: info }; }
  // info: cm = central-mid bodies, wide = real width, attackers = front line,
  //       block = defensive solidity (0 open … 2 packed), line = how high you sit
  GA.FORMATIONS = [
    F('4-4-2', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['LM',16,43],['CM',40,45],['CM',60,45],['RM',84,43],['ST',40,16],['ST',60,16]], { cm: 2, wide: 2, attackers: 2, block: 1, line: 1 }),
    F('4-3-3', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['CM',32,46],['CDM',50,53],['CM',68,46],['LW',20,18],['ST',50,14],['RW',80,18]], { cm: 3, wide: 2, attackers: 3, block: 1, line: 2 }),
    F('4-2-3-1', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['CDM',38,55],['CDM',62,55],['LW',20,32],['CAM',50,33],['RW',80,32],['ST',50,14]], { cm: 2, wide: 2, attackers: 3, block: 1, line: 1 }),
    F('4-1-4-1', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['CDM',50,56],['LM',17,42],['CM',39,44],['CM',61,44],['RM',83,42],['ST',50,15]], { cm: 3, wide: 2, attackers: 1, block: 2, line: 1 }),
    F('4-5-1', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['LM',14,44],['CM',34,47],['CM',50,43],['CM',66,47],['RM',86,44],['ST',50,15]], { cm: 3, wide: 2, attackers: 1, block: 2, line: 0 }),
    F('4-3-1-2', [['GK',50,88],['LB',16,66],['CB',38,69],['CB',62,69],['RB',84,66],['CDM',50,55],['CM',32,46],['CM',68,46],['CAM',50,33],['ST',40,15],['ST',60,15]], { cm: 3, wide: 0, attackers: 2, block: 1, line: 2 }),
    F('3-5-2', [['GK',50,88],['CB',30,70],['CB',50,72],['CB',70,70],['LWB',12,46],['CM',36,47],['CM',50,41],['CM',64,47],['RWB',88,46],['ST',40,16],['ST',60,16]], { cm: 3, wide: 2, attackers: 2, block: 1, line: 1 }),
    F('3-4-3', [['GK',50,88],['CB',30,70],['CB',50,72],['CB',70,70],['LM',15,46],['CM',38,47],['CM',62,47],['RM',85,46],['LW',22,18],['ST',50,15],['RW',78,18]], { cm: 2, wide: 2, attackers: 3, block: 0, line: 2 }),
    F('3-4-1-2', [['GK',50,88],['CB',30,70],['CB',50,72],['CB',70,70],['LM',15,46],['CM',38,47],['CM',62,47],['RM',85,46],['CAM',50,30],['ST',40,15],['ST',60,15]], { cm: 2, wide: 2, attackers: 3, block: 0, line: 2 }),
    F('5-3-2', [['GK',50,88],['LWB',12,64],['CB',32,70],['CB',50,72],['CB',68,70],['RWB',88,64],['CM',34,44],['CM',50,42],['CM',66,44],['ST',40,16],['ST',60,16]], { cm: 3, wide: 2, attackers: 2, block: 2, line: 0 }),
    F('5-4-1', [['GK',50,88],['LWB',12,64],['CB',32,70],['CB',50,72],['CB',68,70],['RWB',88,64],['LM',18,44],['CM',40,45],['CM',60,45],['RM',82,44],['ST',50,15]], { cm: 2, wide: 2, attackers: 1, block: 2, line: 0 })
  ];

  /* ---- TACTICAL MATCHUP: how a shape fares against an opponent's style.
     Real reasoning — clog the middle vs possession, stay compact vs counter,
     pile bodies forward to break a low block, win the air vs physical. Returns
     small modifiers (a noticeable nudge, never a result-changer) + a one-line
     tip the preview shows. ---- */
  GA.matchupAdvice = function (formation, style) {
    var i = formation.info || { cm: 2, wide: 1, attackers: 2, block: 1, line: 1 };
    var atk = 0, def = 0, tip = 'A solid, balanced setup for this game.';
    if (style === 'possession') {
      if (i.cm >= 3) { def += 0.07; tip = 'Three-man midfield matches their numbers, contesting central areas.'; }
      else { def -= 0.07; tip = 'Outnumbered in midfield. A third CM is recommended to retain possession.'; }
    } else if (style === 'counter') {
      if (i.block >= 2 && i.line === 0) { def += 0.07; tip = 'Sitting deep and compact restricts space for their counter-attacks.'; }
      else if (i.line >= 2 || i.attackers >= 3) { def -= 0.07; tip = 'High defensive line is vulnerable to their counters. Consider dropping deeper.'; }
    } else if (style === 'defensive') {
      if (i.wide >= 2 && i.attackers >= 3) { atk += 0.07; tip = 'Attacking width and forward numbers are key to breaking down their low block.'; }
      else if (i.attackers <= 1 || i.wide === 0) { atk -= 0.07; tip = 'Struggling to break down their low block. Add width or a second striker.'; }
    } else if (style === 'attacking') {
      if (i.block >= 2) { def += 0.06; tip = 'Packed defence is well-suited to absorb their all-out attack.'; }
      else if (i.block === 0) { def -= 0.06; tip = 'Playing open against an attacking side invites a shootout. Add defensive cover.'; }
    } else if (style === 'physical') {
      if (i.block >= 1 && (formation.name[0] === '5' || formation.name[0] === '3' || i.cm >= 3)) { def += 0.05; tip = 'Extra defensive bodies help win physical duels and second balls.'; }
      else if (i.attackers >= 3 && i.block === 0) { def -= 0.05; tip = 'Vulnerable to their physical directness. Field more defensive presence.'; }
    }
    return { atk: atk, def: def, tip: tip };
  };

})(window.GA);
