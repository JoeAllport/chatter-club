-- ===============================================================================
-- TWO-WEEK TEST SEED -- Chatter Club
-- Dates: Mon 22 Jun  Fri 3 Jul 2026  (+  Sat/Sun quizzes)
-- Season theme: The Natural World
--
-- Tables:  seasons  season_words  puzzle_content
--          content_sets  content_items  content_set_items  daily_challenges
-- Run in:  Supabase SQL Editor
-- ===============================================================================


-- -----------------------------------------------------------------------------
-- 1. SEASON
-- -----------------------------------------------------------------------------

-- -- Cleanup any previous partial run -----------------------------------------
DELETE FROM daily_challenges  WHERE season_id = '00000000-aaaa-bbbb-cccc-000000000001';
DELETE FROM season_words      WHERE season_id = '00000000-aaaa-bbbb-cccc-000000000001';
DELETE FROM seasons           WHERE id        = '00000000-aaaa-bbbb-cccc-000000000001';
-- (puzzle_content and content_sets are date/id keyed -- ON CONFLICT handles them)

-- -- Season --------------------------------------------------------------------
INSERT INTO seasons (id, title, theme, description, emoji, colour, level, starts_at, ends_at, status)
VALUES (
  '00000000-aaaa-bbbb-cccc-000000000001',
  'The Natural World',
  'nature',
  'Two weeks of vocabulary and reading from the natural world -- weather, landscapes, animals and ecosystems.',
  '',
  '#72c09e',
  'B2',
  '2026-06-22',
  '2026-07-05',
  'published'
)
RETURNING id;


-- -----------------------------------------------------------------------------
-- 2. SEASON WORDS
-- -----------------------------------------------------------------------------

INSERT INTO season_words (id, season_id, word, ipa, part_of_speech, definition, example, day_introduced)
SELECT
  gen_random_uuid(),
  s.id,
  v.word,
  v.ipa,
  v.pos,
  v.definition,
  v.example,
  v.day_num
FROM seasons s
CROSS JOIN (VALUES
  (1, 'canopy',    '/knpi/',    'noun',       'The uppermost layer of branches in a forest, forming a continuous cover.',
   'Sunlight barely reached the floor through the dense canopy above.'),
  (2, 'arid',      '/rd/',      'adjective',  'Having very little rain; extremely dry.',
   'Nothing grew in the arid landscape except a few hardy desert plants.'),
  (3, 'migrate',   '/maret/', 'verb',        'To move from one region to another, especially seasonally.',
   'Thousands of birds migrate south before the winter cold arrives.'),
  (4, 'erode',     '/rd/',    'verb',        'To gradually wear away by natural forces such as water or wind.',
   'Heavy rainfall had begun to erode the cliffs along the coastline.'),
  (5, 'hibernate', '/habnet/','verb',        'To spend the winter in a sleep-like inactive state to conserve energy.',
   'Bears hibernate through the coldest months and emerge again in spring.'),
  (6, 'tundra',    '/tndr/',   'noun',        'A vast, flat, treeless Arctic region where the subsoil is permanently frozen.',
   'Reindeer grazed across the frozen tundra in search of buried grass.'),
  (7, 'predator',  '/predt/',  'noun',        'An animal that hunts, kills, and eats other animals.',
   'The hawk is the dominant predator in this open grassland ecosystem.'),
  (8, 'fertile',   '/ftal/',  'adjective',   'Capable of producing abundant vegetation or crops; rich in nutrients.',
   'Farmers have worked this fertile river valley for thousands of years.'),
  (9, 'cascade',   '/ksked/',  'noun',        'A small waterfall, especially one of a series; also used figuratively.',
   'We could hear the cascade long before we saw the white water tumbling over the rocks.'),
  (10,'habitat',   '/hbtt/',  'noun',        'The natural environment in which an organism normally lives and grows.',
   'Deforestation destroys the habitat of countless species.')
) AS v(day_num, word, ipa, pos, definition, example)
WHERE s.id = '00000000-aaaa-bbbb-cccc-000000000001'
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 3. WORDLE (WordUp)
-- -----------------------------------------------------------------------------

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES
(gen_random_uuid(),'wordle','2026-06-22','published','{"word":"CANOPY","definition":"The topmost layer of branches in a forest, forming a natural roof."}'),
(gen_random_uuid(),'wordle','2026-06-23','published','{"word":"BREACH","definition":"To break through or make a gap in something; also a violation of a rule or law."}'),
(gen_random_uuid(),'wordle','2026-06-24','published','{"word":"STREAM","definition":"A small, narrow river flowing continuously in one direction."}'),
(gen_random_uuid(),'wordle','2026-06-25','published','{"word":"POLLEN","definition":"Fine powder produced by flowers, carried by wind or insects to fertilise other plants."}'),
(gen_random_uuid(),'wordle','2026-06-26','published','{"word":"FREEZE","definition":"To turn to ice; also to become very cold or to stop completely."}'),
(gen_random_uuid(),'wordle','2026-06-29','published','{"word":"TUNDRA","definition":"A cold, treeless biome in the Arctic with permanently frozen subsoil."}'),
(gen_random_uuid(),'wordle','2026-06-30','published','{"word":"ERODED","definition":"Past tense of erode -- worn away gradually by natural forces."}'),
(gen_random_uuid(),'wordle','2026-07-01','published','{"word":"GRAVEL","definition":"Small, loose stones often found near riverbeds and used on paths."}'),
(gen_random_uuid(),'wordle','2026-07-02','published','{"word":"SUMMIT","definition":"The highest point of a mountain or hill."}'),
(gen_random_uuid(),'wordle','2026-07-03','published','{"word":"THATCH","definition":"Dry grass or reeds used as roof covering; also to cover a roof this way."}')
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 4. CONNECTIONS (Clusters)
-- -----------------------------------------------------------------------------

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES

(gen_random_uuid(),'connections','2026-06-22','published','{"groups":[{"category":"Types of rain","words":["drizzle","downpour","shower","deluge"],"level":0},{"category":"Strong wind words","words":["gale","gust","squall","blast"],"level":1},{"category":"___ storm","words":["thunder","snow","hail","brain"],"level":2},{"category":"Cloud types","words":["cumulus","cirrus","stratus","nimbus"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-23','published','{"groups":[{"category":"Parts of a tree","words":["trunk","branch","root","bark"],"level":0},{"category":"Types of tree","words":["oak","pine","willow","birch"],"level":1},{"category":"Things plants do","words":["bloom","wilt","sprout","shed"],"level":2},{"category":"___ wood","words":["drift","hard","dead","fire"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-24','published','{"groups":[{"category":"Baby animals","words":["cub","foal","kitten","calf"],"level":0},{"category":"Animals that migrate","words":["salmon","butterfly","wildebeest","swallow"],"level":1},{"category":"Animal sounds","words":["howl","screech","bellow","chirp"],"level":2},{"category":"Nocturnal creatures","words":["bat","owl","hedgehog","moth"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-25','published','{"groups":[{"category":"Bodies of water","words":["lake","pond","lagoon","reservoir"],"level":0},{"category":"Moving water words","words":["current","tide","flow","surge"],"level":1},{"category":"Adjectives meaning very wet","words":["sodden","drenched","saturated","waterlogged"],"level":2},{"category":"___ fall(s)","words":["water","night","free","down"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-26','published','{"groups":[{"category":"Forms of frozen water","words":["frost","sleet","hail","glacier"],"level":0},{"category":"Animals that hibernate","words":["bear","hedgehog","dormouse","bat"],"level":1},{"category":"Cold adjectives","words":["freezing","bitter","icy","raw"],"level":2},{"category":"Arctic or Antarctic animals","words":["penguin","walrus","lemming","narwhal"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-29','published','{"groups":[{"category":"Flat landscapes","words":["plain","plateau","steppe","prairie"],"level":0},{"category":"High ground words","words":["ridge","peak","summit","crest"],"level":1},{"category":"Rocky features","words":["cliff","gorge","ravine","boulder"],"level":2},{"category":"Coastal landforms","words":["dune","estuary","spit","headland"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-06-30','published','{"groups":[{"category":"Top predators","words":["lion","eagle","shark","crocodile"],"level":0},{"category":"Hunting verbs","words":["stalk","pounce","ambush","chase"],"level":1},{"category":"Collective nouns for animals","words":["pride","pack","pod","flock"],"level":2},{"category":"Camouflage patterns","words":["dappled","mottled","striped","speckled"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-07-01','published','{"groups":[{"category":"Cereal grains","words":["wheat","barley","oats","rye"],"level":0},{"category":"Soil types","words":["clay","loam","peat","chalk"],"level":1},{"category":"Garden tools","words":["trowel","rake","spade","hoe"],"level":2},{"category":"___ crop","words":["cash","root","cover","bumper"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-07-02','published','{"groups":[{"category":"Parts of a river","words":["bank","bed","mouth","source"],"level":0},{"category":"Waterfall vocabulary","words":["cascade","plunge","torrent","rapids"],"level":1},{"category":"Famous rivers","words":["Amazon","Nile","Thames","Danube"],"level":2},{"category":"River + ___","words":["bed","side","bank","boat"],"level":3}]}'),
(gen_random_uuid(),'connections','2026-07-03','published','{"groups":[{"category":"Tropical biomes","words":["rainforest","savanna","mangrove","reef"],"level":0},{"category":"Decomposers","words":["fungus","bacteria","worm","beetle"],"level":1},{"category":"Conservation verbs","words":["protect","restore","rewild","conserve"],"level":2},{"category":"Threats to ecosystems","words":["deforestation","pollution","drought","invasive species"],"level":3}]}')

ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 5. WORD LADDER
-- -----------------------------------------------------------------------------

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES
(gen_random_uuid(),'ladder','2026-06-22','published','{"start":"cold","target":"warm","par":4}'),
(gen_random_uuid(),'ladder','2026-06-23','published','{"start":"rain","target":"snow","par":6}'),
(gen_random_uuid(),'ladder','2026-06-24','published','{"start":"tree","target":"leaf","par":4}'),
(gen_random_uuid(),'ladder','2026-06-25','published','{"start":"fish","target":"bird","par":6}'),
(gen_random_uuid(),'ladder','2026-06-26','published','{"start":"wolf","target":"tame","par":7}'),
(gen_random_uuid(),'ladder','2026-06-29','published','{"start":"shore","target":"stone","par":6}'),
(gen_random_uuid(),'ladder','2026-06-30','published','{"start":"hunt","target":"prey","par":6}'),
(gen_random_uuid(),'ladder','2026-07-01','published','{"start":"leaf","target":"root","par":5}'),
(gen_random_uuid(),'ladder','2026-07-02','published','{"start":"cave","target":"lake","par":3}'),
(gen_random_uuid(),'ladder','2026-07-03','published','{"start":"wild","target":"tame","par":4}')
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 6. LETTER HIVE
-- -----------------------------------------------------------------------------

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES
(gen_random_uuid(),'hive','2026-06-22','published','{"centre":"r","letters":["a","e","i","n","g","t"],"words":["rain","rein","ring","rant","rent","grin","earn","tear","gear","train","grain","tearing","rating","grating","ringer","ranger","triage","retina","terrain","raining","granite","trainer","integer"]}'),
(gen_random_uuid(),'hive','2026-06-23','published','{"centre":"l","letters":["a","e","f","o","r","s"],"words":["lore","loaf","leaf","role","sole","aloe","feral","laser","false","loser","foals","flora","flare","floor","sorel","floater","floaters"]}'),
(gen_random_uuid(),'hive','2026-06-24','published','{"centre":"n","letters":["a","i","m","o","t","e"],"words":["name","note","tone","mean","neat","mine","mane","mint","omit","ante","omen","tenant","notion","nation","motion","inmate","mention","emotion","animate","animation","nomination"]}'),
(gen_random_uuid(),'hive','2026-06-25','published','{"centre":"s","letters":["a","e","h","o","r","w"],"words":["shore","share","shear","swear","swore","shoes","horse","arose","soar","sore","hoarser","ashore","hoarse","seahorse","showers","shower","warehouse"]}'),
(gen_random_uuid(),'hive','2026-06-26','published','{"centre":"b","letters":["a","e","i","r","t","h"],"words":["bath","bathe","bare","bear","beat","bait","brat","bite","birth","bright","breath","breathe","berate","betray","rebirth","heartbeat","tribute","birthrate"]}'),
(gen_random_uuid(),'hive','2026-06-29','published','{"centre":"g","letters":["a","e","l","n","r","s"],"words":["gale","glen","glean","glare","gran","range","ranger","angle","angler","regal","eagle","slang","genre","gangrene","granule","granules","general","generals","language"]}'),
(gen_random_uuid(),'hive','2026-06-30','published','{"centre":"p","letters":["a","e","i","r","s","t"],"words":["part","pair","pest","peat","trip","trap","apart","pasta","paste","taper","stripe","pirate","persist","tapir","esprit","sprite","aspire","parties","tastier","pastries"]}'),
(gen_random_uuid(),'hive','2026-07-01','published','{"centre":"f","letters":["a","e","i","l","r","t"],"words":["fair","fail","flat","flair","filter","fire","trail","trial","fault","fertile","flier","filer","fret","frill","frail","raft","trifle","afterlife"]}'),
(gen_random_uuid(),'hive','2026-07-02','published','{"centre":"w","letters":["a","e","i","l","o","t"],"words":["wait","wail","wale","weal","welt","wile","wilt","owlet","towel","trowel","towline","loathe","violate","wattle","towels","owlets"]}'),
(gen_random_uuid(),'hive','2026-07-03','published','{"centre":"d","letters":["a","e","h","n","r","s"],"words":["dash","dear","dean","darn","dare","sand","hand","hard","head","shed","read","rend","hands","shred","shade","heads","hardens","headers","hardness","dearness"]}')
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 7. CROSSWORD (Mini 77)
-- -----------------------------------------------------------------------------

INSERT INTO puzzle_content (id, puzzle_type, puzzle_date, status, content) VALUES
(gen_random_uuid(),'crossword','2026-06-22','published','{"size":7,"words":[{"id":"w1","word":"RIVER","clue":"A natural stream of water flowing to the sea","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"ROOTS","clue":"Underground parts of a plant that absorb water","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"OCEAN","clue":"A vast body of salt water covering most of the Earth","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"EAGLE","clue":"A large bird of prey famous for its keen eyesight","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"VENOM","clue":"A poisonous substance injected by snakes or spiders","row":0,"col":2,"direction":"down","length":5},{"id":"w6","word":"EARTH","clue":"The soil beneath your feet; also our planet","row":0,"col":4,"direction":"down","length":5},{"id":"w7","word":"TIGER","clue":"The world''s largest wild cat, famous for its stripes","row":6,"col":0,"direction":"across","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-23','published','{"size":7,"words":[{"id":"w1","word":"BLOOM","clue":"When a flower opens and shows its petals","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"BIRCH","clue":"A slender tree with white papery bark","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"OZONE","clue":"A gas in the upper atmosphere that protects us from the sun","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"LEAFY","clue":"Covered with a lot of leaves","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"LOAMY","clue":"Describing ideal, fertile gardening soil","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"ORCHID","clue":"An exotic flower, often rare and delicate","row":0,"col":2,"direction":"down","length":6},{"id":"w7","word":"MOSSY","clue":"Covered in moss; describes damp, shaded surfaces","row":0,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-24','published','{"size":7,"words":[{"id":"w1","word":"SWIFT","clue":"A bird that migrates and rarely lands; also means fast","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"SWAMP","clue":"Wet, marshy ground; a type of wetland habitat","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"AVIAN","clue":"Relating to birds","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"FLOCK","clue":"A group of birds flying together","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"PLUME","clue":"A long, decorative feather","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"WADER","clue":"A bird that walks through shallow water to find food","row":0,"col":2,"direction":"down","length":5},{"id":"w7","word":"TALON","clue":"The sharp claw of a bird of prey","row":0,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-25','published','{"size":7,"words":[{"id":"w1","word":"LAGOON","clue":"A stretch of salt water separated from the sea by sand or rock","row":0,"col":0,"direction":"across","length":6},{"id":"w2","word":"LADEN","clue":"Carrying a heavy load; rivers are often sediment-laden","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"ATOLL","clue":"A ring-shaped coral reef surrounding a lagoon","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"GRAVEL","clue":"Small stones found near riverbeds","row":0,"col":4,"direction":"down","length":6},{"id":"w5","word":"EDDY","clue":"A circular movement of water or air","row":4,"col":0,"direction":"across","length":4},{"id":"w6","word":"BRINE","clue":"Very salty water","row":6,"col":0,"direction":"across","length":5},{"id":"w7","word":"FLOOD","clue":"When a river overflows its banks","row":2,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-26','published','{"size":7,"words":[{"id":"w1","word":"FROST","clue":"Ice crystals that form on surfaces at freezing temperatures","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"FLOES","clue":"Sheets of floating ice (plural)","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"RIDGE","clue":"A long narrow strip of raised land or ice","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"SLEET","clue":"A mixture of rain and snow","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"THAWS","clue":"Melts after freezing (third person singular)","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"OTTER","clue":"A semi-aquatic mammal with a streamlined body","row":0,"col":2,"direction":"down","length":5},{"id":"w7","word":"STONY","clue":"Covered with stones; also meaning cold and expressionless","row":0,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-29','published','{"size":7,"words":[{"id":"w1","word":"PLAIN","clue":"A large flat area of land with few trees","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"PEAKS","clue":"The pointed tops of mountains (plural)","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"INLET","clue":"A narrow strip of water going into the land from the sea","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"DELTA","clue":"A triangular area where a river splits and meets the sea","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"SCREE","clue":"Loose rocks and stones on a mountain slope","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"AISLE","clue":"A narrow passage between two ridges of land","row":0,"col":2,"direction":"down","length":5},{"id":"w7","word":"KNOLL","clue":"A small, gently rounded hill","row":0,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-06-30','published','{"size":7,"words":[{"id":"w1","word":"PROWL","clue":"To move quietly and carefully, as a predator searching for prey","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"PRIDE","clue":"A group of lions; also a feeling of satisfaction","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"OMEGA","clue":"The last letter of the Greek alphabet; the lowest rank in a wolf pack","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"GNASH","clue":"To grind or bite with the teeth aggressively","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"TRACK","clue":"A footprint or trail left by an animal","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"LAIR","clue":"The hidden den of a wild animal","row":0,"col":2,"direction":"down","length":4},{"id":"w7","word":"DINGO","clue":"A wild dog native to Australia","row":0,"col":4,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-07-01','published','{"size":7,"words":[{"id":"w1","word":"LOAMY","clue":"Describing rich, fertile soil with a good mix of sand and clay","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"LANDS","clue":"Areas of ground; also the plural of land","row":0,"col":0,"direction":"down","length":5},{"id":"w3","word":"AFIELD","clue":"Far away from home -- farmers sometimes sell ___ at markets","row":2,"col":0,"direction":"across","length":6},{"id":"w4","word":"DELTA","clue":"A fertile, fan-shaped area where a river meets the sea","row":4,"col":0,"direction":"across","length":5},{"id":"w5","word":"SEEDS","clue":"What a farmer plants at the start of the growing season","row":6,"col":0,"direction":"across","length":5},{"id":"w6","word":"ORCHID","clue":"A delicate flower requiring specific growing conditions","row":0,"col":2,"direction":"down","length":6},{"id":"w7","word":"YIELD","clue":"The amount of crop produced from an area of land","row":0,"col":5,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-07-02','published','{"size":7,"words":[{"id":"w1","word":"RAPIDS","clue":"A section of a river where water flows fast over rocks","row":0,"col":0,"direction":"across","length":6},{"id":"w2","word":"RIPPLE","clue":"A small wave spreading outward on the surface of water","row":0,"col":0,"direction":"down","length":6},{"id":"w3","word":"INLET","clue":"A narrow strip of water cutting into the land","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"PLUNGE","clue":"To fall steeply -- what water does at a waterfall","row":0,"col":3,"direction":"down","length":6},{"id":"w5","word":"EDDY","clue":"A circular current of water","row":4,"col":0,"direction":"across","length":4},{"id":"w6","word":"KAYAK","clue":"A small, narrow boat paddled from inside","row":6,"col":0,"direction":"across","length":5},{"id":"w7","word":"DELTA","clue":"Fan-shaped land at a river''s mouth","row":2,"col":5,"direction":"down","length":5}]}'),
(gen_random_uuid(),'crossword','2026-07-03','published','{"size":7,"words":[{"id":"w1","word":"BIOME","clue":"A large natural zone with its own climate and wildlife","row":0,"col":0,"direction":"across","length":5},{"id":"w2","word":"BURROW","clue":"A hole or tunnel dug by an animal as its home","row":0,"col":0,"direction":"down","length":6},{"id":"w3","word":"MARSH","clue":"Low-lying wet land with reeds and grasses","row":2,"col":0,"direction":"across","length":5},{"id":"w4","word":"OXYGEN","clue":"The gas that plants release and animals need to breathe","row":0,"col":3,"direction":"down","length":6},{"id":"w5","word":"DECAY","clue":"To slowly break down and rot, releasing nutrients back to the soil","row":4,"col":0,"direction":"across","length":5},{"id":"w6","word":"ALGAE","clue":"Simple plant-like organisms that grow in water","row":6,"col":0,"direction":"across","length":5},{"id":"w7","word":"REWILD","clue":"To restore land to its natural, uncultivated state","row":0,"col":5,"direction":"down","length":6}]}')
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 8. WILD CARD CONTENT SETS
-- Each daily challenge wild card is saved as a content_set + content_items.
-- We use fixed UUIDs so we can reference them in daily_challenges below.
-- -----------------------------------------------------------------------------

-- Day 1 (Mon 22 Jun) -- word_formation
-- word_formation is a single-question type; we store it as one MCQ item
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0001-0001-0001-000000000001', 'Natural World  Day 1 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0001-0001-0001-000000000001', 'word_formation',
 'Complete the sentence with the correct form of the word in brackets. The trees ___ fiercely for light in the dense forest. (COMPETE)',
 'competed',
 ARRAY['competition','competitor','competitive'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', 0)
ON CONFLICT DO NOTHING;


-- Day 2 (Tue 23 Jun) -- odd_one_out
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0002-0002-0002-000000000002', 'Natural World  Day 2 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0002-0002-0002-000000000002', 'odd_one_out',
 'Which word does NOT belong with the others? arid / parched / saturated / barren',
 'saturated',
 ARRAY['arid','parched','barren'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0002-0002-0002-000000000002', '22222222-0002-0002-0002-000000000002', 0)
ON CONFLICT DO NOTHING;


-- Day 3 (Wed 24 Jun) -- fill_gap
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0003-0003-0003-000000000003', 'Natural World  Day 3 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0003-0003-0003-000000000003', 'cloze',
 'Every autumn, thousands of monarch butterflies ___ south from Canada to their wintering grounds in Mexico.',
 'migrate',
 ARRAY['evacuate','transfer','relocate'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0003-0003-0003-000000000003', '22222222-0003-0003-0003-000000000003', 0)
ON CONFLICT DO NOTHING;


-- Day 4 (Thu 25 Jun) -- speed_burst (5 questions)
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0004-0004-0004-000000000004', 'Natural World  Day 4 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0004-0004-0004-000000000001', 'mcq', 'What is the process called when water wears away rock over time?', 'erosion', ARRAY['sedimentation','deposit','corrosion']),
('22222222-0004-0004-0004-000000000002', 'mcq', 'A triangular area where a river meets the sea is called a ___.', 'delta', ARRAY['estuary','lagoon','tributary']),
('22222222-0004-0004-0004-000000000003', 'mcq', 'The Colorado River carved which famous natural landmark?', 'the Grand Canyon', ARRAY['the Great Barrier Reef','the Amazon Basin','the Rocky Mountains']),
('22222222-0004-0004-0004-000000000004', 'mcq', 'Tiny particles of rock and soil carried by rivers are called ___.', 'sediment', ARRAY['gravel','residue','debris']),
('22222222-0004-0004-0004-000000000005', 'mcq', 'River floodplains are often used for farming because they are ___.', 'fertile', ARRAY['arid','elevated','rocky'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0004-0004-0004-000000000004', '22222222-0004-0004-0004-000000000001', 0),
('11111111-0004-0004-0004-000000000004', '22222222-0004-0004-0004-000000000002', 1),
('11111111-0004-0004-0004-000000000004', '22222222-0004-0004-0004-000000000003', 2),
('11111111-0004-0004-0004-000000000004', '22222222-0004-0004-0004-000000000004', 3),
('11111111-0004-0004-0004-000000000004', '22222222-0004-0004-0004-000000000005', 4)
ON CONFLICT DO NOTHING;


-- Day 5 (Fri 26 Jun) -- translation (single item)
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0005-0005-0005-000000000005', 'Natural World  Day 5 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0005-0005-0005-000000000005', 'flashcard',
 'pasar el invierno durmiendo (como los osos)',
 'hibernate',
 ARRAY['migrate','evacuate','adapt'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0005-0005-0005-000000000005', '22222222-0005-0005-0005-000000000005', 0)
ON CONFLICT DO NOTHING;


-- Day 6 (Mon 29 Jun) -- word_formation
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0006-0006-0006-000000000006', 'Natural World  Day 6 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0006-0006-0006-000000000006', 'word_formation',
 'The scientist spoke about the ___ of Arctic ecosystems under climate change. (DEGRADE)',
 'degradation',
 ARRAY['degrading','degraded','degrader'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0006-0006-0006-000000000006', '22222222-0006-0006-0006-000000000006', 0)
ON CONFLICT DO NOTHING;


-- Day 7 (Tue 30 Jun) -- odd_one_out
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0007-0007-0007-000000000007', 'Natural World  Day 7 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0007-0007-0007-000000000007', 'odd_one_out',
 'Which word does NOT belong with the others? stalk / pounce / ambush / graze',
 'graze',
 ARRAY['stalk','pounce','ambush'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0007-0007-0007-000000000007', '22222222-0007-0007-0007-000000000007', 0)
ON CONFLICT DO NOTHING;


-- Day 8 (Wed 1 Jul) -- fill_gap
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0008-0008-0008-000000000008', 'Natural World  Day 8 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0008-0008-0008-000000000008', 'cloze',
 'The river valley has some of the most ___ farmland in the region, producing excellent harvests year after year.',
 'fertile',
 ARRAY['arid','sterile','barren'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0008-0008-0008-000000000008', '22222222-0008-0008-0008-000000000008', 0)
ON CONFLICT DO NOTHING;


-- Day 9 (Thu 2 Jul) -- speed_burst (5 questions)
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0009-0009-0009-000000000009', 'Natural World  Day 9 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0009-0009-0009-000000000001', 'mcq', 'Angel Falls is located in which country?', 'Venezuela', ARRAY['Brazil','Colombia','Argentina']),
('22222222-0009-0009-0009-000000000002', 'mcq', 'A small waterfall, especially one in a series, is called a ___.', 'cascade', ARRAY['current','rapid','torrent']),
('22222222-0009-0009-0009-000000000003', 'mcq', 'Waterfalls form when a river crosses from hard rock to ___ rock.', 'soft', ARRAY['wet','ancient','porous']),
('22222222-0009-0009-0009-000000000004', 'mcq', 'Niagara Falls sits on the border between the USA and ___.', 'Canada', ARRAY['Mexico','UK','France']),
('22222222-0009-0009-0009-000000000005', 'mcq', 'At Angel Falls, the water turns to ___ before reaching the bottom.', 'mist', ARRAY['ice','foam','steam'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0009-0009-0009-000000000009', '22222222-0009-0009-0009-000000000001', 0),
('11111111-0009-0009-0009-000000000009', '22222222-0009-0009-0009-000000000002', 1),
('11111111-0009-0009-0009-000000000009', '22222222-0009-0009-0009-000000000003', 2),
('11111111-0009-0009-0009-000000000009', '22222222-0009-0009-0009-000000000004', 3),
('11111111-0009-0009-0009-000000000009', '22222222-0009-0009-0009-000000000005', 4)
ON CONFLICT DO NOTHING;


-- Day 10 (Fri 3 Jul) -- translation
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0010-0010-0010-000000000010', 'Natural World  Day 10 wild card', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0010-0010-0010-000000000010', 'flashcard',
 'el hbitat natural de un animal o planta',
 'habitat',
 ARRAY['ecosystem','territory','biome'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0010-0010-0010-000000000010', '22222222-0010-0010-0010-000000000010', 0)
ON CONFLICT DO NOTHING;


-- Weekend quiz sets (4 weekends: 27 Jun, 28 Jun, 4 Jul, 5 Jul)
-- 8 questions each

-- Sat 27 Jun
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0011-0011-0011-000000000011', 'Natural World  Weekend Quiz 1 (27 Jun)', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0011-0011-0011-000000000001', 'mcq', 'What is the uppermost layer of branches in a forest called?', 'the canopy', ARRAY['the undergrowth','the understory','the forest floor']),
('22222222-0011-0011-0011-000000000002', 'mcq', 'Which adjective means extremely dry with very little rain?', 'arid', ARRAY['humid','temperate','lush']),
('22222222-0011-0011-0011-000000000003', 'mcq', 'When animals move seasonally between habitats, we say they ___.', 'migrate', ARRAY['hibernate','adapt','evolve']),
('22222222-0011-0011-0011-000000000004', 'mcq', 'The process by which water gradually wears away rock is called ___.', 'erosion', ARRAY['sedimentation','weathering','corrosion']),
('22222222-0011-0011-0011-000000000005', 'mcq', 'When a bear sleeps through winter to conserve energy, it ___.', 'hibernates', ARRAY['migrates','evacuates','nests']),
('22222222-0011-0011-0011-000000000006', 'mcq', 'A group of fish moving together is called a ___.', 'shoal', ARRAY['flock','pack','herd']),
('22222222-0011-0011-0011-000000000007', 'mcq', 'What does fertile mean when describing soil?', 'capable of producing good crops', ARRAY['very dry','extremely rocky','completely flat']),
('22222222-0011-0011-0011-000000000008', 'mcq', 'The triangular area where a river meets the sea is called a ___.', 'delta', ARRAY['lagoon','estuary','fjord'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000001', 0),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000002', 1),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000003', 2),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000004', 3),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000005', 4),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000006', 5),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000007', 6),
('11111111-0011-0011-0011-000000000011', '22222222-0011-0011-0011-000000000008', 7)
ON CONFLICT DO NOTHING;


-- Sun 28 Jun
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0012-0012-0012-000000000012', 'Natural World  Weekend Quiz 2 (28 Jun)', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0012-0012-0012-000000000001', 'mcq', 'A baby cow is called a ___.', 'calf', ARRAY['foal','cub','kit']),
('22222222-0012-0012-0012-000000000002', 'mcq', 'Which of these is NOT a body of water?', 'ridge', ARRAY['lagoon','reservoir','pond']),
('22222222-0012-0012-0012-000000000003', 'mcq', 'Permanently frozen ground beneath the tundra is called ___.', 'permafrost', ARRAY['bedrock','topsoil','subsoil']),
('22222222-0012-0012-0012-000000000004', 'mcq', 'Which word means to break through or violate?', 'breach', ARRAY['erode','cascade','migrate']),
('22222222-0012-0012-0012-000000000005', 'mcq', 'A trophic cascade describes what happens when ___.', 'removing a predator changes the whole ecosystem', ARRAY['a waterfall forms a new river','animals migrate to warmer areas','soil nutrients wash away in heavy rain']),
('22222222-0012-0012-0012-000000000006', 'mcq', 'Which animal holds the migration distance record?', 'the Arctic tern', ARRAY['the monarch butterfly','the wildebeest','the salmon']),
('22222222-0012-0012-0012-000000000007', 'mcq', 'An apex predator is one that ___.', 'is at the top of the food chain with no natural predators', ARRAY['only hunts at night','lives exclusively in water','eats only plants']),
('22222222-0012-0012-0012-000000000008', 'mcq', 'The tundra is described as a treeless ___.', 'plain', ARRAY['plateau','canyon','jungle'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000001', 0),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000002', 1),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000003', 2),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000004', 3),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000005', 4),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000006', 5),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000007', 6),
('11111111-0012-0012-0012-000000000012', '22222222-0012-0012-0012-000000000008', 7)
ON CONFLICT DO NOTHING;


-- Sat 4 Jul
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0013-0013-0013-000000000013', 'Natural World  Weekend Quiz 3 (4 Jul)', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0013-0013-0013-000000000001', 'mcq', 'A vast, flat, treeless Arctic landscape is called ___.', 'the tundra', ARRAY['the steppe','the prairie','the savanna']),
('22222222-0013-0013-0013-000000000002', 'mcq', 'An animal that hunts and eats other animals is called a ___.', 'predator', ARRAY['herbivore','scavenger','decomposer']),
('22222222-0013-0013-0013-000000000003', 'mcq', 'Soil capable of producing abundant crops is described as ___.', 'fertile', ARRAY['arid','compact','saturated']),
('22222222-0013-0013-0013-000000000004', 'mcq', 'A small waterfall, especially one in a series, is called a ___.', 'cascade', ARRAY['rapid','surge','current']),
('22222222-0013-0013-0013-000000000005', 'mcq', 'The natural environment where an animal normally lives is its ___.', 'habitat', ARRAY['territory','ecosystem','biome']),
('22222222-0013-0013-0013-000000000006', 'mcq', 'Which of these is a collective noun for a group of lions?', 'pride', ARRAY['pack','pod','herd']),
('22222222-0013-0013-0013-000000000007', 'mcq', 'What does rewild mean?', 'to restore land to its natural state', ARRAY['to train wild animals','to introduce species for sport','to drain wetlands for farming']),
('22222222-0013-0013-0013-000000000008', 'mcq', 'Habitat loss is the single greatest threat to ___.', 'biodiversity', ARRAY['food security','water quality','climate stability'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000001', 0),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000002', 1),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000003', 2),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000004', 3),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000005', 4),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000006', 5),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000007', 6),
('11111111-0013-0013-0013-000000000013', '22222222-0013-0013-0013-000000000008', 7)
ON CONFLICT DO NOTHING;


-- Sun 5 Jul
INSERT INTO content_sets (id, name, status) VALUES
('11111111-0014-0014-0014-000000000014', 'Natural World  Weekend Quiz 4 (5 Jul)', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, task_type, prompt, answer, distractors) VALUES
('22222222-0014-0014-0014-000000000001', 'mcq', 'The process of gradually wearing away rock by water or wind is called ___.', 'erosion', ARRAY['corrosion','weathering','sedimentation']),
('22222222-0014-0014-0014-000000000002', 'mcq', 'Animals that spend winter in a deep sleep to conserve energy ___.', 'hibernate', ARRAY['migrate','evacuate','adapt']),
('22222222-0014-0014-0014-000000000003', 'mcq', 'A river mouth where it fans out into the sea is called a ___.', 'delta', ARRAY['estuary','inlet','lagoon']),
('22222222-0014-0014-0014-000000000004', 'mcq', 'Which word describes soil that is productive and rich in nutrients?', 'fertile', ARRAY['arid','porous','compact']),
('22222222-0014-0014-0014-000000000005', 'mcq', 'An animal at the top of the food chain is called an ___ predator.', 'apex', ARRAY['alpha','prime','chief']),
('22222222-0014-0014-0014-000000000006', 'mcq', 'The permanently frozen layer of ground in Arctic regions is ___.', 'permafrost', ARRAY['topsoil','bedrock','glacier']),
('22222222-0014-0014-0014-000000000007', 'mcq', 'Cascade can refer to ___.', 'a series of small waterfalls or a flowing sequence of events', ARRAY['a type of tropical plant','a sudden temperature drop','a large flat plain']),
('22222222-0014-0014-0014-000000000008', 'mcq', 'Scientists studying hibernation believe it could be applied to ___.', 'long-distance space travel', ARRAY['treating heart disease','improving crop yields','building flood defences'])
ON CONFLICT DO NOTHING;

INSERT INTO content_set_items (set_id, item_id, position) VALUES
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000001', 0),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000002', 1),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000003', 2),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000004', 3),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000005', 4),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000006', 5),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000007', 6),
('11111111-0014-0014-0014-000000000014', '22222222-0014-0014-0014-000000000008', 7)
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 9. DAILY CHALLENGES  (MonFri  2 weeks)
-- References wild_card_set_id (not wild_card column -- that column doesn't exist)
-- -----------------------------------------------------------------------------

INSERT INTO daily_challenges (
  id, season_id, challenge_date, day_number, status, challenge_type,
  title, passage_text, wild_card_type, wild_card_set_id, word_id
)
SELECT
  gen_random_uuid(),
  s.id,
  v.d::date,
  v.day_num,
  'published',
  'daily',
  v.title,
  v.passage,
  v.wct::wild_card_type,
  v.wc_set_id::uuid,
  sw.id
FROM seasons s
CROSS JOIN (VALUES

  (1,'2026-06-22',
   'Life in the Forest Canopy',
   'The forest canopy is one of the most biodiverse environments on Earth. High above the ground, trees compete for sunlight, creating a dense roof of leaves that blocks up to 98% of light from reaching the floor below. This upper layer is home to animals that rarely -- if ever -- come down to the ground. Monkeys, sloths, and hundreds of species of birds spend their entire lives moving through the branches. Scientists are still discovering new species that live only in the canopy.',
   'word_formation','11111111-0001-0001-0001-000000000001',1),

  (2,'2026-06-23',
   'The World''s Great Deserts',
   'When most people picture a desert, they imagine sand dunes and blazing heat. But not all deserts are hot. The Gobi Desert in Asia can drop to -40 degreesC in winter, while Antarctica -- the world''s largest desert -- receives almost no precipitation at all. What makes a desert is not temperature but aridity: less than 250mm of rain per year. In these extreme conditions, plants and animals have evolved remarkable strategies to survive, from storing water in their tissues to going years without a single drop of rain.',
   'odd_one_out','11111111-0002-0002-0002-000000000002',2),

  (3,'2026-06-24',
   'Animal Migration: Nature''s Greatest Journeys',
   'Every year, billions of animals migrate across the planet. The Arctic tern holds the record, travelling from the Arctic to Antarctica and back -- a round trip of up to 90,000 kilometres. Wildebeest thunder across the Serengeti in vast herds, crossing crocodile-filled rivers. Even insects join the journey: monarch butterflies cover 4,000 kilometres from Canada to Mexico each autumn. Scientists believe animals navigate using the Earth''s magnetic field, the position of the sun, and even the stars.',
   'fill_gap','11111111-0003-0003-0003-000000000003',3),

  (4,'2026-06-25',
   'How Rivers Shape the Land',
   'Rivers are among the most powerful forces shaping the Earth''s surface. Over millions of years, the Colorado River carved the Grand Canyon -- a gorge over 1.6 kilometres deep. This process, called erosion, happens when flowing water picks up sediment -- tiny particles of rock and soil -- and carries it downstream. The faster the water moves, the more material it can carry. When rivers slow down, they deposit this sediment, building up deltas and floodplains that are often among the world''s most fertile farming land.',
   'speed_burst','11111111-0004-0004-0004-000000000004',4),

  (5,'2026-06-26',
   'The Long Sleep: Hibernation',
   'As winter approaches, some animals face a critical challenge: how to survive when food becomes scarce and temperatures plummet. Their solution is one of nature''s most elegant adaptations -- hibernation. During this extended sleep, body temperature drops dramatically, heart rate slows to just a few beats per minute, and breathing becomes almost imperceptible. A hibernating bear does not eat, drink, or pass waste for up to seven months. Yet in spring, it emerges healthy, having lived entirely off its fat reserves. Scientists are studying hibernation for potential applications in medicine, including long-distance space travel.',
   'translation','11111111-0005-0005-0005-000000000005',5),

  (6,'2026-06-29',
   'The Tundra: Earth''s Frozen Desert',
   'Stretching across the top of the world, the Arctic tundra is a vast, treeless landscape that looks desolate but teems with life. Permanently frozen ground -- called permafrost -- lies beneath the surface, preventing trees from taking root. Yet in summer, the tundra transforms. Wildflowers burst into colour, migratory birds arrive from thousands of kilometres away, and lemmings emerge from under the snow. The tundra is also one of the regions most threatened by climate change: as permafrost thaws, it releases enormous quantities of the greenhouse gas methane.',
   'word_formation','11111111-0006-0006-0006-000000000006',6),

  (7,'2026-06-30',
   'Predator and Prey: A Deadly Balance',
   'The relationship between predator and prey is one of nature''s most finely balanced systems. Remove the wolves from Yellowstone National Park, and deer populations explode -- rivers erode as deer overgraze riverbanks, trees disappear, and songbirds vanish. Reintroduce the wolves, and the entire ecosystem recovers -- a phenomenon scientists call a "trophic cascade." Predators do not simply reduce the numbers of their prey; they change the behaviour of the animals they hunt. This is why conservationists argue that protecting apex predators is essential to maintaining healthy ecosystems.',
   'odd_one_out','11111111-0007-0007-0007-000000000007',7),

  (8,'2026-07-01',
   'Why Soil is the Foundation of Life',
   'Beneath your feet lies one of the most complex ecosystems on Earth. A single teaspoon of healthy soil contains more microorganisms than there are people on the planet. These bacteria and fungi break down dead matter, release nutrients, and make the soil fertile -- capable of supporting the crops and wild plants that all animal life ultimately depends on. Yet soil is disappearing at an alarming rate. Modern farming practices, deforestation, and urban development strip away the thin layer of topsoil that took thousands of years to form. Scientists warn that without urgent action, food security will be at risk within decades.',
   'fill_gap','11111111-0008-0008-0008-000000000008',8),

  (9,'2026-07-02',
   'Waterfalls: Where Rivers Take the Leap',
   'Waterfalls form when a river crosses from hard rock to soft rock. The soft rock erodes more quickly, creating a sudden drop. Angel Falls in Venezuela -- the world''s highest waterfall -- drops 979 metres in a series of cascades so tall that the water turns to mist before reaching the bottom. Niagara Falls moves more than 2,800 cubic metres of water per second during peak flow, generating enough electricity to power over 3.8 million homes. Beyond their practical value, waterfalls have inspired painters, poets, and travellers for centuries.',
   'speed_burst','11111111-0009-0009-0009-000000000009',9),

  (10,'2026-07-03',
   'Habitat Loss: The Silent Emergency',
   'Every day, an area of forest the size of a football pitch is destroyed somewhere on Earth. As humans clear land for farming, mining, and cities, the natural habitats of millions of species disappear. Habitat loss is now the single greatest threat to biodiversity. When a forest is felled or a wetland drained, the animals that depend on it cannot simply relocate -- they have evolved over millions of years to fill a specific ecological niche. Conservation biologists now focus on preserving entire ecosystems, recognising that every creature plays a role in the web of life.',
   'translation','11111111-0010-0010-0010-000000000010',10)

) AS v(day_num, d, title, passage, wct, wc_set_id, word_day)
JOIN season_words sw
  ON sw.season_id = s.id AND sw.day_introduced = v.word_day
WHERE s.id = '00000000-aaaa-bbbb-cccc-000000000001'
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 10. WEEKEND QUIZZES
-- -----------------------------------------------------------------------------

INSERT INTO daily_challenges (
  id, season_id, challenge_date, day_number, status, challenge_type,
  title, wild_card_type, weekend_quiz_set_id
)
SELECT
  gen_random_uuid(),
  s.id,
  v.d::date,
  v.day_num,
  'published',
  'weekend_quiz',
  v.title,
  'speed_burst'::wild_card_type,
  v.wq_set_id::uuid
FROM seasons s
CROSS JOIN (VALUES
  (6,  '2026-06-27', 'Weekend Quiz: The Natural World -- Week 1',    '11111111-0011-0011-0011-000000000011'),
  (7,  '2026-06-28', 'Weekend Quiz: Nature Vocabulary Review',       '11111111-0012-0012-0012-000000000012'),
  (11, '2026-07-04', 'Weekend Quiz: The Natural World -- Week 2',    '11111111-0013-0013-0013-000000000013'),
  (12, '2026-07-05', 'Weekend Quiz: Two-Week Nature Review',        '11111111-0014-0014-0014-000000000014')
) AS v(day_num, d, title, wq_set_id)
WHERE s.id = '00000000-aaaa-bbbb-cccc-000000000001'
ON CONFLICT DO NOTHING;


-- ===============================================================================
-- VERIFICATION -- run after the seed:
--
-- SELECT puzzle_type, puzzle_date::text, status FROM puzzle_content
--  WHERE puzzle_date BETWEEN '2026-06-22' AND '2026-07-05'
--  ORDER BY puzzle_date, puzzle_type;
--
-- SELECT challenge_date::text, challenge_type, wild_card_type, title
--   FROM daily_challenges
--  WHERE challenge_date BETWEEN '2026-06-22' AND '2026-07-05'
--  ORDER BY challenge_date;
--
-- SELECT word, day_introduced FROM season_words
--  WHERE season_id = (SELECT id FROM seasons WHERE title = 'The Natural World')
--  ORDER BY day_introduced;
-- ===============================================================================
