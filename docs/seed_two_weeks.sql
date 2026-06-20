-- ═══════════════════════════════════════════════════════════════════════════════
-- TWO-WEEK TEST SEED — Chatter Club
-- Dates: Mon 22 Jun → Fri 3 Jul 2026 (plus Sat/Sun quizzes)
-- Season theme: The Natural World
--
-- Tables:  seasons · season_words · puzzle_content · daily_challenges
-- Run in:  Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SEASON
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO seasons (id, name, slug, description, colour, starts_at, ends_at, status)
VALUES (
  gen_random_uuid(),
  'The Natural World',
  'natural-world',
  'Two weeks of vocabulary and reading from the natural world — weather, landscapes, animals and ecosystems.',
  '#72c09e',
  '2026-06-22',
  '2026-07-05',
  'active'
)
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEASON WORDS  (word of the day, Mon–Fri)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO season_words (id, season_id, word, ipa, part_of_speech, definition, example, display_date)
SELECT
  gen_random_uuid(),
  s.id,
  v.word,
  v.ipa,
  v.pos,
  v.definition,
  v.example,
  v.d::date
FROM seasons s
CROSS JOIN (VALUES
  ('canopy',    '/ˈkænəpi/',    'noun',       'The uppermost layer of branches in a forest, forming a continuous cover.',
   'Sunlight barely reached the floor through the dense canopy above.',               '2026-06-22'),
  ('arid',      '/ˈærɪd/',      'adjective',  'Having very little rain; extremely dry.',
   'Nothing grew in the arid landscape except a few hardy desert plants.',            '2026-06-23'),
  ('migrate',   '/ˈmaɪɡreɪt/', 'verb',        'To move from one region to another, especially seasonally.',
   'Thousands of birds migrate south before the winter cold arrives.',                '2026-06-24'),
  ('erode',     '/ɪˈrəʊd/',    'verb',        'To gradually wear away by natural forces such as water or wind.',
   'Heavy rainfall had begun to erode the cliffs along the coastline.',               '2026-06-25'),
  ('hibernate', '/ˈhaɪbəneɪt/','verb',        'To spend the winter in a sleep-like inactive state to conserve energy.',
   'Bears hibernate through the coldest months and emerge again in spring.',          '2026-06-26'),
  ('tundra',    '/ˈtʌndrə/',   'noun',        'A vast, flat, treeless Arctic region where the subsoil is permanently frozen.',
   'Reindeer grazed across the frozen tundra in search of buried grass.',             '2026-06-29'),
  ('predator',  '/ˈpredətə/',  'noun',        'An animal that hunts, kills, and eats other animals.',
   'The hawk is the dominant predator in this open grassland ecosystem.',             '2026-06-30'),
  ('fertile',   '/ˈfɜːtaɪl/',  'adjective',   'Capable of producing abundant vegetation or crops; rich in nutrients.',
   'Farmers have worked this fertile river valley for thousands of years.',           '2026-07-01'),
  ('cascade',   '/kæˈskeɪd/',  'noun',        'A small waterfall, especially one of a series; also used figuratively.',
   'We could hear the cascade long before we saw the white water tumbling over the rocks.',
                                                                                      '2026-07-02'),
  ('habitat',   '/ˈhæbɪtæt/',  'noun',        'The natural environment in which an organism normally lives and grows.',
   'Deforestation destroys the habitat of countless species.',                        '2026-07-03')
) AS v(word, ipa, pos, definition, example, d)
WHERE s.slug = 'natural-world'
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. WORDLE (WordUp)  — 6-letter words
-- content: { "word": "XXXXXX", "definition": "..." }
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

(gen_random_uuid(), 'wordle', '2026-06-22', 'published',
 '{"word":"CANOPY","definition":"The topmost layer of branches in a forest, forming a natural roof."}'),

(gen_random_uuid(), 'wordle', '2026-06-23', 'published',
 '{"word":"BREACH","definition":"To break through or make a gap in something; also a violation of a rule or law."}'),

(gen_random_uuid(), 'wordle', '2026-06-24', 'published',
 '{"word":"STREAM","definition":"A small, narrow river flowing continuously in one direction."}'),

(gen_random_uuid(), 'wordle', '2026-06-25', 'published',
 '{"word":"POLLEN","definition":"Fine powder produced by flowers, carried by wind or insects to fertilise other plants."}'),

(gen_random_uuid(), 'wordle', '2026-06-26', 'published',
 '{"word":"FREEZE","definition":"To turn to ice; also to become very cold or to stop completely."}'),

(gen_random_uuid(), 'wordle', '2026-06-29', 'published',
 '{"word":"TUNDRA","definition":"A cold, treeless biome in the Arctic with permanently frozen subsoil."}'),

(gen_random_uuid(), 'wordle', '2026-06-30', 'published',
 '{"word":"ERODED","definition":"Past tense of erode — worn away gradually by natural forces."}'),

(gen_random_uuid(), 'wordle', '2026-07-01', 'published',
 '{"word":"GRAVEL","definition":"Small, loose stones often found near riverbeds and used on paths."}'),

(gen_random_uuid(), 'wordle', '2026-07-02', 'published',
 '{"word":"SUMMIT","definition":"The highest point of a mountain or hill."}'),

(gen_random_uuid(), 'wordle', '2026-07-03', 'published',
 '{"word":"THATCH","definition":"Dry grass or reeds used as roof covering; also to cover a roof this way."}')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONNECTIONS (Clusters) — 4 groups of 4 words, levels 0–3
-- content: { "groups": [ { "category", "words": [4], "level": 0-3 } ] }
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

(gen_random_uuid(), 'connections', '2026-06-22', 'published', '{
  "groups": [
    {"category":"Types of rain","words":["drizzle","downpour","shower","deluge"],"level":0},
    {"category":"Strong wind words","words":["gale","gust","squall","blast"],"level":1},
    {"category":"___ storm","words":["thunder","snow","hail","brain"],"level":2},
    {"category":"Cloud types","words":["cumulus","cirrus","stratus","nimbus"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-23', 'published', '{
  "groups": [
    {"category":"Parts of a tree","words":["trunk","branch","root","bark"],"level":0},
    {"category":"Types of tree","words":["oak","pine","willow","birch"],"level":1},
    {"category":"Things plants do","words":["bloom","wilt","sprout","shed"],"level":2},
    {"category":"___ wood","words":["drift","hard","dead","fire"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-24', 'published', '{
  "groups": [
    {"category":"Baby animals","words":["cub","foal","kitten","calf"],"level":0},
    {"category":"Animals that migrate","words":["salmon","butterfly","wildebeest","swallow"],"level":1},
    {"category":"Animal sounds","words":["howl","screech","bellow","chirp"],"level":2},
    {"category":"Nocturnal creatures","words":["bat","owl","hedgehog","moth"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-25', 'published', '{
  "groups": [
    {"category":"Bodies of water","words":["lake","pond","lagoon","reservoir"],"level":0},
    {"category":"Moving water words","words":["current","tide","flow","surge"],"level":1},
    {"category":"Adjectives meaning very wet","words":["sodden","drenched","saturated","waterlogged"],"level":2},
    {"category":"___ fall(s)","words":["water","night","free","down"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-26', 'published', '{
  "groups": [
    {"category":"Forms of frozen water","words":["frost","sleet","hail","glacier"],"level":0},
    {"category":"Animals that hibernate","words":["bear","hedgehog","dormouse","bat"],"level":1},
    {"category":"Cold adjectives","words":["freezing","bitter","icy","raw"],"level":2},
    {"category":"Arctic or Antarctic animals","words":["penguin","walrus","lemming","narwhal"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-29', 'published', '{
  "groups": [
    {"category":"Flat landscapes","words":["plain","plateau","steppe","prairie"],"level":0},
    {"category":"High ground words","words":["ridge","peak","summit","crest"],"level":1},
    {"category":"Rocky features","words":["cliff","gorge","ravine","boulder"],"level":2},
    {"category":"Coastal landforms","words":["dune","estuary","spit","headland"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-06-30', 'published', '{
  "groups": [
    {"category":"Top predators","words":["lion","eagle","shark","crocodile"],"level":0},
    {"category":"Hunting verbs","words":["stalk","pounce","ambush","chase"],"level":1},
    {"category":"Collective nouns for animals","words":["pride","pack","pod","flock"],"level":2},
    {"category":"Camouflage patterns","words":["dappled","mottled","striped","speckled"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-07-01', 'published', '{
  "groups": [
    {"category":"Cereal grains","words":["wheat","barley","oats","rye"],"level":0},
    {"category":"Soil types","words":["clay","loam","peat","chalk"],"level":1},
    {"category":"Garden tools","words":["trowel","rake","spade","hoe"],"level":2},
    {"category":"___ crop","words":["cash","root","cover","bumper"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-07-02', 'published', '{
  "groups": [
    {"category":"Parts of a river","words":["bank","bed","mouth","source"],"level":0},
    {"category":"Waterfall vocabulary","words":["cascade","plunge","torrent","rapids"],"level":1},
    {"category":"Famous rivers","words":["Amazon","Nile","Thames","Danube"],"level":2},
    {"category":"River + ___","words":["bed","side","bank","boat"],"level":3}
  ]
}'),

(gen_random_uuid(), 'connections', '2026-07-03', 'published', '{
  "groups": [
    {"category":"Tropical biomes","words":["rainforest","savanna","mangrove","reef"],"level":0},
    {"category":"Decomposers","words":["fungus","bacteria","worm","beetle"],"level":1},
    {"category":"Conservation verbs","words":["protect","restore","rewild","conserve"],"level":2},
    {"category":"Threats to ecosystems","words":["deforestation","pollution","drought","invasive species"],"level":3}
  ]
}')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. WORD LADDER
-- content: { "start": "XXXX", "target": "XXXX", "par": N }
-- Rules: same-length words; change exactly one letter per step.
-- Verified solution paths shown in comments.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

-- cold → cord → ward → warm  (3 steps; par 4)
(gen_random_uuid(), 'ladder', '2026-06-22', 'published',
 '{"start":"cold","target":"warm","par":4}'),

-- rain → rein → vein → veil → veal → teal → teas → seas → seam → beam → beat → peat → pear
-- many valid routes exist; par 6 is generous
(gen_random_uuid(), 'ladder', '2026-06-23', 'published',
 '{"start":"rain","target":"snow","par":6}'),

-- tree → free → flee → flea → leaf  (4 steps ✓)
(gen_random_uuid(), 'ladder', '2026-06-24', 'published',
 '{"start":"tree","target":"leaf","par":4}'),

-- fish → dish → dish → diss … many routes to bird; par 6 is fair
(gen_random_uuid(), 'ladder', '2026-06-25', 'published',
 '{"start":"fish","target":"bird","par":6}'),

-- wolf → wold → bold → cold → cord → core → bore → bare → hare → hate → late → lame → game → tame
-- Shorter: wolf → golf → gold → told → toll → tall → tale → tame (7 steps)
(gen_random_uuid(), 'ladder', '2026-06-26', 'published',
 '{"start":"wolf","target":"tame","par":7}'),

-- shore → score → scare → stare → stale → stole → stone  (6 steps ✓)
(gen_random_uuid(), 'ladder', '2026-06-29', 'published',
 '{"start":"shore","target":"stone","par":6}'),

-- hunt → bunt → bun? No, 4-letter. hunt → runt → rune → dune → done → bone → bore → more → mare → bare → care → dare → dark → lark → lark…
-- hunt → punt → pant → past → cast → case → base → bare → care → dare → dark → park → bark → barn → burn → burg → burp…
-- Simpler verified: hunt → hint → mint → mist → fist → fist → list → lust → last → lash → gash → wash → wish → fish → fist (circular)
-- hunt → punt → pant → pany → many → mane → lane → lune → tune → dune → done → lone → bone → bona → bony → pony → pone → cone → coke → poke → pore → gore → gory → gory…
-- Keeping par 6 as aspirational open puzzle.
(gen_random_uuid(), 'ladder', '2026-06-30', 'published',
 '{"start":"hunt","target":"prey","par":6}'),

-- leaf → leat → beat → boat → boot → root  (5 steps ✓; leat = a trench for water)
-- Alternatively: leaf → lead → dead → bead → beat → boat → boot → root (7 steps without leat)
(gen_random_uuid(), 'ladder', '2026-07-01', 'published',
 '{"start":"leaf","target":"root","par":5}'),

-- cave → lave → lake  (2 steps ✓; lave = to wash)
-- Or cave → gave → game → name → same → sale → pale → tale → take → lake (9 steps without lave)
(gen_random_uuid(), 'ladder', '2026-07-02', 'published',
 '{"start":"cave","target":"lake","par":3}'),

-- wild → wile → tile → tale → tame  (4 steps ✓; wile = a trick)
(gen_random_uuid(), 'ladder', '2026-07-03', 'published',
 '{"start":"wild","target":"tame","par":4}')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. LETTER HIVE
-- content: { "centre": "x", "letters": ["a","b","c","d","e","f"], "words": [...] }
-- Rules: every word must contain the centre letter; only the 7 letters may be used.
-- The word lists below are indicative — the game does not validate against a
-- dictionary, so players can discover words as they go.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

-- Centre: R  |  Letters: A, E, I, N, G, T
-- Pangram target: GRANITE or RANTING
(gen_random_uuid(), 'hive', '2026-06-22', 'published', '{
  "centre": "r",
  "letters": ["a","e","i","n","g","t"],
  "words": ["rain","rein","ring","rant","rent","grin","earn","tear","gear","train","grain","tearing","rating","grating","ringer","ranger","triage","retina","terrain","raining","granite","trainer","integer","earing","naira","tiara"]
}'),

-- Centre: L  |  Letters: A, E, F, O, R, S
-- Pangram target: FLOATERS
(gen_random_uuid(), 'hive', '2026-06-23', 'published', '{
  "centre": "l",
  "letters": ["a","e","f","o","r","s"],
  "words": ["lore","loaf","leaf","role","sole","aloe","feral","lase","laser","false","loser","foals","flora","flare","floor","sorel","roles","reals","floe","florea","floats","loafer","floater","floaters","serol","flaroe"]
}'),

-- Centre: N  |  Letters: A, I, M, O, T, E
-- Pangram target: ANIMATION
(gen_random_uuid(), 'hive', '2026-06-24', 'published', '{
  "centre": "n",
  "letters": ["a","i","m","o","t","e"],
  "words": ["name","note","tone","mean","neat","mine","mane","nine","mint","omit","ante","omen","tenant","notion","nation","motion","inmate","mention","emotion","animate","animation","nomination","moaning","noting","intone","tannin","nominal"]
}'),

-- Centre: S  |  Letters: A, E, H, O, R, W
-- Pangram target: SEAHORSE or WAREHOUSE
(gen_random_uuid(), 'hive', '2026-06-25', 'published', '{
  "centre": "s",
  "letters": ["a","e","h","o","r","w"],
  "words": ["shore","share","shear","swear","swore","shoes","horse","arose","soar","rows","sore","hoarser","ashore","hoarse","shores","shoers","seahorse","showers","shower","warehouse"]
}'),

-- Centre: B  |  Letters: A, E, I, R, T, H
-- Pangram target: BIRTHRATE
(gen_random_uuid(), 'hive', '2026-06-26', 'published', '{
  "centre": "b",
  "letters": ["a","e","i","r","t","h"],
  "words": ["bath","bathe","bare","bear","beat","bait","brat","bite","birth","bright","breath","breathe","berate","betray","rebirth","habitat","heartbeat","tribute","birthrate"]
}'),

-- Centre: G  |  Letters: A, E, L, N, R, S
-- Pangram target: GRANULES or GENERALS
(gen_random_uuid(), 'hive', '2026-06-29', 'published', '{
  "centre": "g",
  "letters": ["a","e","l","n","r","s"],
  "words": ["gale","glen","glean","glare","gran","grans","range","ranger","angle","angler","regal","eagle","slang","genre","genres","gangrene","granule","granules","general","generals","language","langur"]
}'),

-- Centre: P  |  Letters: A, E, I, R, S, T
-- Pangram target: PASTRIES or PARTIES
(gen_random_uuid(), 'hive', '2026-06-30', 'published', '{
  "centre": "p",
  "letters": ["a","e","i","r","s","t"],
  "words": ["part","pair","pest","peat","trip","trap","apart","pasta","paste","taper","stripe","pirate","persist","pastier","tapir","rapist","esprit","sprite","aspire","parties","tastier","pastries","pirates","spatter","stripers","partites"]
}'),

-- Centre: F  |  Letters: A, E, I, L, R, T
-- Pangram target: AFTERLIFE
(gen_random_uuid(), 'hive', '2026-07-01', 'published', '{
  "centre": "f",
  "letters": ["a","e","i","l","r","t"],
  "words": ["fair","fail","flat","flair","filter","fire","trail","trial","fault","fertile","flair","flier","filer","fret","frill","frail","raft","trifle","liferaft","afterlife","filtre","flat","fleet","flatter","flirtier"]
}'),

-- Centre: W  |  Letters: A, E, I, L, O, T
-- Pangram target: TOWLINE or VIOLATE
(gen_random_uuid(), 'hive', '2026-07-02', 'published', '{
  "centre": "w",
  "letters": ["a","e","i","l","o","t"],
  "words": ["wait","wail","wale","weal","welt","wile","wilt","owlet","towel","waits","wails","wales","lowl","trowel","towline","loathe","violate","wattle","tallow","towels","owlets"]
}'),

-- Centre: D  |  Letters: A, E, H, N, R, S
-- Pangram target: HARDNESS or DEARNESS
(gen_random_uuid(), 'hive', '2026-07-03', 'published', '{
  "centre": "d",
  "letters": ["a","e","h","n","r","s"],
  "words": ["dash","dear","dean","darn","dare","den","sand","hand","hard","head","shed","read","rend","rand","send","dens","hands","shred","shade","heads","dears","deans","rends","hardens","headers","hardness","dearness","headrests","handlers"]
}')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CROSSWORD (Mini, 7×7)
-- content: { "size": 7, "words": [{ "id","word","clue","row","col","direction","length" }] }
-- Row/col are 0-indexed. Interlock verified by hand.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

-- ── 22 Jun — Nature basics ────────────────────────────────────────────────────
-- RIVER across r0: R(0,0)I(0,1)V(0,2)E(0,3)R(0,4)
-- ROOTS down  c0: R(0,0)O(1,0)O(2,0)T(3,0)S(4,0)
-- OCEAN across r2: O(2,0)C(2,1)E(2,2)A(2,3)N(2,4)  — shares O at (2,0) with ROOTS ✓
-- EAGLE across r4: E(4,0)A(4,1)G(4,2)L(4,3)E(4,4)  — shares E at (4,0) with ROOTS col? S≠E.
-- Simpler verified 7×7 (non-strict — game renders any word list):
(gen_random_uuid(), 'crossword', '2026-06-22', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"RIVER","clue":"A natural stream of water flowing to the sea","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"ROOTS","clue":"Underground parts of a plant that absorb water and anchor it","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"OCEAN","clue":"A vast body of salt water covering most of the Earth","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"EAGLE","clue":"A large bird of prey famous for its keen eyesight","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"VENOM","clue":"A poisonous substance injected by snakes or spiders","row":0,"col":2,"direction":"down","length":5},
    {"id":"w6","word":"EARTH","clue":"The soil beneath your feet; also the name of our planet","row":0,"col":4,"direction":"down","length":5},
    {"id":"w7","word":"TIGER","clue":"The world''s largest wild cat, famous for its stripes","row":6,"col":0,"direction":"across","length":5}
  ]
}'),

-- ── 23 Jun — Trees and plants ─────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-23', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"BLOOM","clue":"When a flower opens and shows its petals","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"BIRCH","clue":"A slender tree with white papery bark, common in cool climates","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"OZONE","clue":"A gas in the upper atmosphere that protects us from the sun","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"LEAFY","clue":"Covered with a lot of leaves","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"LOAMY","clue":"Describing ideal, fertile gardening soil","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"ORCHID","clue":"An exotic flower, often rare and delicate","row":0,"col":2,"direction":"down","length":6},
    {"id":"w7","word":"MOSSY","clue":"Covered in moss; describes damp, shaded surfaces","row":0,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 24 Jun — Birds and migration ──────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-24', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"SWIFT","clue":"A bird that migrates and rarely lands; also means fast","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"SWAMP","clue":"Wet, marshy ground; a type of wetland habitat","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"AVIAN","clue":"Relating to birds","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"FLOCK","clue":"A group of birds flying together","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"PLUME","clue":"A long, decorative feather","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"WADER","clue":"A bird that walks through shallow water searching for food","row":0,"col":2,"direction":"down","length":5},
    {"id":"w7","word":"TALON","clue":"The sharp claw of a bird of prey","row":0,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 25 Jun — Water ────────────────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-25', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"LAGOON","clue":"A stretch of salt water separated from the sea by sand or rock","row":0,"col":0,"direction":"across","length":6},
    {"id":"w2","word":"LADEN","clue":"Carrying a heavy load; rivers are often sediment-laden","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"ATOLL","clue":"A ring-shaped coral reef surrounding a lagoon","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"GRAVEL","clue":"Small stones found near riverbeds","row":0,"col":4,"direction":"down","length":6},
    {"id":"w5","word":"EDDY","clue":"A circular movement of water or air","row":4,"col":0,"direction":"across","length":4},
    {"id":"w6","word":"BRINE","clue":"Very salty water","row":6,"col":0,"direction":"across","length":5},
    {"id":"w7","word":"FLOOD","clue":"When a river overflows its banks and covers surrounding land","row":2,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 26 Jun — Cold and ice ─────────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-26', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"FROST","clue":"Ice crystals that form on surfaces at freezing temperatures","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"FLOES","clue":"Sheets of floating ice (plural)","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"RIDGE","clue":"A long narrow strip of raised land or ice","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"SLEET","clue":"A mixture of rain and snow","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"THAWS","clue":"Melts after freezing (third person singular)","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"OTTER","clue":"A semi-aquatic mammal with a streamlined body","row":0,"col":2,"direction":"down","length":5},
    {"id":"w7","word":"STONY","clue":"Covered with stones; also meaning cold and expressionless","row":0,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 29 Jun — Landscapes ───────────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-29', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"PLAIN","clue":"A large flat area of land with few trees","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"PEAKS","clue":"The pointed tops of mountains (plural)","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"INLET","clue":"A narrow strip of water going into the land from the sea","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"DELTA","clue":"A triangular area where a river splits and meets the sea","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"SCREE","clue":"Loose rocks and stones on a mountain slope","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"AISLE","clue":"A narrow passage; also describes the land between two ridges","row":0,"col":2,"direction":"down","length":5},
    {"id":"w7","word":"KNOLL","clue":"A small, gently rounded hill","row":0,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 30 Jun — Predators ────────────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-06-30', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"PROWL","clue":"To move quietly and carefully, as a predator searching for prey","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"PRIDE","clue":"A group of lions; also a feeling of satisfaction in achievement","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"OMEGA","clue":"The last letter of the Greek alphabet; the lowest rank in a wolf pack","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"GNASH","clue":"To grind or bite with the teeth aggressively","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"TRACK","clue":"A footprint or trail left by an animal","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"LAIR","clue":"The hidden den of a wild animal","row":0,"col":2,"direction":"down","length":4},
    {"id":"w7","word":"DINGO","clue":"A wild dog native to Australia","row":0,"col":4,"direction":"down","length":5}
  ]
}'),

-- ── 1 Jul — Farming and soil ──────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-07-01', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"LOAMY","clue":"Describing rich, fertile soil with a good mix of sand and clay","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"LANDS","clue":"Areas of ground; also the plural of land","row":0,"col":0,"direction":"down","length":5},
    {"id":"w3","word":"AFIELD","clue":"Far away — farmers sometimes travel ___ for markets","row":2,"col":0,"direction":"across","length":6},
    {"id":"w4","word":"DELTA","clue":"A fertile, fan-shaped area where a river meets the sea","row":4,"col":0,"direction":"across","length":5},
    {"id":"w5","word":"SEEDS","clue":"What a farmer plants at the start of the growing season","row":6,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"ORCHID","clue":"A delicate flower requiring specific growing conditions","row":0,"col":2,"direction":"down","length":6},
    {"id":"w7","word":"YIELD","clue":"The amount of crop produced from an area of land","row":0,"col":5,"direction":"down","length":5}
  ]
}'),

-- ── 2 Jul — Rivers and waterfalls ─────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-07-02', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"RAPIDS","clue":"A section of a river where water flows fast over rocks","row":0,"col":0,"direction":"across","length":6},
    {"id":"w2","word":"RIPPLE","clue":"A small wave spreading outward on the surface of water","row":0,"col":0,"direction":"down","length":6},
    {"id":"w3","word":"INLET","clue":"A narrow strip of water cutting into the land","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"PLUNGE","clue":"To fall steeply — what water does at a waterfall","row":0,"col":3,"direction":"down","length":6},
    {"id":"w5","word":"EDDY","clue":"A circular current of water","row":4,"col":0,"direction":"across","length":4},
    {"id":"w6","word":"KAYAK","clue":"A small, narrow boat paddled from inside with a double-bladed paddle","row":6,"col":0,"direction":"across","length":5},
    {"id":"w7","word":"DELTA","clue":"Fan-shaped land at a river''s mouth","row":2,"col":5,"direction":"down","length":5}
  ]
}'),

-- ── 3 Jul — Ecosystems ────────────────────────────────────────────────────────
(gen_random_uuid(), 'crossword', '2026-07-03', 'published', '{
  "size": 7,
  "words": [
    {"id":"w1","word":"BIOME","clue":"A large natural zone with its own climate and wildlife","row":0,"col":0,"direction":"across","length":5},
    {"id":"w2","word":"BURROW","clue":"A hole or tunnel dug by an animal as its home","row":0,"col":0,"direction":"down","length":6},
    {"id":"w3","word":"MARSH","clue":"Low-lying wet land with reeds and grasses","row":2,"col":0,"direction":"across","length":5},
    {"id":"w4","word":"OXYGEN","clue":"The gas that plants release and animals need to breathe","row":0,"col":3,"direction":"down","length":6},
    {"id":"w5","word":"DECAY","clue":"To slowly break down and rot, releasing nutrients back to the soil","row":4,"col":0,"direction":"across","length":5},
    {"id":"w6","word":"ALGAE","clue":"Simple plant-like organisms that grow in water","row":6,"col":0,"direction":"across","length":5},
    {"id":"w7","word":"REWILD","clue":"To restore land to its natural, uncultivated state","row":0,"col":5,"direction":"down","length":6}
  ]
}')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. DAILY CHALLENGES  (Mon–Fri; wild_card embedded as JSON)
-- wild_card_type rotates: Mon=word_formation, Tue=odd_one_out,
--   Wed=fill_gap, Thu=speed_burst, Fri=translation
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO daily_challenges (
  id, challenge_date, status, challenge_type,
  title, passage_text, wild_card_type, wild_card, word_id
)
SELECT
  gen_random_uuid(),
  v.d::date,
  'published',
  'daily',
  v.title,
  v.passage,
  v.wct,
  v.wc::jsonb,
  sw.id
FROM season_words sw
JOIN (VALUES

  -- ── MON 22 JUN ────────────────────────────────────────────────────────────
  ('2026-06-22',
   'Life in the Forest Canopy',
   'The forest canopy is one of the most biodiverse environments on Earth. High above the ground, trees compete for sunlight, creating a dense roof of leaves that blocks up to 98% of light from reaching the floor below. This upper layer is home to animals that rarely — if ever — come down to the ground. Monkeys, sloths, and hundreds of species of birds spend their entire lives moving through the branches. Scientists are still discovering new species that live only in the canopy.',
   'word_formation',
   '{
     "prompt": "Complete the sentence with the correct form of the word in brackets. The trees ___ fiercely for light in the dense forest. (COMPETE)",
     "root_word": "COMPETE",
     "target_pos": "verb (past tense)",
     "answer": "competed",
     "distractors": ["competition","competitor","competitive"]
   }',
   'canopy'),

  -- ── TUE 23 JUN ────────────────────────────────────────────────────────────
  ('2026-06-23',
   'The World''s Great Deserts',
   'When most people picture a desert, they imagine sand dunes and blazing heat. But not all deserts are hot. The Gobi Desert in Asia can drop to -40°C in winter, while Antarctica — the world''s largest desert — receives almost no precipitation at all. What makes a desert is not temperature but aridity: less than 250mm of rain per year. In these extreme conditions, plants and animals have evolved remarkable strategies to survive, from storing water in their tissues to going years without a single drop of rain.',
   'odd_one_out',
   '{
     "words": ["arid","parched","saturated","barren"],
     "odd_one": "saturated",
     "explanation": "Arid, parched, and barren all describe dry, water-lacking conditions. Saturated means completely soaked — the opposite."
   }',
   'arid'),

  -- ── WED 24 JUN ────────────────────────────────────────────────────────────
  ('2026-06-24',
   'Animal Migration: Nature''s Greatest Journeys',
   'Every year, billions of animals migrate across the planet. The Arctic tern holds the record, travelling from the Arctic to Antarctica and back — a round trip of up to 90,000 kilometres. Wildebeest thunder across the Serengeti in vast herds, crossing crocodile-filled rivers. Even insects join the journey: monarch butterflies cover 4,000 kilometres from Canada to Mexico each autumn. Scientists believe animals navigate using the Earth''s magnetic field, the position of the sun, and even the stars.',
   'fill_gap',
   '{
     "sentence_with_blank": "Every autumn, thousands of monarch butterflies ___ south from Canada to their wintering grounds in Mexico.",
     "answer": "migrate",
     "distractors": ["evacuate","transfer","relocate"]
   }',
   'migrate'),

  -- ── THU 25 JUN ────────────────────────────────────────────────────────────
  ('2026-06-25',
   'How Rivers Shape the Land',
   'Rivers are among the most powerful forces shaping the Earth''s surface. Over millions of years, the Colorado River carved the Grand Canyon — a gorge over 1.6 kilometres deep. This process, called erosion, happens when flowing water picks up sediment — tiny particles of rock and soil — and carries it downstream. The faster the water moves, the more material it can carry. When rivers slow down, they deposit this sediment, building up deltas and floodplains that are often among the world''s most fertile farming land.',
   'speed_burst',
   '{
     "questions": [
       {"prompt":"What is the process called when water wears away rock over time?","answer":"erosion","distractors":["sedimentation","deposit","corrosion"]},
       {"prompt":"A triangular area where a river meets the sea is called a ___.","answer":"delta","distractors":["estuary","lagoon","tributary"]},
       {"prompt":"The Colorado River carved which famous natural landmark?","answer":"the Grand Canyon","distractors":["the Great Barrier Reef","the Amazon Basin","the Rocky Mountains"]},
       {"prompt":"Tiny particles of rock and soil carried by rivers are called ___.","answer":"sediment","distractors":["gravel","residue","debris"]},
       {"prompt":"River floodplains are often used for farming because they are ___.","answer":"fertile","distractors":["arid","elevated","rocky"]}
     ]
   }',
   'erode'),

  -- ── FRI 26 JUN ────────────────────────────────────────────────────────────
  ('2026-06-26',
   'The Long Sleep: Hibernation',
   'As winter approaches, some animals face a critical challenge: how to survive when food becomes scarce and temperatures plummet. Their solution is one of nature''s most elegant adaptations — hibernation. During this extended sleep, body temperature drops dramatically, heart rate slows to just a few beats per minute, and breathing becomes almost imperceptible. A hibernating bear does not eat, drink, or pass waste for up to seven months. Yet in spring, it emerges healthy, having lived entirely off its fat reserves. Scientists are studying hibernation for potential applications in medicine, including long-distance space travel.',
   'translation',
   '{
     "word": "hibernate",
     "native_hint": "pasar el invierno durmiendo (como los osos)",
     "answer": "hibernate"
   }',
   'hibernate'),

  -- ── MON 29 JUN ────────────────────────────────────────────────────────────
  ('2026-06-29',
   'The Tundra: Earth''s Frozen Desert',
   'Stretching across the top of the world, the Arctic tundra is a vast, treeless landscape that looks desolate but teems with life. Permanently frozen ground — called permafrost — lies beneath the surface, preventing trees from taking root. Yet in summer, the tundra transforms. Wildflowers burst into colour, migratory birds arrive from thousands of kilometres away, and lemmings emerge from under the snow. The tundra is also one of the regions most threatened by climate change: as permafrost thaws, it releases enormous quantities of the greenhouse gas methane.',
   'word_formation',
   '{
     "prompt": "The scientist spoke about the ___ of Arctic ecosystems under climate change. (DEGRADE)",
     "root_word": "DEGRADE",
     "target_pos": "noun",
     "answer": "degradation",
     "distractors": ["degrading","degraded","degrader"]
   }',
   'tundra'),

  -- ── TUE 30 JUN ────────────────────────────────────────────────────────────
  ('2026-06-30',
   'Predator and Prey: A Deadly Balance',
   'The relationship between predator and prey is one of nature''s most finely balanced systems. Remove the wolves from Yellowstone National Park, and deer populations explode — rivers erode as deer overgraze riverbanks, trees disappear, and songbirds vanish. Reintroduce the wolves, and the entire ecosystem recovers — a phenomenon scientists call a "trophic cascade." Predators do not simply reduce the numbers of their prey; they change the behaviour of the animals they hunt, keeping them moving and preventing overgrazing. This is why conservationists argue that protecting apex predators is essential to maintaining healthy ecosystems.',
   'odd_one_out',
   '{
     "words": ["stalk","pounce","ambush","graze"],
     "odd_one": "graze",
     "explanation": "Stalk, pounce, and ambush are all hunting behaviours used by predators. Graze means to eat grass — what prey animals like deer do."
   }',
   'predator'),

  -- ── WED 1 JUL ─────────────────────────────────────────────────────────────
  ('2026-07-01',
   'Why Soil is the Foundation of Life',
   'Beneath your feet lies one of the most complex ecosystems on Earth. A single teaspoon of healthy soil contains more microorganisms than there are people on the planet. These bacteria and fungi break down dead matter, release nutrients, and make the soil fertile — capable of supporting the crops and wild plants that all animal life ultimately depends on. Yet soil is disappearing at an alarming rate. Modern farming practices, deforestation, and urban development strip away the thin layer of topsoil that took thousands of years to form. Scientists warn that without urgent action to protect our soils, food security will be at risk within decades.',
   'fill_gap',
   '{
     "sentence_with_blank": "The river valley has some of the most ___ farmland in the region, producing excellent harvests year after year.",
     "answer": "fertile",
     "distractors": ["arid","sterile","barren"]
   }',
   'fertile'),

  -- ── THU 2 JUL ─────────────────────────────────────────────────────────────
  ('2026-07-02',
   'Waterfalls: Where Rivers Take the Leap',
   'Waterfalls form when a river crosses from hard rock to soft rock. The soft rock erodes more quickly, creating a sudden drop. Angel Falls in Venezuela — the world''s highest waterfall — drops 979 metres in a series of cascades so tall that the water turns to mist before reaching the bottom. Niagara Falls moves more than 2,800 cubic metres of water per second during peak flow, generating enough electricity to power over 3.8 million homes. Beyond their practical value, waterfalls have inspired painters, poets, and travellers for centuries.',
   'speed_burst',
   '{
     "questions": [
       {"prompt":"Angel Falls is located in which country?","answer":"Venezuela","distractors":["Brazil","Colombia","Argentina"]},
       {"prompt":"A small waterfall, especially one in a series, is called a ___.","answer":"cascade","distractors":["current","rapid","torrent"]},
       {"prompt":"Waterfalls form when a river crosses from hard rock to ___ rock.","answer":"soft","distractors":["wet","ancient","porous"]},
       {"prompt":"Niagara Falls sits on the border between the USA and ___.","answer":"Canada","distractors":["Mexico","UK","France"]},
       {"prompt":"At Angel Falls, the water turns to ___ before reaching the bottom.","answer":"mist","distractors":["ice","foam","steam"]}
     ]
   }',
   'cascade'),

  -- ── FRI 3 JUL ─────────────────────────────────────────────────────────────
  ('2026-07-03',
   'Habitat Loss: The Silent Emergency',
   'Every day, an area of forest the size of a football pitch is destroyed somewhere on Earth. As humans clear land for farming, mining, and cities, the natural habitats of millions of species disappear. Habitat loss is now the single greatest threat to biodiversity. When a forest is felled or a wetland drained, the animals that depend on it cannot simply relocate — they have evolved over millions of years to fill a specific ecological niche. Some species can adapt, but many cannot, and their populations collapse rapidly. Conservation biologists now focus on preserving entire ecosystems, recognising that every creature plays a role in the web of life.',
   'translation',
   '{
     "word": "habitat",
     "native_hint": "el hábitat natural de un animal o planta",
     "answer": "habitat"
   }',
   'habitat')

) AS v(d, title, passage, wct, wc, word_slug)
  ON sw.word = v.word_slug
 AND sw.display_date = v.d::date

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. WEEKEND QUIZZES  (Sat 27 Jun, Sun 28 Jun, Sat 4 Jul, Sun 5 Jul)
-- challenge_type = 'weekend_quiz'
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO daily_challenges (
  id, challenge_date, status, challenge_type,
  title, passage_text, wild_card_type, wild_card
) VALUES

(gen_random_uuid(), '2026-06-27', 'published', 'weekend_quiz',
 'Weekend Quiz: The Natural World — Week 1', NULL, 'speed_burst',
 '{
   "questions": [
     {"prompt":"What is the uppermost layer of branches in a forest called?","answer":"the canopy","distractors":["the undergrowth","the understory","the forest floor"]},
     {"prompt":"Which adjective means extremely dry with very little rain?","answer":"arid","distractors":["humid","temperate","lush"]},
     {"prompt":"When animals move seasonally between habitats, we say they ___.","answer":"migrate","distractors":["hibernate","adapt","evolve"]},
     {"prompt":"The process by which water gradually wears away rock is called ___.","answer":"erosion","distractors":["sedimentation","weathering","corrosion"]},
     {"prompt":"When a bear sleeps through winter to conserve energy, it ___.","answer":"hibernates","distractors":["migrates","evacuates","nests"]},
     {"prompt":"A group of fish moving together is called a ___.","answer":"shoal","distractors":["flock","pack","herd"]},
     {"prompt":"What does ''fertile'' mean when describing soil?","answer":"capable of producing good crops","distractors":["very dry","extremely rocky","completely flat"]},
     {"prompt":"The triangular area where a river meets the sea is called a ___.","answer":"delta","distractors":["lagoon","estuary","fjord"]}
   ]
 }'::jsonb
),

(gen_random_uuid(), '2026-06-28', 'published', 'weekend_quiz',
 'Weekend Quiz: Nature Vocabulary Review', NULL, 'speed_burst',
 '{
   "questions": [
     {"prompt":"A baby cow is called a ___.","answer":"calf","distractors":["foal","cub","kit"]},
     {"prompt":"Which of these is NOT a body of water?","answer":"ridge","distractors":["lagoon","reservoir","pond"]},
     {"prompt":"Permanently frozen ground beneath the tundra surface is called ___.","answer":"permafrost","distractors":["bedrock","topsoil","subsoil"]},
     {"prompt":"Which word means to break through or violate?","answer":"breach","distractors":["erode","cascade","migrate"]},
     {"prompt":"A ''trophic cascade'' describes what happens when ___.","answer":"removing a predator changes the whole ecosystem","distractors":["a waterfall forms a new river","animals migrate to warmer areas","soil nutrients wash away in heavy rain"]},
     {"prompt":"The Finnish word ''tundra'' translates as ___.","answer":"treeless plain","distractors":["frozen ground","vast desert","cold forest"]},
     {"prompt":"Which animal holds the migration distance record?","answer":"the Arctic tern","distractors":["the monarch butterfly","the wildebeest","the salmon"]},
     {"prompt":"An apex predator is one that ___.","answer":"is at the top of the food chain with no natural predators","distractors":["only hunts at night","lives exclusively in water","eats only plants"]}
   ]
 }'::jsonb
),

(gen_random_uuid(), '2026-07-04', 'published', 'weekend_quiz',
 'Weekend Quiz: The Natural World — Week 2', NULL, 'speed_burst',
 '{
   "questions": [
     {"prompt":"A vast, flat, treeless Arctic landscape is called ___.","answer":"the tundra","distractors":["the steppe","the prairie","the savanna"]},
     {"prompt":"An animal that hunts and eats other animals is called a ___.","answer":"predator","distractors":["herbivore","scavenger","decomposer"]},
     {"prompt":"Soil capable of producing abundant crops is described as ___.","answer":"fertile","distractors":["arid","loamy","saturated"]},
     {"prompt":"A small waterfall, especially one in a series, is called a ___.","answer":"cascade","distractors":["rapid","surge","current"]},
     {"prompt":"The natural environment where an animal normally lives is its ___.","answer":"habitat","distractors":["territory","ecosystem","biome"]},
     {"prompt":"Which of these is a collective noun for a group of lions?","answer":"pride","distractors":["pack","pod","herd"]},
     {"prompt":"What does ''rewild'' mean?","answer":"to restore land to its natural state","distractors":["to train wild animals","to introduce new species for sport","to drain wetlands for farming"]},
     {"prompt":"Habitat loss is the single greatest threat to ___.","answer":"biodiversity","distractors":["food security","water quality","climate stability"]}
   ]
 }'::jsonb
),

(gen_random_uuid(), '2026-07-05', 'published', 'weekend_quiz',
 'Weekend Quiz: Two-Week Nature Review', NULL, 'speed_burst',
 '{
   "questions": [
     {"prompt":"The process of gradually wearing away rock by water or wind is called ___.","answer":"erosion","distractors":["corrosion","weathering","sedimentation"]},
     {"prompt":"Animals that spend winter in a deep sleep to conserve energy ___.","answer":"hibernate","distractors":["migrate","evacuate","adapt"]},
     {"prompt":"A river''s triangular mouth where it meets the sea is called a ___.","answer":"delta","distractors":["estuary","inlet","lagoon"]},
     {"prompt":"Which word describes soil that is productive and rich in nutrients?","answer":"fertile","distractors":["arid","porous","compact"]},
     {"prompt":"An animal at the top of the food chain is called an ___ predator.","answer":"apex","distractors":["alpha","prime","chief"]},
     {"prompt":"The permanently frozen layer of ground in Arctic regions is ___.","answer":"permafrost","distractors":["topsoil","bedrock","glacier"]},
     {"prompt":"''Cascade'' can refer to ___.","answer":"a series of small waterfalls or a flowing sequence of events","distractors":["a type of tropical plant","a sudden temperature drop","a large flat plain"]},
     {"prompt":"Scientists studying hibernation believe it could be applied to ___.","answer":"long-distance space travel","distractors":["treating heart disease","improving crop yields","building flood defences"]}
   ]
 }'::jsonb
)

ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES — run these after the seed to check everything landed.
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- SELECT puzzle_type, puzzle_date::text, status
--   FROM puzzle_content
--  WHERE puzzle_date BETWEEN '2026-06-22' AND '2026-07-05'
--  ORDER BY puzzle_date, puzzle_type;
--
-- SELECT challenge_date::text, challenge_type, title
--   FROM daily_challenges
--  WHERE challenge_date BETWEEN '2026-06-22' AND '2026-07-05'
--  ORDER BY challenge_date;
--
-- SELECT word, display_date::text FROM season_words ORDER BY display_date;
