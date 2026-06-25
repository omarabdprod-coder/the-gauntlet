/* ============================================================
   THE GAUNTLET — store.js
   localStorage: best depth reached, runs played, recent runs.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  var KEY = 'gauntlet_v1';
  var DEFAULT = { runs: 0, bestRung: 0, bestCleared: 0, wins: 0, reachedBarca: 0, beatBarca: 0, history: [] };

  function load() {
    try { var raw = localStorage.getItem(KEY); return raw ? Object.assign({}, DEFAULT, JSON.parse(raw)) : Object.assign({}, DEFAULT); }
    catch (e) { return Object.assign({}, DEFAULT); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  GA.store = {
    get: load,
    reset: function () { save(Object.assign({}, DEFAULT)); },
    recordRun: function (res) {
      // res: { cleared, deathRung, beatBarca, immortal, drafted:[{n,rt}], perks:[ids], won (bool, full clear of fixed ladder) }
      var s = load();
      s.runs++;
      s.wins += res.cleared || 0;
      if ((res.cleared || 0) > s.bestCleared) s.bestCleared = res.cleared;
      if ((res.deathRung || res.cleared + 1) > s.bestRung) s.bestRung = res.deathRung || res.cleared;
      if (res.reachedBarca) s.reachedBarca++;
      if (res.beatBarca) s.beatBarca++;
      s.history.unshift({
        cleared: res.cleared, deathRung: res.deathRung, immortal: !!res.immortal,
        drafted: (res.drafted || []).map(function (p) { return { n: p.n, rt: GA.ratingOf(p) }; }),
        perks: res.perks || [], t: Date.now()
      });
      s.history = s.history.slice(0, 12);
      save(s);
      return s;
    }
  };
})(window.GA);
