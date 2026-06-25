/* ============================================================
   THE GAUNTLET — iconic_bestof.js
   "BEST OF" TEAMS — the top of the climb. All-time club XIs,
   all-time national XIs, and a few legendary era sides. Each is a
   literal real XI with a `rating`; buildLadder slots them where the
   curve matches, so these become the late-game bosses (rating 93-98
   ⇒ rungs ~16-24). Loaded after data.js — appends to GA.ICONIC.

   Expand freely: add entries to the matching list below. Keep names
   accurate (these render literally) and ratings on the 93-98 scale
   so they land at the sharp end. Season label distinguishes them on
   the ladder ('All-Time XI' / a year). danger MUST match an xi name.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  function O(n, pos) { return { n: n, pos: pos }; }

  var BESTOF = [
    /* ---------------------------------------------------------- ALL-TIME CLUBS */
    { rating: 95, club: 'Manchester United', season: 'All-Time XI', league: 'England', kind: 'club',
      formation: '4-4-2', colors: ['#da291c', '#ffffff'], style: 'attacking', danger: 'Eric Cantona', bossOk: true, fortress: true,
      xi: [O('Peter Schmeichel','GK'),O('Gary Neville','RB'),O('Rio Ferdinand','CB'),O('Nemanja Vidić','CB'),O('Denis Irwin','LB'),O('David Beckham','RM'),O('Roy Keane','CM'),O('Paul Scholes','CM'),O('Ryan Giggs','LM'),O('Eric Cantona','ST'),O('Wayne Rooney','ST')] },

    { rating: 95, club: 'Liverpool', season: 'All-Time XI', league: 'England', kind: 'club',
      formation: '4-3-3', colors: ['#c8102e', '#ffffff'], style: 'attacking', danger: 'Steven Gerrard', bossOk: true, fortress: true,
      xi: [O('Alisson','GK'),O('Trent Alexander-Arnold','RB'),O('Virgil van Dijk','CB'),O('Alan Hansen','CB'),O('Andrew Robertson','LB'),O('Graeme Souness','CM'),O('Steven Gerrard','CM'),O('Xabi Alonso','CM'),O('Mohamed Salah','RW'),O('Kenny Dalglish','ST'),O('Sadio Mané','LW')] },

    { rating: 94, club: 'Arsenal', season: 'All-Time XI', league: 'England', kind: 'club',
      formation: '4-4-2', colors: ['#ef0107', '#ffffff'], style: 'possession', danger: 'Thierry Henry', bossOk: true, fortress: true,
      xi: [O('David Seaman','GK'),O('Lee Dixon','RB'),O('Tony Adams','CB'),O('Sol Campbell','CB'),O('Ashley Cole','LB'),O('Freddie Ljungberg','RM'),O('Patrick Vieira','CM'),O('Cesc Fàbregas','CM'),O('Robert Pirès','LM'),O('Thierry Henry','ST'),O('Dennis Bergkamp','CF')] },

    { rating: 93, club: 'Manchester City', season: 'All-Time XI', league: 'England', kind: 'club',
      formation: '4-3-3', colors: ['#6cabdd', '#ffffff'], style: 'possession', danger: 'Sergio Agüero', bossOk: true,
      xi: [O('Ederson','GK'),O('Kyle Walker','RB'),O('Vincent Kompany','CB'),O('Rúben Dias','CB'),O('Pablo Zabaleta','LB'),O('Kevin De Bruyne','CM'),O('Rodri','CM'),O('David Silva','CM'),O('Bernardo Silva','RW'),O('Sergio Agüero','ST'),O('Leroy Sané','LW')] },

    { rating: 97, club: 'Real Madrid', season: 'All-Time XI', league: 'Spain', kind: 'club',
      formation: '4-2-3-1', colors: ['#ffffff', '#febe10'], style: 'counter', danger: 'Cristiano Ronaldo', bossOk: true, fortress: true,
      xi: [O('Iker Casillas','GK'),O('Dani Carvajal','RB'),O('Fernando Hierro','CB'),O('Sergio Ramos','CB'),O('Roberto Carlos','LB'),O('Fernando Redondo','CDM'),O('Zinédine Zidane','CM'),O('Luís Figo','RW'),O('Alfredo Di Stéfano','CAM'),O('Cristiano Ronaldo','LW'),O('Raúl','ST')] },

    { rating: 96, club: 'Barcelona', season: 'All-Time XI', league: 'Spain', kind: 'club',
      formation: '4-3-3', colors: ['#a50044', '#004d98'], style: 'possession', danger: 'Lionel Messi', bossOk: true, fortress: true,
      xi: [O('Víctor Valdés','GK'),O('Dani Alves','RB'),O('Gerard Piqué','CB'),O('Carles Puyol','CB'),O('Jordi Alba','LB'),O('Pep Guardiola','CDM'),O('Xavi','CM'),O('Andrés Iniesta','CM'),O('Lionel Messi','RW'),O('Johan Cruyff','ST'),O('Ronaldinho','LW')] },

    { rating: 95, club: 'AC Milan', season: 'All-Time XI', league: 'Italy', kind: 'club',
      formation: '4-3-1-2', colors: ['#fb090b', '#000000'], style: 'balanced', danger: 'Marco van Basten', bossOk: true, fortress: true,
      xi: [O('Sebastiano Rossi','GK'),O('Cafu','RB'),O('Franco Baresi','CB'),O('Alessandro Nesta','CB'),O('Paolo Maldini','LB'),O('Gennaro Gattuso','CDM'),O('Andrea Pirlo','CM'),O('Frank Rijkaard','CM'),O('Kaká','CAM'),O('Marco van Basten','ST'),O('Andriy Shevchenko','ST')] },

    { rating: 94, club: 'Juventus', season: 'All-Time XI', league: 'Italy', kind: 'club',
      formation: '4-3-3', colors: ['#000000', '#ffffff'], style: 'counter', danger: 'Alessandro Del Piero', bossOk: true,
      xi: [O('Gianluigi Buffon','GK'),O('Lilian Thuram','RB'),O('Fabio Cannavaro','CB'),O('Giorgio Chiellini','CB'),O('Antonio Cabrini','LB'),O('Michel Platini','CM'),O('Andrea Pirlo','CDM'),O('Pavel Nedvěd','LM'),O('Alessandro Del Piero','RW'),O('David Trezeguet','ST'),O('Roberto Baggio','CAM')] },

    { rating: 94, club: 'Internazionale', season: 'All-Time XI', league: 'Italy', kind: 'club',
      formation: '4-3-1-2', colors: ['#010e80', '#000000'], style: 'counter', danger: 'Ronaldo Nazário', bossOk: true,
      xi: [O('Júlio César','GK'),O('Javier Zanetti','RB'),O('Giuseppe Bergomi','CB'),O('Walter Samuel','CB'),O('Giacinto Facchetti','LB'),O('Esteban Cambiasso','CDM'),O('Lothar Matthäus','CM'),O('Sandro Mazzola','CM'),O('Wesley Sneijder','CAM'),O('Ronaldo Nazário','ST'),O('Giuseppe Meazza','ST')] },

    { rating: 95, club: 'Bayern Munich', season: 'All-Time XI', league: 'Germany', kind: 'club',
      formation: '4-2-3-1', colors: ['#dc052d', '#ffffff'], style: 'possession', danger: 'Gerd Müller', bossOk: true, fortress: true,
      xi: [O('Oliver Kahn','GK'),O('Philipp Lahm','RB'),O('Franz Beckenbauer','CB'),O('Mats Hummels','CB'),O('Paul Breitner','LB'),O('Lothar Matthäus','CDM'),O('Bastian Schweinsteiger','CM'),O('Arjen Robben','RW'),O('Thomas Müller','CAM'),O('Franck Ribéry','LW'),O('Gerd Müller','ST')] },

    { rating: 93, club: 'Ajax', season: 'All-Time XI', league: 'Netherlands', kind: 'club',
      formation: '4-3-3', colors: ['#d2122e', '#ffffff'], style: 'possession', danger: 'Johan Cruyff', bossOk: true,
      xi: [O('Edwin van der Sar','GK'),O('Michael Reiziger','RB'),O('Danny Blind','CB'),O('Frank de Boer','CB'),O('Ruud Krol','LB'),O('Johan Neeskens','CM'),O('Frank Rijkaard','CM'),O('Clarence Seedorf','CM'),O('Johan Cruyff','RW'),O('Marco van Basten','ST'),O('Dennis Bergkamp','LW')] },

    /* ---------------------------------------------------------- ALL-TIME NATIONS */
    { rating: 98, club: 'Brazil', season: 'All-Time XI', league: 'Brazil', kind: 'nation',
      formation: '4-2-3-1', colors: ['#ffdf00', '#009739'], style: 'attacking', danger: 'Pelé', bossOk: true, fortress: true,
      xi: [O('Taffarel','GK'),O('Cafu','RB'),O('Aldair','CB'),O('Thiago Silva','CB'),O('Roberto Carlos','LB'),O('Falcão','CDM'),O('Zico','CM'),O('Garrincha','RW'),O('Pelé','CAM'),O('Neymar','LW'),O('Ronaldo Nazário','ST')] },

    { rating: 97, club: 'Argentina', season: 'All-Time XI', league: 'Argentina', kind: 'nation',
      formation: '4-3-3', colors: ['#75aadb', '#ffffff'], style: 'counter', danger: 'Diego Maradona', bossOk: true, fortress: true,
      xi: [O('Ubaldo Fillol','GK'),O('Javier Zanetti','RB'),O('Daniel Passarella','CB'),O('Roberto Ayala','CB'),O('Juan Pablo Sorín','LB'),O('Fernando Redondo','CDM'),O('Diego Maradona','CM'),O('Juan Román Riquelme','CM'),O('Lionel Messi','RW'),O('Gabriel Batistuta','ST'),O('Ángel Di María','LW')] },

    { rating: 96, club: 'France', season: 'All-Time XI', league: 'France', kind: 'nation',
      formation: '4-2-3-1', colors: ['#0055a4', '#ffffff'], style: 'balanced', danger: 'Zinédine Zidane', bossOk: true, fortress: true,
      xi: [O('Hugo Lloris','GK'),O('Lilian Thuram','RB'),O('Laurent Blanc','CB'),O('Marcel Desailly','CB'),O('Bixente Lizarazu','LB'),O('Claude Makélélé','CDM'),O('Michel Platini','CM'),O('Kylian Mbappé','RW'),O('Zinédine Zidane','CAM'),O('Thierry Henry','LW'),O('Karim Benzema','ST')] },

    { rating: 96, club: 'Germany', season: 'All-Time XI', league: 'Germany', kind: 'nation',
      formation: '3-5-2', colors: ['#000000', '#ffffff'], style: 'physical', danger: 'Gerd Müller', bossOk: true, fortress: true,
      xi: [O('Oliver Kahn','GK'),O('Franz Beckenbauer','CB'),O('Matthias Sammer','CB'),O('Jürgen Kohler','CB'),O('Philipp Lahm','RM'),O('Lothar Matthäus','CM'),O('Günter Netzer','CM'),O('Michael Ballack','CM'),O('Andreas Brehme','LM'),O('Gerd Müller','ST'),O('Miroslav Klose','ST')] },

    { rating: 95, club: 'Italy', season: 'All-Time XI', league: 'Italy', kind: 'nation',
      formation: '5-3-2', colors: ['#0066b2', '#ffffff'], style: 'defensive', danger: 'Roberto Baggio', bossOk: true, fortress: true,
      xi: [O('Gianluigi Buffon','GK'),O('Giuseppe Bergomi','RB'),O('Alessandro Nesta','CB'),O('Fabio Cannavaro','CB'),O('Franco Baresi','CB'),O('Paolo Maldini','LB'),O('Andrea Pirlo','CM'),O('Marco Tardelli','CM'),O('Francesco Totti','CAM'),O('Roberto Baggio','ST'),O('Paolo Rossi','ST')] },

    { rating: 95, club: 'Spain', season: 'All-Time XI', league: 'Spain', kind: 'nation',
      formation: '4-3-3', colors: ['#c60b1e', '#ffc400'], style: 'possession', danger: 'Andrés Iniesta', bossOk: true, fortress: true,
      xi: [O('Iker Casillas','GK'),O('Sergio Ramos','RB'),O('Fernando Hierro','CB'),O('Carles Puyol','CB'),O('Jordi Alba','LB'),O('Sergio Busquets','CDM'),O('Xavi','CM'),O('Andrés Iniesta','CM'),O('David Silva','RW'),O('David Villa','ST'),O('Raúl','LW')] },

    /* ---------------------------------------------------------- ERA SIDES */
    { rating: 97, club: 'Brazil', season: '1970', league: 'Brazil', kind: 'era',
      formation: '4-3-3', colors: ['#ffdf00', '#009739'], style: 'attacking', danger: 'Pelé', bossOk: true, fortress: true,
      xi: [O('Félix','GK'),O('Carlos Alberto','RB'),O('Brito','CB'),O('Piazza','CB'),O('Everaldo','LB'),O('Clodoaldo','CM'),O('Gérson','CM'),O('Rivellino','LM'),O('Jairzinho','RW'),O('Tostão','ST'),O('Pelé','CAM')] },

    { rating: 96, club: 'Brazil', season: '2002', league: 'Brazil', kind: 'era',
      formation: '3-4-1-2', colors: ['#ffdf00', '#009739'], style: 'counter', danger: 'Ronaldo Nazário', bossOk: true,
      xi: [O('Marcos','GK'),O('Lúcio','CB'),O('Edmílson','CB'),O('Roque Júnior','CB'),O('Cafu','RM'),O('Gilberto Silva','CM'),O('Kléberson','CM'),O('Roberto Carlos','LM'),O('Ronaldinho','CAM'),O('Ronaldo Nazário','ST'),O('Rivaldo','ST')] },

    { rating: 95, club: 'France', season: '1998', league: 'France', kind: 'era',
      formation: '4-2-3-1', colors: ['#0055a4', '#ffffff'], style: 'balanced', danger: 'Zinédine Zidane', bossOk: true,
      xi: [O('Fabien Barthez','GK'),O('Lilian Thuram','RB'),O('Laurent Blanc','CB'),O('Marcel Desailly','CB'),O('Bixente Lizarazu','LB'),O('Didier Deschamps','CDM'),O('Emmanuel Petit','CM'),O('Christian Karembeu','RW'),O('Zinédine Zidane','CAM'),O('Youri Djorkaeff','LW'),O('Stéphane Guivarc\'h','ST')] },

    { rating: 95, club: 'Spain', season: '2010', league: 'Spain', kind: 'era',
      formation: '4-2-3-1', colors: ['#c60b1e', '#ffc400'], style: 'possession', danger: 'Xavi', bossOk: true,
      xi: [O('Iker Casillas','GK'),O('Sergio Ramos','RB'),O('Gerard Piqué','CB'),O('Carles Puyol','CB'),O('Joan Capdevila','LB'),O('Sergio Busquets','CDM'),O('Xabi Alonso','CM'),O('Andrés Iniesta','RW'),O('Xavi','CAM'),O('Pedro','LW'),O('David Villa','ST')] },

    { rating: 94, club: 'Germany', season: '2014', league: 'Germany', kind: 'era',
      formation: '4-3-3', colors: ['#000000', '#ffffff'], style: 'possession', danger: 'Thomas Müller', bossOk: true,
      xi: [O('Manuel Neuer','GK'),O('Philipp Lahm','RB'),O('Jérôme Boateng','CB'),O('Mats Hummels','CB'),O('Benedikt Höwedes','LB'),O('Sami Khedira','CM'),O('Toni Kroos','CDM'),O('Bastian Schweinsteiger','CM'),O('Thomas Müller','RW'),O('Miroslav Klose','ST'),O('Mesut Özil','LW')] }
  ];

  // boss-rung bruisers can carry a `drain`; none here, but keep the shape consistent
  BESTOF.forEach(function (t) { GA.ICONIC.push(t); });
  GA.BESTOF_COUNT = BESTOF.length;

})(window.GA);
