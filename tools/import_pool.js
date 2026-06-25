/* ============================================================
   THE GAUNTLET — tools/import_pool.js
   Re-runnable importer. Reads every CSV in data/csv/, cleans the
   real-world quirks (missing/repeated headers, blank rows, empty
   NAT column, anonymised & abbreviated club names), derives a play
   archetype tag from the 6 sub-stats, dedupes by name, skips names
   already curated in data.js (so those keep their nationality), and
   writes js/players_generated.js which appends to GA.POOL / GA.FLAVOR.

   Run:  node tools/import_pool.js
   Add more leagues later by dropping their CSVs into data/csv/.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(ROOT, 'data', 'csv');
const OUT = path.join(ROOT, 'js', 'players_generated.js');
const CUR = '2025/26';

/* ---- club normalisation: de-anonymise (Serie A licensing) + tidy casing/abbreviations ---- */
const CLUB = {
  // Ligue 1
  'Paris SG': 'Paris Saint-Germain', 'Om': 'Marseille', 'Ol': 'Lyon', 'As Monaco': 'Monaco',
  'Paris Fc': 'Paris FC', 'Stade Rennais Fc': 'Rennes', 'Ogc Nice': 'Nice', 'Losc Lille': 'Lille',
  'Rc Lens': 'Lens', 'Strasbourg': 'Strasbourg', 'Toulouse Fc': 'Toulouse', 'Stade Brestois 29': 'Brest',
  'Fc Nantes': 'Nantes', 'Angers Sco': 'Angers', 'Havre Ac': 'Le Havre', 'Aj Auxerre': 'Auxerre',
  'Fc Metz': 'Metz', 'Fc Lorient': 'Lorient',
  // La Liga
  'Real Madrid': 'Real Madrid', 'Fc Barcelona': 'Barcelona', 'Atletico De Madrid': 'Atlético Madrid',
  'Athletic Club': 'Athletic Club', 'Real Betis': 'Real Betis', 'Villarreal Cf': 'Villarreal',
  'Celta': 'Celta Vigo', 'Real Sociedad': 'Real Sociedad', 'Ca Osasuna': 'Osasuna',
  'Rayo Vallecano': 'Rayo Vallecano', 'Getafe Cf': 'Getafe', 'Rcd Mallorca': 'Mallorca',
  'Valencia Cf': 'Valencia', 'Girona Fc': 'Girona', 'Sevilla Fc': 'Sevilla', 'Rcd Espanyol': 'Espanyol',
  'D Alaves': 'Alavés', 'Elche Cf': 'Elche', 'Levante Ud': 'Levante', 'R Oviedo': 'Real Oviedo',
  // Premier League
  'AFC Bournemouth': 'Bournemouth', 'Wolverhampton Wanderers': 'Wolves',
  'Brighton & Hove Albion': 'Brighton',
  // Serie A (anonymised → real)
  'Lombardia FC': 'Internazionale', 'Milano FC': 'AC Milan', 'SSC Napoli': 'Napoli', 'AS Roma': 'Roma',
  'Bergamo Calcio': 'Atalanta', 'Latium': 'Lazio', 'Hellas Verona': 'Verona',
  // Bundesliga
  'FC Bayern Munchen': 'Bayern Munich', 'Leverkusen': 'Bayer Leverkusen', 'VfB Stuttgart': 'Stuttgart',
  'TSG Hoffenheim': 'Hoffenheim', 'Frankfurt': 'Eintracht Frankfurt', "M'gladbach": "Borussia M'gladbach",
  'SC Freiburg': 'Freiburg', 'VfL Wolfsburg': 'Wolfsburg', 'SV Werder Bremen': 'Werder Bremen',
  '1. FSV Mainz 05': 'Mainz', '1. FC Koln': 'Köln', 'FC Augsburg': 'Augsburg', 'Hamburger SV': 'Hamburg',
  'FC St. Pauli': 'St. Pauli'
};
/* ---- English EFL clubs (tiers 2-4): slug → [displayName, league, tier(1=L2,2=L1,3=Champ), c0, c1].
   These carry FULL squads in the source, so the game fields their REAL XIs. ---- */
const SLUG = {
  // Championship (tier 3)
  'birmingham-city': ['Birmingham City','Championship',3,'#1a3a8f','#ffffff'],
  'blackburn-rovers': ['Blackburn Rovers','Championship',3,'#009ee0','#ffffff'],
  'bristol-city': ['Bristol City','Championship',3,'#e21c38','#ffffff'],
  'charlton-ath': ['Charlton Athletic','Championship',3,'#d3001c','#ffffff'],
  'coventry-city': ['Coventry City','Championship',3,'#6cabdd','#ffffff'],
  'derby-county': ['Derby County','Championship',3,'#ffffff','#000000'],
  'hull-city': ['Hull City','Championship',3,'#f5a01a','#000000'],
  'ipswich': ['Ipswich Town','Championship',3,'#0033a0','#ffffff'],
  'leicester-city': ['Leicester City','Championship',3,'#0053a0','#fdbe11'],
  'middlesbrough': ['Middlesbrough','Championship',3,'#d50000','#ffffff'],
  'millwall': ['Millwall','Championship',3,'#001d5e','#ffffff'],
  'norwich': ['Norwich City','Championship',3,'#00a14e','#fff200'],
  'oxford-united': ['Oxford United','Championship',3,'#fde100','#001b5e'],
  'portsmouth': ['Portsmouth','Championship',3,'#001489','#ffffff'],
  'preston': ['Preston North End','Championship',3,'#ffffff','#1e3a8a'],
  'qpr': ['Queens Park Rangers','Championship',3,'#1d5ba6','#ffffff'],
  'sheffield-utd': ['Sheffield United','Championship',3,'#ee2737','#ffffff'],
  'sheffield-wed': ['Sheffield Wednesday','Championship',3,'#0066b3','#ffffff'],
  'southampton': ['Southampton','Championship',3,'#d71920','#ffffff'],
  'stoke-city': ['Stoke City','Championship',3,'#e03a3e','#ffffff'],
  'swansea-city': ['Swansea City','Championship',3,'#ffffff','#000000'],
  'watford': ['Watford','Championship',3,'#fbee23','#ed2127'],
  'west-brom': ['West Bromwich Albion','Championship',3,'#0a1f5c','#ffffff'],
  'wrexham': ['Wrexham','Championship',3,'#d80000','#ffffff'],
  // League One (tier 2)
  'afc-wimbledon': ['AFC Wimbledon','League One',2,'#1c4096','#fff200'],
  'barnsley': ['Barnsley','League One',2,'#d50032','#ffffff'],
  'blackpool': ['Blackpool','League One',2,'#f68712','#ffffff'],
  'bolton': ['Bolton Wanderers','League One',2,'#ffffff','#14306b'],
  'bradford-city': ['Bradford City','League One',2,'#7c2c3b','#fbb20a'],
  'burton-albion': ['Burton Albion','League One',2,'#fff200','#000000'],
  'cardiff-city': ['Cardiff City','League One',2,'#d11524','#003b7b'],
  'doncaster': ['Doncaster Rovers','League One',2,'#d3001c','#ffffff'],
  'exeter-city': ['Exeter City','League One',2,'#c8102e','#ffffff'],
  'huddersfield': ['Huddersfield Town','League One',2,'#0072ce','#ffffff'],
  'leyton-orient': ['Leyton Orient','League One',2,'#d50000','#ffffff'],
  'lincoln-city': ['Lincoln City','League One',2,'#d3001c','#ffffff'],
  'luton-town': ['Luton Town','League One',2,'#f5821f','#13284b'],
  'mansfield-town': ['Mansfield Town','League One',2,'#f9a01b','#003a70'],
  'northampton': ['Northampton Town','League One',2,'#7c2c3b','#ffffff'],
  'peterborough': ['Peterborough United','League One',2,'#0066b3','#ffffff'],
  'plymouth-argyle': ['Plymouth Argyle','League One',2,'#016938','#ffffff'],
  'port-vale': ['Port Vale','League One',2,'#ffffff','#000000'],
  'reading': ['Reading','League One',2,'#004494','#ffffff'],
  'rotherham-utd': ['Rotherham United','League One',2,'#d3001c','#ffffff'],
  'stevenage': ['Stevenage','League One',2,'#c8102e','#ffffff'],
  'stockport': ['Stockport County','League One',2,'#003399','#ffffff'],
  'wigan-athletic': ['Wigan Athletic','League One',2,'#1d5ba6','#ffffff'],
  'wycombe': ['Wycombe Wanderers','League One',2,'#0e4c92','#a3c1e0'],
  // League Two (tier 1)
  'accrington': ['Accrington Stanley','League Two',1,'#d3001c','#ffffff'],
  'barnet': ['Barnet','League Two',1,'#f57f17','#000000'],
  'barrow': ['Barrow','League Two',1,'#ffffff','#0033a0'],
  'bristol-rovers': ['Bristol Rovers','League Two',1,'#004a97','#ffffff'],
  'bromley-fc': ['Bromley','League Two',1,'#ffffff','#000000'],
  'cambridge-utd': ['Cambridge United','League Two',1,'#f5a01a','#000000'],
  'cheltenham-town': ['Cheltenham Town','League Two',1,'#d3001c','#ffffff'],
  'chesterfield': ['Chesterfield','League Two',1,'#005daa','#ffffff'],
  'colchester': ['Colchester United','League Two',1,'#0066b3','#ffffff'],
  'crawley-town': ['Crawley Town','League Two',1,'#d3001c','#ffffff'],
  'crewe-alexandra': ['Crewe Alexandra','League Two',1,'#d3001c','#ffffff'],
  'fleetwood-town': ['Fleetwood Town','League Two',1,'#d3001c','#ffffff'],
  'gillingham': ['Gillingham','League Two',1,'#0033a0','#ffffff'],
  'grimsby-town': ['Grimsby Town','League Two',1,'#000000','#ffffff'],
  'harrogate-town': ['Harrogate Town','League Two',1,'#fff200','#000000'],
  'mk-dons': ['MK Dons','League Two',1,'#ffffff','#e1b522'],
  'newport-county': ['Newport County','League Two',1,'#f5a01a','#000000'],
  'notts-county': ['Notts County','League Two',1,'#000000','#ffffff'],
  'oldham-athletic': ['Oldham Athletic','League Two',1,'#004a97','#ffffff'],
  'salford-city': ['Salford City','League Two',1,'#f68712','#000000'],
  'shrewsbury': ['Shrewsbury Town','League Two',1,'#003a70','#fbb20a'],
  'swindon-town': ['Swindon Town','League Two',1,'#d3001c','#ffffff'],
  'tranmere-rovers': ['Tranmere Rovers','League Two',1,'#ffffff','#0033a0'],
  'walsall': ['Walsall','League Two',1,'#d3001c','#ffffff']
};

function titleCase(s) { return s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1)); }
function normClub(raw) {
  const k = (raw || '').trim();
  if (SLUG[k]) return SLUG[k][0];
  if (CLUB[k]) return CLUB[k];
  return k ? titleCase(k) : '';
}

const VALID_POS = new Set(['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF']);
const LINE = { GK:'GK', CB:'DEF',LB:'DEF',RB:'DEF',LWB:'DEF',RWB:'DEF',
  CDM:'MID',CM:'MID',CAM:'MID',LM:'MID',RM:'MID', LW:'ATT',RW:'ATT',ST:'ATT',CF:'ATT' };

/* ---- derive an archetype tag from {pac,sho,pas,dri,def,phy} + position ----
   matches the vocabulary in data.js GA.TAGS:
   GUN finisher · CREATE creator · MAESTRO playmaker · ENGINE box-to-box
   MUD destroyer · ROCK defender · SIEGE keeper ---- */
function deriveTag(pos, s) {
  const [pac, sho, pas, dri, def, phy] = s;
  const line = LINE[pos];
  if (line === 'GK') return 'SIEGE';
  if (line === 'DEF') {
    // marauding full-back with real end product → creator, else rock
    if ((pos === 'LB' || pos === 'RB' || pos === 'LWB' || pos === 'RWB') && dri >= 78 && pas >= 76 && pac >= 82) return 'CREATE';
    return 'ROCK';
  }
  if (line === 'ATT') {
    if (pos === 'ST' || pos === 'CF') return (sho >= dri || sho >= 78) ? 'GUN' : 'CREATE';
    // wingers: a poacher-winger with big shooting → finisher, else creator
    return (sho >= 80 && sho >= pas) ? 'GUN' : 'CREATE';
  }
  // MID
  if (pos === 'CDM') return def >= 74 ? 'MUD' : 'ENGINE';
  if (pos === 'CAM') return pas >= 82 ? 'MAESTRO' : 'CREATE';
  // CM / LM / RM
  if (pos === 'LM' || pos === 'RM') return (sho >= 78 && sho >= pas) ? 'GUN' : 'CREATE';
  // CM
  if (pas >= 82 && dri >= 80) return 'MAESTRO';
  if (def >= 76) return 'ENGINE';
  return 'CREATE';
}

/* ---- a few curated stars appear under a different spelling in the CSV;
   alias the CSV spelling so we don't import them a SECOND time as a
   different person (curated keeps the nationality / better tag) ---- */
const ALIAS = ['Vini Jr.', 'Gabriel', 'Ronald Araujo', 'Palhinha'];

/* ---- pull names already curated in data.js so we don't duplicate them
   (those keep their hand-set nationality / peak season / tag) ---- */
function curatedNames() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const names = new Set(ALIAS);
  const re = /P\('((?:\\'|[^'])*)'/g; let m;
  while ((m = re.exec(src))) names.add(m[1].replace(/\\'/g, "'"));
  return names;
}

/* ---- parse one CSV ---- */
function parseCsv(file) {
  const rows = [];
  const text = fs.readFileSync(file, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const f = raw.split(',');
    if (f.length < 6) continue;
    const player = (f[1] || '').trim();
    const pos = (f[4] || '').trim();
    const ovr = parseInt((f[5] || '').trim(), 10);
    if (!player || player === 'PLAYER') continue;       // header / junk
    if (!VALID_POS.has(pos)) continue;                   // header variant / bad row
    if (!Number.isFinite(ovr) || ovr < 40 || ovr > 99) continue;
    const club = normClub(f[3]);
    const stat = i => { const v = parseInt((f[i] || '').trim(), 10); return Number.isFinite(v) ? v : 0; };
    const s = [stat(6), stat(7), stat(8), stat(9), stat(10), stat(11)]; // PAC SHO PAS DRI DEF PHY
    rows.push({ n: player, pos, ovr, club, s, tag: deriveTag(pos, s) });
  }
  return rows;
}

/* ---- main ---- */
const skip = curatedNames();
const files = fs.readdirSync(CSV_DIR).filter(f => /\.csv$/i.test(f)).sort();
const byName = new Map();          // name -> best row
const perFile = {};
let collisions = 0, skipped = 0;

for (const file of files) {
  const rows = parseCsv(path.join(CSV_DIR, file));
  perFile[file] = rows.length;
  for (const r of rows) {
    if (skip.has(r.n)) { skipped++; continue; }          // curated already owns this name
    const prev = byName.get(r.n);
    if (prev) { collisions++; if (r.ovr > prev.ovr) byName.set(r.n, r); }
    else byName.set(r.n, r);
  }
}

const all = [...byName.values()].sort((a, b) => b.ovr - a.ovr || a.n.localeCompare(b.n));
const pool = all.filter(p => p.ovr >= 72);
const flavor = all.filter(p => p.ovr < 72);

/* ---- English EFL clubs with a fieldable squad (>=11 players incl. a GK) ---- */
const eflMetaByName = {};
Object.values(SLUG).forEach(([name, league, tier, c0, c1]) => { eflMetaByName[name] = { league, tier, c0, c1 }; });
const sCount = {}, sGk = {};
all.forEach(p => { if (eflMetaByName[p.club]) { sCount[p.club] = (sCount[p.club] || 0) + 1; if (p.pos === 'GK') sGk[p.club] = (sGk[p.club] || 0) + 1; } });
const eflClubs = Object.keys(eflMetaByName).filter(n => (sCount[n] || 0) >= 11 && (sGk[n] || 0) >= 1).sort();

/* ---- emit ---- */
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function line(p) {
  return `  P('${esc(p.n)}','${p.pos}',${p.ovr},'${esc(p.club)}','${p.tag}',[${p.s.join(',')}])`;
}
const header = `/* ============================================================
   THE GAUNTLET — players_generated.js  (AUTO-GENERATED)
   Do not edit by hand. Regenerate with:  node tools/import_pool.js
   Source: data/csv/*.csv  ·  ${all.length} players  ·  ${new Date().toISOString().slice(0,10)}
   Real players (EAFC-26): top-5 leagues (72+) + English EFL tiers 2-4
   (full squads, ~48-77). 72+ → GA.POOL (draftable), <72 → GA.FLAVOR.
   English clubs also get GA.CLUB_SQUADS/CLUB_META/EFL_TIERS so the game
   can field their REAL XIs as opponents. nat is blank (not in source);
   the curated stars in data.js keep their hand-set nationality.
   s = [PAC,SHO,PAS,DRI,DEF,PHY] preserved for future sim work.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  var CUR = '${CUR}';
  function P(n, pos, ovr, club, tag, s) { return { n: n, pos: pos, ovr: ovr, nat: '', club: club, season: CUR, tag: tag, s: s }; }
`;
const body = `  var ADD = [\n${pool.concat(flavor).map(line).join(',\n')}\n  ];\n`;
const eflMeta = `
  // English EFL clubs (real squads): name -> [league, tier(1=L2,2=L1,3=Champ), c0, c1]
  var EFL = {\n${eflClubs.map(n => { const m = eflMetaByName[n]; return `    '${esc(n)}': ['${m.league}', ${m.tier}, '${m.c0}', '${m.c1}']`; }).join(',\n')}\n  };\n`;
const footer = `
  var have = {}; GA.POOL.forEach(function (p) { have[p.n] = 1; }); GA.FLAVOR.forEach(function (p) { have[p.n] = 1; });
  ADD.forEach(function (p) { if (!have[p.n]) { (p.ovr >= 72 ? GA.POOL : GA.FLAVOR).push(p); have[p.n] = 1; } });
  GA.ALL_PLAYERS = GA.POOL.concat(GA.FLAVOR);
  GA.PLAYERS = GA.POOL;

  // --- real English EFL clubs: metadata + grouped squads, for real-club opponent XIs ---
  GA.CLUB_META = GA.CLUB_META || {};
  GA.EFL_TIERS = GA.EFL_TIERS || { 1: [], 2: [], 3: [] };
  Object.keys(EFL).forEach(function (name) {
    var m = EFL[name];
    GA.CLUB_META[name] = { league: m[0], tier: m[1], colors: [m[2], m[3]] };
    (GA.EFL_TIERS[m[1]] = GA.EFL_TIERS[m[1]] || []).push(name);
  });
  GA.CLUB_SQUADS = GA.CLUB_SQUADS || {};
  ADD.forEach(function (p) { if (GA.CLUB_META[p.club]) { (GA.CLUB_SQUADS[p.club] = GA.CLUB_SQUADS[p.club] || []).push(p); } });
})(window.GA);
`;
fs.writeFileSync(OUT, header + body + eflMeta + footer);

/* ---- report ---- */
const tags = {}; all.forEach(p => tags[p.tag] = (tags[p.tag] || 0) + 1);
const bands = { '72-75':0,'76-79':0,'80-83':0,'84-87':0,'88+':0 };
all.forEach(p => { const o=p.ovr; bands[o>=88?'88+':o>=84?'84-87':o>=80?'80-83':o>=76?'76-79':'72-75']++; });
console.log('files:', perFile);
console.log('parsed rows total:', Object.values(perFile).reduce((a,b)=>a+b,0));
console.log('skipped (already curated):', skipped, '| name collisions resolved:', collisions);
console.log('written:', all.length, '(pool ' + pool.length + ', flavor ' + flavor.length + ')');
console.log('tags:', tags);
console.log('ovr bands:', bands);
console.log('top 8:', all.slice(0,8).map(p=>p.n+' '+p.ovr+' '+p.club).join(' | '));
console.log('EFL real-squad clubs:', eflClubs.length, '(L2 ' + eflClubs.filter(n=>eflMetaByName[n].tier===1).length + ', L1 ' + eflClubs.filter(n=>eflMetaByName[n].tier===2).length + ', Champ ' + eflClubs.filter(n=>eflMetaByName[n].tier===3).length + ')');
console.log('-> ' + path.relative(ROOT, OUT));
