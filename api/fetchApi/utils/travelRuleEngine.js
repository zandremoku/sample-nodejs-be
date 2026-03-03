/**
 * Travel Experience Rule Engine - v2.0
 */

// ─── RULE SETS ────────────────────────────────────────────────

const helpers = {
    hasInterest: (p, ...interests) => interests.some(i => p.interests.includes(i)),
    hasLang: (p, ...langs) => langs.some(l => p.languages.includes(l)),
    langCount: (p) => p.languages.length,
    incVal: (iv) => {
        let score;
        if (iv < 30000) {
            score = 1;
        } else if (iv >= 30000 && iv < 40000) {
            score = 2;
        } else if (iv >= 40000 && iv < 60000) {
            score = 3;
        } else {
            score = 4;
        }
        return score;
    },
    fitVal: (f) => ({
        sedentary: 1,
        moderately_active: 2,
        vigorously_active: 3,
        extremely_active: 4
    }[f]),
    durDays: (d) => ({weekend: 2, one_week: 6, two_weeks: 12, three_weeks_plus: 24}[d]),
};

const pos = (score, reasons, warnings = []) => ({score, reasons, warnings}); //helper for positive outlook
const neg = (score, warning) => ({score, reasons: [], warnings: [warning]});// helper for negative outlook

// Duration rule factory
function durationRule(minDays, label) {
    return {
        name: "Travel duration",
        evaluate: (p) => {
            const d = helpers.durDays(p.tripDuration);
            if (d >= minDays) {
                return pos(10, [`Duration suitable for ${label}`]);
            }
            if (d >= minDays * 0.6) {
                return neg(0, `Limited duration. ${label} suitable in a limited version`);
            }
            return neg(-15, `Duration not suitable for ${label} (minimum ~${minDays} days)`);
        },
    };
}

// Group rule factory
function groupRule(good, bad, warning) {
    return {
        name: "Group composition",
        evaluate: (p) => {
            if (bad.includes(p.travelGroup)) return neg(-10, warning);
            if (good.includes(p.travelGroup)) return pos(10, [`Suitable for ${p.travelGroup}`]);
            return pos(0, []);
        },
    };
}

// Language rule factory
function langRule(helpful, label) {
    return {
        name: "Spoken languages",
        evaluate: (p) => {
            if (helpers.hasLang(p, ...helpful)) return pos(8, [`Speaking ${label} is a great advantage!`]);
            if (helpers.hasLang(p, "english") || helpers.langCount(p) >= 2) return pos(3, ["English is a great plus almost everywhere!"]);
            return neg(0, `Speaking ${label} would be very helpful with this experience`);
        },
    };
}

const RULE_SETS = [
    {
        category: "Extreme adventures",
        destinations: ["Patagonia", "Himalaya", "Antarctica", "Iceland vulcanos", "Congo Virunga"],
        rules: [
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r === "high" ? pos(40, ["High risk tolerance, good on ya!"]) :
                        r === "medium" ? neg(10, "High risk: can be very stressful.") :
                            neg(-30, "Discouraged: too much risky based on your condition.")
            },
            {
                name: "Fitness level", evaluate: ({fitnessLevel: f}) =>
                    helpers.fitVal(f) >= 3 ? pos(35, ["Excellent physical shape, good on ya!"]) :
                        helpers.fitVal(f) === 2 ? neg(5, "Requires adequate physical training") :
                            neg(-20, "Sorry, not suitable with your current physical conditions.")
            },
            {
                name: "Interests",
                evaluate: p => helpers.hasInterest(p, "adventure") ? pos(30, ["Adventure passionate"]) : pos(0, [])
            },
            {
                name: "Age", evaluate: ({age: a}) =>
                    a < 18 ? neg(-50, "A minimum 18 yrs of age is required.") :
                        a <= 40 ? pos(10, ["Best age"]) :
                            a <= 55 ? neg(0, "Please consider your health conditions") :
                                neg(-10, "Healthcare professional advise is recommended.")
            },
            {
                name: "Budget", evaluate: ({income}) => {
                    if (helpers.incVal(income) >= 4) {
                        return pos(5, ["Suitable for your budget"]);
                    } else if (helpers.incVal(income) === 3) {
                        return neg(0, "Be careful because of significant budget required");
                    } else {
                        return neg(-5, "Sorry, high budget required. You do not meet the minimum required");
                    }
                }
            },
            durationRule(10, "Extreme adventures"),
            groupRule(["solo", "friends"], ["family_children"], "Extreme adventures are not recommended for people carrying children"),
            langRule(["english", "spanish", "portuguese"], "english/spanish (must have for guides and permits)"),
        ],
    },

    {
        category: "Trekking and nature",
        destinations: ["New Zealand", "Costa Rica", "Norvegian fjords", "Nepal", "Macchu Picchu"],
        rules: [
            {
                name: "Interests",
                evaluate: p => helpers.hasInterest(p, "nature", "photography") ? pos(35, ["You love nature"]) : pos(0, [])
            },
            {
                name: "Fitness", evaluate: ({fitnessLevel: f}) =>
                    helpers.fitVal(f) >= 2 ? pos(30, ["Good fit for trekking"]) : neg(-10, "Trekking could be difficult")
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r !== "low" ? pos(15, ["Keen to challenging experiences"]) : pos(5, ["Easy trekking available"])
            },
            {
                name: "Budget", evaluate: ({income}) => {
                    if (helpers.incVal(income) >= 4) {
                        return pos(5, ["Suitable for your budget"]);
                    } else if (helpers.incVal(income) === 3) {
                        return neg(0, "Be careful because of significant budget required");
                    } else {
                        return neg(-5, "Sorry, high budget required. You do not meet the minimum required");
                    }
                }
            },
            durationRule(4, "Quality trekking"),
            groupRule(["solo", "couple", "friends"], ["family_children"], "Demanding treks not suitable for small children"),
            langRule(["english", "german"], "english/german"),
        ],
    },

    {
        category: "Culture e history",
        destinations: ["Rome", "Athens", "Paris", "Florence", "Cairo", "London", "Madrid", "Petra", "Marrakesh"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "history", "art", "architecture") ? pos(45, ["Highly interested for culture"]) : pos(0, [])
            },
            {name: "Fitness", evaluate: () => pos(20, ["Does not require a high physical effort"])},
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r === "low" ? pos(20, ["Safe destinations"]) : pos(10, [])
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 2 ? pos(15, ["Budget for museums and tours"]) :
                        pos(5, [], ["Some landmarks/sightseeing have entrance fees"])
            },
            durationRule(4, "Cultural itineraries"),
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "couple") return pos(8, ["Perfect for a couple!"]);
                    if (p.travelGroup === "family_children") return neg(-5, "Choose kid-friendly!");
                    return pos(5, []);
                }
            },
            {
                name: "Languages", evaluate: (p) => {
                    const local = ["italian", "spanish", "french", "arabic", "english"];
                    const matched = local.filter(l => p.languages.includes(l));
                    if (matched.length > 0) return pos(10, [`You speak ${matched.join("/")} — better culture immersion, good on ya!`]);
                    if (helpers.hasLang(p, "english")) return pos(4, ["English is enough in most of sites"]);
                    return neg(-3, "Language barriers could limit enjoying the experiences");
                }
            },
        ],
    },

    {
        category: "Art and design",
        destinations: ["Berlin", "New York", "Milan", "Barcellona", "Paris", "Tokyo"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "art", "architecture", "photography") ? pos(50, ["Love arts and design"]) : pos(5, [])
            },
            {name: "Accessibility", evaluate: () => pos(20, ["Accessible for all ages"])},
            {
                name: "Nightlife", evaluate: p =>
                    helpers.hasInterest(p, "nightlife") ? pos(15, ["Creative cities have a vibrant nightlife"]) : pos(0, [])
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 2 ? pos(15, ["Consider budget for museums and tours"]) :
                        neg(-10, [], ["Exclusive experiences require higher budget"])
            },
            durationRule(2, "Artsy city trips"),
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "couple") return pos(10, ["Perfect for a couple"]);
                    if (p.travelGroup === "friends") return pos(8, ["Very enjoying with friends"]);
                    if (p.travelGroup === "family_children") return neg(-5, "Modern museum not always suitable with children");
                    return pos(3, []);
                }
            },
            langRule(["english", "french", "german", "japanese"], "english/french (local artsy scenes)"),
        ],
    },

    {
        category: "Food and wine",
        destinations: ["Tuscany", "Lyon", "San Sebastián", "Japan", "Mexico", "Perù"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "food") ? pos(55, ["Food is at the center of your interests!"]) : pos(0, [])
            },
            {
                name: "Culture", evaluate: p =>
                    helpers.hasInterest(p, "history", "art") ? pos(15, ["Foodish locations offer culture too!"]) : pos(0, [])
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 3 ? pos(20, ["Budget for premium restaurants and wine tours"]) :
                        helpers.incVal(income) >= 2 ? pos(10, ["Accessible food experiences"]) :
                            pos(0, [], ["Be aware the best restaurants could be very expensive!"])
            },
            {name: "Fitness level", evaluate: () => pos(10, ["Perfect for all physical conditions"])},
            durationRule(4, "food tours"),
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "couple") return pos(12, ["The ultimate romantic experience"]);
                    if (p.travelGroup === "friends") return pos(10, ["Sharing food with friends — perfect"]);
                    if (p.travelGroup === "family_children") return neg(-5, "Children limit restaurant choices");
                    return pos(5, []);
                }
            },
            {
                name: "Languages", evaluate: (p) => {
                    const gl = ["italian", "french", "spanish", "japanese", "portuguese"];
                    const m = gl.filter(l => p.languages.includes(l));
                    if (m.length > 0) return pos(10, [`You speak ${m.join("/")} — access to off-menu experiences and markets`]);
                    return pos(2, [], ["The local language opens up many more gastronomic experiences"]);
                }
            },
        ],
    },

    {
        category: "Relax e wellness",
        destinations: ["Maldives", "Bali", "Santorini", "Thailand", "Mauritius", "Azores"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "relax") ? pos(50, ["Relax is your priority"]) : pos(10, ["Tutti hanno bisogno di relax"])
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r === "low" ? pos(25, ["Safe and peaceful destinations"]) : pos(10, [])
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 4 ? pos(20, ["Budget for luxury resorts"]) :
                        helpers.incVal(income) >= 3 ? pos(10, ["Good mid-range options"]) :
                            neg(-5, "Exclusive destinations have high costs")
            },
            {name: "Fitness level", evaluate: () => pos(5, ["It does not require any particular physical fitness"])},
            durationRule(4, "relax vacations"),
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "couple") return pos(15, ["Romantic and regenerating holiday"]);
                    if (p.travelGroup === "family_children") return pos(8, ["Resort with family services available"]);
                    if (p.travelGroup === "solo") return pos(5, ["Solitary regeneration — great idea"]);
                    return pos(5, []);
                }
            },
            langRule(["english"], "English (sufficient in all resorts)"),
        ],
    },

    {
        category: "Safaris and wildlife",
        destinations: ["Kenya Masai Mara", "Tanzania Serengeti", "South Africa", "Botswana Okavango", "Rwanda"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "nature", "photography") ? pos(45, ["Perfect for nature and wildlife photography"]) : pos(5, [])
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r === "high" ? pos(20, ["Open to safari adventures"]) :
                        r === "medium" ? pos(10, []) :
                            neg(-5, "Safaris involve some risk and unpredictability")
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 3 ? pos(25, ["Budget for lodges and specialized guides"]) :
                        helpers.incVal(income) >= 2 ? pos(5, [], ["Quality safaris come at a significant cost"]) :
                            neg(-10, "Luxury safari on a budget")
            },
            {name: "Age", evaluate: ({age: a}) => a >= 12 ? pos(5, []) : neg(-20, "Minimum age required")},
            durationRule(6, "complete safaris"),
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "family_children") return neg(-8, "Check the lodge's minimum age requirement.");
                    if (p.travelGroup === "couple") return pos(10, ["Couples' Safari — a Unique and Romantic Experience"]);
                    if (p.travelGroup === "solo") return pos(8, ["Group safaris for singles are very popular"]);
                    return pos(5, []);
                }
            },
            langRule(["english", "french", "portuguese"], "english/french (mandatory in Africa)"),
        ],
    },

    {
        category: "Luxury cruises",
        destinations: ["Mediterranean", "Caribbean", "Alaska", "Norvegian fjords", "Antartica expedition"],
        rules: [
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 4 ? pos(35, ["Ideal budget for luxury cruises"]) :
                        helpers.incVal(income) === 3 ? pos(10, [], ["Some of this options might be suitable for your budget"]) :
                            neg(-10, "Luxury cruises off your budget")
            },
            {
                name: "Interests", evaluate: (p) => {
                    const n = (["history", "art", "food", "relax", "nature"]).filter(i => p.interests.includes(i)).length;
                    return n >= 2 ? pos(25, ["The cruise covers many of your interests in one trip"]) : pos(5, []);
                }
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r === "low" ? pos(20, ["Safe and comfortable experience"]) : pos(10, [])
            },
            {
                name: "Age/Fitness level", evaluate: ({age: a, fitnessLevel: f}) =>
                    a >= 50 && helpers.fitVal(f) <= 2 ? pos(15, ["Maximum comfort without physical effort"]) : pos(5, [])
            },
            {
                name: "Travel duration", evaluate: (p) => {
                    const d = helpers.durDays(p.tripDuration);
                    if (d >= 7) return pos(15, ["Ideal duration for a complete cruise"]);
                    if (d >= 4) return pos(5, [], ["Short cruises limit the stops"]);
                    return neg(-15, "A cruise requires at least 5–7 days");
                }
            },
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "family_children") return pos(10, ["Cruise ships with excellent family services"]);
                    if (p.travelGroup === "couple") return pos(12, ["Perfect for a couple"]);
                    if (p.travelGroup === "family_adults") return pos(10, ["Ideal for families with different interests"]);
                    return pos(5, []);
                }
            },
            langRule(["english", "italian", "spanish"], "English (official language on international ships)"),
        ],
    },

    {
        category: "Backpacking",
        destinations: ["Sud-Est Asia", "America Latina", "India", "Morocco", "Eastern Europe"],
        rules: [
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) <= 2 ? pos(30, ["Backpacking maximizes experiences on a budget"]) : pos(10, [])
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r !== "low" ? pos(25, ["Open to the unpredictability of travel"]) : neg(-10, "Backpacking can be unpredictable")
            },
            {
                name: "Age", evaluate: ({age: a}) =>
                    a <= 30 ? pos(25, ["Ideal age for backpacking"]) :
                        a <= 45 ? pos(10, []) : neg(-5, "Intensive backpacking can be tiring")
            },
            {
                name: "Fitness level", evaluate: ({fitnessLevel: f}) =>
                    helpers.fitVal(f) >= 2 ? pos(20, ["Good resistance for frequent movements"]) : neg(-5, "Spostamenti continui richiedono energia")
            },
            {
                name: "Travel duration", evaluate: (p) => {
                    const d = helpers.durDays(p.tripDuration);
                    if (d >= 14) return pos(20, ["Perfect durability for immersive backpacking"]);
                    if (d >= 7) return pos(10, ["Enough to explore a region"]);
                    return neg(-5, "Backpacking is most rewarding with at least 7–14 days");
                }
            },
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "solo") return pos(20, ["Backpacking alone is a unique growth experience"]);
                    if (p.travelGroup === "friends") return pos(15, ["With friends: more safety and more fun"]);
                    if (p.travelGroup === "family_children") return neg(-20, "Backpacking not recommended with little children");
                    if (p.travelGroup === "couple") return pos(10, ["Very romantic as a couple"]);
                    return pos(5, []);
                }
            },
            {
                name: "Languages", evaluate: (p) => {
                    const n = helpers.langCount(p);
                    if (n >= 3) return pos(12, [`You speak ${n} languages — great for solo travelling!`]);
                    if (helpers.hasLang(p, "english", "spanish")) return pos(8, ["English/Spanish cover most destinations"]);
                    return neg(-3, "English is almost essential in backpacking");
                }
            },
        ],
    },

    {
        category: "Surfing and water sports",
        destinations: ["Hawaii", "Bali", "Portugal Nazaré", "Australia", "Messico Puerto Escondido"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "sport", "adventure") ? pos(50, ["Passion for sports and adventure"]) : pos(0, [])
            },
            {
                name: "Fitness level", evaluate: ({fitnessLevel: f}) =>
                    helpers.fitVal(f) >= 3 ? pos(30, ["Excellent physical level!"]) :
                        helpers.fitVal(f) === 2 ? pos(10, [], ["Start with basic lessons"]) :
                            neg(-15, "Water sports require good physical fitness")
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r !== "low" ? pos(15, []) : neg(-10, "Water sports carry risks")
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 4 ? pos(10, ["Budget for equipment and guides"]) : neg(-10, "Higher budget required for travel to these destinations, in addition of expensive equipment and guides")
            },
            {
                name: "Age", evaluate: ({age: a}) =>
                    a <= 35 ? pos(10, ["Ideal age"]) :
                        a <= 50 ? pos(5, [], ["Possible with the right experience"]) :
                            neg(-5, "Consider less intense options (kayaking, snorkeling)")
            },
            {
                name: "Travel duration", evaluate: (p) => {
                    const d = helpers.durDays(p.tripDuration);
                    if (d >= 7) return pos(10, ["Duration to learn and progress"]);
                    if (d >= 4) return pos(5, ["Minimum days to learn"]);
                    return neg(-5, "With less than 4 days it is difficult to learn or progress in surfing");
                }
            },
            groupRule(["friends", "solo", "couple"], ["family_friends"], "Demanding water sports are not suitable for families with children"),
            langRule(["english", "Portuguese", "spanish"], "English/Spanish (international surf community)"),
        ],
    },

    {
        category: "Nature photography",
        destinations: ["Iceland", "Galapagos", "Amazon", "Yellowstone", "Namibia", "Norwegian Aurora"],
        rules: [
            {
                name: "Interests", evaluate: p =>
                    helpers.hasInterest(p, "photography", "nature") ? pos(55, ["Photography and nature are your passions!"]) :
                        helpers.hasInterest(p, "adventure") ? pos(15, []) : pos(0, [])
            },
            {
                name: "Fitness", evaluate: ({fitnessLevel: f}) =>
                    helpers.fitVal(f) >= 2 ? pos(20, ["Adequate fitness for hiking"]) : neg(-5, "Some locations require long walks at dawn")
            },
            {
                name: "Risk tolerance", evaluate: ({riskTolerance: r}) =>
                    r !== "low" ? pos(15, ["Open to remote and wild locations"]) : pos(5, [])
            },
            {
                name: "Budget", evaluate: ({income}) =>
                    helpers.incVal(income) >= 4 ? pos(10, ["Budget for equipment and guides"]) : neg(-10, "Higher budget required for travel to these destinations, in addition of expensive equipment and guides")
            },
            {
                name: "Travel duration", evaluate: (p) => {
                    const d = helpers.durDays(p.tripDuration);
                    if (d >= 7) return pos(15, ["Duration to hunt the perfect light conditions"]);
                    if (d >= 5) return pos(5, ["Ok, that's the minimum to enjoy!"]);
                    return neg(-10, "Wildlife photography requires at least 5–7 days");
                }
            },
            {
                name: "Group composition", evaluate: (p) => {
                    if (p.travelGroup === "solo") return pos(15, ["Alone: maximum freedom to follow light and subjects"]);
                    if (p.travelGroup === "couple" || p.travelGroup === "friends") return pos(5, [], ["Make sure everyone shares rhythms and schedules"]);
                    if (p.travelGroup === "family_children") return neg(-10, "Small children make the patience required difficult");
                    return pos(5, []);
                }
            },
            langRule(["english", "spanish", "portuguese"], "English (essential for guides and permits in the reserves)"),
        ],
    },
];

// ─── ENGINE ───────────────────────────────────────────────────

function buildSummary(p) {
    const age = p.age < 25 ? "young explorer" : p.age < 40 ? "traveler in the prime of life" : p.age < 60 ? "expert traveler" : "mature traveler";
    const fitMap = {
        sedendary: "quiet rhythms as you are used to be",
        moderately_active: "good resistance",
        vigorously_active: "you enjoy being active!",
        extremely_active: "althet here, excellent!"
    };
    const incMap = {
        low: "low budget",
        medium: "flexible budget",
        high: "good budget",
        very_high: "high budget"
    };
    const groupMap = {
        solo: "solo traveler",
        couple: "travel with partner",
        friends: "with friends",
        family_children: "family travel with children",
        family_adults: "family travel (no children)"
    };
    const durMap = {
        weekend: "un weekend",
        one_week: "one week",
        two_weeks: "two weeks",
        three_weeks_plus: "three weeks or more"
    };

    const fit = fitMap[p.fitnessLevel];
    console.log("Income value:", p.income);
    let income;
    if (p.income < 30000) {
        income = 'low';
    } else if (p.income >= 30000 && p.income < 40000) {
        income = 'medium';
    } else if (p.income >= 40000 && p.income < 60000) {
        income = 'high';
    } else {
        income = 'very_high';
    }
    const inc = incMap[income];
    const group = groupMap[p.travelGroup];
    const dur = durMap[p.tripDuration];

    return `${age.charAt(0).toUpperCase() + age.slice(1)}, ${fit}, ${inc}. ${group.charAt(0).toUpperCase() + group.slice(1)} for ${dur}. Languages: ${p.languages.join(", ")}. Interests: ${p.interests.join(", ")}.`;
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
    return {profile, topMatches: sorted.slice(0, 5), allMatches: sorted, profileSummary: buildSummary(profile)};
}

export {evaluateProfile};
