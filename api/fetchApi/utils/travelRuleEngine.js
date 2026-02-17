/**
 * Travel Experience Rule Engine - v2.0
 * JavaScript implementation of the traveler profile evaluation system
 */

// ─── RULE SETS ────────────────────────────────────────────────

const helpers = {
  hasInterest: (p, ...interests) => interests.some(i => p.interests.includes(i)),
  hasLang: (p, ...langs) => langs.some(l => p.languages.includes(l)),
  langCount: (p) => p.languages.length,
  incVal: (i) => ({ basso:1, medio:2, alto:3, altissimo:4 }[i]),
  fitVal: (f) => ({ sedentario:1, moderato:2, attivo:3, atletico:4 }[f]),
  durDays: (d) => ({ weekend:2, settimana:6, due_settimane:12, mese_o_piu:25 }[d]),
};

const pos = (score, reasons, warnings = []) => ({ score, reasons, warnings });
const neg = (score, warning) => ({ score, reasons: [], warnings: [warning] });

// Duration rule factory
function durationRule(minDays, label) {
  return {
    name: "Durata viaggio",
    evaluate: (p) => {
      const d = helpers.durDays(p.tripDuration);
      if (d >= minDays)        return pos(10, [`Durata adeguata per ${label}`]);
      if (d >= minDays * 0.6)  return neg(0,  `Durata al limite — ${label} in versione ridotta`);
      return neg(-15, `Durata insufficiente per ${label} (minimo ~${minDays} giorni)`);
    },
  };
}

// Group rule factory
function groupRule(good, bad, warning) {
  return {
    name: "Composizione gruppo",
    evaluate: (p) => {
      if (bad.includes(p.travelGroup))  return neg(-10, warning);
      if (good.includes(p.travelGroup)) return pos(10, [`Ideale per ${p.travelGroup}`]);
      return pos(0, []);
    },
  };
}

// Language rule factory
function langRule(helpful, label) {
  return {
    name: "Lingue parlate",
    evaluate: (p) => {
      if (helpers.hasLang(p, ...helpful)) return pos(8, [`Conosci ${label} — grande vantaggio`]);
      if (helpers.hasLang(p, "inglese") || helpers.langCount(p) >= 2) return pos(3, ["L'inglese apre porte ovunque"]);
      return neg(0, `Conoscere ${label} faciliterebbe molto questa esperienza`);
    },
  };
}

const RULE_SETS = [
  {
    category: "Avventura estrema",
    destinations: ["Patagonia","Himalaya","Antartide","Islanda vulcani","Congo Virunga"],
    rules: [
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r==="alto" ? pos(40,["Alta tolleranza al rischio!"]) :
          r==="medio"? neg(10,"Rischio elevato potrebbe essere stressante") :
                       neg(-30,"Sconsigliata: rischio troppo alto") },
      { name: "Fitness", evaluate: ({ fitnessLevel: f }) =>
          helpers.fitVal(f)>=3 ? pos(35,["Ottima forma fisica"]) :
          helpers.fitVal(f)===2? neg(5,"Richiede preparazione aggiuntiva") :
                         neg(-20,"Forma fisica insufficiente") },
      { name: "Interesse", evaluate: p => helpers.hasInterest(p,"avventura") ? pos(20,["Appassionato di avventura"]) : pos(0,[]) },
      { name: "Età", evaluate: ({ age: a }) =>
          a<18  ? neg(-50,"Età minima non raggiunta") :
          a<=40 ? pos(10,["Età ideale"]) :
          a<=55 ? neg(0,"Valuta bene le condizioni fisiche") :
                  neg(-10,"Check medico preventivo consigliato") },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=3 ? pos(5,["Budget adeguato"]) : neg(-5,"Costi significativi") },
      durationRule(10,"avventure estreme"),
      groupRule(["solo","amici"],["famiglia_bambini"],"Avventure estreme sconsigliate con bambini"),
      langRule(["inglese","spagnolo","portoghese"],"inglese/spagnolo (indispensabile per guide e permessi)"),
    ],
  },

  {
    category: "Trekking e natura",
    destinations: ["Dolomiti","Nuova Zelanda","Costa Rica","Norvegia fiordi","Nepal"],
    rules: [
      { name: "Interesse", evaluate: p => helpers.hasInterest(p,"natura","fotografia") ? pos(35,["Ami la natura"]) : pos(0,[]) },
      { name: "Fitness", evaluate: ({ fitnessLevel: f }) =>
          helpers.fitVal(f)>=2 ? pos(30,["Buona forma per trekking"]) : neg(-10,"Trekking potrebbero essere faticosi") },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r!=="basso" ? pos(15,["Aperto a percorsi impegnativi"]) : pos(5,["Trekking facili disponibili"]) },
      { name: "Budget", evaluate: () => pos(20,["Accessibile a ogni fascia di reddito"]) },
      durationRule(4,"trekking di qualità"),
      groupRule(["solo","coppia","amici"],["famiglia_bambini"],"Trekking impegnativi poco adatti con bambini piccoli"),
      langRule(["inglese","tedesco"],"inglese/tedesco"),
    ],
  },

  {
    category: "Cultura e storia",
    destinations: ["Roma","Atene","Cairo","Kyoto","Petra","Machu Picchu"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"storia","arte","architettura") ? pos(45,["Forte interesse per cultura"]) : pos(0,[]) },
      { name: "Fitness", evaluate: () => pos(20,["Non richiede sforzo fisico elevato"]) },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r==="basso" ? pos(20,["Destinazioni sicure"]) : pos(10,[]) },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=2 ? pos(15,["Budget per musei e tour"]) :
                              pos(5,[],["Alcune attrazioni hanno costi di ingresso"]) },
      durationRule(4,"itinerari culturali"),
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="coppia") return pos(8,["Perfetta per una coppia"]);
          if (p.travelGroup==="famiglia_bambini") return neg(-5,"Seleziona attrazioni kid-friendly");
          return pos(5,[]);
      }},
      { name: "Lingue", evaluate: (p) => {
          const local = ["italiano","spagnolo","francese","tedesco","arabo","giapponese"];
          const matched = local.filter(l => p.languages.includes(l));
          if (matched.length>0) return pos(10,[`Conosci ${matched.join("/")} — immersione più profonda`]);
          if (helpers.hasLang(p,"inglese")) return pos(4,["L'inglese è sufficiente nei principali siti"]);
          return neg(-3,"Barriere linguistiche possono limitare l'esperienza");
      }},
    ],
  },

  {
    category: "Arte e design",
    destinations: ["Berlino","New York","Milano","Barcellona","Parigi","Tokyo"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"arte","architettura","fotografia") ? pos(50,["Passione per arte e design"]) : pos(5,[]) },
      { name: "Accessibilità", evaluate: () => pos(20,["Accessibile a ogni età"]) },
      { name: "Nightlife", evaluate: p =>
          helpers.hasInterest(p,"nightlife") ? pos(15,["Le città creative hanno vita notturna vivace"]) : pos(0,[]) },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=2 ? pos(15,["Budget per gallerie e musei"]) :
                              pos(0,[],["Esperienze esclusive richiedono budget maggiore"]) },
      durationRule(2,"city trip artistici"),
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="coppia") return pos(10,["Perfetto per una coppia"]);
          if (p.travelGroup==="amici") return pos(8,["Divertente con gli amici"]);
          if (p.travelGroup==="famiglia_bambini") return neg(-5,"Musei moderni non sempre ideali con bambini");
          return pos(3,[]);
      }},
      langRule(["inglese","francese","tedesco","giapponese"],"inglese/francese (scene artistiche locali)"),
    ],
  },

  {
    category: "Gastronomia e vino",
    destinations: ["Toscana","Lyon","San Sebastián","Giappone","Messico","Perù"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"gastronomia") ? pos(55,["La gastronomia è al centro dei tuoi interessi!"]) : pos(0,[]) },
      { name: "Cultura", evaluate: p =>
          helpers.hasInterest(p,"storia","arte") ? pos(15,["Le destinazioni gastronomiche offrono anche cultura"]) : pos(0,[]) },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=3 ? pos(20,["Budget per ristoranti stellati e wine tour"]) :
          helpers.incVal(income)>=2 ? pos(10,["Esperienze gastronomiche accessibili"]) :
                              pos(0,[],["I migliori ristoranti possono essere costosi"]) },
      { name: "Fitness", evaluate: () => pos(10,["Perfetto per qualsiasi livello fisico"]) },
      durationRule(4,"tour gastronomici"),
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="coppia") return pos(12,["Esperienza romantica per eccellenza"]);
          if (p.travelGroup==="amici") return pos(10,["Condividere cibo con amici — perfetto"]);
          if (p.travelGroup==="famiglia_bambini") return neg(-5,"I bambini limitano la scelta dei ristoranti");
          return pos(5,[]);
      }},
      { name: "Lingue", evaluate: (p) => {
          const gl = ["italiano","francese","spagnolo","giapponese","portoghese"];
          const m = gl.filter(l => p.languages.includes(l));
          if (m.length>0) return pos(10,[`Conosci ${m.join("/")} — accesso a esperienze off-menu e mercati`]);
          return pos(2,[],["La lingua locale apre molte più esperienze gastronomiche"]);
      }},
    ],
  },

  {
    category: "Relax e benessere",
    destinations: ["Maldive","Bali","Santorini","Tailandia","Mauritius","Azzorre"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"relax") ? pos(50,["Il relax è la tua priorità"]) : pos(10,["Tutti hanno bisogno di relax"]) },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r==="basso" ? pos(25,["Destinazioni sicure e tranquille"]) : pos(10,[]) },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=3 ? pos(20,["Budget per resort di lusso"]) :
          helpers.incVal(income)>=2 ? pos(10,["Buone opzioni mid-range"]) :
                              neg(-5,"Le destinazioni esclusive hanno costi elevati") },
      { name: "Fitness", evaluate: () => pos(5,["Non richiede forma fisica particolare"]) },
      durationRule(4,"vacanze relax"),
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="coppia") return pos(15,["Vacanza romantica e rigenerante"]);
          if (p.travelGroup==="famiglia_bambini") return pos(8,["Resort con servizi famiglia disponibili"]);
          if (p.travelGroup==="solo") return pos(5,["Rigenerazione solitaria — ottima idea"]);
          return pos(5,[]);
      }},
      langRule(["inglese"],"inglese (sufficiente in tutti i resort)"),
    ],
  },

  {
    category: "Safari e wildlife",
    destinations: ["Kenya Masai Mara","Tanzania Serengeti","Sudafrica","Botswana Okavango","Rwanda gorilla"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"natura","fotografia") ? pos(45,["Perfetto per natura e wildlife photography"]) : pos(5,[]) },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r==="alto" ? pos(20,["Aperto alle avventure safari"]) :
          r==="medio"? pos(10,[]) :
                       neg(-5,"I safari implicano qualche rischio e imprevedibilità") },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=3 ? pos(25,["Budget per lodge e guide specializzate"]) :
          helpers.incVal(income)>=2 ? pos(5,[],["I safari di qualità hanno costi significativi"]) :
                              neg(-10,"Safari di lusso fuori budget") },
      { name: "Età", evaluate: ({ age: a }) => a>=12 ? pos(5,[]) : neg(-20,"Età minima richiesta") },
      durationRule(6,"safari completi"),
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="famiglia_bambini") return neg(-8,"Verifica l'età minima richiesta dal lodge");
          if (p.travelGroup==="coppia") return pos(10,["Safari di coppia — esperienza unica e romantica"]);
          if (p.travelGroup==="solo") return pos(8,["Safari di gruppo per singoli molto diffusi"]);
          return pos(5,[]);
      }},
      langRule(["inglese","francese","portoghese"],"inglese/francese (essenziale in Africa)"),
    ],
  },

  {
    category: "Crociera di lusso",
    destinations: ["Mediterraneo","Caraibi","Alaska","Fiordi norvegesi","Antartide expedition"],
    rules: [
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=3 ? pos(35,["Budget ideale per crociere di lusso"]) :
          helpers.incVal(income)===2? pos(10,[],["Esistono opzioni mid-range"]) :
                              neg(-10,"Crociere di lusso fuori budget") },
      { name: "Interessi multipli", evaluate: (p) => {
          const n=(["storia","arte","gastronomia","relax","natura"]).filter(i=>p.interests.includes(i)).length;
          return n>=2 ? pos(25,["La crociera copre molti tuoi interessi in un viaggio"]) : pos(5,[]);
      }},
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r==="basso" ? pos(20,["Esperienza sicura e confortevole"]) : pos(10,[]) },
      { name: "Età/Fitness", evaluate: ({ age: a, fitnessLevel: f }) =>
          a>=50&&helpers.fitVal(f)<=2 ? pos(15,["Massimo comfort senza sforzo fisico"]) : pos(5,[]) },
      { name: "Durata", evaluate: (p) => {
          const d=helpers.durDays(p.tripDuration);
          if (d>=7) return pos(15,["Durata ideale per una crociera completa"]);
          if (d>=4) return pos(5,[],["Le crociere brevi limitano le tappe"]);
          return neg(-15,"Una crociera richiede almeno 5–7 giorni");
      }},
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="famiglia_bambini") return pos(10,["Navi da crociera con servizi family eccellenti"]);
          if (p.travelGroup==="coppia") return pos(12,["Perfetta per una coppia"]);
          if (p.travelGroup==="famiglia_adulti") return pos(10,["Ideale per famiglie con interessi diversi"]);
          return pos(5,[]);
      }},
      langRule(["inglese","italiano","spagnolo"],"inglese (lingua ufficiale sulle navi internazionali)"),
    ],
  },

  {
    category: "Backpacking",
    destinations: ["Sud-Est Asiatico","America Latina","India","Marocco","Europa Est"],
    rules: [
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)<=2 ? pos(30,["Il backpacking massimizza le esperienze con budget contenuto"]) : pos(10,[]) },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r!=="basso" ? pos(25,["Aperto all'imprevedibilità del viaggio"]) : neg(-10,"Il backpacking può essere imprevedibile") },
      { name: "Età", evaluate: ({ age: a }) =>
          a<=30 ? pos(25,["Età ideale per il backpacking"]) :
          a<=45 ? pos(10,[]) : neg(-5,"Il backpacking intensivo può diventare stancante") },
      { name: "Fitness", evaluate: ({ fitnessLevel: f }) =>
          helpers.fitVal(f)>=2 ? pos(20,["Buona resistenza per spostamenti frequenti"]) : neg(-5,"Spostamenti continui richiedono energia") },
      { name: "Durata", evaluate: (p) => {
          const d=helpers.durDays(p.tripDuration);
          if (d>=14) return pos(20,["Durata perfetta per un backpacking immersivo"]);
          if (d>=7) return pos(10,["Sufficiente per esplorare una regione"]);
          return neg(-5,"Il backpacking è più gratificante con almeno 7–14 giorni");
      }},
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="solo") return pos(20,["Il backpacking da soli è un'esperienza di crescita unica"]);
          if (p.travelGroup==="amici") return pos(15,["Con amici: più sicurezza e più divertimento"]);
          if (p.travelGroup==="famiglia_bambini") return neg(-20,"Backpacking sconsigliato con bambini piccoli");
          if (p.travelGroup==="coppia") return pos(10,["Molto romantico in coppia"]);
          return pos(5,[]);
      }},
      { name: "Lingue", evaluate: (p) => {
          const n=helpers.langCount(p);
          if (n>=3) return pos(12,[`Parli ${n} lingue — ottimo per viaggiare da solo`]);
          if (helpers.hasLang(p,"inglese","spagnolo")) return pos(8,["Inglese/spagnolo coprono la maggior parte delle mete"]);
          return neg(-3,"L'inglese è quasi indispensabile nel backpacking");
      }},
    ],
  },

  {
    category: "Surf e sport acquatici",
    destinations: ["Hawaii","Bali","Portogallo Nazaré","Australia Byron Bay","Messico Puerto Escondido"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"sport","avventura") ? pos(50,["Passione per sport e avventura"]) : pos(0,[]) },
      { name: "Fitness", evaluate: ({ fitnessLevel: f }) =>
          helpers.fitVal(f)>=3 ? pos(30,["Ottima forma fisica"]) :
          helpers.fitVal(f)===2? pos(10,[],["Inizia con lezioni base"]) :
                         neg(-15,"Sport acquatici richiedono buona forma fisica") },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r!=="basso" ? pos(15,[]) : neg(-10,"Sport acquatici comportano rischi") },
      { name: "Età", evaluate: ({ age: a }) =>
          a<=35 ? pos(10,["Età ideale"]) :
          a<=50 ? pos(5,[],["Possibile con la giusta esperienza"]) :
                  neg(-5,"Valuta opzioni meno intense (kayak, snorkeling)") },
      { name: "Durata", evaluate: (p) => {
          const d=helpers.durDays(p.tripDuration);
          if (d>=7) return pos(10,["Durata per imparare e progredire"]);
          if (d>=4) return pos(5,[]);
          return neg(-5,"Con meno di 4 giorni difficile fare progressi nel surf");
      }},
      groupRule(["amici","solo","coppia"],["famiglia_bambini"],"Sport acquatici impegnativi poco adatti a famiglie con bambini"),
      langRule(["inglese","portoghese","spagnolo"],"inglese/spagnolo (surf community internazionale)"),
    ],
  },

  {
    category: "Fotografia naturalistica",
    destinations: ["Islanda","Galapagos","Amazzonia","Yellowstone","Namibia","Norvegia Aurora"],
    rules: [
      { name: "Interesse", evaluate: p =>
          helpers.hasInterest(p,"fotografia","natura") ? pos(55,["Fotografia e natura sono le tue passioni!"]) :
          helpers.hasInterest(p,"avventura") ? pos(15,[]) : pos(0,[]) },
      { name: "Fitness", evaluate: ({ fitnessLevel: f }) =>
          helpers.fitVal(f)>=2 ? pos(20,["Fitness adeguato per escursioni"]) : neg(-5,"Alcune location richiedono lunghe camminate all'alba") },
      { name: "Rischio", evaluate: ({ riskTolerance: r }) =>
          r!=="basso" ? pos(15,["Aperto a location remote e selvagge"]) : pos(5,[]) },
      { name: "Budget", evaluate: ({ income }) =>
          helpers.incVal(income)>=2 ? pos(10,["Budget per attrezzatura e guide"]) : pos(0,[]) },
      { name: "Durata", evaluate: (p) => {
          const d=helpers.durDays(p.tripDuration);
          if (d>=7) return pos(15,["Durata per cacciare le condizioni di luce perfette"]);
          if (d>=4) return pos(5,[]);
          return neg(-10,"La wildlife photography richiede almeno 5–7 giorni");
      }},
      { name: "Gruppo", evaluate: (p) => {
          if (p.travelGroup==="solo") return pos(15,["Da soli: massima libertà per seguire luce e soggetti"]);
          if (p.travelGroup==="coppia"||p.travelGroup==="amici") return pos(5,[],["Assicurati che tutti condividano ritmi e orari"]);
          if (p.travelGroup==="famiglia_bambini") return neg(-10,"Bambini piccoli rendono difficile la pazienza richiesta");
          return pos(5,[]);
      }},
      langRule(["inglese","spagnolo","portoghese"],"inglese (fondamentale per guide e permessi nelle riserve)"),
    ],
  },
];

// ─── ENGINE ───────────────────────────────────────────────────

function buildSummary(p) {
  const age   = p.age<25?"giovane esploratore":p.age<40?"viaggiatore nel pieno della vita":p.age<60?"viaggiatore esperto":"viaggiatore maturo";
  const fitMap = {sedentario:"ritmi tranquilli",moderato:"buona resistenza",attivo:"fisicamente attivo",atletico:"ottima forma fisica"};
  const incMap = {basso:"budget contenuto",medio:"budget flessibile",alto:"buona disponibilità",altissimo:"budget illimitato"};
  const groupMap = {solo:"viaggia da solo",coppia:"in coppia",amici:"con amici",famiglia_bambini:"in famiglia con bambini",famiglia_adulti:"in famiglia"};
  const durMap = {weekend:"un weekend",settimana:"una settimana",due_settimane:"due settimane",mese_o_piu:"un mese o più"};
  
  const fit   = fitMap[p.fitnessLevel];
  const inc   = incMap[p.income];
  const group = groupMap[p.travelGroup];
  const dur   = durMap[p.tripDuration];
  
  return `${age.charAt(0).toUpperCase()+age.slice(1)}, ${fit}, ${inc}. ${group.charAt(0).toUpperCase()+group.slice(1)} per ${dur}. Lingue: ${p.languages.join(", ")}. Interessi: ${p.interests.join(", ")}.`;
}

function evaluateProfile(profile) {
  const allMatches = RULE_SETS.map(rs => {
    let total = 0;
    const reasons = [], warnings = [];
    for (const rule of rs.rules) {
      const r = rule.evaluate(profile);
      total += r.score;
      reasons.push(...r.reasons);
      warnings.push(...r.warnings);
    }
    return {
      category: rs.category,
      score: Math.min(100, Math.max(0, total)),
      reasons, warnings,
      exampleDestinations: rs.destinations,
    };
  });
  const sorted = [...allMatches].sort((a, b) => b.score - a.score);
  return { profile, topMatches: sorted.slice(0, 5), allMatches: sorted, profileSummary: buildSummary(profile) };
}

export { evaluateProfile };
