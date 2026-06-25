/* ============================================================
   THE GAUNTLET — run.js  (v3)
   Run spine: builds the procedural real-team ladder, runs the
   pre-game scouting (72+), keeps the squad/XI under MANUAL control
   (signings land on the bench — you place them), serves scaled
   slot rewards with one re-roll and a boss bonus, and runs the
   3-block fitness battery.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';

  var _uid = 1;
  function clone(p) { return Object.assign({}, p, { blocks: GA.BATTERY_MAX, uid: _uid++, _goals: 0 }); }

  GA.newRun = function (seed) {
    seed = seed || ('run-' + Date.now());
    var squad = GA.PUB_TEAM.squad.map(function (p) { var c = clone(p); c._pub = true; return c; });
    var pool = GA.PUB_TEAMS_POOL || [GA.PUB_TEAM];
    var choices = GA.shuffle(pool.slice()).slice(0, 10);
    var run = {
      seed: seed, squad: squad, formation: null, lineup: [], bench: [],
      rung: 1, cleared: 0, attempt: 0, mentality: 'balanced',
      perks: [], drafted: [], hasReplay: false, usedReplay: false,
      pregameLeft: 3, dead: false, history: [], bossBonus: false,
      ladder: GA.buildLadder(seed, 24),
      pubTeamChoices: choices,
      pubTeam: choices[0]
    };
    squad.forEach(function (p) { p.club = run.pubTeam.club; });
    GA.fitBest(run); // the inherited pub XI — signings will land on the bench for you to place
    return run;
  };

  GA.setPubTeam = function (run, team) {
    run.pubTeam = team;
    run.squad.forEach(function (p) {
      if (p._pub) p.club = team.club;
    });
  };

  GA.rungAt = function (run, n) { return (run && run.ladder && run.ladder[n - 1]) || GA.buildLadder((run ? run.seed : 'x'), n)[n - 1]; };
  GA.currentRung = function (run) { return GA.rungAt(run, run.rung); };

  /* ---- auto-fit a strong XI (used only for the inherited team + the optional
     "auto-pick" button; signings are otherwise placed by hand) ---- */
  GA.fitBest = function (run, preferName) {
    var best = GA.bestFormation(run.squad, preferName || (run.formation && run.formation.name), true);
    run.formation = best.f; run.lineup = best.a.slots; run.bench = best.a.bench;
  };
  /* ---- change shape, keeping the current XI as intact as possible ---- */
  GA.setFormation = function (run, name) {
    var f = null; for (var i = 0; i < GA.FORMATIONS.length; i++) if (GA.FORMATIONS[i].name === name) f = GA.FORMATIONS[i];
    if (!f) return;
    var starters = run.lineup.filter(function (s) { return s.player; }).map(function (s) { return s.player; });
    var a = GA.autoAssign(starters.concat(run.bench), f); // starters first → they keep priority
    run.formation = f; run.lineup = a.slots; run.bench = a.bench;
  };

  GA.startersOf = function (run) { return run.lineup.filter(function (s) { return s.player; }).map(function (s) { return s.player; }); };
  GA.xiOf = function (run) { return run.lineup.map(function (s) { return s.player ? Object.assign({}, s.player, { pos: s.pos, srcPos: s.player.pos }) : null; }); };
  GA.holesIn = function (run) { return run.lineup.filter(function (s) { return !s.player; }).length; };
  GA.teamLevel = function (run) { return GA.teamOVR(run.squad); };
  var inSquad = function (run, name) { return run.squad.some(function (s) { return s.n === name; }); };

  /* ---- squad depth: a deep bench lifts the whole side (+1 atk/def per 2 extra
     players beyond a normal squad, capped). Rewards hoarding the abundance. ---- */
  GA.depthBonus = function (squadSize) { return Math.min(5, Math.max(0, Math.floor((squadSize - 18) / 2))); };

  /* ---- release a bench player (declutter; trades the depth bonus) ---- */
  GA.releaseFromBench = function (run, idx) {
    var p = run.bench[idx]; if (!p) return;
    run.bench.splice(idx, 1);
    run.squad = run.squad.filter(function (s) { return s.uid !== p.uid; });
    run.drafted = run.drafted.filter(function (s) { return s.uid !== p.uid; });
  };

  /* ============================================================ PRE-GAME SCOUTING (72+) */
  GA.preGameSpin = function (run, rng) {
    rng = rng || Math.random;
    var r = rng(), band;
    if (r < 0.045) band = [87, 99]; else if (r < 0.23) band = [80, 86]; else band = [72, 79];
    var cands = GA.POOL.filter(function (p) { return p.ovr >= band[0] && p.ovr <= band[1] && !inSquad(run, p.n); });
    if (!cands.length) cands = GA.POOL.filter(function (p) { return p.ovr >= 72 && !inSquad(run, p.n); });
    return cands.length ? GA.pick(cands, rng) : null;
  };

  /* ---- sign a player: lands on the BENCH (you place him in Tactics) ---- */
  GA.signPlayer = function (run, poolPlayer) {
    var c = clone(poolPlayer); c._drafted = true;
    run.squad.push(c); run.drafted.push(c); run.bench.push(c);
    return c;
  };

  /* ============================================================ SLOT REWARDS (scaled to your team) */
  // each reward is { id, type:'player'|'item', player?, item? }; values rise with your OVR
  GA.rollRewards = function (run, count, excludeIds, rng) {
    rng = rng || Math.random;
    // offers centre on ~80 early (a 77-83 player most wins) and then track the
    // RISING CURVE — you draft a notch above what's coming so a sharp recruiter
    // pulls ahead of the EFL/PL and only the all-time greats finally out-rate you.
    var ovr = GA.teamLevel(run);
    var nextThreat = (GA.rungAt(run, run.rung + 1) || GA.currentRung(run) || {}).threat || ovr;
    var mu = Math.min(96, Math.max(80, ovr + 3, nextThreat + 6));
    var lo = Math.max(74, mu - 7), hi = Math.min(99, mu + 6);
    var pool = GA.POOL.filter(function (p) { return p.ovr >= lo && p.ovr <= hi && !inSquad(run, p.n); });
    var weighted = pool.map(function (p) { return { p: p, w: Math.exp(-Math.pow(p.ovr - mu, 2) / 20.5) + 0.01 }; });
    excludeIds = excludeIds || [];
    function pickPlayer(taken) {
      var avail = weighted.filter(function (x) { return !taken[x.p.n] && excludeIds.indexOf('p:' + x.p.n) === -1; });
      if (!avail.length) return null;
      var tot = avail.reduce(function (a, b) { return a + b.w; }, 0), r = rng() * tot;
      for (var i = 0; i < avail.length; i++) { r -= avail[i].w; if (r <= 0) return avail[i].p; }
      return avail[avail.length - 1].p;
    }
    // available items: every UNOWNED permanent perk + the repeatable one-offs
    var items = [];
    if (!run.hasReplay && run.perks.indexOf('cup_replay') === -1) items.push(GA.ITEMS.cup_replay);
    (GA.PERMA_PERKS || ['giant']).forEach(function (id) { if (run.perks.indexOf(id) === -1) items.push(GA.ITEMS[id]); });
    items.push(GA.ITEMS.recharge); items.push(GA.ITEMS.coach);
    items = GA.shuffle(items, rng).filter(function (it) { return it && excludeIds.indexOf('i:' + it.id) === -1; });

    var out = [], taken = {}, itemI = 0;
    for (var k = 0; k < count; k++) {
      // ~30% item, but guarantee at least one player and never all-items
      var wantItem = rng() < 0.30 && itemI < items.length && out.filter(function (o) { return o.type === 'item'; }).length < count - 1;
      if (wantItem) { var it = items[itemI++]; out.push({ id: 'i:' + it.id, type: 'item', item: it }); }
      else { var pl = pickPlayer(taken); if (pl) { taken[pl.n] = 1; out.push({ id: 'p:' + pl.n, type: 'player', player: pl }); }
             else if (itemI < items.length) { var it2 = items[itemI++]; out.push({ id: 'i:' + it2.id, type: 'item', item: it2 }); } }
    }
    // ensure at least one player if possible
    if (!out.some(function (o) { return o.type === 'player'; })) { var pl2 = pickPlayer(taken); if (pl2) out[0] = { id: 'p:' + pl2.n, type: 'player', player: pl2 }; }
    return out;
  };

  GA.applyReward = function (run, rw) {
    if (rw.type === 'player') return GA.signPlayer(run, rw.player);
    var id = rw.item.id;
    if (id === 'cup_replay') { run.hasReplay = true; if (run.perks.indexOf('cup_replay') === -1) run.perks.push('cup_replay'); }
    else if (id === 'recharge') { run.squad.forEach(function (p) { p.blocks = GA.BATTERY_MAX; }); }
    else if (id === 'coach') { var st = GA.startersOf(run).sort(function (a, b) { return GA.ratingOf(a) - GA.ratingOf(b); })[0]; if (st) st.ovr = (st.ovr || 50) + 3; }
    else if ((GA.PERMA_PERKS || []).indexOf(id) !== -1) { if (run.perks.indexOf(id) === -1) run.perks.push(id); } // build-defining perks
    return null;
  };

  GA.setMentality = function (run, id) { run.mentality = id; };

  /* ============================================================ FITNESS BATTERY */
  GA.applyBatteries = function (run, rung) {
    var drain = (rung && rung.drain) ? 2 : 1;
    if (run.perks && run.perks.indexOf('fitness') !== -1) drain = 1; // Sports Science: never double-drained
    var starterIds = {}; GA.startersOf(run).forEach(function (p) { starterIds[p.uid] = 1; });
    run.squad.forEach(function (p) {
      if (starterIds[p.uid]) p.blocks = Math.max(0, GA.blocksOf(p) - drain);
      else p.blocks = GA.BATTERY_MAX; // one match on the bench = fully recharged
    });
  };

  function tallyGoals(run, sim) {
    if (!sim || !sim.myScorers) return;
    sim.myScorers.forEach(function (name) {
      for (var i = 0; i < run.squad.length; i++) {
        var p = run.squad[i];
        if (p.n === name) { p._goals = (p._goals || 0) + 1; break; }
      }
    });
  }

  GA.onWin = function (run, sim, rung) {
    GA.applyBatteries(run, rung);
    run.cleared++;
    run.bossBonus = !!rung.boss; // beating a boss earns the bigger slot drop
    tallyGoals(run, sim);
    run.history.push({ rung: run.rung, club: rung.club, season: rung.season, boss: !!rung.boss, gf: sim.gf, ga: sim.ga, pens: sim.pens, penScore: sim.penScore });
  };
  GA.onLoss = function (run, sim, rung) {
    if (run.hasReplay && !run.usedReplay) { run.usedReplay = true; tallyGoals(run, sim); return 'replay'; }
    run.dead = true; run.deathRung = run.rung; run.deathOpp = rung;
    tallyGoals(run, sim);
    run.history.push({ rung: run.rung, club: rung.club, season: rung.season, boss: !!rung.boss, gf: sim.gf, ga: sim.ga, pens: sim.pens, penScore: sim.penScore, died: true });
    return 'dead';
  };
  GA.advance = function (run) { run.rung++; run.attempt = 0; }; // XI persists; you manage it

})(window.GA);
