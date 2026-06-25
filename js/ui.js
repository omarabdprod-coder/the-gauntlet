/* ============================================================
   THE GAUNTLET — ui.js  (v3)
   Render helpers: pitch, player cards with real histories, the
   fitness battery, slot rewards, the matchup adviser, the live
   momentum chart, the Frankenstein share card, and the theme kit.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  var ui = {}; GA.ui = ui;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  ui.esc = esc;
  function lastName(n) { var p = String(n).split(' '); return p.length > 1 ? p[p.length - 1] : n; }
  ui.lastName = lastName;
  ui.initials = function (name) {
    var p = String(name).replace(/[^A-Za-zÀ-ÿ' -]/g, '').split(/[\s-]+/).filter(Boolean);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };
  ui.flag = function (nat) { return '<span class="flag">' + esc(nat) + '</span>'; };
  ui.posClass = function (pos) { var l = GA.LINE[pos]; return 'pos-' + (l === 'GK' ? 'gk' : l === 'DEF' ? 'def' : l === 'MID' ? 'mid' : 'att'); };

  /* ---- the 3-block fitness battery ---- */
  ui.battery = function (blocks) {
    blocks = Math.max(0, Math.min(3, blocks));
    var cls = 'b' + blocks, cells = '';
    for (var i = 0; i < 3; i++) cells += '<i class="' + (i < blocks ? 'on' : '') + '"></i>';
    return '<span class="batt ' + cls + '" title="' + (blocks === 0 ? 'Exhausted — heavy rating drop' : blocks + '/3 fitness') + '">' + cells + '</span>';
  };

  /* ---- collectible-card tier from rating + heritage (bronze→silver→gold→icon) ---- */
  ui.cardTier = function (p) {
    var r = GA.ratingOf(p), legend = p.season && p.season !== GA.CUR;
    if (legend || r >= 88) return 'icon';
    if (r >= 80) return 'gold';
    if (r >= 74) return 'silver';
    return 'bronze';
  };

  /* ---- a player as a collectible sticker (squad, reveals, the album) ---- */
  ui.playerCard = function (p, mode, opts) {
    opts = opts || {};
    var tier = ui.cardTier(p), throwback = p.season && p.season !== GA.CUR;
    var arch = p.tag && GA.TAGS[p.tag] ? GA.TAGS[p.tag].k : '';
    return '<button class="sticker tier-' + tier + ' ' + ui.posClass(p.pos) + ' ' + (opts.cls || '') + '" ' +
        (opts.action ? 'data-action="' + opts.action + '"' : '') + ' ' + (opts.data || '') + '>' +
      '<span class="stk-foil" aria-hidden="true"></span><span class="stk-shine" aria-hidden="true"></span>' +
      '<div class="stk-top"><span class="stk-ovr">' + GA.ratingOf(p) + '</span><span class="stk-meta-col"><span class="stk-pos">' + esc(p.pos) + '</span><span class="stk-nat">' + esc(p.nat) + '</span></span></div>' +
      '<div class="stk-photo"><span class="stk-mono">' + ui.initials(p.n) + '</span></div>' +
      '<div class="stk-plate"><div class="stk-name">' + esc(p.n) + '</div>' +
        '<div class="stk-club">' + esc(p.club || '') + (throwback ? '<span class="stk-era">' + esc(p.season) + '</span>' : '') + '</div>' +
        (p._goals ? '<div class="stk-goals" style="font-family:var(--mono);font-size:9.5px;font-weight:700;color:var(--acc);margin-top:3px">⚽ ' + p._goals + ' goal' + (p._goals > 1 ? 's' : '') + '</div>' : '') +
        (arch ? '<div class="stk-arch">' + esc(arch) + '</div>' : '') + '</div>' +
    '</button>';
  };

  /* ---- your formation pitch (ratings + batteries) ---- */
  ui.formationPitch = function (lineup, opts) {
    opts = opts || {};
    var elig = opts.eligible || [];
    var html = '<div class="pitch fp ' + (opts.cls || '') + '">' + pitchLines();
    lineup.forEach(function (sl, i) {
      var isElig = elig.indexOf(i) !== -1, sel = opts.selected === i, p = sl.player;
      var cls = 'pp' + (p ? ' tier-' + ui.cardTier(p) : ' pp-hole') + (isElig ? ' pp-elig' : '') + (sel ? ' pp-sel' : '') + (p && p._drafted ? ' pp-in' : '');
      var act = opts.slotAction ? 'data-action="' + opts.slotAction + '" data-slot="' + i + '"' : '';
      html += '<div class="' + cls + '" style="left:' + sl.x + '%;top:' + sl.y + '%" ' + act + '>';
      if (p) {
        html += '<span class="pp-badge ' + ui.posClass(sl.pos) + '">' + ui.initials(p.n) + '</span>' +
          '<span class="pp-rt">' + GA.ratingOf(p) + '</span>' +
          '<span class="pp-name">' + esc(lastName(p.n)) + '</span>' +
          '<span class="pp-pos">' + esc(sl.pos) + '</span>' +
          (opts.battery !== false ? ui.battery(GA.blocksOf(p)) : '') +
          (p._drafted ? '<span class="pp-tag">★</span>' : '') +
          (opts.removable ? '<button class="pp-x" data-action="bench-out" data-slot="' + i + '" title="To the bench">×</button>' : '');
      } else {
        html += '<span class="pp-badge hole ' + ui.posClass(sl.pos) + '">+</span><span class="pp-name hole-n">' + esc(sl.pos) + '</span><span class="pp-pos">empty</span>';
      }
      html += '</div>';
    });
    return html + '</div>';
  };

  ui.oppPitch = function (rung) {
    var a = GA.autoAssign(rung.xi, GA.oppFormation(rung));
    var html = '<div class="pitch fp opp" style="--c0:' + rung.colors[0] + ';--c1:' + rung.colors[1] + '">' + pitchLines();
    a.slots.forEach(function (sl) {
      var p = sl.player; if (!p) return;
      var danger = p.n === rung.danger;
      html += '<div class="pp ' + (danger ? 'pp-danger' : '') + '" style="left:' + sl.x + '%;top:' + sl.y + '%">' +
        '<span class="pp-badge opp ' + ui.posClass(sl.pos) + '">' + ui.initials(p.n) + '</span>' +
        '<span class="pp-name">' + esc(lastName(p.n)) + '</span><span class="pp-pos">' + esc(sl.pos) + '</span>' +
        (danger ? '<span class="pp-tag danger">DANGER</span>' : '') + '</div>';
    });
    return html + '</div>';
  };
  function pitchLines() {
    return '<div class="pitch-lines"><div class="pitch-line-center"></div><div class="pitch-line-circle"></div>' +
      '<div class="pitch-line-box-top"></div><div class="pitch-line-box-bot"></div><div class="pitch-line-goal-top"></div><div class="pitch-line-goal-bot"></div></div>';
  }
  ui.formationMini = function (f) {
    var h = '<div class="fmini">';
    f.slots.forEach(function (s) { h += '<span class="fdot ' + ui.posClass(s.pos) + '" style="left:' + s.x + '%;top:' + s.y + '%"></span>'; });
    return h + '</div>';
  };

  /* ---- bench strip (battery + ovr) ---- */
  ui.benchStrip = function (bench, opts) {
    opts = opts || {};
    if (!bench.length) return '<div class="benchbar"><div class="benchbar-h">BENCH</div><div class="benchbar-list"><span class="bench-empty">empty bench</span></div></div>';
    
    var hText = 'BENCH (' + bench.length + ')';
    if (opts.tradeMode) {
      hText += ' — SELECT 3 PLAYERS TO RECYCLE (' + opts.tradeSelections.length + '/3)';
    } else if (opts.interactive) {
      hText += ' — TAP A MAN, THEN A GREEN SLOT';
    }

    return '<div class="benchbar"><div class="benchbar-h">' + hText + '</div><div class="benchbar-list">' +
      bench.map(function (p, i) {
        var sel = '';
        var act = '';
        if (opts.tradeMode) {
          sel = opts.tradeSelections.indexOf(i) !== -1 ? ' trade-sel' : '';
          act = 'data-action="trade-toggle" data-idx="' + i + '"';
        } else if (opts.interactive) {
          sel = opts.picked && opts.picked.src === 'bench' && opts.picked.idx === i ? ' sel' : '';
          act = 'data-action="bench-pick" data-idx="' + i + '"';
        }
        var t = (opts.interactive || opts.tradeMode) ? 'div' : 'span';
        return '<' + t + ' class="bench-card tier-' + ui.cardTier(p) + ((opts.interactive || opts.tradeMode) ? '' : ' static') + sel + (p._drafted ? ' signed' : '') + '" ' + act + '>' +
          '<span class="pc-badge ' + ui.posClass(p.pos) + '">' + ui.initials(p.n) + '</span>' +
          '<span class="bench-n">' + esc(lastName(p.n)) + '<small>' + p.pos + ' · ' + GA.ratingOf(p) + (p._goals ? ' · ⚽ ' + p._goals : '') + '</small></span>' +
          ui.battery(GA.blocksOf(p)) +
          (opts.interactive && !opts.tradeMode ? '<button class="bench-x" data-action="bench-release" data-idx="' + i + '" title="Release ' + esc(p.n) + '">×</button>' : '') + '</' + t + '>';
      }).join('') + '</div></div>';
  };

  /* ---- slot reward: a concrete player sticker, or a foil item sticker ---- */
  ui.rewardCard = function (rw, idx, opts) {
    opts = opts || {};
    var act = opts.action || 'loot-pick', sel = opts.selected ? ' chosen' : '';
    if (rw.type === 'item') {
      var it = rw.item;
      return '<button class="sticker item-sticker tier-icon' + sel + '" data-action="' + act + '" data-idx="' + idx + '">' +
        '<span class="stk-foil" aria-hidden="true"></span><span class="stk-shine" aria-hidden="true"></span>' +
        '<div class="stk-item-emoji">' + it.emoji + '</div><div class="stk-plate"><div class="stk-item-name">' + esc(it.name) + '</div>' +
        '<div class="stk-item-desc">' + esc(it.desc) + '</div></div></button>';
    }
    return ui.playerCard(rw.player, 'slot', { action: act, data: 'data-idx="' + idx + '"', cls: 'reward-sticker' + sel });
  };

  /* ---- matchup adviser line ---- */
  ui.matchupTip = function (formation, style) {
    var m = GA.matchupAdvice(formation, style);
    var cls = (m.atk + m.def) > 0.01 ? 'good' : (m.atk + m.def) < -0.01 ? 'bad' : 'neutral';
    return '<div class="matchtip ' + cls + '"><span class="mt-ic">' + (cls === 'good' ? '✓' : cls === 'bad' ? '!' : '–') + '</span>' + esc(m.tip) + '</div>';
  };

  /* ---- pitch-mentality selector ---- */
  ui.mentalityBar = function (current) {
    return '<div class="mentality-bar">' + GA.MENTALITIES.map(function (m) {
      return '<button class="ment' + (current === m.id ? ' on' : '') + '" data-action="mentality-set" data-id="' + m.id + '">' +
        '<span class="ment-emoji">' + m.emoji + '</span><span class="ment-name">' + esc(m.name) + '</span></button>';
    }).join('') + '</div>';
  };

  /* ---- ladder rail ---- */
  ui.ladder = function (run) {
    var top = run.rung + 3, bot = Math.max(1, run.rung - 5), rows = '';
    for (var n = top; n >= bot; n--) {
      var r = GA.rungAt(run, n), state = n < run.rung ? 'done' : (n === run.rung ? 'now' : 'todo'), boss = !!r.boss;
      var name = (state === 'todo' && n > run.rung + 1) ? '???' : r.club;
      rows += '<div class="lad-row ' + state + (boss ? ' boss' : '') + '"><div class="lad-num">' + n + '</div>' +
        '<div class="lad-body"><div class="lad-club">' + esc(name) + (boss ? '<span class="lad-boss">BOSS</span>' : '') + '</div>' +
        '<div class="lad-meta">' + (name === '???' ? 'scouting…' : esc(r.season) + ' · OVR ' + r.threat) + '</div></div>' +
        '<div class="lad-mark">' + (state === 'done' ? '✓' : state === 'now' ? '▶' : '') + '</div></div>';
    }
    return '<div class="ladder">' + rows + '</div>';
  };

  /* ---- live momentum chart ---- */
  ui.drawMomentum = function (canvas, sim, upto) {
    var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    var cs = getComputedStyle(document.body);
    var you = cs.getPropertyValue('--acc').trim() || '#ffd23f', them = cs.getPropertyValue('--red').trim() || '#ff5d5d';
    var light = document.body.classList.contains('light-theme');
    var grid = light ? 'rgba(26,21,12,.10)' : 'rgba(255,255,255,.07)', lab = light ? 'rgba(26,21,12,.5)' : 'rgba(255,255,255,.45)';
    var padL = 8, padR = 8, padT = 8, padB = 18, n = 91, X = function (i) { return padL + (w - padL - padR) * (i / (n - 1)); };
    var midY = padT + (h - padT - padB) * 0.5;
    c.strokeStyle = grid; c.lineWidth = 1; c.beginPath(); c.moveTo(padL, midY); c.lineTo(w - padR, midY); c.stroke();
    var head = upto == null ? n - 1 : Math.min(n - 1, upto);
    c.beginPath(); c.moveTo(X(0), midY);
    for (var i = 0; i <= head; i++) { var y = padT + (h - padT - padB) * (1 - sim.momentum[i]); c.lineTo(X(i), y); }
    c.lineTo(X(head), midY); c.closePath(); c.globalAlpha = 0.16; c.fillStyle = you; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = you; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath();
    for (i = 0; i <= head; i++) { var yy = padT + (h - padT - padB) * (1 - sim.momentum[i]); if (i === 0) c.moveTo(X(i), yy); else c.lineTo(X(i), yy); }
    c.stroke();
    sim.events.forEach(function (e) { if (e.kind !== 'goal' || e.min > head) return; c.fillStyle = e.team === 'us' ? you : them; var gy = e.team === 'us' ? padT + 4 : h - padB - 4; c.beginPath(); c.arc(X(e.min), gy, 3.4, 0, 7); c.fill(); });
    c.fillStyle = lab; c.font = '9px ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
    [0, 45, 90].forEach(function (m) { c.fillText(m + "'", X(m), h - 13); });
  };

  /* ============================================================ SHARE CARD — the Frankenstein XI */
  ui.shareCard = function (canvas, d) {
    var W = 1200, H = 630; canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    var NUM = "'Anton','Arial Narrow',sans-serif", SANS = "'Space Grotesk',system-ui,sans-serif", MONO = "ui-monospace,Menlo,Consolas,monospace";
    var cs = getComputedStyle(document.body), acc = cs.getPropertyValue('--acc').trim() || '#ffd23f';
    var BONE = '#ECE6D6', MUT = '#928c7c', INK = '#0b0b0a';
    var immortal = d.immortal;
    function halftone(x, y, w, h, step, col) { c.fillStyle = col; for (var yy = y; yy < y + h; yy += step) for (var xx = x; xx < x + w; xx += step) c.fillRect(xx, yy, 1, 1); }

    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    halftone(12, 12, W - 24, H - 24, 8, 'rgba(236,230,214,.05)');
    c.strokeStyle = BONE; c.lineWidth = 4; c.strokeRect(18, 18, W - 36, H - 36);

    // ---- left: result ----
    c.fillStyle = BONE; c.font = '700 18px ' + MONO; c.fillText('THE  GAUNTLET', 52, 66);
    c.fillStyle = acc; c.fillRect(52, 78, 158, 6);
    // club name — auto-fit so forged names (e.g. "OLD COCKERMOUTH HOTSPUR") never overflow the column
    var clubName = (d.clubName || 'DOG & DUCK FC').toUpperCase();
    var cnSize = 58; c.font = '400 ' + cnSize + 'px ' + NUM;
    while (cnSize > 26 && c.measureText(clubName).width > 466) { cnSize -= 2; c.font = '400 ' + cnSize + 'px ' + NUM; }
    c.fillStyle = BONE; c.fillText(clubName, 50, 146);
    // giant cleared number, double-printed
    c.font = '400 196px ' + NUM;
    c.fillStyle = BONE; c.fillText(String(d.cleared), 58, 352);
    c.fillStyle = acc; c.fillText(String(d.cleared), 50, 344);
    c.fillStyle = BONE; c.font = '700 24px ' + MONO; c.fillText('RUNGS CLEARED', 54, 388);
    var fellLine = (immortal ? 'IMMORTAL · CONQUERED THE CLIMB' : ('FELL AT RUNG ' + d.deathRung + (d.deathClub ? '  ·  ' + d.deathClub.toUpperCase() : '')));
    var flSize = 20; c.font = '700 ' + flSize + 'px ' + MONO;
    while (flSize > 13 && c.measureText(fellLine).width > 462) { flSize -= 1; c.font = '700 ' + flSize + 'px ' + MONO; }
    c.fillStyle = MUT; c.fillText(fellLine, 54, 420);
    if (d.legends && d.legends.length) {
      c.fillStyle = MUT; c.font = '700 15px ' + MONO; c.fillText('LEGENDS RAIDED', 52, 474);
      var y = 488;
      d.legends.slice(0, 3).forEach(function (p) {
        var hi = ui.cardTier(p) === 'icon' || ui.cardTier(p) === 'gold';
        c.strokeStyle = BONE; c.lineWidth = 2; c.strokeRect(52, y, 436, 36);
        c.fillStyle = BONE; c.font = '800 19px ' + SANS; c.fillText(lastName(p.n).toUpperCase().slice(0, 22), 64, y + 25);
        c.fillStyle = hi ? acc : BONE; c.font = '400 22px ' + NUM; c.textAlign = 'right'; c.fillText(GA.ratingOf(p), 478, y + 26); c.textAlign = 'left';
        y += 44;
      });
    }

    // ---- right: the XI board ----
    var px = 548, py = 72, pw = 604, ph = 446;
    c.fillStyle = acc; c.fillRect(px + 9, py + 9, pw, ph);
    c.fillStyle = '#0e160d'; c.fillRect(px, py, pw, ph);
    halftone(px + 6, py + 6, pw - 12, ph - 12, 8, 'rgba(236,230,214,.04)');
    c.strokeStyle = BONE; c.lineWidth = 3; c.strokeRect(px, py, pw, ph);
    c.strokeStyle = 'rgba(236,230,214,.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py + ph / 2); c.lineTo(px + pw, py + ph / 2); c.stroke();
    c.strokeRect(px + pw / 2 - 34, py + ph / 2 - 34, 68, 68);
    c.fillStyle = acc; c.font = '700 15px ' + MONO; c.fillText('THE FRANKENSTEIN XI', px + 18, py + 30);
    (d.lineup || []).forEach(function (sl) {
      if (!sl.player) return;
      var x = px + pw * (sl.x / 100), yy = py + 36 + (ph - 62) * (sl.y / 100);
      var hi = ui.cardTier(sl.player) === 'icon' || ui.cardTier(sl.player) === 'gold', col = hi ? acc : BONE;
      c.fillStyle = INK; c.fillRect(x - 17, yy - 17, 34, 34);
      c.strokeStyle = col; c.lineWidth = 2.5; c.strokeRect(x - 17, yy - 17, 34, 34);
      c.fillStyle = col; c.font = '400 18px ' + NUM; c.textAlign = 'center'; c.fillText(GA.ratingOf(sl.player), x, yy + 7);
      c.fillStyle = BONE; c.font = '700 11px ' + MONO; c.fillText(lastName(sl.player.n).toUpperCase().slice(0, 11), x, yy + 32);
      c.textAlign = 'left';
    });
    // stamp
    var stamp = immortal ? 'IMMORTAL' : 'RUN OVER', sc2 = immortal ? '#36d399' : '#ff5e57';
    c.save(); c.translate(px + pw - 28, py + ph - 6); c.rotate(-0.04);
    c.font = '400 32px ' + NUM; c.textAlign = 'right'; var sw = c.measureText(stamp).width;
    c.fillStyle = INK; c.fillRect(-sw - 24, -36, sw + 28, 48);
    c.strokeStyle = sc2; c.lineWidth = 3.5; c.strokeRect(-sw - 24, -36, sw + 28, 48);
    c.fillStyle = sc2; c.fillText(stamp, -11, 1); c.restore(); c.textAlign = 'left';
    c.fillStyle = MUT; c.font = '700 15px ' + MONO; c.textAlign = 'right'; c.fillText('ONE PUB TEAM · EVERY LEGEND IN HISTORY', W - 52, H - 36); c.textAlign = 'left';
    return canvas.toDataURL('image/png');
  };
  function lineColor(pos, cs) { var l = GA.LINE[pos]; var v = l === 'GK' ? '--gk' : l === 'DEF' ? '--def' : l === 'MID' ? '--mid' : '--att'; return (cs.getPropertyValue(v).trim() || '#ffd23f'); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  ui.ordinal = ordinal;

  /* ============================================================ THEME KIT */
  GA.THEMES = [
    {
      id: 'gold',
      name: 'Hi-Vis Gold',
      glow: 'rgba(255,210,63,.22)',
      ink: '#171204',
      dark: {
        '--bg': '#0b0b0a', '--bg2': '#131312', '--panel': '#151513', '--panel2': '#1c1c19',
        '--ink': '#ECE6D6', '--ink2': '#A6A192', '--ink3': '#6c685c',
        '--line': 'rgba(236,230,214,.16)', '--line2': 'rgba(236,230,214,.32)',
        '--grass': '#13201a', '--grass2': '#0f1a15', '--chalk': 'rgba(236,230,214,.22)',
        '--edge': '#ECE6D6', '--acc': '#ffd23f', '--acc-soft': 'rgba(255,210,63,.10)',
        '--cta-bg': '#ffd23f', '--cta-ink': '#171204'
      },
      light: {
        '--bg': '#E7E0CC', '--bg2': '#ddd5bf', '--panel': '#F4EEDC', '--panel2': '#ebe3cd',
        '--ink': '#14120B', '--ink2': '#54503f', '--ink3': '#88826c',
        '--line': 'rgba(20,18,11,.18)', '--line2': 'rgba(20,18,11,.42)',
        '--grass': '#3f8a54', '--grass2': '#37804b', '--chalk': 'rgba(255,255,255,.5)',
        '--edge': '#14120B', '--acc': '#c29000', '--acc-soft': 'rgba(194,144,0,.10)',
        '--cta-bg': '#c29000', '--cta-ink': '#fffdf6'
      }
    },
    {
      id: 'emerald',
      name: 'Touchline',
      glow: 'rgba(54,211,153,.22)',
      ink: '#04231a',
      dark: {
        '--bg': '#060b09', '--bg2': '#0e1511', '--panel': '#101915', '--panel2': '#16221c',
        '--ink': '#DDECE6', '--ink2': '#92A69F', '--ink3': '#5C6C66',
        '--line': 'rgba(221,236,230,.16)', '--line2': 'rgba(221,236,230,.32)',
        '--grass': '#071510', '--grass2': '#040f0c', '--chalk': 'rgba(221,236,230,.22)',
        '--edge': '#DDECE6', '--acc': '#36d399', '--acc-soft': 'rgba(54,211,153,.10)',
        '--cta-bg': '#36d399', '--cta-ink': '#04231a'
      },
      light: {
        '--bg': '#CCDED5', '--bg2': '#bfd1c8', '--panel': '#DBEDE3', '--panel2': '#cfded5',
        '--ink': '#08140F', '--ink2': '#3F544B', '--ink3': '#6B8277',
        '--line': 'rgba(8,20,15,.18)', '--line2': 'rgba(8,20,15,.42)',
        '--grass': '#2b6d3d', '--grass2': '#256136', '--chalk': 'rgba(255,255,255,.5)',
        '--edge': '#08140F', '--acc': '#178c5d', '--acc-soft': 'rgba(23,140,93,.10)',
        '--cta-bg': '#178c5d', '--cta-ink': '#fffdf6'
      }
    },
    {
      id: 'crimson',
      name: 'Matchday Red',
      glow: 'rgba(255,94,87,.22)',
      ink: '#2a0606',
      dark: {
        '--bg': '#0d0707', '--bg2': '#180f0f', '--panel': '#1d1212', '--panel2': '#261a1a',
        '--ink': '#ECE0D6', '--ink2': '#A6978E', '--ink3': '#6C615A',
        '--line': 'rgba(236,224,214,.16)', '--line2': 'rgba(236,224,214,.32)',
        '--grass': '#1c1212', '--grass2': '#150d0d', '--chalk': 'rgba(236,224,214,.22)',
        '--edge': '#ECE0D6', '--acc': '#ff5e57', '--acc-soft': 'rgba(255,94,87,.10)',
        '--cta-bg': '#ff5e57', '--cta-ink': '#2a0606'
      },
      light: {
        '--bg': '#EADBCF', '--bg2': '#ddcebf', '--panel': '#F7EADF', '--panel2': '#ede0d5',
        '--ink': '#1A0A08', '--ink2': '#5A4542', '--ink3': '#8A7470',
        '--line': 'rgba(26,10,8,.18)', '--line2': 'rgba(26,10,8,.42)',
        '--grass': '#7e2b24', '--grass2': '#70251f', '--chalk': 'rgba(255,255,255,.5)',
        '--edge': '#1A0A08', '--acc': '#bf3226', '--acc-soft': 'rgba(191,50,38,.10)',
        '--cta-bg': '#bf3226', '--cta-ink': '#fffdf6'
      }
    },
    {
      id: 'ice',
      name: 'Sky Blue',
      glow: 'rgba(90,184,255,.22)',
      ink: '#04203a',
      dark: {
        '--bg': '#06090e', '--bg2': '#0d1219', '--panel': '#101720', '--panel2': '#17212d',
        '--ink': '#D6E3EC', '--ink2': '#8EA2B0', '--ink3': '#596C7C',
        '--line': 'rgba(214,227,236,.16)', '--line2': 'rgba(214,227,236,.32)',
        '--grass': '#091823', '--grass2': '#06121b', '--chalk': 'rgba(214,227,236,.22)',
        '--edge': '#D6E3EC', '--acc': '#5ab8ff', '--acc-soft': 'rgba(90,184,255,.10)',
        '--cta-bg': '#5ab8ff', '--cta-ink': '#04203a'
      },
      light: {
        '--bg': '#CFDCE7', '--bg2': '#c0cdd8', '--panel': '#DCEDF7', '--panel2': '#cfdee7',
        '--ink': '#08101A', '--ink2': '#3C4E5E', '--ink3': '#6E8092',
        '--line': 'rgba(8,16,26,.18)', '--line2': 'rgba(8,16,26,.42)',
        '--grass': '#205375', '--grass2': '#1b4765', '--chalk': 'rgba(255,255,255,.5)',
        '--edge': '#08101A', '--acc': '#176bcc', '--acc-soft': 'rgba(23,107,204,.10)',
        '--cta-bg': '#176bcc', '--cta-ink': '#fffdf6'
      }
    },
    {
      id: 'violet',
      name: 'Floodlight',
      glow: 'rgba(176,123,255,.22)',
      ink: '#1a0a33',
      dark: {
        '--bg': '#0a060f', '--bg2': '#110d19', '--panel': '#151020', '--panel2': '#1d162d',
        '--ink': '#E7D6EC', '--ink2': '#A98EB0', '--ink3': '#72597C',
        '--line': 'rgba(231,214,236,.16)', '--line2': 'rgba(231,214,236,.32)',
        '--grass': '#1c1030', '--grass2': '#160c26', '--chalk': 'rgba(231,214,236,.22)',
        '--edge': '#E7D6EC', '--acc': '#b07bff', '--acc-soft': 'rgba(176,123,255,.10)',
        '--cta-bg': '#b07bff', '--cta-ink': '#1a0a33'
      },
      light: {
        '--bg': '#DFCFE7', '--bg2': '#d0c0d8', '--panel': '#EDDCF7', '--panel2': '#dfcfe7',
        '--ink': '#12081A', '--ink2': '#4A3C5E', '--ink3': '#7C6E92',
        '--line': 'rgba(18,8,26,.18)', '--line2': 'rgba(18,8,26,.42)',
        '--grass': '#5e3294', '--grass2': '#512a80', '--chalk': 'rgba(255,255,255,.5)',
        '--edge': '#12081A', '--acc': '#7f1dcd', '--acc-soft': 'rgba(127,29,205,.10)',
        '--cta-bg': '#7f1dcd', '--cta-ink': '#fffdf6'
      }
    }
  ];
  GA.BACKGROUNDS = [
    { id: 'floodlit', name: 'Floodlit' },
    { id: 'pitch',    name: 'Pitch Stripes' },
    { id: 'noir',     name: 'Noir' },
    { id: 'terrace',  name: 'Terrace' }
  ];
  ui.applyAccent = function (id) {
    var t = GA.THEMES.filter(function (x) { return x.id === id; })[0] || GA.THEMES[0];
    var r = document.documentElement.style;
    var light = document.body.classList.contains('light-theme');
    var cfg = light ? t.light : t.dark;
    Object.keys(cfg).forEach(function (key) {
      r.setProperty(key, cfg[key]);
    });
    r.setProperty('--gold', cfg['--acc']);
    r.setProperty('--cta-glow', t.glow);
    r.setProperty('--mid', cfg['--acc']);
  };
  ui.applyBackground = function (id) { document.body.setAttribute('data-bg', id); };
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  ui.themePicker = function (accent, bg) {
    var isLight = document.body.classList.contains('light-theme');
    var crtActive = document.body.classList.contains('crt-active');
    return '<div class="theme-pop" id="themePop">' +
      '<div class="tp-h">ACCENT</div><div class="tp-row">' + GA.THEMES.map(function (t) {
        var c = isLight ? t.light['--acc'] : t.dark['--acc'];
        return '<button class="tp-sw' + (accent === t.id ? ' on' : '') + '" data-action="set-accent" data-id="' + t.id + '" title="' + t.name + '" style="background:' + c + '"></button>';
      }).join('') + '</div>' +
      '<div class="tp-h">BACKDROP</div><div class="tp-row bg">' + GA.BACKGROUNDS.map(function (b) { return '<button class="tp-bg' + (bg === b.id ? ' on' : '') + '" data-action="set-bg" data-id="' + b.id + '">' + esc(b.name) + '</button>'; }).join('') + '</div>' +
      '<div class="tp-h">CRT SCREEN</div><div class="tp-row">' +
      '<button class="tp-bg' + (crtActive ? ' on' : '') + '" data-action="toggle-crt" id="crtToggle">' + (crtActive ? 'CRT: ON' : 'CRT: OFF') + '</button></div></div>';
  };

})(window.GA);
