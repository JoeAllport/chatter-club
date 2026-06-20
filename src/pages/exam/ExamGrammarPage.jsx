// ExamGrammarPage.jsx — Individual grammar point page (/exam/grammar/:point)
// SEO surface: free, no sign-up required
// Pulls explanation content + exercises from grammar_items
// Option B: full explanation + all available exercises with score counter

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Slug ↔ grammar_point conversion ──────────────────────────────────────────

function slugToPoint(slug) {
  return slug.replace(/-/g, '_')
}

// ── Exam part badge colours ───────────────────────────────────────────────────

const PART_COLOURS = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-violet-50 text-violet-700 border-violet-200',
  3: 'bg-orange-50 text-orange-700 border-orange-200',
  4: 'bg-rose-50 text-rose-700 border-rose-200',
  W: 'bg-teal-50 text-teal-700 border-teal-200',
}

const PART_LABELS = {
  mcq:           { part: 1, label: 'Part 1 — Multiple-choice cloze' },
  open_cloze:    { part: 2, label: 'Part 2 — Open cloze' },
  fill_in:       { part: 2, label: 'Part 2 — Open cloze' },
  word_formation:{ part: 3, label: 'Part 3 — Word formation' },
  transformation:{ part: 4, label: 'Part 4 — Key word transformation' },
}

// ── Grammar explanations ──────────────────────────────────────────────────────
// Each entry: { title, level, intro, structures[], notes[], examTips[] }

const EXPLANATIONS = {

  // ── CORE GRAMMAR ────────────────────────────────────────────────────────────

  conditionals: {
    title: 'Conditionals',
    level: 'B1–B2',
    intro: `Conditionals describe situations and their results. English has four main conditional forms, each used for a different type of situation.`,
    structures: [
      { name: 'Zero conditional',  form: 'If + present simple, present simple',                 example: 'If you heat water to 100°C, it boils.',               use: 'Facts and general truths' },
      { name: 'First conditional', form: 'If + present simple, will + infinitive',              example: 'If it rains tomorrow, we will stay inside.',          use: 'Real future possibilities' },
      { name: 'Second conditional',form: 'If + past simple, would + infinitive',                example: 'If I had more time, I would study harder.',           use: 'Unreal or unlikely present/future' },
      { name: 'Third conditional', form: 'If + past perfect, would have + past participle',     example: 'If she had studied, she would have passed.',          use: 'Unreal past — imagining a different outcome' },
    ],
    notes: [
      'The if-clause can come first or second: "We would stay inside if it rained" is equally correct.',
      'Mixed conditionals combine second and third: "If I had studied harder, I would be a doctor now."',
      'In formal writing, you can use "were" instead of "was" in second conditionals: "If he were here, he would agree."',
    ],
    examTips: [
      { part: 2, tip: 'Part 2 tests "if", "unless", "provided that", "as long as" — all introduce conditionals.' },
      { part: 4, tip: 'Part 4 often transforms: "I didn\'t study, so I failed." → "If I had studied, I wouldn\'t have failed."' },
    ],
  },

  passive_voice: {
    title: 'Passive Voice',
    level: 'B1–B2',
    intro: `The passive voice is used when the action is more important than who does it, or when we do not know who does the action.`,
    structures: [
      { name: 'Present simple passive',  form: 'am/is/are + past participle',        example: 'The report is written every week.',      use: 'Regular or ongoing actions' },
      { name: 'Past simple passive',     form: 'was/were + past participle',          example: 'The bridge was built in 1889.',          use: 'Completed past actions' },
      { name: 'Present perfect passive', form: 'has/have been + past participle',     example: 'The results have been announced.',       use: 'Recent completed actions' },
      { name: 'Future passive',          form: 'will be + past participle',           example: 'The decision will be made tomorrow.',    use: 'Future actions' },
    ],
    notes: [
      'Use "by" + agent only when the agent is important or surprising: "The cake was eaten by the dog."',
      'Verbs with two objects (give, send, tell) can form passives in two ways: "She was given the prize" or "The prize was given to her."',
      'Causative passive: "I had my car serviced" — a professional did it for you.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: passive constructions often use "been" as the missing word.' },
      { part: 4, tip: 'Part 4 tests active ↔ passive transformations — the key word is often the verb form that forces the switch.' },
    ],
  },

  reported_speech: {
    title: 'Reported Speech',
    level: 'B1–B2',
    intro: `Reported speech (also called indirect speech) is used to report what someone said without quoting their exact words. Tenses usually shift back one step.`,
    structures: [
      { name: 'Present → past',          form: 'present simple → past simple',       example: '"I work here." → She said she worked there.',             use: 'Standard tense backshift' },
      { name: 'Will → would',            form: 'will → would',                        example: '"I will call you." → He said he would call.',             use: 'Future statements' },
      { name: 'Can → could',             form: 'can → could',                         example: '"I can help." → She said she could help.',                use: 'Ability / offers' },
      { name: 'Reporting questions',     form: 'if/whether (yes/no); wh-word (wh-Q)', example: '"Are you coming?" → He asked if I was coming.',           use: 'Reported questions — no inversion, no question mark' },
    ],
    notes: [
      'Time expressions also shift: "today" → "that day", "yesterday" → "the day before", "tomorrow" → "the next day".',
      'If reporting something still true now, the tense shift is optional: "She said the Earth is round" (not: was).',
      'Reporting verbs beyond say/tell: told, asked, explained, warned, promised, suggested, admitted, denied.',
    ],
    examTips: [
      { part: 4, tip: 'Part 4 frequently tests reported speech: "I\'ll be there," he said. → He promised ___." The key word signals the reporting verb.' },
    ],
  },

  modal_verbs: {
    title: 'Modal Verbs',
    level: 'B1–B2',
    intro: `Modal verbs (can, could, may, might, must, should, will, would, shall, ought to) add meaning about ability, possibility, obligation, permission or deduction.`,
    structures: [
      { name: 'Deduction (present)', form: 'must / can\'t / might / could + infinitive',                  example: 'She must be tired — she worked all night.',      use: 'Logical conclusions about now' },
      { name: 'Deduction (past)',    form: 'must / can\'t / might / could + have + past participle',       example: 'He can\'t have forgotten — he wrote it down.',    use: 'Logical conclusions about the past' },
      { name: 'Obligation',         form: 'must / have to / should / ought to',                           example: 'You must submit the form by Friday.',             use: 'Necessity and advice' },
      { name: 'Permission',         form: 'can / could / may / might',                                    example: 'You may leave early if you finish.',              use: 'Formal permission; uncertain possibility' },
    ],
    notes: [
      '"Must" = internal obligation (I decide). "Have to" = external obligation (rules, laws).',
      '"Needn\'t have" = did something but it was unnecessary. "Didn\'t need to" = wasn\'t necessary (and probably didn\'t do it).',
      '"Could have" = was possible but didn\'t happen. "Should have" = was the right thing to do but didn\'t happen.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "must", "might", "could", "should" frequently appear as missing function words.' },
      { part: 4, tip: 'Part 4: "There\'s no need to go." → "You needn\'t ___." Modal transformations are very common.' },
    ],
  },

  relative_clauses: {
    title: 'Relative Clauses',
    level: 'B1–B2',
    intro: `Relative clauses add information about a noun. They are introduced by relative pronouns: who, which, that, whose, where, when.`,
    structures: [
      { name: 'Defining',         form: 'who / which / that (no commas)',    example: 'The book that I recommended is now a film.',             use: 'Identifies which person or thing — essential information' },
      { name: 'Non-defining',     form: 'who / which (with commas)',         example: 'My sister, who lives in Madrid, is a teacher.',         use: 'Adds extra, non-essential information' },
      { name: 'Whose',            form: 'whose + noun',                     example: 'The author whose novel won the prize was there.',        use: 'Shows possession — replaces "his/her/their"' },
      { name: 'Where / when',     form: 'where (place) / when (time)',       example: 'The café where we met has closed.',                     use: 'Relative adverbs instead of pronoun + preposition' },
    ],
    notes: [
      'In defining clauses, "that" can replace "who" or "which", but NOT in non-defining clauses.',
      'The relative pronoun can be omitted when it is the object: "The film (that) I watched was great."',
      '"Whose" is often confused with "who\'s" (= who is). They are never interchangeable.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "which", "whose", "where", "when" frequently appear as missing relative pronouns.' },
      { part: 4, tip: 'Part 4: "The man\'s company went bankrupt." → "The man, whose company went bankrupt, ___."' },
    ],
  },

  gerunds_infinitives: {
    title: 'Gerunds and Infinitives',
    level: 'B1–B2',
    intro: `Some verbs are followed by the gerund (-ing form), some by the infinitive (to + verb), and some by either — with a change in meaning.`,
    structures: [
      { name: 'Gerund (-ing)',           form: 'verb + -ing',           example: 'She enjoys reading. They suggested leaving early.',     use: 'After: enjoy, avoid, suggest, mind, consider, finish, admit, deny' },
      { name: 'Infinitive (to + verb)',  form: 'verb + to + infinitive', example: 'He decided to leave. She agreed to help.',             use: 'After: want, decide, agree, hope, plan, refuse, manage, seem' },
      { name: 'Change in meaning',       form: 'remember / forget / try / stop', example: 'I remember meeting her. (past) / I must remember to call. (future)', use: 'The same verb changes meaning with -ing vs to' },
      { name: 'After prepositions',      form: 'preposition + -ing',    example: 'She left without saying goodbye.',                      use: 'Gerund always follows a preposition' },
    ],
    notes: [
      '"Stop doing" = quit the action. "Stop to do" = pause in order to do something else.',
      '"Try doing" = experiment to see if it works. "Try to do" = attempt (may not succeed).',
      'Adjective + preposition combinations also take the gerund: "good at swimming", "afraid of failing".',
    ],
    examTips: [
      { part: 1, tip: 'Part 1: "She avoided ___ (to make / making) eye contact" — the correct form is "making".' },
      { part: 2, tip: 'Part 2: the missing word is often "to" — the start of an infinitive.' },
      { part: 4, tip: 'Part 4: "It is not worth making that journey." → "There is no point ___."' },
    ],
  },

  present_perfect_past_simple: {
    title: 'Present Perfect vs Past Simple',
    level: 'B1–B2',
    intro: `Both tenses talk about the past, but the present perfect connects the past to now; the past simple is used for finished events with a specific time.`,
    structures: [
      { name: 'Present perfect',   form: 'have/has + past participle',  example: 'I have visited Paris. (connection to now: experience)',     use: 'Experience, recent events, unfinished time periods' },
      { name: 'Past simple',       form: 'verb + -ed / irregular',      example: 'I visited Paris last year. (finished, specific time)',      use: 'Finished past with a specific time marker' },
      { name: 'Present perfect + for/since', form: 'have/has + pp + for/since', example: 'She has worked here for five years.',              use: 'Duration from past to now ("for" = period, "since" = start point)' },
      { name: 'Already/yet/just',  form: 'have + already/just/yet + pp', example: 'I\'ve already eaten. Have you finished yet?',             use: 'Time adverbs that signal present perfect' },
    ],
    notes: [
      'Use past simple with: yesterday, last week, in 2010, ago, when. Use present perfect with: already, yet, just, ever, never, recently.',
      '"I\'ve been to Paris" = I went at some point (experience). "I went to Paris" = I went (implies I came back, specific occasion).',
      '"I\'ve been here since Monday" (still here now) vs "I was here on Monday" (finished).',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "for" and "since" are common missing words in perfect tense contexts.' },
      { part: 4, tip: 'Part 4: "She started working here five years ago." → "She has worked here ___."' },
    ],
  },

  comparatives_superlatives: {
    title: 'Comparatives and Superlatives',
    level: 'B1–B2',
    intro: `Comparatives compare two things; superlatives compare one thing with all others in a group.`,
    structures: [
      { name: 'Comparative',             form: 'adjective + -er / more + adjective', example: 'This route is faster. The new model is more efficient.',    use: 'Comparing two things; "than" follows' },
      { name: 'Superlative',             form: 'the + adjective + -est / most',       example: 'This is the fastest route. The most efficient model.',      use: 'One thing vs all others in a group' },
      { name: 'Double comparative',      form: 'the + comparative, the + comparative', example: 'The more you practise, the better you get.',              use: 'Two things changing together' },
      { name: 'Modifying comparatives',  form: 'much/far/a lot / slightly/a little + comparative', example: 'This is far more expensive.',                 use: 'Degree of difference' },
    ],
    notes: [
      'One-syllable adjectives: add -er/-est (fast → faster → fastest).',
      'Two+ syllable adjectives: use more/most (careful → more careful → most careful). Exceptions: happier, busiest.',
      'Irregular: good/well → better → best; bad → worse → worst; far → further/farther → furthest/farthest.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "as ___ as" structures often have the adjective missing.' },
      { part: 4, tip: 'Part 4: "No other city in Spain is as big as Madrid." → "Madrid is ___ city in Spain."' },
    ],
  },

  unreal_past: {
    title: 'Unreal Past (wish / if only)',
    level: 'B2',
    intro: `"Wish" and "if only" express regret or desire for things to be different. They use past or perfect tenses to describe unreal situations.`,
    structures: [
      { name: 'Wish + past simple',      form: 'wish + past simple',            example: 'I wish I lived closer to work. (but I don\'t)',    use: 'Desire for a present situation to be different' },
      { name: 'Wish + past perfect',     form: 'wish + had + past participle',  example: 'I wish I had studied harder. (but I didn\'t)',    use: 'Regret about the past' },
      { name: 'Wish + would',            form: 'wish + subject + would + inf',  example: 'I wish you would stop doing that.',               use: 'Annoyance at someone\'s behaviour (they can change it)' },
      { name: 'If only',                 form: 'if only + past simple/perfect', example: 'If only I had more time. / If only I had known.', use: 'Stronger emotion than "wish"' },
    ],
    notes: [
      '"Wish + past simple" is for present situations; "wish + past perfect" is for past regrets.',
      '"Wish + would" is NOT used when the subject of wish and would are the same: NOT "I wish I would study more" → use "I wish I studied more".',
      '"It\'s time + past simple" works the same way: "It\'s time we left." = we haven\'t left yet.',
    ],
    examTips: [
      { part: 4, tip: 'Part 4 transformation: "I regret not going to university." → "I wish I ___."' },
    ],
  },

  causative_structures: {
    title: 'Causative Structures (have/get)',
    level: 'B2',
    intro: `Causative structures express the idea that someone arranges for something to be done by another person, rather than doing it themselves.`,
    structures: [
      { name: 'Have something done',  form: 'have + object + past participle',      example: 'I had my hair cut yesterday.',                      use: 'A professional did it for you (neutral/formal)' },
      { name: 'Get something done',   form: 'get + object + past participle',       example: 'I got my car fixed at the garage.',                 use: 'Same meaning, more informal' },
      { name: 'Have someone do sth',  form: 'have + person + bare infinitive',      example: 'The manager had his assistant prepare the report.',  use: 'Someone does something for you' },
      { name: 'Get someone to do sth',form: 'get + person + to + infinitive',       example: 'I got my friend to help me move.',                  use: 'Persuade or arrange for someone to do something' },
    ],
    notes: [
      '"Have + object + past participle" can also mean something bad happened: "I had my wallet stolen." (you didn\'t arrange it).',
      'Context determines the meaning — look at whether the situation is positive/neutral (arranged) or negative (suffered).',
      '"Get" versions are more conversational; "have" versions suit formal writing.',
    ],
    examTips: [
      { part: 4, tip: 'Part 4: "A mechanic repaired my car." → "I had my car ___." Focus on the word order: object before past participle.' },
    ],
  },

  participle_clauses: {
    title: 'Participle Clauses',
    level: 'B2',
    intro: `Participle clauses use -ing (present participle) or -ed (past participle) to shorten relative clauses or adverbial clauses. They are common in formal and written English.`,
    structures: [
      { name: 'Present participle (-ing)', form: '-ing clause',                 example: 'Walking into the room, she noticed the mess.',       use: 'Replaces an adverbial clause (when / while / because)' },
      { name: 'Past participle (-ed)',     form: '-ed clause',                  example: 'Written in 1851, the novel is still relevant today.', use: 'Passive meaning — replaces "which was written"' },
      { name: 'After conjunctions',        form: 'having + past participle',    example: 'Having finished the report, he went home.',          use: 'Shows the first action completed before the second' },
      { name: 'Reduced relative clauses', form: '-ing / -ed replacing who/which', example: 'The man sitting by the window is my boss.',       use: 'Shorter than "the man who is sitting"' },
    ],
    notes: [
      'The subject of the participle clause must match the subject of the main clause.',
      '"Walking down the street, a dog barked at me" is wrong — the dog was not walking.',
      'Common in Cambridge B2 Writing — use them to vary your sentence structure.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "Having" often introduces a participle clause — it can be a missing word.' },
      { part: 4, tip: 'Part 4: "Because she was tired, she went home early." → "___ tired, she went home early." (Being / Feeling)' },
    ],
  },

  // ── VOCABULARY AND USAGE ─────────────────────────────────────────────────────

  articles: {
    title: 'Articles (a / an / the)',
    level: 'B1–B2',
    intro: `English has two articles: the definite article "the" and the indefinite article "a/an". Knowing when to use each — or no article at all — is essential at B2 level.`,
    structures: [
      { name: 'The — definite article',   form: 'the + noun',                    example: 'The sun rises in the east.',              use: 'Something already known; only one of its kind; superlatives' },
      { name: 'A/An — indefinite article',form: 'a/an + singular countable noun', example: 'She bought a book and an umbrella.',      use: 'First mention; one of many; jobs and roles' },
      { name: 'No article (zero article)',form: '— + noun',                      example: 'I love music. He studies medicine.',      use: 'Plural/uncountable nouns in general; proper nouns; meals, languages, sports' },
    ],
    notes: [
      '"The" with unique things: the moon, the Internet, the 1990s, the north of Spain.',
      'No article with most proper nouns: Spain, London, Mount Everest — but: the United Kingdom, the Nile, the Alps.',
      '"A" vs "an" depends on the sound, not the letter: "an hour" (silent h), "a university" (sounds like "you").',
    ],
    examTips: [
      { part: 2, tip: 'Part 2 frequently tests articles — "the", "a", or "an" are valid open cloze answers. Never leave this blank.' },
    ],
  },

  quantifiers: {
    title: 'Quantifiers',
    level: 'B1–B2',
    intro: `Quantifiers express how much or how many of something there is. The correct choice depends on whether the noun is countable or uncountable, and whether the sentence is positive, negative, or a question.`,
    structures: [
      { name: 'Large quantity',   form: 'many (C) / much (U) / a lot of (C+U) / plenty of',     example: 'I have many friends. There isn\'t much time.',       use: 'Large amounts' },
      { name: 'Small quantity',   form: 'a few (C) / a little (U) / some (C+U, positive)',       example: 'We have a few options. I have a little money.',      use: 'Small but sufficient amount' },
      { name: 'Negative/minimal', form: 'few (C) / little (U) = not many/much',                 example: 'Few people know the truth. (= not many)',            use: '"Few/little" without "a" = surprisingly small, often negative' },
      { name: 'Questions/negatives', form: 'any (C+U) / no (C+U)',                              example: 'Is there any milk? There are no seats left.',         use: '"Any" in questions and negatives; "no" = not any' },
    ],
    notes: [
      '"Few" vs "a few": "few friends" = hardly any (negative idea); "a few friends" = some (positive idea). Same with "little/a little".',
      '"Each" and "every" are both used with singular countable nouns but have slightly different emphasis.',
      '"Either/neither" are for two things; "any/none" for three or more.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: quantifiers like "few", "much", "any", "no" are common missing words in open cloze tasks.' },
    ],
  },

  prepositions: {
    title: 'Prepositions',
    level: 'B1–B2',
    intro: `Prepositions show relationships of time, place, and manner. Many English verbs, adjectives, and nouns are followed by a fixed preposition — these must be learned as chunks.`,
    structures: [
      { name: 'Time',         form: 'at (specific time), on (day/date), in (period)', example: 'at 3pm / on Monday / in January / in the morning',     use: 'AT a point in time; ON a day; IN a period' },
      { name: 'Place',        form: 'at (location), on (surface), in (enclosed)',     example: 'at the station / on the table / in the box',            use: 'AT a point; ON a surface; IN enclosed/bounded space' },
      { name: 'Verb + prep',  form: 'verb + fixed preposition',                       example: 'depend on, consist of, apply for, agree with',           use: 'Fixed collocations — cannot be changed' },
      { name: 'Adj + prep',   form: 'adjective + fixed preposition',                  example: 'fond of, responsible for, interested in, good at',       use: 'Fixed adjective collocations' },
    ],
    notes: [
      '"Interested in" (NOT "interested about"). "Responsible for" (NOT "responsible of"). "Good at" (NOT "good in").',
      'Dependent prepositions must be learned by chunk, not rule. Exposure to authentic texts is the fastest route.',
      'Part 4 often tests prepositions in transformation: the key word forces a different structure with a different preposition.',
    ],
    examTips: [
      { part: 1, tip: 'Part 1 tests prepositions as vocabulary choices — often the meaning difference is subtle (among vs between).' },
      { part: 2, tip: 'Part 2: prepositions are frequently the missing word in open cloze.' },
      { part: 4, tip: 'Part 4: "She is responsible for the project." → "The project is ___." (her responsibility)' },
    ],
  },

  linking_words: {
    title: 'Linking Words',
    level: 'B1–B2',
    intro: `Linking words connect ideas within and between sentences. They show contrast, reason, result, addition, concession and more. Essential for writing tasks.`,
    structures: [
      { name: 'Addition',     form: 'furthermore / moreover / in addition / besides',               example: 'The hotel was expensive. Furthermore, the service was poor.',        use: 'Adding a point, often reinforcing' },
      { name: 'Contrast',     form: 'however / nevertheless / on the other hand / whereas',         example: 'I like coffee. However, I try not to drink it too late.',            use: 'Opposing ideas' },
      { name: 'Concession',   form: 'although / even though / despite / in spite of',               example: 'Although she was tired, she finished the report.',                   use: '"Despite the fact" — unexpected contrast' },
      { name: 'Result',       form: 'therefore / consequently / as a result / so',                  example: 'He missed the bus; consequently, he arrived late.',                  use: 'Cause and effect' },
    ],
    notes: [
      '"Although/even though" + clause; "despite/in spite of" + noun or -ing: "Despite being tired…" / "In spite of the rain…"',
      'Don\'t confuse "however" (contrast) with "therefore" (result) — a common error in writing tasks.',
      'Cambridge B2 Writing: examiners reward a variety of linking devices used accurately. Avoid overusing "also" and "and".',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "despite", "although", "however", "therefore" are all valid open cloze answers.' },
      { part: 4, tip: 'Part 4: "Even though she was tired, she continued." → "Despite ___, she continued."' },
    ],
  },

  vocabulary_confusables: {
    title: 'Confusable Words',
    level: 'B1–B2',
    intro: `Many English words look or sound similar but have completely different meanings. These "confusables" are a major source of errors at B2 level and are frequently tested in Part 1.`,
    structures: [
      { name: 'Affect vs effect',      form: 'affect (verb) / effect (noun)',              example: 'Stress affects your health. The effect is serious.',      use: 'Affect = the action; effect = the result' },
      { name: 'Raise vs rise',         form: 'raise (transitive) / rise (intransitive)',   example: 'They raised prices. Prices rose sharply.',                use: 'Raise = you move something; rise = it moves by itself' },
      { name: 'Lend vs borrow',        form: 'lend (give) / borrow (take)',                example: 'Can you lend me a pen? Can I borrow a pen?',             use: 'Lend = give temporarily; borrow = take temporarily' },
      { name: 'Remember vs remind',    form: 'remember (yourself) / remind (someone else)',example: 'I remember her. Can you remind me later?',               use: 'Remind = prompt another person\'s memory' },
    ],
    notes: [
      'Other common confusables: say/tell, do/make, look/see/watch, listen/hear, fun/funny, sensible/sensitive.',
      'The best strategy: learn each confusable pair in two example sentences — one for each word.',
      'Part 1 distractors are often near-synonyms or confusable pairs.',
    ],
    examTips: [
      { part: 1, tip: 'Part 1 frequently tests confusable pairs as the four MCQ options — all four will fit grammatically but only one fits the meaning.' },
    ],
  },

  make_do_take_have: {
    title: 'Make / Do / Take / Have',
    level: 'B1–B2',
    intro: `"Make", "do", "take", and "have" are used in many fixed collocations. Choosing the right one is a matter of memory, not grammar rules.`,
    structures: [
      { name: 'Make',  form: 'make + noun',  example: 'make a decision, make a mistake, make an effort, make progress, make noise',  use: 'Creating, producing, or causing something' },
      { name: 'Do',    form: 'do + noun',    example: 'do homework, do the washing, do research, do damage, do your best',           use: 'Tasks, activities, work, chores' },
      { name: 'Take',  form: 'take + noun',  example: 'take a photo, take notes, take a risk, take time, take an exam, take part',   use: 'Actions requiring movement or effort' },
      { name: 'Have',  form: 'have + noun',  example: 'have a break, have a meeting, have lunch, have a conversation, have fun',     use: 'Experiences and social actions' },
    ],
    notes: [
      '"Do business" but "make a deal". "Make a phone call" but "take a call". These must be memorised.',
      'Some expressions go with multiple verbs: "make/take a decision" — "make" is more common in British English.',
      'Phrasal verbs also use these: "make up", "do up", "take off", "have over".',
    ],
    examTips: [
      { part: 1, tip: 'Part 1 frequently gives all four verbs as options for one collocation slot. The answer is always a fixed phrase.' },
      { part: 4, tip: 'Part 4: "She completed the assignment." → "She ___ her homework." (did)' },
    ],
  },

  phrasal_verbs_exam: {
    title: 'Phrasal Verbs',
    level: 'B1–B2',
    intro: `Phrasal verbs are verbs combined with a preposition or adverb particle to create a new meaning. They are extremely common in English and feature heavily in Cambridge B2 exams.`,
    structures: [
      { name: 'Intransitive',         form: 'verb + particle (no object)',           example: 'The plane took off on time.',                                  use: 'No object; particle cannot move' },
      { name: 'Transitive separable', form: 'verb + particle + object OR v + obj + particle', example: 'Turn off the TV. / Turn the TV off.',            use: 'Object can go before or after the particle; pronoun always before' },
      { name: 'Transitive inseparable',form: 'verb + particle + object (no split)',  example: 'She looked after the children.',                              use: 'Object always after the particle' },
      { name: 'Three-part (inseparable)',form: 'verb + particle + particle + object',example: 'I\'m looking forward to the holiday.',                        use: 'Three-part phrasal verbs are always inseparable' },
    ],
    notes: [
      'Pronouns must go between verb and particle: "turn it off" (NOT "turn off it").',
      'Three-part phrasal verbs: "look forward to", "get on with", "put up with", "run out of", "come up with".',
      'Many phrasal verbs have formal single-word equivalents: "put off" = postpone, "bring up" = mention/raise.',
    ],
    examTips: [
      { part: 1, tip: 'Part 1: the four options are often the same verb with different particles — pick the one that matches the meaning.' },
      { part: 4, tip: 'Part 4: "She postponed the meeting." → "She ___ the meeting." (put off)' },
    ],
  },

  word_formation: {
    title: 'Word Formation',
    level: 'B1–B2',
    intro: `Word formation is tested in Part 3 of the Reading & Use of English paper. You are given a base word and must use a prefix or suffix to form the correct word that fits the gap.`,
    structures: [
      { name: 'Noun suffixes',     form: '-tion/-sion, -ment, -ness, -ity, -ance/-ence, -er/-or',  example: 'achieve → achievement, happy → happiness',     use: 'Turning verbs/adjectives into nouns' },
      { name: 'Adjective suffixes',form: '-ful, -less, -ous, -ive, -al, -able/-ible, -ic',         example: 'help → helpful, hope → hopeless',              use: 'Turning nouns/verbs into adjectives' },
      { name: 'Verb suffixes',     form: '-ise/-ize, -en, -ify, -ate',                             example: 'modern → modernise, wide → widen',              use: 'Turning nouns/adjectives into verbs' },
      { name: 'Negative prefixes', form: 'un-, in-, im-, ir-, il-, dis-, mis-',                    example: 'happy → unhappy, possible → impossible',        use: 'Reversing the meaning of a word' },
    ],
    notes: [
      'Some words change spelling when you add a suffix: "happy" → "happiness" (y → i), "achieve" → "achievement".',
      'Watch for double negatives in context: "not uncommon" = fairly common (understatement).',
      'Read the sentence carefully for meaning AND grammar: you need the right word class AND the right form.',
    ],
    examTips: [
      { part: 3, tip: 'Part 3: check whether the gap needs a noun, verb, adjective, or adverb — then apply the correct suffix.' },
      { part: 3, tip: 'Part 3: check whether the meaning should be negative — many answers require a prefix like "un-" or "dis-".' },
    ],
  },

  // ── ADVANCED STRUCTURES ──────────────────────────────────────────────────────

  emphasis_inversion: {
    title: 'Emphasis and Inversion',
    level: 'B2–C1',
    intro: `Inversion and cleft sentences are used to add emphasis. They are formal structures common in Cambridge B2 Part 4 and in writing tasks.`,
    structures: [
      { name: 'Negative adverbials + inversion', form: 'Negative adverb + aux + subject + verb', example: 'Never have I seen such a thing. Rarely does he complain.',    use: 'Strong emphasis — sentence starts with negative/restrictive adverb' },
      { name: 'Hardly/Scarcely/No sooner',       form: 'Hardly had I + pp + when/than...',       example: 'No sooner had she arrived than it started to rain.',          use: '"When" with hardly/scarcely; "than" with no sooner' },
      { name: 'Cleft sentences (it)',            form: 'It is/was + focus + that/who + rest',    example: 'It was Maria who found the key.',                            use: 'Emphasises a particular element of the sentence' },
      { name: 'Cleft sentences (what)',          form: 'What + clause + is/was + focus',         example: 'What I need is more time.',                                  use: 'Emphasises the new or important information' },
    ],
    notes: [
      'Inversion is only used after negative or restrictive adverbials at the start of a sentence.',
      'Normal word order: "I have never seen such a thing." Inverted: "Never have I seen such a thing."',
      'These structures appear more in formal writing. Using one correctly in a Cambridge essay shows C1-level range.',
    ],
    examTips: [
      { part: 2, tip: 'Part 2: "Never ___ I seen anything like it." → "have" (inversion after negative adverb).' },
      { part: 4, tip: 'Part 4 frequently transforms normal sentences to inverted structures using key words: "never", "only", "no sooner".' },
    ],
  },

  spelling: {
    title: 'Spelling',
    level: 'B1–B2',
    intro: `Spelling errors in Cambridge B2 exams cost marks. Part 3 and Part 4 answers must be spelled correctly. Knowing the most common patterns prevents unnecessary mistakes.`,
    structures: [
      { name: 'Double consonants',  form: 'short vowel + consonant → double before -ing/-ed/-er', example: 'run → running, big → bigger, stop → stopped',  use: 'Consonant doubles when the vowel before it is short and stressed' },
      { name: '-ie- vs -ei-',       form: '"i before e except after c" — but with exceptions',    example: 'believe, achieve — but: receive, ceiling',       use: 'The "c" exception: after c, use -ei-' },
      { name: 'Silent letters',     form: 'common words with unpronounced letters',               example: 'know, write, island, knife, psychology',         use: 'Must be learned by word — there is no rule' },
      { name: '-tion vs -sion',     form: 'noun endings',                                        example: 'education, action — but: extension, decision',   use: 'Verbs ending in -d/-de → -sion (extend → extension)' },
    ],
    notes: [
      'Commonly misspelled: necessary (one c, double s), accommodation (double c, double m), definitely (not "definately").',
      'British vs American differences: colour/color, realise/realize, centre/center — Cambridge uses British English.',
      'In Part 3 and Part 4, an answer spelled incorrectly scores zero even if the word is right.',
    ],
    examTips: [
      { part: 3, tip: 'Part 3: double-check suffixes — "happiness" (double p? No — happ-i-ness), "successful" (double c, double s).' },
      { part: 4, tip: 'Part 4: copy words from the question carefully — you can lose a mark for a spelling error in your transformation.' },
    ],
  },
}

// ── Score display ─────────────────────────────────────────────────────────────

function ScoreSummary({ answered, items }) {
  if (Object.keys(answered).length === 0) return null
  const done    = items.filter(i => answered[i.id] !== undefined)
  const correct = done.filter(i => {
    const a = answered[i.id]
    return typeof a === 'string' && a.toLowerCase() === (i.answer || '').toLowerCase()
  })
  const pct = done.length > 0 ? Math.round((correct.length / done.length) * 100) : 0

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex items-center gap-4">
      <div className="text-2xl font-bold text-gray-900">{correct.length}/{done.length}</div>
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {pct}% correct · {items.length - done.length > 0 ? `${items.length - done.length} remaining` : 'all answered'}
        </p>
      </div>
    </div>
  )
}

// ── Exercise components ───────────────────────────────────────────────────────

function MCQExercise({ item, index, answered, onAnswer }) {
  const selected = answered[item.id]
  const options  = item.options || []

  return (
    <div className={`rounded-xl p-5 border transition-all ${
      selected !== undefined
        ? selected === item.answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        : 'bg-white border-gray-200'
    }`}>
      <p className="text-sm font-medium text-gray-800 mb-3">
        <span className="text-gray-400 mr-1">{index + 1}.</span> {item.content}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const letter    = ['A', 'B', 'C', 'D'][i]
          const isCorrect = opt === item.answer
          const isSelected= selected === opt
          return (
            <button
              key={i}
              onClick={() => selected === undefined && onAnswer(item.id, opt)}
              disabled={selected !== undefined}
              className={`text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                selected !== undefined
                  ? isCorrect
                    ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                    : isSelected
                      ? 'bg-red-100 border-red-400 text-red-800'
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="font-semibold mr-1">{letter}.</span> {opt}
            </button>
          )
        })}
      </div>
      {selected !== undefined && item.explanation && (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          💡 {item.explanation}
        </p>
      )}
    </div>
  )
}

function OpenClozeExercise({ item, index, answered, onAnswer }) {
  const [input, setInput] = useState('')
  const submitted = answered[item.id] !== undefined
  const isCorrect = submitted && answered[item.id]?.toLowerCase() === (item.answer || '').toLowerCase()

  function check() {
    if (!input.trim()) return
    onAnswer(item.id, input.trim().toLowerCase())
  }

  return (
    <div className={`rounded-xl p-5 border transition-all ${
      submitted
        ? isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        : 'bg-white border-gray-200'
    }`}>
      <p className="text-sm font-medium text-gray-800 mb-3">
        <span className="text-gray-400 mr-1">{index + 1}.</span> {item.content}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={submitted ? (isCorrect ? answered[item.id] : `${answered[item.id]}`) : input}
          onChange={e => !submitted && setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitted && check()}
          disabled={submitted}
          placeholder="Type your answer…"
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 disabled:bg-transparent disabled:border-transparent disabled:px-0"
        />
        {!submitted && (
          <button
            onClick={check}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Check
          </button>
        )}
      </div>
      {submitted && (
        <div className="mt-2 text-sm">
          {isCorrect
            ? <span className="text-green-700 font-medium">✓ Correct</span>
            : <span className="text-red-700">Correct answer: <strong>{item.answer}</strong></span>
          }
          {item.explanation && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">💡 {item.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamGrammarPage() {
  const { point: slug } = useParams()
  const grammarPoint    = slugToPoint(slug || '')
  const explanation     = EXPLANATIONS[grammarPoint]

  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [answered, setAnswered] = useState({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('grammar_items')
        .select('id, content, answer, options, explanation, skill_type, difficulty')
        .eq('grammar_point', grammarPoint)
        .in('skill_type', ['mcq', 'open_cloze', 'fill_in', 'word_formation', 'transformation'])
        .order('difficulty', { ascending: true })
        .limit(20)

      setItems(data || [])
      setLoading(false)
    }

    if (grammarPoint) load()
    else setLoading(false)
  }, [grammarPoint])

  function handleAnswer(id, value) {
    setAnswered(prev => ({ ...prev, [id]: value }))
  }

  function resetExercises() {
    setAnswered({})
  }

  // Group exercises by skill_type / exam part
  const grouped = {}
  items.forEach(item => {
    const meta = PART_LABELS[item.skill_type] || { part: '?', label: 'Other' }
    const key  = String(meta.part)
    if (!grouped[key]) grouped[key] = { label: meta.label, items: [] }
    grouped[key].items.push(item)
  })

  const title     = explanation?.title || slug?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Grammar'
  const pageTitle = `${title} — B2 Grammar Reference`

  const totalAnswered = Object.keys(answered).length
  const totalCorrect  = items.filter(i => {
    const a = answered[i.id]
    return a !== undefined && a.toLowerCase() === (i.answer || '').toLowerCase()
  }).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title={pageTitle}
        description={`Free explanation and exercises for ${title} at B2 level. Cambridge B2 First grammar reference.`}
        canonical={`/exam/grammar/${slug}`}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/exam" className="hover:text-gray-700 transition-colors">Exam Centre</Link>
        <span>›</span>
        <Link to="/exam/grammar" className="hover:text-gray-700 transition-colors">Grammar</Link>
        <span>›</span>
        <span className="text-gray-600">{title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          {explanation?.level || 'B1–B2'} · Cambridge B2 First
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-4">{title}</h1>
        {explanation?.intro && (
          <p className="text-gray-600 leading-relaxed text-base">
            {explanation.intro}
          </p>
        )}
      </div>

      {/* Structures table */}
      {explanation?.structures && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Forms and uses</h2>
          <div className="space-y-3">
            {explanation.structures.map(({ name, form, example, use }) => (
              <div key={name} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-800">{name}</span>
                  <code className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">{form}</code>
                </div>
                <p className="text-sm text-gray-700 italic mb-1">"{example}"</p>
                <p className="text-xs text-gray-500">{use}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {explanation?.notes && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Things to remember</h2>
          <ul className="space-y-2">
            {explanation.notes.map((note, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="text-gray-300 flex-shrink-0 mt-0.5">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exam tips */}
      {explanation?.examTips && explanation.examTips.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">In the exam</h2>
          <div className="space-y-2">
            {explanation.examTips.map(({ part, tip }, i) => {
              const colour = PART_COLOURS[part] || 'bg-gray-50 text-gray-600 border-gray-200'
              const label  = part === 'W' ? 'Writing' : `Part ${part}`
              return (
                <div key={i} className={`flex gap-3 text-sm p-3 rounded-xl border ${colour}`}>
                  <span className="font-bold flex-shrink-0 text-xs uppercase tracking-wider mt-0.5">{label}</span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No explanation yet */}
      {!explanation && (
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-500">
            The full explanation for this grammar point is being written. The exercises below are available now.
          </p>
        </div>
      )}

      {/* ── Exercises ──────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Practice exercises</h2>
            {!loading && items.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{items.length} question{items.length !== 1 ? 's' : ''} from our question bank</p>
            )}
          </div>
          {totalAnswered > 0 && (
            <button onClick={resetExercises} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Reset
            </button>
          )}
        </div>

        {/* Score summary */}
        {totalAnswered > 0 && (
          <div className="mb-5">
            <ScoreSummary answered={answered} items={items} />
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
            Exercises for this topic are being added soon.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([partKey, group]) => {
              const colour = PART_COLOURS[Number(partKey)] || PART_COLOURS[partKey] || 'bg-gray-50 text-gray-600 border-gray-200'
              return (
                <div key={partKey}>
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border mb-4 ${colour}`}>
                    {group.label}
                  </div>
                  <div className="space-y-4">
                    {group.items.map((item, i) => {
                      const globalIndex = items.findIndex(x => x.id === item.id)
                      return item.skill_type === 'mcq'
                        ? <MCQExercise key={item.id} item={item} index={globalIndex} answered={answered} onAnswer={handleAnswer} />
                        : <OpenClozeExercise key={item.id} item={item} index={globalIndex} answered={answered} onAnswer={handleAnswer} />
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA — daily challenge */}
      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-6 py-7 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">More practice — Daily Exam Challenge</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Five Cambridge-format questions every day. Free to start, no sign-up required.
          </p>
        </div>
        <Link
          to="/exam/challenge"
          className="flex-shrink-0 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
        >
          Start today's challenge →
        </Link>
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link to="/exam/grammar" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Grammar Reference
        </Link>
      </div>
    </div>
  )
}
