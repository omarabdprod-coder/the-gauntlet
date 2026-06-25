/* ============================================================
   THE GAUNTLET — app.js  (v3)
   Home → Inherit → Pre-game scouting (72+, manual) → Set line-up
     → loop: Preview (matchup + mentality) → [Tactics] → Match
       → Win: Slot Machine (3 plain rewards, 1 re-roll; bosses = 5, pick 2)
       → Loss: Cup Replay, or the Frankenstein share card.
   ============================================================ */
(function (GA) {
  'use strict';
  var ui = GA.ui, app = document.getElementById('app');
  var G = {}, spinSeq = 0;
  function reset() { spinSeq++; G = { screen: 'home', run: null, sim: null, picked: null, loot: null, lootExclude: [], rerolled: false, lootPicks: [], lootNeed: 1, resolved: false, raf: 0, shareURL: null, _recorded: false, _lossKind: null, tradeMode: false, tradeSelections: [] }; }
  reset();

  /* ---------- rain ---------- */
  var rainCanvas = null, rainCtx = null, rainActive = false, rainRaf = 0, rainP = [];
  function startRain() {
    if (rainActive) return; rainCanvas = document.getElementById('rainCanvas');
    if (!rainCanvas) { rainCanvas = document.createElement('canvas'); rainCanvas.id = 'rainCanvas'; document.body.appendChild(rainCanvas); }
    rainCtx = rainCanvas.getContext('2d'); rainActive = true; resizeRain(); window.addEventListener('resize', resizeRain); rainP = [];
    for (var i = 0; i < 70; i++) rainP.push({ x: Math.random() * rainCanvas.width, y: Math.random() * rainCanvas.height - rainCanvas.height, l: Math.random() * 18 + 8, xs: -1 - Math.random() * 2, ys: Math.random() * 6 + 10 });
    (function loop() { if (!rainActive) return; rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height); rainCtx.strokeStyle = 'rgba(174,182,192,0.15)'; rainCtx.lineWidth = 1; rainCtx.lineCap = 'round';
      for (var i = 0; i < rainP.length; i++) { var p = rainP[i]; rainCtx.beginPath(); rainCtx.moveTo(p.x, p.y); rainCtx.lineTo(p.x + p.xs, p.y + p.l); rainCtx.stroke(); p.x += p.xs; p.y += p.ys; if (p.y > rainCanvas.height) { p.x = Math.random() * rainCanvas.width; p.y = -p.l; } } rainRaf = requestAnimationFrame(loop); })();
  }
  function stopRain() { rainActive = false; if (rainRaf) cancelAnimationFrame(rainRaf); window.removeEventListener('resize', resizeRain); if (rainCanvas) rainCanvas.remove(); rainCanvas = null; }
  function resizeRain() { if (rainCanvas) { rainCanvas.width = window.innerWidth; rainCanvas.height = window.innerHeight; } }

  /* ---------- chrome ---------- */
  var ICONS = {
    sun: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
    moon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    soundOn: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.4 7.4 0 0 1 0 10.4"/></svg>',
    soundOff: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z"/><path d="M16 9.8l4.4 4.4M20.4 9.8L16 14.2"/></svg>',
    palette: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.5-1-2.5 0-.8.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="11" r="1"/></svg>',
    back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg>'
  };
  function controlsHTML() {
    var muted = GA.sound.isMuted(), isLight = document.body.classList.contains('light-theme');
    var acc = localStorage.getItem('gauntlet_accent') || 'gold', bg = localStorage.getItem('gauntlet_bg') || 'floodlit';
    return '<div class="global-controls"><div class="theme-wrap">' +
      '<button class="theme-toggle" data-action="toggle-themes" title="Themes">' + ICONS.palette + '</button>' + ui.themePicker(acc, bg) + '</div>' +
      '<button class="theme-toggle" data-action="toggle-theme" title="Light / dark">' + (isLight ? ICONS.moon : ICONS.sun) + '</button>' +
      '<button class="sound-toggle' + (muted ? '' : ' on') + '" data-action="toggle-sound" title="Sound">' + (muted ? ICONS.soundOff : ICONS.soundOn) + '</button></div>';
  }
  function topbar(title, sub) { return '<div class="topbar"><button class="back" data-action="go-home" title="Abandon run">' + ICONS.back + '</button><span class="topbar-t">' + ui.esc(title) + '</span>' + controlsHTML() + '<span class="topbar-cfg">' + (sub ? ui.esc(sub) : '') + '</span></div>'; }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; }
  var _renderedScreen = null;
  function render(h) {
    if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; }
    var sameScreen = G.screen === _renderedScreen, y = window.scrollY;
    app.innerHTML = h;
    window.scrollTo(0, sameScreen ? y : 0); // re-rendering the same screen (e.g. picking a player) must not jump to top
    if (!sameScreen) { var w = app.firstElementChild; if (w) w.classList.add('screen-in'); } // entrance only on a real screen change
    _renderedScreen = G.screen;
    requestAnimationFrame(animateCounts);
  }
  function animateCounts() {
    document.querySelectorAll('[data-count]').forEach(function (elm) {
      if (elm._counted) return; elm._counted = true;
      var to = parseFloat(elm.getAttribute('data-count')); if (isNaN(to)) return;
      var suffix = elm.getAttribute('data-suffix') || '', t0 = performance.now(), dur = 650;
      (function step(now) { var p = Math.min(1, (now - t0) / dur); elm.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(step); })(performance.now());
    });
  }
  function flashScore(id) { var n = document.getElementById(id); if (!n) return; n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); setTimeout(function () { if (n) n.classList.remove('flash'); }, 480); }
  // a cinematic goal burst over the pitch chart
  function goalBurst(team, scorer) {
    var host = document.querySelector('.simbox'); if (!host) return;
    var us = team === 'us';
    var b = el('<div class="goal-burst ' + (us ? 'us' : 'them') + '"><div class="gb-word">' + (us ? 'GOAL!' : 'CONCEDED') + '</div>' + (scorer ? '<div class="gb-who">' + ui.esc(ui.lastName(scorer)) + '</div>' : '') + '</div>');
    host.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1250);
  }
  function toast(m) { var t = el('<div class="toast">' + ui.esc(m) + '</div>'); document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('show'); }); setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2200); }
  function runMeta(run) { return 'RUNG ' + run.rung + ' · ' + run.cleared + ' CLEARED · OVR ' + GA.teamOVR(run.squad); }
  function lives(run) { return run.hasReplay && !run.usedReplay ? '<span class="life-pill">🔁 Cup Replay</span>' : ''; }
  function perksHTML(run) {
    var owned = (run.perks || []).filter(function (id) { return GA.ITEMS[id] && GA.PERMA_PERKS && GA.PERMA_PERKS.indexOf(id) !== -1; });
    if (!owned.length) return '';
    return '<div class="perkstrip"><div class="perkstrip-h">YOUR PERKS</div><div class="perkstrip-list">' +
      owned.map(function (id) { var it = GA.ITEMS[id]; return '<span class="perk-chip" title="' + ui.esc(it.desc) + '">' + it.emoji + ' ' + ui.esc(it.name) + '</span>'; }).join('') +
      '</div></div>';
  }

  /* ============================================================ HOME */
  function home() {
    G.screen = 'home'; stopRain();
    var s = GA.store.get();
    render('<div class="wrap home">' +
      '<div class="brandrow"><span class="wordmark">THE GAUNTLET</span>' + controlsHTML() + '</div>' +
      '<header class="hero"><div class="hero-copy">' +
        '<div class="kicker">★ A football roguelike</div>' +
        '<h1>One pub team.<br><span>Every legend in history.</span></h1>' +
        '<p class="hero-sub">Inherit a squad of hungover nobodies. Scout some signings, set your tactics, and climb a twelve-rung gauntlet of history\'s greatest teams. Grab new players and perks from the slot machine on each win. One defeat ends the run. Run it back.</p>' +
        '<div class="hero-ctas"><button class="cta" data-action="begin-run">Start a run →</button>' +
          '<button class="cta ghost" data-action="toggle-howto">How it works</button></div>' +
        (s.runs ? '' : '<div class="firstrun-hint">New here? Here\'s the whole game in seven lines ↓</div>') +
        '<div class="howto' + (s.runs ? ' hidden' : '') + '" id="howto">' + howto() + '</div></div>' +
        '<aside class="hero-board"><div class="hb-head"><span>THE CLIMB</span><span>↑ HARDER · ENDLESS</span></div>' +
          ladderPreview() + '<div class="hb-caption">Generated fresh every run. <b>No two climbs the same.</b></div></aside>' +
      '</header>' + tickerHTML() +
      (s.runs ? '<h2 class="rh">Your record</h2><div class="statstrip">' + stat('RUNS', s.runs) + stat('BEST RUNG', s.bestRung || '–') + stat('CLEARED', s.bestCleared || '–') + stat('REACHED BOSS', s.reachedBarca) + stat('BEAT A BOSS', s.beatBarca) + '</div>' : '') +
      historyHTML(s.history) +
      '<footer class="foot">Mud, memory, and the ghosts of football past.' + (s.runs ? '<br><button class="link-btn danger" data-action="reset-stats">reset record</button>' : '') +
        '<br><span class="foot-fine">A free, non-commercial fan project — not affiliated with or endorsed by any club, league, or EA. Player &amp; club data for educational use only; all rights belong to their owners.</span></footer></div>');
  }
  function stat(k, v) { var num = typeof v === 'number'; return '<div class="stat"><b' + (num ? ' data-count="' + v + '"' : '') + '>' + (num ? 0 : v) + '</b><span>' + k + '</span></div>'; }
  function ladderPreview() {
    var bands = [['Non-league &amp; League Two', '1', '50'], ['League One &amp; Championship', '5', '60'], ['Premier League', '9', '72'], ['European elite', '13', '82'], ['The all-time greats', '17', '92']], rows = '';
    bands.forEach(function (b, i) { rows += '<div class="lp-row"><span class="lp-n">' + b[1] + '</span><span class="lp-club">' + b[0] + '<small>real clubs, real players</small></span><span class="lp-th">' + b[2] + '</span></div>'; });
    rows += '<div class="lp-row boss"><span class="lp-n">★</span><span class="lp-club">Bosses<small>every 3rd rung</small></span><span class="lp-boss">+ BONUS</span></div>';
    return '<div class="ladder-preview">' + rows + '</div>';
  }
  function tickerHTML() {
    var names = GA.ICONIC.map(function (t) { return '<span class="tk-item"><i>★</i>' + ui.esc(t.club.toUpperCase()) + '<span class="tk-meta">' + ui.esc(t.season) + '</span></span>'; });
    names.push('<span class="tk-item tk-count">' + GA.POOL.length + ' DRAFTABLE PLAYERS · REAL CLUBS · 3-BLOCK FITNESS · ENDLESS</span>');
    var half = GA.shuffle(names).join('');
    return '<div class="ticker" aria-hidden="true"><div class="tk-track">' + half + half + '</div></div>';
  }
  function howto() {
    return '<ol class="howto-list">' +
      '<li><b>Inherit Dog &amp; Duck FC</b> — 16 nobodies rated 50. Take three scout spins (72+) to build a starting spine.</li>' +
      '<li><b>Pick your lineup.</b> New signings go to the bench. You control who plays and what formation you field.</li>' +
      '<li><b>Face the gauntlet.</b> Match difficulty scales up every rung. Every third rung is a boss with special rules.</li>' +
      '<li><b>Tactical matchups.</b> Pick your formation and mentality to exploit the opponent\'s style.</li>' +
      '<li><b>Slot rewards.</b> Win a match to spin. Choose a player to sign or a team-wide perk (one free re-roll).</li>' +
      '<li><b>Manage fatigue.</b> Playing drains stamina; sitting on the bench fully recharges a player. Rotate to keep legs fresh.</li>' +
      '<li><b>Sudden death.</b> Lose once and the run is dead. Save your team\'s Share Card and go again.</li></ol>';
  }
  function historyHTML(hist) {
    if (!hist || !hist.length) return '';
    var rows = hist.slice(0, 6).map(function (h) {
      var when = ''; if (h.t) { var d = Math.floor((Date.now() - h.t) / 1000); when = d < 60 ? 'just now' : d < 3600 ? Math.floor(d / 60) + 'm ago' : d < 86400 ? Math.floor(d / 3600) + 'h ago' : Math.floor(d / 86400) + 'd ago'; }
      var legs = (h.drafted || []).slice(0, 4).map(function (p) { return '<span class="hc-chip">' + ui.esc(ui.lastName(p.n)) + '<b>' + p.rt + '</b></span>'; }).join('');
      return '<div class="history-card"><div class="hc-left"><div class="hc-title-row"><span class="hc-club">Reached Rung ' + (h.deathRung || h.cleared) + '</span>' + (when ? '<span class="hc-season">' + when + '</span>' : '') + '</div>' + (legs ? '<div class="hc-signings">' + legs + '</div>' : '') + '</div>' +
        '<div class="hc-right"><div class="hc-pts"><b>' + h.cleared + '</b><span>CLEARED</span></div><span class="hc-badge ' + (h.immortal ? 'survived' : 'relegated') + '">' + (h.immortal ? 'LEGEND' : 'FELL') + '</span></div></div>';
    }).join('');
    return '<section class="history-section"><h2 class="rh">Recent climbs</h2><div class="history-grid">' + rows + '</div></section>';
  }

  /* ============================================================ INHERIT + PRE-GAME */
  function rnd(arr) { return Math.floor(Math.random() * arr.length); }
  function randomBuild() { var W = GA.CLUB_WORDS; return { pre: rnd(W.pre), place: rnd(W.place), suffix: rnd(W.suffix), kit: rnd(GA.CLUB_KITS) }; }
  function buildIdentity(b) {
    var W = GA.CLUB_WORDS, words = [W.pre[b.pre], W.place[b.place], W.suffix[b.suffix]];
    return { club: words.join(' '), badge: words.map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 3),
      colors: (GA.CLUB_KITS[b.kit] || GA.CLUB_KITS[0]).slice(), motto: 'Forged from the finest English nonsense.', custom: true };
  }
  function clubForge(run) {
    var W = GA.CLUB_WORDS, b = G.build, id = buildIdentity(b);
    function reel(bank, label) {
      return '<div class="forge-reel"><div class="forge-row"><button class="forge-arr" data-action="forge-cycle" data-bank="' + bank + '" data-dir="-1">‹</button>' +
        '<span class="forge-word">' + ui.esc(W[bank][b[bank]]) + '</span>' +
        '<button class="forge-arr" data-action="forge-cycle" data-bank="' + bank + '" data-dir="1">›</button></div><small>' + label + '</small></div>';
    }
    var kits = GA.CLUB_KITS.map(function (k, i) { return '<button class="forge-kit' + (b.kit === i ? ' on' : '') + '" data-action="forge-kit" data-idx="' + i + '" style="background:' + k[0] + '" title="kit"><i style="background:' + k[1] + '"></i></button>'; }).join('');
    var live = run.pubTeam && run.pubTeam.custom && run.pubTeam.club === id.club;
    return '<div class="forge">' +
      '<div class="forge-reels">' + reel('pre', 'prefix') + reel('place', 'place') + reel('suffix', 'type') + '</div>' +
      '<div class="forge-preview ' + (live ? 'live' : '') + '"><span class="forge-badge" style="--c0:' + id.colors[0] + ';--c1:' + id.colors[1] + '">' + id.badge + '</span><span class="forge-name">' + ui.esc(id.club) + '</span></div>' +
      '<div class="forge-kits">' + kits + '</div>' +
      '<div class="forge-actions"><button class="btn tiny" data-action="forge-roll">🎲 Randomise</button>' +
        '<button class="cta tiny' + (live ? ' is-live' : '') + '" data-action="forge-use">' + (live ? '✓ Leading them out' : 'Forge this club →') + '</button></div></div>';
  }
  function intro() {
    G.screen = 'intro'; startRain();
    var run = G.run;
    if (!G.build) G.build = randomBuild();
    var pub = run.pubTeam || GA.PUB_TEAM;
    render('<div class="wrap"><div class="brief">' + topbar('The Inheritance') +
      '<div class="brief-head" style="--c0:' + pub.colors[0] + ';--c1:' + pub.colors[1] + '"><div class="brief-badge">' + pub.badge + '</div>' +
        '<div><div class="brief-club">' + ui.esc(pub.club) + '</div><div class="brief-season">' + ui.esc(pub.motto) + '</div></div><div class="ovr-badge">' + GA.teamOVR(run.squad) + '<span>OVR</span></div></div>' +
      '<div class="profile"><div class="profile-h">THE SITUATION</div><p>The manager took the club kitty and vanished. The chairman is busy running his chip shop. Yet, due to some bizarre administrative screw-up, your pub team of Sunday league players has been entered into a gauntlet against the greatest clubs in football history. Sixteen amateurs playing for pints. Average rating: 50. Ahead of you: the ultimate football ladder. Grab three initial signings, pick your shape, and see how far you can climb.</p></div>' +
      '<div class="profile" style="margin-top:16px">' +
        '<div class="profile-h">CHOOSE YOUR CLUB</div>' +
        '<p style="margin-bottom:10px">Lead a local side — or <b>forge your own</b> from the finest English nonsense.</p>' +
        '<div class="choose-sub">PICK A LOCAL SIDE</div>' +
        '<div class="pub-teams-grid">' +
          run.pubTeamChoices.map(function (t, idx) {
            var active = pub.club === t.club;
            return '<button class="pubopt' + (active ? ' on' : '') + '" data-action="select-pub-team" data-idx="' + idx + '">' +
              '<span class="pubopt-badge" style="--c0:' + t.colors[0] + ';--c1:' + t.colors[1] + '">' + t.badge + '</span>' +
              '<span class="pubopt-n">' + ui.esc(t.club) + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="choose-tools"><button class="btn tiny" data-action="reroll-pub-teams">↻ Reroll choices</button></div>' +
        '<div class="choose-sub">…OR FORGE YOUR OWN</div>' + clubForge(run) +
      '</div>' +
      '<div class="brief-pitch"><div class="brief-pitch-h">THE XI YOU INHERIT · ' + run.formation.name + '</div>' + ui.formationPitch(run.lineup, { battery: false }) + '</div>' +
      '<button class="cta" data-action="to-pregame">Hit the scouting lever →</button></div></div>');
  }
  function pregame() {
    G.screen = 'pregame'; startRain();
    var run = G.run, left = run.pregameLeft;
    render('<div class="wrap">' + topbar('Pre-Season Scouting', 'OVR ' + GA.teamOVR(run.squad)) +
      '<p class="lead">Three pulls of the scouting lever to build your spine. Every player is <b>72 or better</b>. You\'ll get solid first-teamers, a good look at some top-tier stars, and a rare shot at a legend. Signings go to your bench; you place them in the lineup.</p>' +
      '<div class="machine slotmachine"><div class="mach-h" id="pgHead">' + (left > 0 ? 'SCOUTING SPINS LEFT: ' + left : 'SCOUTING COMPLETE') + '</div>' +
        '<div class="slot-reels single"><div class="slot-reel big" id="pgReel">— — —</div></div>' +
        '<button class="lever' + (left > 0 ? '' : ' disabled') + '" ' + (left > 0 ? 'data-action="pregame-spin"' : '') + '>' + (left > 0 ? 'PULL THE LEVER' : 'NO SPINS LEFT') + '</button>' +
        '<div class="pg-reveal" id="pgReveal"></div></div>' +
      '<div class="pg-squad"><div class="brief-pitch-h">SIGNED</div><div class="pg-chips">' +
        (run.drafted.length ? run.drafted.map(function (p) { return '<span class="pg-chip">' + ui.esc(p.n) + ' <b>' + GA.ratingOf(p) + '</b> <small>' + p.pos + (p.season !== GA.CUR ? ' · ' + p.season : '') + '</small></span>'; }).join('') : '<span class="bench-empty">nobody yet</span>') + '</div></div>' +
      '<button class="cta" data-action="to-setup">' + (left > 0 ? 'Skip — set your line-up →' : 'Set your line-up →') + '</button></div>');
  }
  function pregameSpin() {
    var run = G.run; if (run.pregameLeft <= 0) return;
    var player = GA.preGameSpin(run, Math.random); if (!player) { run.pregameLeft = 0; pregame(); return; }
    var lever = document.querySelector('.lever'); if (lever) { lever.classList.add('disabled'); lever.textContent = 'SCOUTING…'; }
    spinName('pgReel', player.n, function () {
      run.pregameLeft--; var signed = GA.signPlayer(run, player); GA.sound.playSign();
      var rev = document.getElementById('pgReveal');
      if (rev) rev.innerHTML = ui.playerCard(signed, 'slot', { cls: 'reveal-card' });
      setTimeout(pregame, 1100);
    });
  }

  /* ============================================================ TACTICS / SET-UP */
  function tactics(first) {
    G.screen = 'tactics'; startRain();
    var run = G.run;
    if (G.tradeMode) G.picked = null;
    var pk = G.picked, moving = pk && pk.src === 'pitch';
    var eligible = pk ? (moving ? eligForMove(pk.idx) : eligForBench(pk.p)) : [];
    var rung = GA.currentRung(run);
    
    var banner = '';
    if (G.tradeMode) {
      banner = '<div class="cfg-note warn highlight" style="margin-top:14px;border-color:var(--green)">♻️ <b>Trade-in Mode Active</b><br>Select exactly 3 bench players to recycle. They will be removed and you\'ll get a free 72+ OVR player spin from the pool.</div>';
    }

    render('<div class="wrap">' + topbar(first ? 'Set Your Line-Up' : 'Tactics', runMeta(run)) +
      '<h2 class="sec">Your shape</h2>' +
      (G.tradeMode ? '' : '<div class="form-picker">' + GA.FORMATIONS.map(function (f) { return '<button class="fcard ' + (run.formation.name === f.name ? 'on' : '') + '" data-action="pick-formation" data-name="' + f.name + '">' + ui.formationMini(f) + '<span class="fcard-n">' + f.name + '</span></button>'; }).join('') + '</div>') +
      (rung && !G.tradeMode ? ui.matchupTip(run.formation, rung.style) : '') +
      banner +
      '<p class="lead">' + (G.tradeMode ? '<b>Select exactly 3 players from the bench list below.</b>' : pk ? '<b>Moving ' + ui.esc(ui.lastName(pk.p.n)) + ' — choose a green slot to position him.</b>' : 'Tap a starter to swap him. Tap a bench player and then an eligible green slot to bring him on. Keep an eye on battery blocks for stamina.') + '</p>' +
      (G.tradeMode ? '' : '<div class="tac-head"><span class="brief-pitch-h">' + run.formation.name + ' · OVR ' + Math.round(GA.teamOVR([].concat.apply([], [GA.startersOf(run)]))) + '</span>' +
         '<div class="tac-actions" style="display:flex;gap:8px"><button class="btn tiny" data-action="auto-fill">⚡ Auto-pick best XI</button>' +
         '<button class="btn tiny highlight" data-action="trade-mode-toggle" style="border-color:var(--acc);color:var(--acc)">♻️ Recycle</button></div></div>') +
      ui.formationPitch(run.lineup, G.tradeMode ? { removable: false, battery: false } : { slotAction: 'tac-slot', eligible: eligible, selected: moving ? pk.idx : undefined, removable: !pk }) +
      ui.benchStrip(run.bench, { interactive: !G.tradeMode, picked: pk, tradeMode: G.tradeMode, tradeSelections: G.tradeSelections }) +
      (G.tradeMode ?
         '<div class="result-actions" style="margin-top:20px"><button class="cta ghost" data-action="trade-cancel">Cancel Trade</button>' +
         '<button class="cta' + (G.tradeSelections.length === 3 ? '' : ' disabled') + '" data-action="trade-submit"' + (G.tradeSelections.length === 3 ? '' : ' disabled') + '>Confirm Trade-in →</button></div>'
       : '<button class="cta" data-action="' + (first ? 'setup-done' : 'tactics-done') + '">' + (first ? 'Start the climb →' : 'Lock it in →') + '</button>') + '</div>');
  }
  function eligForBench(p) { var out = []; G.run.lineup.forEach(function (s, i) { if (GA.canPlay(p, s.pos)) out.push(i); }); return out; }
  function eligForMove(idx) { var from = G.run.lineup[idx], p = from.player, out = []; G.run.lineup.forEach(function (s, i) { if (i === idx || !GA.canPlay(p, s.pos)) return; if (s.player && !GA.canPlay(s.player, from.pos)) return; out.push(i); }); return out; }
  function tacSlot(i, first) {
    var run = G.run, sl = run.lineup[i], pk = G.picked;
    if (pk && pk.src === 'pitch') {
      if (pk.idx === i) { G.picked = null; tactics(first); return; }
      var from = run.lineup[pk.idx], mv = from.player;
      if (!GA.canPlay(mv, sl.pos)) { toast(ui.lastName(mv.n) + " can't play " + sl.pos); return; }
      if (sl.player && !GA.canPlay(sl.player, from.pos)) { toast('No swap — ' + ui.lastName(sl.player.n) + " can't cover " + from.pos); return; }
      from.player = sl.player || null; sl.player = mv; G.picked = null; GA.sound.playClick(); tactics(first); return;
    }
    if (pk && pk.src === 'bench') {
      if (!GA.canPlay(pk.p, sl.pos)) { toast(ui.lastName(pk.p.n) + ' can only play ' + GA.eligiblePos(pk.p).join('/')); return; }
      run.bench.splice(pk.idx, 1); if (sl.player) run.bench.push(sl.player); sl.player = pk.p; G.picked = null; GA.sound.playSign(); tactics(first); return;
    }
    if (sl.player) { G.picked = { src: 'pitch', idx: i, p: sl.player }; tactics(first); }
  }
  function benchOut(i, first) { var sl = G.run.lineup[i]; if (!sl || !sl.player) return; G.run.bench.push(sl.player); sl.player = null; if (G.picked && G.picked.src === 'pitch' && G.picked.idx === i) G.picked = null; tactics(first); }
  function benchRelease(i) {
    var p = G.run.bench[i]; if (!p) return;
    if (window.confirm('Release ' + p.n + ' (OVR ' + GA.ratingOf(p) + ')?\nThis frees bench space but reduces your squad depth bonus.')) {
      GA.releaseFromBench(G.run, i); G.picked = null; toast(p.n + ' released'); GA.sound.playClick();
      tactics(!!document.querySelector('[data-action="setup-done"]'));
    }
  }

  /* ============================================================ PREVIEW */
  function preview() {
    G.screen = 'preview'; G.resolved = false; G._recorded = false; G._lossKind = null; startRain();
    var run = G.run, rung = GA.currentRung(run), boss = !!rung.boss, style = GA.STYLES[rung.style] || GA.STYLES.balanced;
    var ts = GA.teamStrength(GA.xiOf(run), true), depth = GA.depthBonus(run.squad.length);
    var spirit = Math.round(Math.min(GA.COH_CAP || 16, run.cleared * GA.SIM_COH)); // squad cohesion (matches the sim)
    var myAtk = Math.round(ts.atk + spirit + depth), myDef = Math.round(ts.def + spirit + depth);
    var oppAtk = rung.threat + (style.atk || 0), oppDef = rung.threat + (style.def || 0);
    var net = (myAtk + myDef) - (oppAtk + oppDef);
    var v = net >= 12 ? ['Favourites', 'jt-ok'] : net >= -3 ? ['Even match', 'jt-warn'] : net >= -16 ? ['Underdogs', 'jt-hot'] : ['Massive ask', 'jt-dead'];
    var tired = GA.startersOf(run).filter(function (p) { return GA.blocksOf(p) === 0; });
    render('<div class="wrap">' + topbar('Rung ' + run.rung + (boss ? ' · BOSS' : ''), runMeta(run)) +
      '<div class="prev-grid"><div class="prev-main">' +
        '<div class="brief-head ' + (boss ? 'is-boss' : '') + '" style="--c0:' + rung.colors[0] + ';--c1:' + rung.colors[1] + '"><div class="brief-badge">' + ui.esc(rung.club.slice(0, 3).toUpperCase()) + '</div>' +
          '<div><div class="brief-club">' + ui.esc(rung.club) + (boss ? ' <span class="boss-flag">BOSS</span>' : '') + '</div><div class="brief-season">' + ui.esc(rung.season) + ' · ' + ui.esc(rung.league) + ' · plays ' + ui.esc(style.label) + '</div></div>' +
          '<div class="ovr-badge threat">' + rung.threat + '<span>OVR</span></div></div>' +
        '<div class="profile' + (boss ? ' boss-profile' : '') + '"><div class="profile-h">' + (boss ? 'BOSS' : 'THE OPPOSITION') + '</div><p>' + ui.esc(rung.tagline) + '</p>' + (boss ? '<p class="mut-line">⚡ <b>Boss bonus:</b> beat them to unlock <b>five</b> slot rewards instead of three, and pick two.</p>' : '') + '</div>' +
        '<div class="brief-pitch"><div class="brief-pitch-h">THEIR SHAPE · ' + GA.oppFormation(rung).name + ' · DANGER MAN: ' + ui.esc(rung.danger) + '</div>' + ui.oppPitch(rung) + '</div>' +
      '</div><aside class="prev-side">' +
        '<div class="jobtag ' + v[1] + '"><b>' + v[0] + '</b><span>Attack ' + myAtk + ' vs Defence ' + oppDef + '<br>Attack ' + oppAtk + ' vs Defence ' + myDef + '</span></div>' +
        ui.ladder(run) + lives(run) + perksHTML(run) +
      '</aside></div>' +
      '<div class="brief-pitch-h" style="margin-top:18px">YOUR APPROACH</div>' + ui.mentalityBar(run.mentality) + '<div class="ment-desc">' + ui.esc(GA.mentalityById(run.mentality).desc) + '</div>' +
      ui.matchupTip(run.formation, rung.style) +
      (tired.length ? '<div class="cfg-note warn">🪫 ' + tired.length + ' starter' + (tired.length > 1 ? 's are' : ' is') + ' out of stamina (' + tired.map(function (p) { return ui.lastName(p.n); }).join(', ') + ') — they will perform poorly. Put some fresh legs on the pitch.</div>' : '') +
      '<div class="brief-pitch"><div class="brief-pitch-h">YOUR XI · ' + run.formation.name + ' · ATK ' + myAtk + ' / DEF ' + myDef + (spirit ? ' · <span class="depth-tag">TEAM SPIRIT +' + spirit + '</span>' : '') + (depth ? ' · <span class="depth-tag">DEPTH +' + depth + '</span>' : '') + '</div>' + ui.formationPitch(run.lineup, {}) + '</div>' +
      ui.benchStrip(run.bench, {}) +
      '<div class="result-actions"><button class="cta ghost" data-action="open-tactics">Rotate &amp; tactics</button><button class="cta" data-action="play-match">Play match →</button></div></div>');
  }

  /* ============================================================ MATCH */
  function matchSim() {
    G.screen = 'sim'; startRain();
    var run = G.run, rung = GA.currentRung(run);
    var pub = run.pubTeam || GA.PUB_TEAM;
    G.sim = GA.simMatch({ xi: GA.xiOf(run), formation: run.formation, rung: rung, perks: run.perks, cleared: run.cleared, mentality: run.mentality, squadSize: run.squad.length, seed: run.seed + '-r' + run.rung + '-a' + run.attempt, clubName: pub.club });
    render('<div class="wrap">' + topbar('Matchday', runMeta(run)) +
      '<div class="match-head"><div class="mh-team us"><span class="mh-badge" style="--c0:' + pub.colors[0] + ';--c1:' + pub.colors[1] + '">' + pub.badge + '</span><span class="mh-name">' + ui.esc(pub.club.replace(' FC', '')) + '</span></div>' +
        '<div class="mh-score"><span id="scoreUs">0</span><b>–</b><span id="scoreThem">0</span><div class="mh-clock" id="clock">0\'</div></div>' +
        '<div class="mh-team them"><span class="mh-badge" style="--c0:' + rung.colors[0] + ';--c1:' + rung.colors[1] + '">' + ui.esc(rung.club.slice(0, 3).toUpperCase()) + '</span><span class="mh-name">' + ui.esc(rung.club) + '</span></div></div>' +
      '<div class="simbox"><canvas id="momentum" class="chart momentum"></canvas></div>' +
      '<div class="match-feed" id="feed"><div class="mf-kick">🟢 Kick-off — ' + ui.esc(rung.club) + ' ' + rung.season + ' · you set up to ' + ui.esc(GA.mentalityById(run.mentality).name.toLowerCase()) + '</div></div>' +
      '<button class="cta ghost" data-action="skip-match">Skip to full time →</button></div>');
    animateMatch();
  }
  function animateMatch() { G.htShown = false; G.momentDone = false; G.simShown = 0; G.simUs = 0; G.simThem = 0; playPhase(0, 45); }
  function playPhase(fromMin, toMin) {
    var sim = G.sim, canvas = document.getElementById('momentum');
    var span = Math.max(1, toMin - fromMin), dur = (span / 90) * 4600 + 250, t0 = performance.now();
    if (fromMin === 0) GA.sound.playWhistle();
    function frame(now) {
      var prog = Math.min(1, (now - t0) / dur), minute = Math.floor(fromMin + prog * span);
      if (canvas) ui.drawMomentum(canvas, G.sim, minute);
      var ck = document.getElementById('clock'); if (ck) ck.textContent = minute + "'";
      while (G.simShown < G.sim.events.length && G.sim.events[G.simShown].min <= minute) {
        var e = G.sim.events[G.simShown++];
        if (e.kind === 'goal') { if (e.team === 'us') { G.simUs++; GA.sound.playGoal(); flashScore('scoreUs'); } else { G.simThem++; GA.sound.playConcede(); flashScore('scoreThem'); } var su = document.getElementById('scoreUs'), st = document.getElementById('scoreThem'); if (su) su.textContent = G.simUs; if (st) st.textContent = G.simThem; goalBurst(e.team, e.scorer); }
        addFeed(e);
      }
      var mo = G.sim.moments && G.sim.moments[0];
      if (mo && !G.momentDone && minute > 45 && minute >= mo.min) { if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; } G.momentDone = true; showMoment(mo, minute); return; }
      if (prog < 1) G.raf = requestAnimationFrame(frame);
      else if (toMin >= 90) { GA.sound.playWhistle(); finishMatch(); }
      else halftime();
    }
    G.raf = requestAnimationFrame(frame);
  }
  /* ---- BIG MOMENT: a self-contained gamble mid-second-half ---- */
  function showMoment(m, minute) {
    GA.sound.playWhistle();
    var ck = document.getElementById('clock'); if (ck) ck.textContent = m.min + "'";
    var ov = el('<div class="ht-overlay moment-overlay" id="momentOverlay"><div class="ht-card moment-card ' + m.side + '">' +
      '<div class="mo-tag"><span class="mo-ic">' + m.icon + '</span>' + m.head + ' · ' + m.min + "'</div>" +
      '<div class="mo-prompt">' + ui.esc(m.prompt) + '</div>' +
      '<div class="ht-talks">' + m.options.map(function (o, i) {
        return '<button class="ht-talk mo-opt" data-action="moment-pick" data-opt="' + i + '"><span class="htt-ic">' + (i === 0 ? '➤' : '↩') + '</span><b>' + ui.esc(o.label) + '</b><small>' + ui.esc(o.desc) + '</small></button>';
      }).join('') + '</div></div></div>');
    var wrap = document.querySelector('.wrap'); if (wrap) wrap.appendChild(ov);
  }
  function momentPick(i) {
    if (G.screen !== 'sim') return;
    var m = G.sim.moments && G.sim.moments[0]; if (!m) return;
    var o = m.options[+i] && m.options[+i].out; if (!o) return;
    var ov = document.getElementById('momentOverlay'); if (ov) ov.remove();
    if (o.team === 'us') {
      G.simUs++; GA.sound.playGoal(); flashScore('scoreUs');
      var su = document.getElementById('scoreUs'); if (su) su.textContent = G.simUs;
      if (m.scorer) { G.sim.myScorers = G.sim.myScorers || []; G.sim.myScorers.push(m.scorer); }
    }
    else if (o.team === 'them') { G.simThem++; GA.sound.playConcede(); flashScore('scoreThem'); var st = document.getElementById('scoreThem'); if (st) st.textContent = G.simThem; }
    else GA.sound.playClick();
    var feed = document.getElementById('feed');
    if (feed) { feed.appendChild(el('<div class="mf-row ' + (o.team === 'us' ? 'us' : o.team === 'them' ? 'them' : 'flav') + ' moment"><span class="mf-min">' + m.min + "'</span><span class=\"mf-ic\">" + (o.team === 'us' ? '⚽' : o.team === 'them' ? '⚽' : m.icon) + '</span><span class="mf-txt">' + ui.esc(o.txt) + '</span></div>')); feed.scrollTop = feed.scrollHeight; }
    playPhase(m.min, 90);
  }
  /* ---- HALF TIME: one quick team-talk that re-rolls only the 2nd half ---- */
  function halftime() {
    if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; }
    if (G.htShown) return; G.htShown = true; GA.sound.playWhistle();
    var us = G.simUs, them = G.simThem;
    var read = us > them ? 'You’re ahead — see it out, or go for the kill?' : us < them ? 'You’re behind. Time to gamble?' : 'All square. How do you want the second half?';
    var clk = document.getElementById('clock'); if (clk) clk.textContent = 'HT';
    var ov = el('<div class="ht-overlay" id="htOverlay"><div class="ht-card">' +
      '<div class="ht-h">HALF TIME</div><div class="ht-score">' + us + ' – ' + them + '</div><div class="ht-read">' + read + '</div>' +
      '<div class="ht-talks">' +
        '<button class="ht-talk attack" data-action="ht-talk" data-talk="attack"><span class="htt-ic">⚔️</span><b>Throw everything forward</b><small>More goals — at both ends</small></button>' +
        '<button class="ht-talk steady" data-action="ht-talk" data-talk="steady"><span class="htt-ic">⚖️</span><b>Stick to the plan</b><small>No change — let it play out</small></button>' +
        '<button class="ht-talk defend" data-action="ht-talk" data-talk="defend"><span class="htt-ic">🛡️</span><b>Shut up shop</b><small>Tighten up, protect what you have</small></button>' +
      '</div></div></div>');
    var wrap = document.querySelector('.wrap'); if (wrap) wrap.appendChild(ov);
  }
  function htTalk(talk) {
    if (G.screen !== 'sim' || !G.htShown) return;
    var mod = talk === 'attack' ? { gf: 1.45, ga: 1.32 } : talk === 'defend' ? { gf: 0.72, ga: 0.6 } : { gf: 1, ga: 1 };
    var run = G.run, rung = GA.currentRung(run);
    G.sim = GA.simMatch({ xi: GA.xiOf(run), formation: run.formation, rung: rung, perks: run.perks, cleared: run.cleared, mentality: run.mentality, squadSize: run.squad.length, seed: run.seed + '-r' + run.rung + '-a' + run.attempt, ht: mod });
    // re-anchor playback at the second half (1st-half events are identical & already shown)
    G.simShown = 0; G.simUs = 0; G.simThem = 0;
    G.sim.events.forEach(function (e) { if (e.min <= 45) { G.simShown++; if (e.kind === 'goal') { if (e.team === 'us') G.simUs++; else G.simThem++; } } });
    var ov = document.getElementById('htOverlay'); if (ov) ov.remove();
    var feed = document.getElementById('feed'); if (feed) { feed.appendChild(el('<div class="mf-row flav ht"><span class="mf-min">HT</span><span class="mf-ic">🗣️</span><span class="mf-txt">' + htLine(talk) + '</span></div>')); feed.scrollTop = feed.scrollHeight; }
    GA.sound.playWhistle(); playPhase(46, 90);
  }
  function htLine(t) { return t === 'attack' ? 'You send them out to chase it — everyone forward.' : t === 'defend' ? 'You tell them to dig in and protect it.' : 'You keep the same instructions — steady.'; }
  function addFeed(e) {
    var feed = document.getElementById('feed'); if (!feed) return; var row;
    if (e.kind === 'goal') row = el('<div class="mf-row ' + (e.team === 'us' ? 'us' : 'them') + '"><span class="mf-min">' + e.min + "'</span><span class=\"mf-ic\">⚽</span><span class=\"mf-txt\">" + (e.team === 'us' ? '<b>GOAL!</b> ' : 'Conceded — ') + ui.esc(e.scorer) + (e.team === 'us' ? ' scores' : '') + '</span></div>');
    else row = el('<div class="mf-row flav"><span class="mf-min">' + e.min + "'</span><span class=\"mf-ic\">" + (e.kind === 'save' ? '🧤' : e.kind === 'woodwork' ? '🥅' : '😬') + '</span><span class="mf-txt">' + ui.esc(e.scorer) + ' ' + ui.esc(e.txt || 'goes close') + '</span></div>');
    feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
  }
  function finishMatch() {
    var sim = G.sim;
    GA.finalizeResult(sim, G.simUs, G.simThem); // decide from the LIVE score (HT + any moment)
    var su = document.getElementById('scoreUs'), st = document.getElementById('scoreThem'); if (su) su.textContent = sim.gf; if (st) st.textContent = sim.ga;
    if (sim.pens) {
      var feed = document.getElementById('feed');
      if (feed) feed.appendChild(el('<div class="mf-row pens"><span class="mf-min">FT</span><span class="mf-ic">🥅</span><span class="mf-txt">All square at full time — <b>it\'s penalties</b>.</span></div>'));
      setTimeout(takerPicker, 950); return;
    }
    setTimeout(result, 700);
  }
  function skipMatch() {
    if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; }
    var sim = G.sim;
    GA.finalizeResult(sim, sim.baseGf, sim.baseGa); // skip = base score, no moment, auto takers
    if (sim.pens) { var r = GA.runShootout(sim.penParams, sim.penParams.autoTakers, sim.seed); sim.penKicks = r.penKicks; sim.won = r.won; sim.penScore = r.penScore; return penaltyShootout(); }
    result();
  }

  /* ---- PICK YOUR PENALTY TAKERS — order your five before the shootout ---- */
  function takerPicker() {
    G.screen = 'takerpick'; G.penTakers = []; stopRain();
    var run = G.run, rung = GA.currentRung(run);
    renderTakerPicker(run, rung);
  }
  function takerConfidence(p) { var sho = p.s && p.s[1]; var sk = sho != null ? sho : Math.max(40, GA.ratingOf(p) - 6); return Math.round(sk); }
  function renderTakerPicker(run, rung) {
    var outfield = GA.startersOf(run).filter(function (p) { return p.pos !== 'GK'; });
    var picked = G.penTakers; // array of uids in order
    var slots = '';
    for (var i = 0; i < 5; i++) {
      var uid = picked[i], p = uid ? outfield.filter(function (x) { return x.uid === uid; })[0] : null;
      slots += '<div class="tk-slot' + (p ? ' filled' : '') + '"><span class="tk-num">' + (i + 1) + '</span>' + (p ? '<span class="tk-slot-n">' + ui.esc(ui.lastName(p.n)) + '</span>' : '<span class="tk-slot-empty">—</span>') + '</div>';
    }
    var grid = outfield.map(function (p) {
      var ord = picked.indexOf(p.uid), conf = takerConfidence(p);
      var bar = '<span class="tk-conf"><i style="width:' + Math.min(100, Math.max(8, (conf - 35) * 1.6)) + '%"></i></span>';
      return '<button class="tk-card' + (ord >= 0 ? ' chosen' : '') + ' tier-' + ui.cardTier(p) + '" data-action="taker-add" data-uid="' + p.uid + '">' +
        (ord >= 0 ? '<span class="tk-badge">' + (ord + 1) + '</span>' : '') +
        '<span class="tk-card-pos ' + ui.posClass(p.pos) + '">' + p.pos + '</span>' +
        '<span class="tk-card-n">' + ui.esc(ui.lastName(p.n)) + '</span>' +
        '<span class="tk-card-rt">' + GA.ratingOf(p) + '</span>' + bar + '<small class="tk-conf-l">PK ' + conf + '</small></button>';
    }).join('');
    render('<div class="wrap takerpick-screen">' + topbar('Penalty Shootout', runMeta(run)) +
      '<div class="tk-head"><div class="pens-sub">ALL SQUARE — PENALTIES</div><h2 class="tk-h">Choose your five takers</h2>' +
        '<p class="lead">Tap five players in the order they’ll step up. Your clinical finishers convert more — choose wisely.</p></div>' +
      '<div class="tk-order">' + slots + '</div>' +
      '<div class="tk-grid">' + grid + '</div>' +
      '<div class="tk-actions"><button class="btn" data-action="taker-auto">⚡ Auto-pick best 5</button>' +
        '<button class="cta' + (picked.length < 5 ? ' disabled' : '') + '" data-action="taker-start"' + (picked.length < 5 ? ' disabled' : '') + '>' + (picked.length < 5 ? 'Pick ' + (5 - picked.length) + ' more' : 'To the spot →') + '</button></div></div>');
  }
  function takerAdd(uid) {
    uid = +uid; var i = G.penTakers.indexOf(uid);
    if (i >= 0) G.penTakers.splice(i, 1); else if (G.penTakers.length < 5) { G.penTakers.push(uid); GA.sound.playClick(); }
    renderTakerPicker(G.run, GA.currentRung(G.run));
  }
  function takerAuto() {
    var outfield = GA.startersOf(G.run).filter(function (p) { return p.pos !== 'GK'; }).slice().sort(function (a, b) { return takerConfidence(b) - takerConfidence(a); });
    G.penTakers = outfield.slice(0, 5).map(function (p) { return p.uid; }); GA.sound.playSign();
    renderTakerPicker(G.run, GA.currentRung(G.run));
  }
  function takerStart() {
    if (G.penTakers.length < 5) return;
    var run = G.run, sim = G.sim, outfield = GA.startersOf(run).filter(function (p) { return p.pos !== 'GK'; });
    var byUid = {}; outfield.forEach(function (p) { byUid[p.uid] = p; });
    var chosen = G.penTakers.map(function (u) { var p = byUid[u]; return { n: p.n, skill: takerConfidence(p) }; });
    // the rest of the XI take any sudden-death kicks after the chosen five
    var rest = outfield.filter(function (p) { return G.penTakers.indexOf(p.uid) === -1; }).sort(function (a, b) { return takerConfidence(b) - takerConfidence(a); }).map(function (p) { return { n: p.n, skill: takerConfidence(p) }; });
    var r = GA.runShootout(sim.penParams, chosen.concat(rest), sim.seed);
    sim.penKicks = r.penKicks; sim.won = r.won; sim.penScore = r.penScore;
    penaltyShootout();
  }

  /* ============================================================ PENALTY SHOOTOUT */
  function penaltyShootout() { G.screen = 'pens'; G.penIdx = 0; G.penUs = 0; G.penThem = 0; G.penTick = 0; stopRain(); GA.sound.playWhistle(); renderPens(); }
  function penPip(k, just) { return '<span class="pen-pip ' + (k.scored ? 'scored' : 'missed') + (k.sd ? ' sd' : '') + (just ? ' just' : '') + '">' + (k.scored ? '✓' : '✗') + '</span>'; }
  function penPips(team) {
    var tk = G.sim.penKicks.map(function (k, gi) { return { k: k, gi: gi }; }).filter(function (x) { return x.k.team === team; });
    var html = '';
    // exactly five standard slots — sudden death is NEVER pre-revealed
    for (var i = 0; i < 5; i++) {
      var x = tk[i];
      html += (x && x.gi < G.penIdx) ? penPip(x.k, x.gi === G.penIdx - 1) : '<span class="pen-pip pending"></span>';
    }
    // sudden-death pips appear only once a kick has actually been taken
    for (var j = 5; j < tk.length; j++) { var y = tk[j]; if (y.gi < G.penIdx) html += penPip(y.k, y.gi === G.penIdx - 1); }
    return html;
  }
  function renderPens() {
    var run = G.run, rung = GA.currentRung(run), sim = G.sim, next = sim.penKicks[G.penIdx], done = !next, yourTurn = next && next.team === 'us';
    var pub = run.pubTeam || GA.PUB_TEAM;
    render('<div class="wrap pens-screen">' + topbar('Penalty Shootout', runMeta(run)) +
      '<div class="pens-head"><div class="pens-sub">PENALTIES</div><div class="pens-score" id="penScore"><span>' + G.penUs + '</span><b>–</b><span>' + G.penThem + '</span></div></div>' +
      '<div class="pens-board">' +
        '<div class="pens-row"><span class="pens-team" style="--c0:' + pub.colors[0] + ';--c1:' + pub.colors[1] + '">' + ui.esc(pub.club.toUpperCase().replace(' FC', '')) + '</span><div class="pens-pips">' + penPips('us') + '</div></div>' +
        '<div class="pens-row"><span class="pens-team" style="--c0:' + rung.colors[0] + ';--c1:' + rung.colors[1] + '">' + ui.esc(rung.club.toUpperCase()) + '</span><div class="pens-pips">' + penPips('them') + '</div></div>' +
      '</div>' +
      '<div class="pens-action">' +
        (done ? '<div class="pens-result ' + (sim.won ? 'win' : 'loss') + '">' + (sim.won ? 'YOU WIN ON PENALTIES' : 'HEARTBREAK FROM THE SPOT') + '</div>' +
            '<button class="cta" data-action="pens-continue">' + (sim.won ? 'Climb on →' : 'See how it ended →') + '</button>'
          : yourTurn ? '<div class="pens-prompt"><b>' + ui.esc(ui.lastName(next.taker)) + '</b> steps up.</div><button class="cta pen-fire" data-action="pen-shoot">⚽ TAKE THE KICK</button>'
            : '<div class="pens-prompt them"><b>' + ui.esc(ui.lastName(next.taker)) + '</b> to take it…</div>') +
      '</div></div>');
    if (done) return;
    if (!yourTurn) { var at = ++G.penTick; setTimeout(function () { if (G.screen === 'pens' && G.penTick === at) penShoot(); }, 1000); }
  }
  function penShoot() {
    if (G.screen !== 'pens') return;
    var k = G.sim.penKicks[G.penIdx]; if (!k) return;
    if (k.scored) { if (k.team === 'us') G.penUs++; else G.penThem++; }
    GA.sound.playKick(); // the thwack, then the outcome lands a beat later
    setTimeout(function () { if (k.scored) (k.team === 'us' ? GA.sound.playGoal() : GA.sound.playConcede()); else GA.sound.playSave(); }, 160);
    G.penIdx++; renderPens();
  }

  /* ============================================================ RESULT */
  function result() { if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; } var run = G.run, sim = G.sim, rung = GA.currentRung(run); return sim.won ? winResult(run, sim, rung) : lossResult(run, sim, rung); }
  function breakdown(sim) {
    var f = (sim.factors || []).map(function (x) { return '<li class="' + (x.good ? 'good' : 'bad') + '">' + (x.good ? '✓ ' : '✗ ') + ui.esc(x.t) + '</li>'; }).join('');
    return '<div class="breakdown"><div class="bd-row"><span>Your attack ' + sim.myAtk + ' vs their defence ' + sim.oppDef + '</span><b>' + sim.xgF.toFixed(1) + ' xG</b></div>' +
      '<div class="bd-row"><span>Their attack ' + sim.oppAtk + ' vs your defence ' + sim.myDef + '</span><b>' + sim.xgA.toFixed(1) + ' xG</b></div>' +
      '<div class="bd-row sub"><span>' + sim.possession + '% possession · shots ' + sim.shotsF + '–' + sim.shotsA + '</span></div>' +
      (f ? '<ul class="bd-factors">' + f + '</ul>' : '') + '</div>';
  }
  function winResult(run, sim, rung) {
    G.screen = 'win'; stopRain();
    if (!G.resolved) { GA.onWin(run, sim, rung); G.resolved = true; GA.sound.playStamp(); setTimeout(function () { GA.sound.playSuccess(); }, 130); }
    var line = sim.gf + '–' + sim.ga + (sim.pens ? ' (' + sim.penScore + ' pens)' : '');
    render('<div class="wrap result"><div class="stamp survived">WIN</div>' +
      '<div class="result-tally"><b>' + line + '</b> <small>vs ' + ui.esc(rung.club) + ' ' + ui.esc(rung.season) + (sim.downgraded ? ' · they don\'t lose — you survived on penalties' : '') + '</small></div>' +
      breakdown(sim) +
      (rung.boss ? '<div class="camp-banner">★ <b>Boss beaten.</b> The slot machine drops <b>five</b> rewards — pick two.</div>' : '<div class="cfg-note" style="max-width:560px;margin:14px auto 0">' + (sim.manOfMatch ? '<b>' + ui.esc(sim.manOfMatch) + '</b> the hero. ' : '') + 'Spin the slot machine.</div>') +
      '<div class="result-actions"><button class="cta" data-action="to-loot">Open the slot machine →</button></div></div>');
  }
  function lossResult(run, sim, rung) {
    var res = G.resolved ? G._lossKind : (G._lossKind = GA.onLoss(run, sim, rung)); G.resolved = true;
    if (res === 'replay') return replayScreen(run, sim, rung);
    G.screen = 'death'; stopRain();
    if (!G._recorded) { GA.sound.playStamp(); setTimeout(function () { GA.sound.playFail(); }, 130); var beat = run.cleared >= 9; GA.store.recordRun({ cleared: run.cleared, deathRung: run.rung, reachedBarca: run.cleared >= 5, beatBarca: run.history.some(function (h) { return h.boss && !h.died; }), immortal: beat, drafted: run.drafted, perks: run.perks }); G._recorded = true; }
    deathScreen(run, sim, rung);
  }
  function replayScreen(run, sim, rung) {
    G.screen = 'replay'; stopRain();
    render('<div class="wrap result"><div class="stamp" style="color:var(--acc);border-color:var(--acc)">CUP REPLAY</div>' +
      '<div class="result-tally"><b>' + sim.gf + '–' + sim.ga + '</b> <small>vs ' + ui.esc(rung.club) + ' — but the tie is replayed</small></div>' +
      '<div class="camp-banner">Cup Replay activated. The defeat is wiped. Try Rung ' + run.rung + ' again. No more second chances.</div>' +
      '<div class="result-actions"><button class="cta" data-action="replay-go">Replay the tie →</button></div></div>');
  }
  function deathScreen(run, sim, rung) {
    var beat = run.cleared >= 9, legends = run.drafted.slice().sort(function (a, b) { return GA.ratingOf(b) - GA.ratingOf(a); });
    render('<div class="wrap result"><div class="stamp ' + (beat ? 'survived' : 'down') + '">' + (beat ? 'LEGEND' : 'RUN OVER') + '</div>' +
      '<div class="result-tally"><b data-count="' + run.cleared + '">0</b> rungs cleared <small>fell at Rung ' + run.rung + ' · ' + ui.esc(rung.club) + ' ' + ui.esc(rung.season) + ' · ' + sim.gf + '–' + sim.ga + (sim.pens ? ' (' + sim.penScore + ' pens)' : '') + '</small></div>' +
      '<div class="share"><canvas id="shareCanvas" class="sharecanvas"></canvas><div class="share-btns"><button class="btn" data-action="share-download">Download card</button><button class="btn" data-action="share-copy">Copy image</button><button class="btn" data-action="share-tweet">Copy caption</button></div>' +
        '<div class="share-text" id="shareText">' + ui.esc(shareText(run)) + '</div></div>' +
      '<div class="result-cols"><div class="rcol"><h3 class="rh">The journey</h3>' + journeyHTML(run) + '</div><div class="rcol"><h3 class="rh">Legends raided</h3>' + (legends.length ? '<div class="squad-grid small">' + legends.map(function (p) { return ui.playerCard(p, 'reveal', {}); }).join('') + '</div>' : '<p class="lead">A pure pub-team run. Respect.</p>') + '</div></div>' +
      '<div class="result-actions"><button class="cta" data-action="new-run">Climb again →</button><button class="cta ghost" data-action="go-home">Home</button></div></div>');
    G.shareURL = ui.shareCard(document.getElementById('shareCanvas'), { cleared: run.cleared, deathRung: run.rung, deathClub: rung.club, immortal: beat, lineup: run.lineup, legends: legends, clubName: run.pubTeam ? run.pubTeam.club : 'DOG & DUCK FC' });
  }
  function journeyHTML(run) {
    if (!run.history.length) return '<p class="lead">Knocked out in the first round.</p>';
    return '<ul class="matchlog">' + run.history.map(function (h) { return '<li class="' + (h.died ? 'ml-rescue' : 'ml-win') + '"><span class="ml-gw">R' + h.rung + '</span><span class="ml-fix">' + (h.boss ? '★ ' : '') + ui.esc(h.club) + '</span><span class="ml-score">' + h.gf + '–' + h.ga + (h.pens ? ' (p)' : '') + '</span><span class="ml-txt">' + (h.died ? 'The run ended here.' : 'Cleared') + '</span></li>'; }).join('') + '</ul>';
  }
  function shareText(run) {
    var top = run.drafted.slice().sort(function (a, b) { return GA.ratingOf(b) - GA.ratingOf(a); })[0];
    return 'My pub team reached Rung ' + run.rung + ' of The Gauntlet' + (top ? ', leading ' + top.n + ' (OVR ' + GA.ratingOf(top) + ')' : '') + '. Can you do better?';
  }

  /* ============================================================ SLOT MACHINE (v3) */
  function toLoot() {
    G.screen = 'loot'; G.lootExclude = []; G.rerolled = false; G.lootPicks = [];
    G.lootNeed = G.run.bossBonus ? 2 : 1; startRain();
    showLoot(true);
  }
  function showLoot(spin) {
    var run = G.run, count = run.bossBonus ? 5 : 3;
    G.loot = GA.rollRewards(run, count, G.lootExclude, Math.random);
    var head = run.bossBonus ? 'BOSS BONUS — PICK TWO' : 'PICK ONE';
    render('<div class="wrap">' + topbar('The Slot Machine', runMeta(run)) +
      '<div class="machine slotmachine' + (spin ? ' spinning-hazard' : '') + '"><div class="mach-h" id="slotHead">' + (spin ? 'SCOUTING THE MARKET…' : head) + '</div>' +
        '<div class="slot-reels"><div class="slot-reel" id="sr0">—</div><div class="slot-reel" id="sr1">—</div><div class="slot-reel" id="sr2">—</div></div></div>' +
      '<div class="loot-row n' + count + (spin ? ' pending' : '') + '" id="lootRow">' + G.loot.map(function (o, i) { return ui.rewardCard(o, i, { selected: G.lootPicks.indexOf(i) !== -1 }); }).join('') + '</div>' +
      '<div class="loot-foot" id="lootFoot">' + (G.rerolled ? '<span class="loot-note">re-roll spent</span>' : '<button class="btn" data-action="loot-reroll">↻ Re-roll all (1 left)</button>') +
        (G.lootNeed > 1 ? '<span class="loot-note"> · ' + G.lootPicks.length + '/' + G.lootNeed + ' picked</span>' : '') + '</div></div>');
    if (spin) spinSlots(++spinSeq);
  }
  function spinSlots(seq) {
    var labels = GA.POOL.map(function (p) { return p.n; }).concat(['Cup Replay', 'Full Recharge', 'Giant Killers', 'Coaching']);
    var finals = G.loot.slice(0, 3).map(function (o) { return o.type === 'player' ? o.player.n : o.item.name; });
    var t0 = performance.now(), dur = 1700, locked = [false, false, false], next = [0, 0, 0]; GA.sound.playFlap();
    function frame(now) {
      if (seq !== spinSeq) return; var prog = (now - t0) / dur;
      for (var i = 0; i < 3; i++) { var lockAt = 0.45 + i * 0.18; if (prog >= lockAt && !locked[i]) { locked[i] = true; setReel('sr' + i, finals[i]); GA.sound.playSign(); } else if (!locked[i] && now >= next[i]) { setReel('sr' + i, GA.pick(labels)); next[i] = now + 90; } }
      if (prog < 1) requestAnimationFrame(frame); else finishSpin(seq);
    }
    requestAnimationFrame(frame);
  }
  function setReel(id, text) { var r = document.getElementById(id); if (!r) return; r.textContent = ui.lastName(text); r.classList.remove('flap'); void r.offsetWidth; r.classList.add('flap'); }
  function finishSpin(seq) { if (seq !== spinSeq) return; var m = document.querySelector('.slotmachine'); if (m) m.classList.remove('spinning-hazard'); var h = document.getElementById('slotHead'); if (h) h.textContent = G.run.bossBonus ? 'BOSS BONUS — PICK TWO' : 'PICK ONE'; var row = document.getElementById('lootRow'); if (row) { row.classList.remove('pending'); row.classList.add('reveal-go'); } GA.sound.playSign(); }
  function lootReroll() { if (G.rerolled || G.lootPicks.length) return; G.rerolled = true; G.lootExclude = G.loot.map(function (o) { return o.id; }); GA.sound.playFlap(); showLoot(true); }
  function lootPick(idx) {
    if (G.lootPicks.indexOf(idx) !== -1) return;
    var rw = G.loot[idx], signed = GA.applyReward(G.run, rw);
    G.lootPicks.push(idx);
    if (rw.type === 'player') { GA.sound.playSign(); toast('Signed ' + rw.player.n + ' (' + GA.ratingOf(rw.player) + ') — he\'s on the bench'); }
    else { GA.sound.playSuccess(); toast(rw.item.emoji + ' ' + rw.item.name); }
    if (G.lootPicks.length >= G.lootNeed) { advance(); }
    else { // re-render to mark picked + disable that card; remove reroll
      var row = document.getElementById('lootRow');
      if (row) { var card = row.children[idx]; if (card) { card.classList.add('chosen'); card.setAttribute('disabled', 'true'); } }
      var foot = document.getElementById('lootFoot'); if (foot) foot.innerHTML = '<span class="loot-note">' + G.lootPicks.length + '/' + G.lootNeed + ' picked — choose one more</span>';
    }
  }

  // after the slot machine, drop straight into Tactics so new signings get
  // placed before the next tie — then "Lock it in →" goes to the preview.
  function advance() { GA.advance(G.run); G.picked = null; tactics(false); }

  function showTradeSpin(newPlayer) {
    G.screen = 'trade-spin';
    stopRain();
    render('<div class="wrap">' + topbar('Recycling Hub', runMeta(G.run)) +
      '<div class="machine slotmachine spinning-hazard"><div class="mach-h" id="tradeHead">PROCESSING RECYCLING…</div>' +
        '<div class="slot-reels single"><div class="slot-reel big" id="tradeReel">— — —</div></div>' +
        '<div class="pg-reveal" id="tradeReveal"></div></div></div>');
    spinName('tradeReel', newPlayer.n, function () {
      var signed = GA.signPlayer(G.run, newPlayer);
      GA.sound.playSign();
      var rev = document.getElementById('tradeReveal');
      if (rev) rev.innerHTML = ui.playerCard(signed, 'slot', { cls: 'reveal-card' });
      setTimeout(function () {
        G.tradeMode = false;
        G.tradeSelections = [];
        tactics(!!document.querySelector('[data-action="setup-done"]'));
      }, 1500);
    });
  }

  /* generic readable single-reel spin (slow enough to read the names) */
  function spinName(id, final, onDone) {
    var seq = ++spinSeq, names = GA.POOL.map(function (p) { return p.n; }), t0 = performance.now(), dur = 2300, next = 0;
    (function frame(now) {
      if (seq !== spinSeq) return; var prog = (now - t0) / dur;
      if (prog >= 1) { var r = document.getElementById(id); if (r) { r.textContent = final; r.classList.remove('flap'); void r.offsetWidth; r.classList.add('flap'); } setTimeout(function () { if (seq === spinSeq) onDone(); }, 260); return; }
      if (now >= next) { var rr = document.getElementById(id); if (rr) { rr.textContent = GA.pick(names); rr.classList.remove('flap'); void rr.offsetWidth; rr.classList.add('flap'); } GA.sound.playFlap(); next = now + (110 + prog * prog * 420); }
      requestAnimationFrame(frame);
    })(performance.now());
  }

  /* ============================================================ ROUTER */
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) return; var a = b.getAttribute('data-action'), d = b.dataset;
    if (a !== 'toggle-sound') GA.sound.playClick();
    switch (a) {
      case 'toggle-sound': var m = GA.sound.toggleMute(); document.querySelectorAll('.sound-toggle').forEach(function (x) { x.classList.toggle('on', !m); x.innerHTML = m ? ICONS.soundOff : ICONS.soundOn; }); if (!m) GA.sound.playClick(); break;
      case 'toggle-theme': document.body.classList.toggle('light-theme'); var lt = document.body.classList.contains('light-theme'); localStorage.setItem('gauntlet_theme', lt ? 'light' : 'dark'); ui.applyAccent(localStorage.getItem('gauntlet_accent') || 'gold'); document.querySelectorAll('.theme-toggle').forEach(function (x) { if (x.getAttribute('data-action') === 'toggle-theme') x.innerHTML = lt ? ICONS.moon : ICONS.sun; }); break;
      case 'toggle-themes': var pop = document.getElementById('themePop'); if (pop) pop.classList.toggle('open'); break;
      case 'set-accent': localStorage.setItem('gauntlet_accent', d.id); ui.applyAccent(d.id); document.querySelectorAll('.tp-sw').forEach(function (x) { x.classList.toggle('on', x.dataset.id === d.id); }); break;
      case 'set-bg': localStorage.setItem('gauntlet_bg', d.id); ui.applyBackground(d.id); document.querySelectorAll('.tp-bg').forEach(function (x) { x.classList.toggle('on', x.dataset.id === d.id); }); break;
      case 'toggle-howto': var ht = document.getElementById('howto'); if (ht) ht.classList.toggle('hidden'); break;
      case 'go-home': reset(); home(); break;
      case 'reset-stats': if (window.confirm('Wipe your record?')) { GA.store.reset(); home(); } break;
      case 'begin-run': case 'new-run': startRun(); break;
      case 'select-pub-team':
        var team = G.run.pubTeamChoices[+d.idx];
        GA.setPubTeam(G.run, team);
        intro();
        break;
      case 'reroll-pub-teams':
        var pool = GA.PUB_TEAMS_POOL || [GA.PUB_TEAM];
        var choices = GA.shuffle(pool.slice()).slice(0, 10);
        G.run.pubTeamChoices = choices;
        GA.setPubTeam(G.run, choices[0]);
        intro();
        break;
      case 'forge-cycle': { var bk = d.bank, arr = GA.CLUB_WORDS[bk]; G.build[bk] = (G.build[bk] + (+d.dir) + arr.length) % arr.length; GA.sound.playFlap(); intro(); break; }
      case 'forge-roll': G.build = randomBuild(); GA.sound.playFlap(); intro(); break;
      case 'forge-kit': G.build.kit = +d.idx; GA.sound.playClick(); intro(); break;
      case 'forge-use': GA.setPubTeam(G.run, buildIdentity(G.build)); GA.sound.playSign(); toast('You\'ll lead out ' + buildIdentity(G.build).club); intro(); break;
      case 'to-pregame': pregame(); break;
      case 'pregame-spin': pregameSpin(); break;
      case 'to-setup': G.picked = null; tactics(true); break;
      case 'setup-done': G.picked = null; preview(); break;
      case 'open-tactics': G.picked = null; tactics(false); break;
      case 'pick-formation': GA.setFormation(G.run, d.name); tactics(G.screen === 'tactics' && document.querySelector('[data-action="setup-done"]')); break;
      case 'auto-fill': GA.fitBest(G.run, G.run.formation.name); G.picked = null; tactics(!!document.querySelector('[data-action="setup-done"]')); break;
      case 'tac-slot': tacSlot(+d.slot, !!document.querySelector('[data-action="setup-done"]')); break;
      case 'bench-pick': G.picked = { src: 'bench', idx: +d.idx, p: G.run.bench[+d.idx] }; tactics(!!document.querySelector('[data-action="setup-done"]')); break;
      case 'bench-out': benchOut(+d.slot, !!document.querySelector('[data-action="setup-done"]')); break;
      case 'tactics-done': G.picked = null; preview(); break;
      case 'mentality-set': GA.setMentality(G.run, d.id); preview(); break;
      case 'play-match': matchSim(); break;
      case 'ht-talk': htTalk(d.talk); break;
      case 'moment-pick': momentPick(d.opt); break;
      case 'taker-add': takerAdd(d.uid); break;
      case 'taker-auto': takerAuto(); break;
      case 'taker-start': takerStart(); break;
      case 'skip-match': skipMatch(); break;
      case 'pen-shoot': penShoot(); break;
      case 'pens-continue': result(); break;
      case 'bench-release': benchRelease(+d.idx); break;
      case 'trade-mode-toggle':
        if (G.run.bench.length < 3) { toast('Need at least 3 bench players to recycle.'); }
        else { G.tradeMode = true; G.tradeSelections = []; G.picked = null; tactics(!!document.querySelector('[data-action="setup-done"]')); }
        break;
      case 'trade-toggle':
        var idx = +d.idx;
        var pos = G.tradeSelections.indexOf(idx);
        if (pos >= 0) G.tradeSelections.splice(pos, 1);
        else if (G.tradeSelections.length < 3) G.tradeSelections.push(idx);
        tactics(!!document.querySelector('[data-action="setup-done"]'));
        break;
      case 'trade-cancel':
        G.tradeMode = false; G.tradeSelections = []; tactics(!!document.querySelector('[data-action="setup-done"]'));
        break;
      case 'trade-submit':
        if (G.tradeSelections.length !== 3) return;
        var newPlayer = GA.preGameSpin(G.run, Math.random);
        if (!newPlayer) { toast('No player available in pool.'); return; }
        var toRemoveUids = G.tradeSelections.map(function(idx) { return G.run.bench[idx].uid; });
        G.run.bench = G.run.bench.filter(function(p) { return toRemoveUids.indexOf(p.uid) === -1; });
        G.run.squad = G.run.squad.filter(function(p) { return toRemoveUids.indexOf(p.uid) === -1; });
        G.run.drafted = G.run.drafted.filter(function(p) { return toRemoveUids.indexOf(p.uid) === -1; });
        showTradeSpin(newPlayer);
        break;
      case 'to-loot': toLoot(); break;
      case 'loot-reroll': lootReroll(); break;
      case 'loot-pick': lootPick(+d.idx); break;
      case 'replay-go': G.run.attempt++; G.resolved = false; G._lossKind = null; preview(); break;
      case 'share-download': dl(); break; case 'share-copy': cp(); break; case 'share-tweet': cpText(); break;
      case 'toggle-crt': var crt = document.body.classList.toggle('crt-active'); localStorage.setItem('gauntlet_crt', crt ? 'on' : 'off'); var btn = document.getElementById('crtToggle'); if (btn) { btn.textContent = crt ? 'CRT: ON' : 'CRT: OFF'; btn.classList.toggle('on', crt); } break;
    }
  });

  function startRun() { reset(); G.run = GA.newRun('run-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)); intro(); }
  function dl() { if (!G.shareURL) return; var a = document.createElement('a'); a.href = G.shareURL; a.download = 'gauntlet-run.png'; a.click(); }
  function cp() { var c = document.getElementById('shareCanvas'); if (!c || !c.toBlob || !navigator.clipboard || !window.ClipboardItem) { toast('Copy not supported — use Download.'); return; } c.toBlob(function (bl) { navigator.clipboard.write([new window.ClipboardItem({ 'image/png': bl })]).then(function () { toast('Card copied ✓'); }).catch(function () { toast('Copy blocked — use Download.'); }); }); }
  function cpText() { var t = document.getElementById('shareText'); if (t && navigator.clipboard) navigator.clipboard.writeText(t.textContent).then(function () { toast('Caption copied ✓'); }); }

  /* ---- boot: theme + render ---- */
  if (localStorage.getItem('gauntlet_theme') === 'light') document.body.classList.add('light-theme');
  if (localStorage.getItem('gauntlet_crt') === 'on') document.body.classList.add('crt-active');
  ui.applyAccent(localStorage.getItem('gauntlet_accent') || 'gold');
  ui.applyBackground(localStorage.getItem('gauntlet_bg') || 'floodlit');
  home();
  GA.debug = function () { return G; };
})(window.GA);
