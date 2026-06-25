/* ============================================================
   THE GAUNTLET — data.js  (v3)
   REAL players & clubs only. A master player pool carries full
   histories (club, season, nation); opponents are real clubs whose
   XI is assembled from real players matching the rung's quality,
   with a set of curated iconic teams keeping their literal XIs.
   ----------------------------------------------------------------
   ⮕ EXPANSION POINT: paste the full EAFC-26 + Football-League +
     historical database into GA.POOL (draftable ≥72) and GA.FLAVOR
     (≤71, opponent colour), and extra clubs into GA.CLUBS / iconic
     teams into GA.ICONIC. The engine scales automatically.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';

  GA.TAGS = {
    GUN:    { k: 'Finisher',     c: '#ffd23f' }, CREATE: { k: 'Creator',  c: '#ffd23f' },
    ENGINE: { k: 'Engine',       c: '#7ee787' }, MUD:    { k: 'Destroyer', c: '#7ee787' },
    ROCK:   { k: 'Rock',         c: '#58a6ff' }, SIEGE:  { k: 'Keeper',    c: '#58a6ff' },
    MAESTRO:{ k: 'Maestro',      c: '#ffd23f' }, UNSUNG: { k: 'Unsung',    c: '#c0a16b' },
    UTIL:   { k: 'Squad',        c: '#8b949e' }
  };
  GA.CUR = '2025/26'; // the current season

  // P(name, pos, ovr, nat, club, season, tag)
  function P(n, pos, ovr, nat, club, season, tag) { return { n: n, pos: pos, ovr: ovr, nat: nat, club: club, season: season || GA.CUR, tag: tag || 'UTIL' }; }

  GA.PUB_TEAM = {
    club: 'Dog & Duck FC', badge: 'D&D', colors: ['#3a4a2f', '#d9c89a'],
    motto: 'Played Sunday. Hungover Saturday.',
    squad: [
      P('Baz Tunnicliffe','GK',50,'ENG','Dog & Duck FC'), P('Reg Pickles','GK',48,'ENG','Dog & Duck FC'),
      P('Daz Sidebottom','RB',50,'ENG','Dog & Duck FC'), P('Kev Mottram','CB',50,'ENG','Dog & Duck FC'),
      P('Big Col Hargreaves','CB',50,'ENG','Dog & Duck FC'), P('Tony Sproston','LB',50,'ENG','Dog & Duck FC'),
      P('Mick Crabtree','CB',49,'ENG','Dog & Duck FC'), P('Gaz Bottomley','CDM',50,'ENG','Dog & Duck FC'),
      P('Stevie Pratt','CM',50,'ENG','Dog & Duck FC'), P('Wayne Stubbins','CM',50,'ENG','Dog & Duck FC'),
      P('Lee Sugden','RM',50,'ENG','Dog & Duck FC'), P('Robbie Entwistle','LM',50,'ENG','Dog & Duck FC'),
      P('Macca Threlfall','ST',50,'ENG','Dog & Duck FC'), P('Deano Birch','ST',50,'ENG','Dog & Duck FC'),
      P('Chris Collywobble','LW',49,'ENG','Dog & Duck FC'), P('Sully Ramsbottom','RW',49,'ENG','Dog & Duck FC')
    ]
  };

  GA.PUB_TEAMS_POOL = [
    { club: 'Dog & Duck FC', badge: 'D&D', colors: ['#3a4a2f', '#d9c89a'], motto: 'Played Sunday. Hungover Saturday.' },
    { club: 'Rose & Crown FC', badge: 'R&C', colors: ['#e8482b', '#ffffff'], motto: 'Putting the pub in pub team.' },
    { club: 'Pig & Whistle FC', badge: 'P&W', colors: ['#ffb6c1', '#333333'], motto: 'Bacon rolls and deep-lying playmakers.' },
    { club: 'Fox & Hounds FC', badge: 'F&H', colors: ['#d2691e', '#1a3c40'], motto: 'Running is strictly optional.' },
    { club: 'Queen\'s Head FC', badge: 'QHD', colors: ['#4b0082', '#eedd82'], motto: 'We only play if it\'s not raining.' },
    { club: 'Royal Oak FC', badge: 'ROK', colors: ['#1e4620', '#ffd23f'], motto: 'Defending deep since 1984.' },
    { club: 'The Black Bull FC', badge: 'TBB', colors: ['#111111', '#ff5e57'], motto: 'No referee is safe.' },
    { club: 'Railway Tavern FC', badge: 'RLY', colors: ['#b22222', '#f5f5dc'], motto: 'Always late, never sober.' },
    { club: 'Hackney Marshes FC', badge: 'HAK', colors: ['#556b2f', '#eae6df'], motto: 'Mud, sweat, and missing shinguards.' },
    { club: 'Wythenshawe Rec FC', badge: 'WYT', colors: ['#4682b4', '#ffffff'], motto: 'Smoking at halftime.' },
    { club: 'Salford Amateurs FC', badge: 'SAL', colors: ['#9c27b0', '#ffffff'], motto: 'Pie and gravy after the whistle.' },
    { club: 'Camberwell Green FC', badge: 'CAM', colors: ['#2e8b57', '#ffe4e1'], motto: 'Tactics? Just hoof it.' },
    { club: 'Red Star Brewery FC', badge: 'RSB', colors: ['#e8482b', '#111111'], motto: 'Sponsoring our own hydration.' },
    { club: 'Battersea Park Rangers', badge: 'BPR', colors: ['#4169e1', '#ffffff'], motto: 'Lost every away game since 2012.' },
    { club: 'Gorton Victoria FC', badge: 'GVI', colors: ['#228b22', '#ffeb3b'], motto: 'Muddy pitches and golden dreams.' },
    { club: 'Nag\'s Head FC', badge: 'NAG', colors: ['#b3541e', '#fcf6f0'], motto: 'Unfit, unorganized, unbeatable.' },
    { club: 'The Jolly Sailor FC', badge: 'JOL', colors: ['#185adb', '#fcfcfc'], motto: 'Pints and slide tackles.' },
    { club: 'Red Cow Athletic', badge: 'COW', colors: ['#800000', '#ffffff'], motto: 'Grazing on the touchline.' },
    { club: 'Coach & Horses FC', badge: 'C&H', colors: ['#6f4e37', '#ffd23f'], motto: 'Getting a lift in the chairman\'s van.' },
    { club: 'White Hart FC', badge: 'WHI', colors: ['#203239', '#e0ddaa'], motto: 'More yellow cards than points.' }
  ];

  /* ---- NAME FORGE: combine stereotypically-English words into your own club.
     prefix + place + type → e.g. "Nether Wallop Wanderers". Many real (and
     gloriously real-sounding) English place names in the middle bank. ---- */
  GA.CLUB_WORDS = {
    pre: ['Nether', 'Upper', 'Lower', 'Great', 'Little', 'Old', 'North', 'South', 'Kings', 'Bishops', 'Steeple', 'Long', 'Stony', 'Cold', 'Market', 'Castle', 'Chipping', 'Much', 'Saint', 'Maiden'],
    place: ['Wallop', 'Snoring', 'Piddle', 'Pudsey', 'Ramsbottom', 'Scunthorpe', 'Bognor', 'Cockermouth', 'Wetwang', 'Giggleswick', 'Mousehole', 'Slaughter', 'Nettlebed', 'Dorking', 'Tooting', 'Sprouton', 'Wibbleton', 'Bumstead', 'Crumbleton', 'Soggington'],
    suffix: ['United', 'City', 'Town', 'Rovers', 'Wanderers', 'Athletic', 'Albion', 'County', 'Rangers', 'Thistle', 'Argyle', 'Alexandra', 'Forest', 'Vale', 'Stanley', 'Borough', 'Hotspur', 'Park', 'FC', 'AFC']
  };
  GA.CLUB_KITS = [
    ['#7a263a', '#9cd0e8'], ['#d3001c', '#ffffff'], ['#1d5ba6', '#ffffff'], ['#1e7a34', '#ffffff'],
    ['#111111', '#ffd23f'], ['#6cabdd', '#0a2342'], ['#5a0f2e', '#f0e6d2'], ['#4b0082', '#ffd23f']
  ];

  GA.STYLES = {
    balanced:   { atk: 0,  def: 0,  label: 'balanced' },
    attacking:  { atk: 5,  def: -5, label: 'all-out attack' },
    defensive:  { atk: -5, def: 5,  label: 'low block' },
    counter:    { atk: 4,  def: 2,  label: 'counter-attacking' },
    physical:   { atk: 1,  def: 5,  label: 'physical & direct', setpiece: true },
    possession: { atk: 4,  def: 4,  label: 'possession', strangle: true }
  };
  GA.MENTALITIES = [
    { id: 'park',     name: 'Park the Bus',   emoji: '🚌', gf: 0.62, ga: 0.52, desc: 'Throw everyone behind the ball. Zero attacking threat, but you\'re a brick wall. Best for grinding out a draw to steal it on penalties.' },
    { id: 'counter',  name: 'Counter-Attack', emoji: '⚡', gf: 0.90, ga: 0.76, vsStrong: 1.18, desc: 'Soak up pressure in your own half and hit them on the break. Essential for punching up against the giants.' },
    { id: 'balanced', name: 'Balanced',       emoji: '⚖️', gf: 1.00, ga: 1.00, desc: 'No tactical gimmicks. Just play the match in front of you.' },
    { id: 'attack',   name: 'All-Out Attack', emoji: '🗡️', gf: 1.30, ga: 1.28, desc: 'Throw caution to the wind and push bodies forward. Massive goals threat, but you will leak at the back.' }
  ];
  GA.mentalityById = function (id) { for (var i = 0; i < GA.MENTALITIES.length; i++) if (GA.MENTALITIES[i].id === id) return GA.MENTALITIES[i]; return GA.MENTALITIES[2]; };

  /* ============================================================ PLAYER POOL */
  /* DRAFTABLE (≥72) — what the slot machine can offer. Seed set; expand freely. */
  GA.POOL = [
    // ---- 2025/26 elite (88-94) ----
    P('Erling Haaland','ST',91,'NOR','Manchester City',GA.CUR,'GUN'), P('Kylian Mbappé','ST',91,'FRA','Real Madrid',GA.CUR,'GUN'),
    P('Vinícius Júnior','LW',90,'BRA','Real Madrid',GA.CUR,'CREATE'), P('Mohamed Salah','RW',89,'EGY','Liverpool',GA.CUR,'GUN'),
    P('Jude Bellingham','CAM',90,'ENG','Real Madrid',GA.CUR,'MAESTRO'), P('Rodri','CDM',91,'ESP','Manchester City',GA.CUR,'ENGINE'),
    P('Harry Kane','ST',90,'ENG','Bayern Munich',GA.CUR,'GUN'), P('Lautaro Martínez','ST',88,'ARG','Internazionale',GA.CUR,'GUN'),
    P('Robert Lewandowski','ST',88,'POL','Barcelona',GA.CUR,'GUN'), P('Bukayo Saka','RW',87,'ENG','Arsenal',GA.CUR,'CREATE'),
    P('Florian Wirtz','CAM',88,'GER','Liverpool',GA.CUR,'CREATE'), P('Jamal Musiala','CAM',87,'GER','Bayern Munich',GA.CUR,'CREATE'),
    P('Pedri','CM',87,'ESP','Barcelona',GA.CUR,'MAESTRO'), P('Federico Valverde','CM',89,'URU','Real Madrid',GA.CUR,'ENGINE'),
    P('Virgil van Dijk','CB',89,'NED','Liverpool',GA.CUR,'ROCK'), P('Rúben Dias','CB',88,'POR','Manchester City',GA.CUR,'ROCK'),
    P('Alisson','GK',89,'BRA','Liverpool',GA.CUR,'SIEGE'), P('Thibaut Courtois','GK',89,'BEL','Real Madrid',GA.CUR,'SIEGE'),
    P('Kevin De Bruyne','CM',88,'BEL','Napoli',GA.CUR,'MAESTRO'), P('Vitinha','CM',87,'POR','Paris Saint-Germain',GA.CUR,'ENGINE'),
    P('Ousmane Dembélé','RW',88,'FRA','Paris Saint-Germain',GA.CUR,'CREATE'), P('Khvicha Kvaratskhelia','LW',87,'GEO','Paris Saint-Germain',GA.CUR,'CREATE'),
    // ---- 2025/26 very good (82-86) ----
    P('Martin Ødegaard','CAM',86,'NOR','Arsenal',GA.CUR,'CREATE'), P('Declan Rice','CDM',86,'ENG','Arsenal',GA.CUR,'ENGINE'),
    P('William Saliba','CB',86,'FRA','Arsenal',GA.CUR,'ROCK'), P('Phil Foden','CAM',86,'ENG','Manchester City',GA.CUR,'CREATE'),
    P('Cole Palmer','CAM',86,'ENG','Chelsea',GA.CUR,'CREATE'), P('Bruno Fernandes','CAM',86,'POR','Manchester United',GA.CUR,'CREATE'),
    P('Alexis Mac Allister','CM',85,'ARG','Liverpool',GA.CUR,'ENGINE'), P('Nicolò Barella','CM',86,'ITA','Internazionale',GA.CUR,'ENGINE'),
    P('Joshua Kimmich','CM',86,'GER','Bayern Munich',GA.CUR,'ENGINE'), P('Trent Alexander-Arnold','RB',85,'ENG','Real Madrid',GA.CUR,'CREATE'),
    P('Achraf Hakimi','RB',85,'MAR','Paris Saint-Germain',GA.CUR,'ROCK'), P('Theo Hernández','LB',84,'FRA','AC Milan',GA.CUR,'ROCK'),
    P('Alphonso Davies','LB',84,'CAN','Bayern Munich',GA.CUR,'ROCK'), P('Gabriel Magalhães','CB',85,'BRA','Arsenal',GA.CUR,'ROCK'),
    P('Antonio Rüdiger','CB',85,'GER','Real Madrid',GA.CUR,'ROCK'), P('Alessandro Bastoni','CB',85,'ITA','Internazionale',GA.CUR,'ROCK'),
    P('Lamine Yamal','RW',86,'ESP','Barcelona',GA.CUR,'CREATE'), P('Raphinha','LW',86,'BRA','Barcelona',GA.CUR,'GUN'),
    P('Rafael Leão','LW',85,'POR','AC Milan',GA.CUR,'CREATE'), P('Alexander Isak','ST',86,'SWE','Liverpool',GA.CUR,'GUN'),
    P('Victor Osimhen','ST',87,'NGA','Galatasaray',GA.CUR,'GUN'), P('Dušan Vlahović','ST',84,'SRB','Juventus',GA.CUR,'GUN'),
    P('Marcus Thuram','ST',84,'FRA','Internazionale',GA.CUR,'GUN'), P('Dominik Szoboszlai','CM',84,'HUN','Liverpool',GA.CUR,'ENGINE'),
    P('Michael Olise','RW',85,'FRA','Bayern Munich',GA.CUR,'CREATE'), P('Ederson','GK',86,'BRA','Manchester City',GA.CUR,'SIEGE'),
    P('Gianluigi Donnarumma','GK',88,'ITA','Manchester City',GA.CUR,'SIEGE'), P('David Raya','GK',84,'ESP','Arsenal',GA.CUR,'SIEGE'),
    P('Mike Maignan','GK',85,'FRA','AC Milan',GA.CUR,'SIEGE'), P('Ronald Araújo','CB',84,'URU','Barcelona',GA.CUR,'ROCK'),
    P('Jules Koundé','RB',84,'FRA','Barcelona',GA.CUR,'ROCK'), P('Pau Cubarsí','CB',83,'ESP','Barcelona',GA.CUR,'ROCK'),
    P('Marcus Rashford','LW',83,'ENG','Aston Villa',GA.CUR,'GUN'), P('Bradley Barcola','LW',83,'FRA','Paris Saint-Germain',GA.CUR,'CREATE'),
    // ---- 2025/26 solid first-team (72-81) ----
    P('Cristian Romero','CB',83,'ARG','Tottenham Hotspur',GA.CUR,'ROCK'), P('Kyle Walker','RB',81,'ENG','Burnley',GA.CUR,'ROCK'),
    P('Jarrod Bowen','RW',81,'ENG','West Ham United',GA.CUR,'GUN'), P('Morgan Gibbs-White','CAM',81,'ENG','Nottingham Forest',GA.CUR,'CREATE'),
    P('Ollie Watkins','ST',82,'ENG','Aston Villa',GA.CUR,'GUN'), P('Dominic Solanke','ST',80,'ENG','Tottenham Hotspur',GA.CUR,'GUN'),
    P('Anthony Gordon','LW',80,'ENG','Newcastle United',GA.CUR,'CREATE'), P('Bryan Mbeumo','RW',81,'CMR','Manchester United',GA.CUR,'GUN'),
    P('Yoane Wissa','ST',79,'COD','Newcastle United',GA.CUR,'GUN'), P('Pascal Groß','CM',78,'GER','Borussia Dortmund',GA.CUR,'CREATE'),
    P('João Palhinha','CDM',82,'POR','Tottenham Hotspur',GA.CUR,'MUD'), P('Moisés Caicedo','CDM',84,'ECU','Chelsea',GA.CUR,'MUD'),
    P('Wilfred Ndidi','CDM',79,'NGA','Besiktas',GA.CUR,'MUD'), P('Youri Tielemans','CM',80,'BEL','Aston Villa',GA.CUR,'ENGINE'),
    P('James Maddison','CAM',82,'ENG','Tottenham Hotspur',GA.CUR,'CREATE'), P('Eberechi Eze','CAM',82,'ENG','Arsenal',GA.CUR,'CREATE'),
    P('Cody Gakpo','LW',82,'NED','Liverpool',GA.CUR,'GUN'), P('Nico Williams','LW',83,'ESP','Athletic Club',GA.CUR,'CREATE'),
    P('Mikel Merino','CM',80,'ESP','Arsenal',GA.CUR,'ENGINE'), P('Pedro Neto','RW',79,'POR','Chelsea',GA.CUR,'CREATE'),
    P('Joško Gvardiol','CB',84,'CRO','Manchester City',GA.CUR,'ROCK'), P('Levi Colwill','CB',81,'ENG','Chelsea',GA.CUR,'ROCK'),
    P('Murillo','CB',82,'BRA','Nottingham Forest',GA.CUR,'ROCK'), P('Pedro Porro','RB',81,'ESP','Tottenham Hotspur',GA.CUR,'ROCK'),
    P('Milos Kerkez','LB',79,'HUN','Liverpool',GA.CUR,'ROCK'), P('Antonee Robinson','LB',80,'USA','Fulham',GA.CUR,'ROCK'),
    P('Nick Pope','GK',81,'ENG','Newcastle United',GA.CUR,'SIEGE'), P('Jordan Pickford','GK',83,'ENG','Everton',GA.CUR,'SIEGE'),
    P('Emiliano Martínez','GK',84,'ARG','Aston Villa',GA.CUR,'SIEGE'), P('Matz Sels','GK',80,'BEL','Nottingham Forest',GA.CUR,'SIEGE'),
    P('Chris Wood','ST',78,'NZL','Nottingham Forest',GA.CUR,'GUN'), P('Jean-Philippe Mateta','ST',79,'FRA','Crystal Palace',GA.CUR,'GUN'),
    P('Matheus Cunha','ST',81,'BRA','Manchester United',GA.CUR,'GUN'), P('Antoine Semenyo','RW',79,'GHA','Bournemouth',GA.CUR,'GUN'),
    P('Bruno Guimarães','CM',84,'BRA','Newcastle United',GA.CUR,'ENGINE'), P('Sandro Tonali','CM',82,'ITA','Newcastle United',GA.CUR,'ENGINE'),
    P('Adam Wharton','CDM',78,'ENG','Crystal Palace',GA.CUR,'ENGINE'), P('Elliot Anderson','CM',78,'ENG','Nottingham Forest',GA.CUR,'ENGINE'),
    P('Marc Guéhi','CB',82,'ENG','Crystal Palace',GA.CUR,'ROCK'), P('Dean Huijsen','CB',80,'ESP','Real Madrid',GA.CUR,'ROCK'),

    // ---- LEGENDS & CULT HEROES (peak season) ----
    P('Thierry Henry','ST',91,'FRA','Arsenal','2003/04','MAESTRO'), P('Dennis Bergkamp','CF',89,'NED','Arsenal','1997/98','CREATE'),
    P('Ronaldinho','LW',93,'BRA','Barcelona','2005/06','MAESTRO'), P('Ronaldo Nazário','ST',94,'BRA','Inter','1997/98','GUN'),
    P('Zinédine Zidane','CAM',93,'FRA','Real Madrid','2002/03','MAESTRO'), P('Kaká','CAM',92,'BRA','AC Milan','2006/07','MAESTRO'),
    P('Lionel Messi','RW',94,'ARG','Barcelona','2011/12','MAESTRO'), P('Cristiano Ronaldo','LW',93,'POR','Real Madrid','2013/14','GUN'),
    P('Diego Maradona','CAM',94,'ARG','Napoli','1986/87','MAESTRO'), P('Pelé','ST',94,'BRA','Santos','1969/70','GUN'),
    P('Xavi','CM',90,'ESP','Barcelona','2010/11','MAESTRO'), P('Andrés Iniesta','CM',90,'ESP','Barcelona','2011/12','MAESTRO'),
    P('Andrea Pirlo','CDM',89,'ITA','Juventus','2011/12','MAESTRO'), P('Steven Gerrard','CM',89,'ENG','Liverpool','2008/09','ENGINE'),
    P('Frank Lampard','CM',88,'ENG','Chelsea','2009/10','ENGINE'), P('Patrick Vieira','CDM',88,'FRA','Arsenal','2003/04','ENGINE'),
    P('Paolo Maldini','CB',90,'ITA','AC Milan','2002/03','ROCK'), P('Fabio Cannavaro','CB',90,'ITA','Juventus','2005/06','ROCK'),
    P('Alessandro Nesta','CB',89,'ITA','AC Milan','2006/07','ROCK'), P('Carles Puyol','CB',88,'ESP','Barcelona','2010/11','ROCK'),
    P('Roberto Carlos','LB',89,'BRA','Real Madrid','2002/03','ROCK'), P('Cafu','RB',88,'BRA','AC Milan','2006/07','ROCK'),
    P('Javier Zanetti','RB',86,'ARG','Inter','2009/10','ROCK'), P('Gianluigi Buffon','GK',91,'ITA','Juventus','2005/06','SIEGE'),
    P('Iker Casillas','GK',90,'ESP','Real Madrid','2009/10','SIEGE'), P('Peter Schmeichel','GK',90,'DEN','Manchester United','1998/99','SIEGE'),
    P('Didier Drogba','ST',89,'CIV','Chelsea','2009/10','GUN'), P('Samuel Eto\'o','ST',89,'CMR','Inter','2009/10','GUN'),
    P('Wesley Sneijder','CAM',88,'NED','Inter','2009/10','CREATE'), P('Francesco Totti','CF',89,'ITA','Roma','2006/07','MAESTRO'),
    P('Andriy Shevchenko','ST',90,'UKR','AC Milan','2003/04','GUN'), P('Pavel Nedvěd','LM',88,'CZE','Juventus','2002/03','ENGINE'),
    P('Luís Figo','RW',89,'POR','Real Madrid','2001/02','CREATE'), P('David Beckham','RM',86,'ENG','Manchester United','1998/99','CREATE'),
    P('Paul Scholes','CM',87,'ENG','Manchester United','2006/07','ENGINE'), P('Ryan Giggs','LW',87,'WAL','Manchester United','1998/99','CREATE'),
    P('Eric Cantona','CF',88,'FRA','Manchester United','1995/96','MAESTRO'), P('Roy Keane','CDM',88,'IRL','Manchester United','1999/00','MUD'),
    P('Zlatan Ibrahimović','ST',90,'SWE','AC Milan','2010/11','GUN'), P('Gabriel Batistuta','ST',89,'ARG','Fiorentina','1998/99','GUN'),
    P('Alessandro Del Piero','CF',88,'ITA','Juventus','2005/06','MAESTRO'), P('Marco van Basten','ST',91,'NED','AC Milan','1988/89','GUN'),
    P('Ruud Gullit','CAM',89,'NED','AC Milan','1988/89','MAESTRO'), P('George Weah','ST',88,'LBR','AC Milan','1994/95','GUN'),
    P('Romário','ST',90,'BRA','Barcelona','1993/94','GUN'), P('Hristo Stoichkov','LW',88,'BUL','Barcelona','1993/94','GUN'),
    P('Johan Cruyff','CF',93,'NED','Ajax','1972/73','MAESTRO'), P('Franz Beckenbauer','CB',90,'GER','Bayern Munich','1973/74','ROCK'),
    P('George Best','RW',90,'NIR','Manchester United','1967/68','MAESTRO'), P('Bobby Moore','CB',87,'ENG','West Ham United','1965/66','ROCK'),
    P('Gerd Müller','ST',89,'GER','Bayern Munich','1971/72','GUN'), P('Lev Yashin','GK',89,'URS','Dynamo Moscow','1962/63','SIEGE'),
    // cult heroes / fan favourites
    P('Jamie Vardy','ST',82,'ENG','Leicester City','2015/16','GUN'), P('Riyad Mahrez','RW',84,'ALG','Leicester City','2015/16','CREATE'),
    P('N\'Golo Kanté','CDM',87,'FRA','Leicester City','2016/17','MUD'), P('Yaya Touré','CM',87,'CIV','Manchester City','2013/14','ENGINE'),
    P('Juan Román Riquelme','CAM',88,'ARG','Villarreal','2004/05','MAESTRO'), P('Pavel Pogrebnyak','ST',74,'RUS','Fulham','2011/12','GUN'),
    P('Tim Cahill','CAM',79,'AUS','Everton','2007/08','UNSUNG'), P('Matt Le Tissier','CAM',85,'ENG','Southampton','1993/94','MAESTRO'),
    P('Gianfranco Zola','CF',87,'ITA','Chelsea','1996/97','MAESTRO'), P('Robbie Fowler','ST',86,'ENG','Liverpool','1995/96','GUN')
  ];

  /* FLAVOUR (≤71) — never draftable, only used to colour low-tier opponents */
  GA.FLAVOR = [
    P('Karl Darlow','GK',71,'ENG','Leeds United'), P('Gavin Bazunu','GK',70,'IRL','Southampton'), P('Liam Roberts','GK',62,'ENG','Millwall'),
    P('Jack Stevens','GK',58,'ENG','Bromley'), P('Ben Wilson','GK',60,'ENG','Wrexham'),
    P('Jan Bednarek','CB',76,'POL','Southampton'), P('Jack Stephens','CB',71,'ENG','Southampton'), P('Conor Coady','CB',74,'ENG','Leicester City'),
    P('Sonny Bradley','CB',64,'ENG','Wrexham'), P('Kyle McFadzean','CB',62,'ENG','Mansfield Town'), P('Will Boyle','CB',60,'ENG','Notts County'),
    P('Ryan Manning','LB',72,'IRL','Southampton'), P('Callum O\'Hare','CAM',73,'ENG','Sheffield United'), P('Josh Brownhill','CM',75,'ENG','Burnley'),
    P('Oliver Norwood','CM',72,'NIR','Sheffield United'), P('Conor Hourihane','CM',68,'IRL','Derby County'), P('Alex Mowatt','CM',69,'ENG','West Bromwich Albion'),
    P('Lewis Wing','CM',64,'ENG','Stockport County'), P('George Honeyman','CM',66,'ENG','Millwall'), P('Sam Finley','CM',60,'ENG','Bristol Rovers'),
    P('Aiden McGeady','RW',70,'IRL','Sunderland'), P('Tom Lawrence','LW',74,'WAL','Rangers'), P('Bobby Decordova-Reid','RW',72,'JAM','Leicester City'),
    P('Teemu Pukki','ST',73,'FIN','Norwich City'), P('Jordan Rhodes','ST',66,'SCO','Blackpool'), P('Cauley Woodrow','ST',64,'ENG','Notts County'),
    P('Macauley Bonne','ST',62,'ZIM','Gillingham'), P('Mallik Wilks','ST',63,'ENG','Rotherham United'), P('Paddy Madden','ST',60,'IRL','Stockport County'),
    P('Dom Telford','ST',61,'ENG','Crawley Town'), P('Danny Hylton','ST',58,'ENG','Northampton Town'), P('Macaulay Langstaff','ST',64,'ENG','Notts County')
  ];

  GA.ALL_PLAYERS = GA.POOL.concat(GA.FLAVOR);
  GA.PLAYERS = GA.POOL; // draftable alias

  /* ============================================================ CLUBS (real, by tier band) */
  // tier index -> { league, clubs:[ [name, c0, c1] ], styles:[...] }
  GA.CLUB_TIERS = [
    { league: 'National League', styles: ['defensive', 'physical', 'balanced'], clubs: [['Gateshead','#000000','#ffffff'],['Yeovil Town','#16a34a','#ffffff'],['Boreham Wood','#000000','#ffffff'],['Solihull Moors','#facc15','#1d4ed8'],['Forest Green Rovers','#3a8a3a','#000000'],['Aldershot Town','#d50000','#1d4ed8'],['Hartlepool United','#1565c0','#ffffff'],['Southend United','#1d4ed8','#ffffff'],['Eastleigh','#1565c0','#ffffff'],['Sutton United','#f5c518','#5b3a1a'],['Woking','#d50000','#ffffff'],['FC Halifax Town','#0066b3','#ffffff']] },
    { league: 'League Two', styles: ['physical', 'defensive', 'counter', 'balanced'], clubs: [['Notts County','#000000','#ffffff'],['Walsall','#d00000','#ffffff'],['Mansfield Town','#f1c40f','#003366'],['Bradford City','#7a2b8f','#f59e0b'],['Port Vale','#000000','#f5d000'],['Crewe Alexandra','#c2185b','#ffffff'],['Gillingham','#1565c0','#000000'],['Harrogate Town','#ffd23f','#000000']] },
    { league: 'League One', styles: ['physical', 'counter', 'balanced', 'attacking'], clubs: [['Bolton Wanderers','#ffffff','#1a237e'],['Wigan Athletic','#1e88e5','#ffffff'],['Charlton Athletic','#d50000','#ffffff'],['Lincoln City','#d50000','#ffffff'],['Stevenage','#d00000','#ffffff'],['Reading','#1565c0','#ffffff'],['Barnsley','#d50000','#ffffff'],['Huddersfield Town','#1565c0','#ffffff']] },
    { league: 'Championship', styles: ['attacking', 'possession', 'counter', 'balanced'], clubs: [['Leeds United','#ffffff','#1e3a8a'],['Middlesbrough','#d00000','#ffffff'],['Coventry City','#1aa7e8','#000000'],['West Bromwich Albion','#0a1f5c','#ffffff'],['Norwich City','#16a34a','#facc15'],['Hull City','#f57f17','#000000'],['Watford','#facc15','#d50000'],['Bristol City','#d50000','#ffffff'],['Sheffield Wednesday','#1565c0','#ffffff'],['Preston North End','#ffffff','#1e3a8a']] },
    { league: 'Premier League', styles: ['counter', 'physical', 'possession', 'balanced'], clubs: [['Everton','#1565c0','#ffffff'],['Crystal Palace','#1d4ed8','#d50000'],['Wolves','#f5a623','#000000'],['Brentford','#d50000','#ffffff'],['Fulham','#ffffff','#000000'],['Bournemouth','#d50000','#000000'],['Brighton','#0057b8','#ffffff'],['West Ham United','#7a263a','#1bb1e7'],['Leeds United','#ffffff','#1e3a8a']] },
    { league: 'Premier League', styles: ['balanced', 'attacking', 'counter', 'possession'], clubs: [['Aston Villa','#7a263a','#9cd0e8'],['Newcastle United','#000000','#ffffff'],['Tottenham Hotspur','#ffffff','#132257'],['Atlético Madrid','#d50000','#ffffff'],['Napoli','#1aa7e8','#ffffff'],['Borussia Dortmund','#f5d000','#000000'],['AS Monaco','#d50000','#ffffff'],['Juventus','#ffffff','#000000']] },
    { league: 'Europe\'s elite', styles: ['possession', 'attacking', 'counter'], clubs: [['Arsenal','#ef0107','#ffffff'],['Liverpool','#c8102e','#ffffff'],['Bayern Munich','#dc052d','#ffffff'],['Internazionale','#010e80','#000000'],['Barcelona','#a50044','#004d98'],['Paris Saint-Germain','#004170','#d80000'],['Real Madrid','#ffffff','#febe10'],['Manchester City','#6cabdd','#ffffff']] }
  ];

  /* ============================================================ ICONIC TEAMS (literal real XIs) */
  function O(n, pos) { return { n: n, pos: pos }; }
  GA.ICONIC = [
    { rating: 68, club: 'Sunderland', season: '2018/19', league: 'League One', formation: '4-4-2', colors: ['#eb172b','#ffffff'], style: 'attacking', danger: 'Aiden McGeady', bossOk: false,
      xi: [O('Jon McLaughlin','GK'),O('Luke O\'Nien','RB'),O('Tom Flanagan','CB'),O('Jack Baldwin','CB'),O('Bryan Oviedo','LB'),O('Lynden Gooch','RM'),O('Lee Cattermole','CM'),O('Max Power','CM'),O('Aiden McGeady','LM'),O('Josh Maja','ST'),O('Charlie Wyke','ST')] },
    { rating: 70, club: 'Derby County', season: '2020/21', league: 'Championship', formation: '4-3-3', colors: ['#000000','#ffffff'], style: 'defensive', danger: 'Tom Lawrence', bossOk: false,
      xi: [O('Kelle Roos','GK'),O('Nathan Byrne','RB'),O('Curtis Davies','CB'),O('Matt Clarke','CB'),O('Craig Forsyth','LB'),O('Max Bird','CM'),O('Graeme Shinnie','CM'),O('Jason Knight','CM'),O('Kamil Jóźwiak','RW'),O('Colin Kazim-Richards','ST'),O('Tom Lawrence','LW')] },
    { rating: 79, club: 'Stoke City', season: '2010/11', league: 'Premier League', formation: '4-4-2', colors: ['#e03a3e','#ffffff'], style: 'physical', drain: 1, danger: 'Kenwyne Jones', bossOk: false,
      xi: [O('Asmir Begović','GK'),O('Andy Wilkinson','RB'),O('Robert Huth','CB'),O('Ryan Shawcross','CB'),O('Marc Wilson','LB'),O('Glenn Whelan','CM'),O('Dean Whitehead','CM'),O('Jermaine Pennant','RM'),O('Matthew Etherington','LM'),O('Kenwyne Jones','ST'),O('Jonathan Walters','ST')] },
    { rating: 80, club: 'Brighton & Hove Albion', season: '2021/22', league: 'Premier League', formation: '4-2-3-1', colors: ['#0057b8','#ffffff'], style: 'possession', danger: 'Leandro Trossard', bossOk: false,
      xi: [O('Robert Sánchez','GK'),O('Tariq Lamptey','RB'),O('Lewis Dunk','CB'),O('Adam Webster','CB'),O('Marc Cucurella','LB'),O('Yves Bissouma','CDM'),O('Moisés Caicedo','CDM'),O('Leandro Trossard','LW'),O('Alexis Mac Allister','CAM'),O('Pascal Groß','RW'),O('Neal Maupay','ST')] },
    { rating: 84, club: 'Leicester City', season: '2015/16', league: 'Premier League', formation: '4-4-2', colors: ['#0053a0','#fdbe11'], style: 'counter', danger: 'Jamie Vardy', bossOk: true,
      xi: [O('Kasper Schmeichel','GK'),O('Danny Simpson','RB'),O('Wes Morgan','CB'),O('Robert Huth','CB'),O('Christian Fuchs','LB'),O('N\'Golo Kanté','CM'),O('Danny Drinkwater','CM'),O('Riyad Mahrez','RW'),O('Marc Albrighton','LM'),O('Shinji Okazaki','CF'),O('Jamie Vardy','ST')] },
    { rating: 85, club: 'Tottenham Hotspur', season: '2018/19', league: 'Premier League', formation: '4-2-3-1', colors: ['#ffffff','#132257'], style: 'counter', danger: 'Harry Kane', bossOk: false,
      xi: [O('Hugo Lloris','GK'),O('Kieran Trippier','RB'),O('Toby Alderweireld','CB'),O('Jan Vertonghen','CB'),O('Danny Rose','LB'),O('Moussa Sissoko','CDM'),O('Eric Dier','CDM'),O('Heung-min Son','LW'),O('Christian Eriksen','CAM'),O('Érik Lamela','RW'),O('Harry Kane','ST')] },
    { rating: 87, club: 'Manchester United', season: '2007/08', league: 'Premier League', formation: '4-4-2', colors: ['#da291c','#ffffff'], style: 'attacking', danger: 'Cristiano Ronaldo', bossOk: true,
      xi: [O('Edwin van der Sar','GK'),O('Wes Brown','RB'),O('Rio Ferdinand','CB'),O('Nemanja Vidić','CB'),O('Patrice Evra','LB'),O('Owen Hargreaves','CM'),O('Paul Scholes','CM'),O('Michael Carrick','CM'),O('Cristiano Ronaldo','RW'),O('Wayne Rooney','ST'),O('Carlos Tévez','LW')] },
    { rating: 89, club: 'Liverpool', season: '2018/19', league: 'Premier League', formation: '4-3-3', colors: ['#c8102e','#ffffff'], style: 'counter', danger: 'Mohamed Salah', bossOk: true,
      xi: [O('Alisson','GK'),O('Trent Alexander-Arnold','RB'),O('Virgil van Dijk','CB'),O('Joël Matip','CB'),O('Andrew Robertson','LB'),O('Fabinho','CDM'),O('Jordan Henderson','CM'),O('Georginio Wijnaldum','CM'),O('Mohamed Salah','RW'),O('Roberto Firmino','ST'),O('Sadio Mané','LW')] },
    { rating: 90, club: 'Manchester City', season: '2017/18', league: 'Premier League', formation: '4-3-3', colors: ['#6cabdd','#ffffff'], style: 'possession', danger: 'Kevin De Bruyne', bossOk: true,
      xi: [O('Ederson','GK'),O('Kyle Walker','RB'),O('John Stones','CB'),O('Nicolás Otamendi','CB'),O('Aymeric Laporte','LB'),O('Fernandinho','CDM'),O('Kevin De Bruyne','CM'),O('David Silva','CM'),O('Raheem Sterling','RW'),O('Sergio Agüero','ST'),O('Leroy Sané','LW')] },
    { rating: 87, club: 'Internazionale', season: '2009/10', league: 'Serie A', formation: '4-2-3-1', colors: ['#010e80','#000000'], style: 'counter', danger: 'Wesley Sneijder', bossOk: true,
      xi: [O('Júlio César','GK'),O('Maicon','RB'),O('Lúcio','CB'),O('Walter Samuel','CB'),O('Javier Zanetti','LB'),O('Esteban Cambiasso','CDM'),O('Thiago Motta','CDM'),O('Samuel Eto\'o','RW'),O('Wesley Sneijder','CAM'),O('Goran Pandev','LW'),O('Diego Milito','ST')] },
    { rating: 89, club: 'Arsenal', season: '2003/04', league: 'Premier League', formation: '4-4-2', colors: ['#ef0107','#ffffff'], style: 'attacking', danger: 'Thierry Henry', bossOk: true, fortress: true,
      xi: [O('Jens Lehmann','GK'),O('Lauren','RB'),O('Kolo Touré','CB'),O('Sol Campbell','CB'),O('Ashley Cole','LB'),O('Freddie Ljungberg','RM'),O('Patrick Vieira','CM'),O('Gilberto Silva','CM'),O('Robert Pirès','LM'),O('Dennis Bergkamp','CF'),O('Thierry Henry','ST')] },
    { rating: 89, club: 'Real Madrid', season: '2013/14', league: 'La Liga', formation: '4-3-3', colors: ['#ffffff','#febe10'], style: 'counter', danger: 'Cristiano Ronaldo', bossOk: true, fortress: true,
      xi: [O('Iker Casillas','GK'),O('Dani Carvajal','RB'),O('Sergio Ramos','CB'),O('Pepe','CB'),O('Marcelo','LB'),O('Xabi Alonso','CDM'),O('Luka Modrić','CM'),O('Ángel Di María','LM'),O('Gareth Bale','RW'),O('Karim Benzema','ST'),O('Cristiano Ronaldo','LW')] },
    { rating: 93, club: 'Barcelona', season: '2010/11', league: 'La Liga', formation: '4-3-3', colors: ['#a50044','#004d98'], style: 'possession', danger: 'Lionel Messi', bossOk: true, fortress: true,
      xi: [O('Víctor Valdés','GK'),O('Dani Alves','RB'),O('Gerard Piqué','CB'),O('Carles Puyol','CB'),O('Eric Abidal','LB'),O('Sergio Busquets','CDM'),O('Xavi','CM'),O('Andrés Iniesta','CM'),O('Pedro','RW'),O('Lionel Messi','CF'),O('David Villa','LW')] }
  ];

  /* ============================================================ RATING CURVE & LADDER
     A static curve that rises ~50 → 99 across the climb, pacing with the team
     you build (you draft 77-83 players, so your OVR keeps up). Opponents are
     shown at this rating, and real clubs slot in at their true level — so
     United '08 lands in the high 80s late, never an early 65-rated "boss".  */
  GA.threatFor = function (n) { return Math.min(99, Math.round(48 + (n - 1) * 2.7) + (n % 3 === 0 ? 2 : 0)); };
  // bands (user spec): <58 non-league · 58-62 L2 · 62-68 L1 · 68-76 Champ · 76-85 PL · 85-92 elite · 92+ legendary
  function tierForThreat(t) { return t < 58 ? 0 : t < 62 ? 1 : t < 68 ? 2 : t < 76 ? 3 : t < 85 ? 4 : t < 92 ? 5 : 6; }

  // a real English club's ACTUAL best XI from its full squad (GA.CLUB_SQUADS,
  // built from the imported EFL data). Returns null if it can't field eleven.
  function realClubXI(name) {
    var squad = GA.CLUB_SQUADS && GA.CLUB_SQUADS[name];
    if (!squad || squad.length < 11 || !squad.some(function (p) { return p.pos === 'GK'; })) return null;
    var best = GA.bestFormation(squad);
    if (!best || !best.a || best.a.holes > 0) return null;
    var starters = best.a.slots.filter(function (s) { return s.player; });
    if (starters.length < 11) return null;
    var xi = starters.map(function (s) { return O(s.player.n, s.pos); });
    var pl = starters.map(function (s) { return s.player; });
    var atts = pl.filter(function (p) { return GA.LINE[p.pos] === 'ATT'; }).sort(function (a, b) { return b.ovr - a.ovr; });
    var danger = (atts[0] || pl.slice().sort(function (a, b) { return b.ovr - a.ovr; })[0]).n;
    return { xi: xi, formation: best.f.name, danger: danger };
  }

  // assemble a real club's XI from real players near the band rating
  function assembleTeam(rng, tier, threat, used) {
    used = used || {};
    // tiers 1-3 (League Two → Championship) are REAL English clubs fielding
    // their ACTUAL squads — the early climb is the genuine football pyramid.
    var efl = GA.EFL_TIERS && GA.EFL_TIERS[tier];
    if (efl && efl.length) {
      var order = GA.shuffle(efl.slice(), rng);
      for (var e = 0; e < order.length; e++) {
        var rname = order[e]; if (used[rname]) continue;
        var real = realClubXI(rname); if (!real) continue;
        var meta = GA.CLUB_META[rname]; used[rname] = 1;
        var styT = tier <= 1 ? ['physical', 'defensive', 'counter', 'balanced'] : tier === 2 ? ['physical', 'counter', 'balanced', 'attacking'] : ['counter', 'balanced', 'attacking', 'possession'];
        return { club: rname, season: GA.CUR, league: meta.league, formation: real.formation,
          colors: meta.colors.slice(), style: GA.pick(styT, rng), danger: real.danger,
          xi: real.xi, real: true, assembled: true,
          tagline: GA.pick(['A proper professional side. They won\'t give you an inch.', 'No pub players here. A well-drilled squad of full-time pros.', 'A robust league outfit. This is where the real work starts.', 'They do this for a living. You\'ll have to fight for this one.'], rng) };
      }
    }
    var ct = GA.CLUB_TIERS[Math.min(tier, GA.CLUB_TIERS.length - 1)];
    var clubOrder = GA.shuffle(ct.clubs.slice(), rng), club = null;
    for (var ci = 0; ci < clubOrder.length; ci++) { if (!used[clubOrder[ci][0]]) { club = clubOrder[ci]; break; } }
    if (!club) club = clubOrder[0];
    used[club[0]] = 1;
    var fOptions = tier <= 1 ? ['4-4-2', '4-5-1', '5-3-2', '4-1-4-1'] : tier <= 3 ? ['4-4-2', '4-2-3-1', '4-3-3', '3-5-2'] : ['4-3-3', '4-2-3-1', '3-4-3', '4-4-2'];
    var fName = GA.pick(fOptions, rng), f = null;
    for (var i = 0; i < GA.FORMATIONS.length; i++) if (GA.FORMATIONS[i].name === fName) f = GA.FORMATIONS[i];
    // real players nearest this rung's level, by line (always fills — the
    // closest-rated real names available, shuffled among near-equals for variety)
    var byLine = { GK: [], DEF: [], MID: [], ATT: [] };
    GA.ALL_PLAYERS.forEach(function (p) { byLine[GA.LINE[p.pos]].push(p); });
    Object.keys(byLine).forEach(function (k) {
      byLine[k].sort(function (a, b) { return Math.abs(a.ovr - threat) - Math.abs(b.ovr - threat); });
      byLine[k] = GA.shuffle(byLine[k].slice(0, 14), rng); // jitter among the ~14 closest
    });
    var used = {}, xi = [];
    f.slots.forEach(function (s) {
      var list = byLine[GA.LINE[s.pos]] || [], pick = null;
      for (var j = 0; j < list.length; j++) { if (!used[list[j].n]) { pick = list[j]; break; } }
      if (!pick) { var all = byLine[GA.LINE[s.pos]]; pick = all[0] || { n: 'Reserve', pos: s.pos }; }
      used[pick.n] = 1; xi.push(O(pick.n, s.pos));
    });
    var atts = xi.filter(function (p) { return GA.LINE[p.pos] === 'ATT' || p.pos === 'CAM'; });
    return { club: club[0], season: GA.CUR, league: ct.league, formation: fName, colors: [club[1], club[2]],
      style: GA.pick(ct.styles, rng), danger: (atts[0] || xi[10] || xi[0]).n, xi: xi, assembled: true,
      tagline: GA.pick(['Organised, physical, and looking for blood. Do not underestimate them.', 'No easy fixtures at this level. You\'ll need to stay sharp.', 'They\'ll look at your pub squad and fancy their chances. Make them pay.', 'Tough, direct, and clinical on the counter.'], rng) };
  }

  GA.buildLadder = function (seed, upto) {
    upto = upto || 24;
    var rng = GA.rngFrom('ladder-' + seed);
    var usedIconic = {}, usedClubs = {}, ladder = [];
    for (var n = 1; n <= upto; n++) {
      var threat = GA.threatFor(n), tier = tierForThreat(threat), isBoss = n % 3 === 0, rung;
      // real iconic teams slot in where the curve matches their true rating
      var near = GA.ICONIC.filter(function (t) { return !usedIconic[t.club + t.season] && !usedClubs[t.club] && Math.abs(t.rating - threat) <= 4; });
      if (isBoss && near.length) {
        // weighted-random among the near sides (closest favoured) so the boss
        // rungs — now that many same-tier legends exist — vary run-to-run
        // instead of always serving up the single closest-rated team.
        var wsum = 0, ws = near.map(function (t) { var w = Math.exp(-Math.abs(t.rating - threat) * 0.8); wsum += w; return w; });
        var pr = rng() * wsum, pick = near[near.length - 1];
        for (var wi = 0; wi < near.length; wi++) { pr -= ws[wi]; if (pr <= 0) { pick = near[wi]; break; } }
        rung = Object.assign({}, pick); usedIconic[rung.club + rung.season] = 1; usedClubs[rung.club] = 1; threat = rung.rating;
      } else if (!isBoss && near.length && rng() < 0.5) {
        rung = Object.assign({}, GA.pick(near, rng)); usedIconic[rung.club + rung.season] = 1; usedClubs[rung.club] = 1; threat = rung.rating;
      } else rung = assembleTeam(rng, tier, threat, usedClubs);
      rung.rung = n; rung.threat = threat; rung.boss = isBoss ? 'BOSS' : null;
      if (rung.drain) rung.drain = 1; // bruisers cost an extra battery block
      ladder.push(rung);
    }
    return ladder;
  };
  GA.LAST_FIXED = 0;

  /* ============================================================ SLOT REWARD ITEMS / PERKS
     PERMA perks persist all run and stack into a build (offered once each).
     The rest are one-offs / repeatable. Every PERK is wired into the sim. */
  GA.ITEMS = {
    // ---- one-off / repeatable ----
    cup_replay: { id: 'cup_replay', name: 'Cup Replay', emoji: '🔁', tag: 'ONE-OFF', desc: 'A second life. Your NEXT defeat is replayed instead of ending the run — once.' },
    recharge:   { id: 'recharge',   name: 'Full Recharge', emoji: '🔋', tag: 'INSTANT', desc: 'Refills every player\'s fitness battery to full, right now. Bank it before a boss.' },
    coach:      { id: 'coach',      name: 'Coaching Badge', emoji: '📋', tag: 'UPGRADE', desc: 'Permanently adds +3 OVR to your lowest-rated starter. Stack it on the same man for a project.' },
    // ---- PERMANENT PERKS (build-defining; one of each) ----
    giant:      { id: 'giant',      name: 'Giant Killers',    emoji: '🗡️', perma: true, desc: 'PERMANENT. When the opponent OUT-RATES your XI, your attack surges (+18% goals) and your nerve from the spot holds. The bigger they are, the harder you bite.' },
    wall:       { id: 'wall',       name: 'Brick Wall',       emoji: '🧱', perma: true, desc: 'PERMANENT. A drilled, miserly back line — you concede roughly 15% fewer goals in EVERY match for the rest of the run.' },
    cavalry:    { id: 'cavalry',    name: 'Goal Machine',     emoji: '⚡', perma: true, desc: 'PERMANENT. Relentless going forward — you create roughly 12% more goals in EVERY match.' },
    setpiece:   { id: 'setpiece',   name: 'Set-Piece Kings',  emoji: '🎯', perma: true, desc: 'PERMANENT. Lethal from dead balls — a standing extra goal-threat every match, plus ice-cold penalty takers.' },
    fitness:    { id: 'fitness',    name: 'Sports Science',   emoji: '💪', perma: true, desc: 'PERMANENT. Elite conditioning — your starters never take DOUBLE battery drain, even against the bruisers.' },
    twelfth:    { id: 'twelfth',    name: 'Twelfth Man',      emoji: '🙌', perma: true, desc: 'PERMANENT. The travelling support roars you on — +2 attack AND +2 defence in every single match.' }
  };
  GA.PERMA_PERKS = ['giant', 'wall', 'cavalry', 'setpiece', 'fitness', 'twelfth'];
  GA.perkById = function (id) { return GA.ITEMS[id] || null; };

})(window.GA);
