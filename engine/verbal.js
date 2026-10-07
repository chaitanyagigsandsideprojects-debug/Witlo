/* Verbal ability templates. Language can't be produced reliably by formula,
   so the meaning-based items come from hand-written banks; grammar items are
   templated so the same rule appears with fresh sentences. */
import { NAMES } from './core';

const Q = (o) => ({ cat: 'verbal', fast: true, deep: false, lv: [1, 3], words: true, ...o });

// [word, synonym, level]
const SYN = [
  ['Rapid', 'Quick', 1], ['Abundant', 'Plentiful', 1], ['Vivid', 'Bright', 1], ['Diligent', 'Hard-working', 1], ['Fragile', 'Delicate', 1], ['Brief', 'Short', 1], ['Courage', 'Bravery', 1], ['Eager', 'Keen', 1], ['Enormous', 'Huge', 1], ['Gloomy', 'Sad', 1],
  ['Honest', 'Truthful', 1], ['Idle', 'Inactive', 1], ['Jovial', 'Cheerful', 2], ['Lethal', 'Deadly', 1], ['Novice', 'Beginner', 1], ['Placid', 'Calm', 2], ['Quarrel', 'Argument', 1], ['Rigid', 'Stiff', 1], ['Scarce', 'Rare', 1], ['Timid', 'Shy', 1],
  ['Vacant', 'Empty', 1], ['Wealthy', 'Rich', 1], ['Zeal', 'Enthusiasm', 2], ['Adept', 'Skilled', 2], ['Benevolent', 'Kind', 2], ['Conceal', 'Hide', 1], ['Deceive', 'Mislead', 1], ['Endeavour', 'Attempt', 2], ['Feeble', 'Weak', 1], ['Hazard', 'Danger', 1],
  ['Imitate', 'Copy', 1], ['Lament', 'Mourn', 2], ['Mend', 'Repair', 1], ['Obstinate', 'Stubborn', 2], ['Precise', 'Exact', 1], ['Reluctant', 'Unwilling', 2], ['Absurd', 'Ridiculous', 1], ['Commence', 'Begin', 1], ['Evident', 'Obvious', 1], ['Fatigue', 'Tiredness', 1],
  ['Genuine', 'Real', 1], ['Obsolete', 'Outdated', 2], ['Ponder', 'Reflect', 2], ['Rebuke', 'Scold', 2], ['Vanish', 'Disappear', 1], ['Hinder', 'Obstruct', 2], ['Fortunate', 'Lucky', 1], ['Fury', 'Rage', 1], ['Loyal', 'Faithful', 1], ['Vital', 'Essential', 1],
  ['Ambiguous', 'Unclear', 2], ['Candid', 'Frank', 2], ['Meticulous', 'Careful', 2], ['Lucid', 'Clear', 2], ['Frugal', 'Thrifty', 2], ['Gregarious', 'Sociable', 3], ['Ephemeral', 'Short-lived', 3], ['Ubiquitous', 'Everywhere', 3], ['Pragmatic', 'Practical', 2], ['Tenacious', 'Persistent', 2],
  ['Verbose', 'Wordy', 3], ['Zealous', 'Passionate', 2], ['Austere', 'Plain', 3], ['Cogent', 'Convincing', 3], ['Diffident', 'Unconfident', 3], ['Eloquent', 'Articulate', 2], ['Fervent', 'Intense', 2], ['Gullible', 'Easily fooled', 2], ['Impetuous', 'Rash', 3], ['Laconic', 'Brief in speech', 3],
  ['Mitigate', 'Lessen', 3], ['Nonchalant', 'Casual', 3], ['Ostentatious', 'Showy', 3], ['Prudent', 'Wise', 2], ['Querulous', 'Complaining', 3], ['Resilient', 'Tough', 2], ['Sagacious', 'Wise', 3], ['Trepidation', 'Fear', 3], ['Vindicate', 'Clear of blame', 3], ['Wary', 'Cautious', 2],
  ['Alleviate', 'Ease', 2], ['Benign', 'Harmless', 2], ['Capricious', 'Unpredictable', 3], ['Docile', 'Obedient', 2], ['Enigmatic', 'Mysterious', 3], ['Feasible', 'Possible', 2], ['Haughty', 'Arrogant', 2], ['Innate', 'Inborn', 2], ['Jubilant', 'Joyful', 2], ['Kindle', 'Ignite', 2],
  ['Lavish', 'Extravagant', 2], ['Malevolent', 'Spiteful', 3], ['Nostalgia', 'Longing for the past', 2], ['Opulent', 'Luxurious', 3], ['Perplexed', 'Confused', 2], ['Reticent', 'Reserved', 3], ['Serene', 'Peaceful', 2], ['Tranquil', 'Calm', 2], ['Vigilant', 'Watchful', 2], ['Wane', 'Decline', 3],
  ['Astute', 'Shrewd', 3], ['Brevity', 'Shortness', 2], ['Clandestine', 'Secret', 3], ['Dexterous', 'Nimble-handed', 3], ['Exacerbate', 'Worsen', 3], ['Fallacy', 'False belief', 3], ['Garrulous', 'Talkative', 3], ['Harbinger', 'Forerunner', 3], ['Inept', 'Clumsy', 2], ['Jeopardy', 'Danger', 2],
  ['Abate', 'Subside', 3], ['Accord', 'Agreement', 2], ['Acute', 'Sharp', 2], ['Admonish', 'Warn', 3], ['Affluent', 'Wealthy', 2], ['Agile', 'Nimble', 2], ['Aid', 'Help', 1], ['Amiable', 'Friendly', 2], ['Ample', 'Enough', 2], ['Apparent', 'Clear', 1],
  ['Arid', 'Dry', 2], ['Audacious', 'Bold', 3], ['Authentic', 'Genuine', 2], ['Begin', 'Start', 1], ['Bizarre', 'Strange', 2], ['Blunder', 'Mistake', 2], ['Bold', 'Daring', 1], ['Calm', 'Peaceful', 1], ['Cease', 'Stop', 2], ['Chaos', 'Disorder', 2],
  ['Cherish', 'Treasure', 2], ['Clever', 'Smart', 1], ['Concur', 'Agree', 3], ['Convey', 'Communicate', 2], ['Crucial', 'Vital', 2], ['Curb', 'Restrain', 2], ['Defer', 'Postpone', 3], ['Delight', 'Joy', 1], ['Depict', 'Portray', 2], ['Diminish', 'Reduce', 2],
  ['Dismal', 'Gloomy', 2], ['Durable', 'Long-lasting', 2], ['Elated', 'Overjoyed', 2], ['Elude', 'Escape', 3], ['Emulate', 'Imitate', 3], ['Enhance', 'Improve', 2], ['Enigma', 'Mystery', 2], ['Exquisite', 'Beautiful', 2], ['Fabricate', 'Invent', 3], ['Frail', 'Weak', 1],
  ['Gratitude', 'Thankfulness', 2], ['Hasten', 'Hurry', 2], ['Hilarious', 'Very funny', 1], ['Immense', 'Vast', 2], ['Impartial', 'Fair', 2], ['Inevitable', 'Unavoidable', 2], ['Insolent', 'Rude', 3], ['Keen', 'Eager', 1], ['Lucky', 'Fortunate', 1], ['Mimic', 'Copy', 1],
  ['Notion', 'Idea', 2], ['Opulent', 'Lavish', 3], ['Pensive', 'Thoughtful', 3], ['Petty', 'Trivial', 2], ['Quaint', 'Charming', 3], ['Ravenous', 'Very hungry', 3], ['Remedy', 'Cure', 1], ['Robust', 'Strong', 2], ['Scrutinize', 'Examine', 3], ['Sincere', 'Honest', 1],
  ['Spontaneous', 'Unplanned', 2], ['Steadfast', 'Loyal', 3], ['Swift', 'Fast', 1], ['Tedious', 'Boring', 2], ['Thrifty', 'Economical', 2], ['Turmoil', 'Confusion', 3], ['Valiant', 'Brave', 2], ['Verify', 'Confirm', 2], ['Wary', 'Careful', 2], ['Yearn', 'Long for', 3],
];
// [word, antonym, level]
const ANT = [
  ['Ancient', 'Modern', 1], ['Brave', 'Cowardly', 1], ['Generous', 'Stingy', 1], ['Victory', 'Defeat', 1], ['Expand', 'Shrink', 1], ['Permanent', 'Temporary', 1], ['Accept', 'Reject', 1], ['Transparent', 'Opaque', 2], ['Artificial', 'Natural', 1], ['Optimist', 'Pessimist', 1],
  ['Arrival', 'Departure', 1], ['Humble', 'Proud', 1], ['Scarce', 'Plentiful', 2], ['Innocent', 'Guilty', 1], ['Maximum', 'Minimum', 1], ['Include', 'Exclude', 1], ['Barren', 'Fertile', 2], ['Complex', 'Simple', 1], ['Deep', 'Shallow', 1], ['Frequent', 'Rare', 1],
  ['Import', 'Export', 1], ['Junior', 'Senior', 1], ['Knowledge', 'Ignorance', 1], ['Loyal', 'Treacherous', 2], ['Polite', 'Rude', 1], ['Superior', 'Inferior', 1], ['Wisdom', 'Folly', 2], ['Borrow', 'Lend', 1], ['Float', 'Sink', 1], ['Rigid', 'Flexible', 1],
  ['Abundant', 'Meagre', 2], ['Benevolent', 'Malicious', 2], ['Candid', 'Evasive', 3], ['Diligent', 'Lazy', 1], ['Eloquent', 'Inarticulate', 3], ['Frugal', 'Extravagant', 2], ['Hostile', 'Friendly', 1], ['Lucid', 'Confusing', 2], ['Meticulous', 'Careless', 2], ['Novice', 'Expert', 1],
  ['Obscure', 'Famous', 2], ['Prosperity', 'Poverty', 2], ['Reluctant', 'Willing', 2], ['Tranquil', 'Turbulent', 3], ['Verbose', 'Concise', 3], ['Zenith', 'Nadir', 3], ['Amplify', 'Reduce', 2], ['Augment', 'Diminish', 3], ['Cautious', 'Reckless', 2], ['Conceal', 'Reveal', 1],
  ['Dwindle', 'Grow', 2], ['Ephemeral', 'Eternal', 3], ['Feasible', 'Impossible', 2], ['Gregarious', 'Solitary', 3], ['Hasty', 'Deliberate', 2], ['Lenient', 'Strict', 2], ['Mundane', 'Extraordinary', 3], ['Prudent', 'Foolish', 2], ['Rational', 'Irrational', 1], ['Spurious', 'Genuine', 3],
  ['Vague', 'Definite', 2], ['Wane', 'Wax', 3], ['Adversity', 'Fortune', 3], ['Belligerent', 'Peaceful', 3], ['Credible', 'Unbelievable', 2], ['Docile', 'Unruly', 3], ['Exhaustive', 'Partial', 3], ['Fragile', 'Sturdy', 1], ['Impartial', 'Biased', 2], ['Jovial', 'Morose', 3],
  ['Absent', 'Present', 1], ['Admire', 'Despise', 2], ['Advance', 'Retreat', 2], ['Agree', 'Disagree', 1], ['Allow', 'Forbid', 2], ['Bitter', 'Sweet', 1], ['Bold', 'Timid', 2], ['Calm', 'Agitated', 2], ['Cheap', 'Expensive', 1], ['Construct', 'Demolish', 2],
  ['Courage', 'Cowardice', 2], ['Dawn', 'Dusk', 1], ['Decline', 'Accept', 2], ['Dense', 'Sparse', 2], ['Destroy', 'Create', 1], ['Encourage', 'Discourage', 1], ['Entrance', 'Exit', 1], ['Expand', 'Contract', 2], ['Fact', 'Fiction', 1], ['Fertile', 'Barren', 2],
  ['Gather', 'Scatter', 2], ['Gentle', 'Harsh', 1], ['Hero', 'Villain', 1], ['Hope', 'Despair', 2], ['Hostile', 'Amicable', 3], ['Inhale', 'Exhale', 1], ['Lavish', 'Meagre', 3], ['Liberty', 'Captivity', 2], ['Mature', 'Childish', 2], ['Modest', 'Arrogant', 2],
  ['Narrow', 'Wide', 1], ['Obedient', 'Defiant', 2], ['Patient', 'Restless', 2], ['Praise', 'Criticise', 2], ['Prohibit', 'Permit', 2], ['Reward', 'Punishment', 1], ['Shallow', 'Profound', 3], ['Strengthen', 'Weaken', 1], ['Thrifty', 'Wasteful', 2], ['Vertical', 'Horizontal', 1],
  ['Vivid', 'Dull', 2], ['Zeal', 'Apathy', 3], ['Conceal', 'Disclose', 3], ['Candid', 'Secretive', 3], ['Tranquil', 'Chaotic', 3],
];
// [word, meaning, level]
const VOCAB = [
  ['Procrastinate', 'Delay doing something', 1], ['Insomnia', 'Inability to sleep', 1], ['Bibliophile', 'Lover of books', 2], ['Altruism', 'Selfless concern for others', 2], ['Ambivalent', 'Having mixed feelings', 2], ['Cacophony', 'A harsh mix of sounds', 2], ['Epiphany', 'A sudden realisation', 2], ['Hypocrite', 'One who says one thing and does another', 1],
  ['Nostalgia', 'Sentimental longing for the past', 1], ['Pseudonym', 'A false name used by a writer', 2], ['Quarantine', 'Isolation to prevent spread of disease', 1], ['Euphemism', 'A mild word for a harsh one', 2], ['Plagiarism', 'Copying someone\'s work as your own', 1], ['Anonymous', 'Of unknown name', 1], ['Omnivore', 'Eats both plants and meat', 1], ['Philanthropist', 'One who donates to good causes', 2],
  ['Sycophant', 'A flatterer seeking favour', 3], ['Ubiquitous', 'Found everywhere', 2], ['Esoteric', 'Understood by only a few', 3], ['Paradox', 'A statement that seems self-contradictory', 2], ['Pragmatic', 'Dealing with things practically', 2], ['Serendipity', 'A happy accident', 2], ['Juxtapose', 'Place side by side to compare', 3], ['Meticulous', 'Very careful about detail', 2],
  ['Verbose', 'Using more words than needed', 2], ['Benevolent', 'Well-meaning and kind', 2], ['Candour', 'Open honesty', 3], ['Ostracise', 'Exclude from a group', 3], ['Gregarious', 'Fond of company', 2], ['Lethargic', 'Sluggish and drowsy', 2], ['Resilient', 'Able to recover quickly', 1], ['Obsolete', 'No longer in use', 1],
  ['Impeccable', 'Without any fault', 2], ['Arduous', 'Requiring great effort', 2], ['Cryptic', 'Mysterious in meaning', 2], ['Dormant', 'Temporarily inactive', 2], ['Fickle', 'Changing often', 2], ['Inevitable', 'Certain to happen', 1], ['Mundane', 'Dull and ordinary', 2], ['Novice', 'A beginner', 1],
  ['Placate', 'Make less angry', 3], ['Quintessential', 'The perfect example of something', 3], ['Reticent', 'Not revealing one\'s thoughts readily', 3], ['Tenacious', 'Holding firmly; persistent', 2], ['Vindictive', 'Wanting revenge', 3], ['Whimsical', 'Playfully unusual', 3], ['Zealot', 'A fanatical supporter', 3], ['Hiatus', 'A pause or break', 3],
  ['Ambiguous', 'Open to more than one meaning', 2], ['Benevolent', 'Kind and generous', 2], ['Catastrophe', 'A sudden great disaster', 1], ['Diligent', 'Hard-working and careful', 1], ['Eloquent', 'Fluent and persuasive in speaking', 2], ['Frugal', 'Careful with money', 2],
  ['Gullible', 'Easily tricked', 2], ['Hypothesis', 'A proposed explanation to be tested', 2], ['Impartial', 'Not taking sides', 2], ['Jeopardise', 'Put at risk', 3], ['Lucrative', 'Producing a lot of profit', 3], ['Mediocre', 'Only average in quality', 2],
  ['Negligent', 'Failing to take proper care', 3], ['Optimist', 'One who expects good outcomes', 1], ['Perseverance', 'Continued effort despite difficulty', 2], ['Redundant', 'No longer needed', 2], ['Scrutiny', 'Close examination', 3], ['Transient', 'Lasting only a short time', 3],
  ['Unanimous', 'Agreed by everyone', 2], ['Versatile', 'Able to do many things well', 2], ['Witty', 'Cleverly funny', 1], ['Adversary', 'An opponent', 2], ['Benign', 'Harmless', 2], ['Consensus', 'General agreement', 2],
  ['Dilemma', 'A difficult choice between options', 1], ['Empathy', "Understanding another person's feelings", 1], ['Feasible', 'Possible to do', 2], ['Inquisitive', 'Eager to learn; curious', 2], ['Meticulous', 'Showing great attention to detail', 2], ['Prudent', 'Acting with care for the future', 2],
];
// analogy pairs grouped by relation
const ANALOGY = {
  'young one': [['Dog', 'Puppy'], ['Cat', 'Kitten'], ['Cow', 'Calf'], ['Lion', 'Cub'], ['Hen', 'Chick'], ['Frog', 'Tadpole'], ['Sheep', 'Lamb'], ['Horse', 'Foal'], ['Goat', 'Kid'], ['Duck', 'Duckling']],
  'tool of worker': [['Carpenter', 'Saw'], ['Painter', 'Brush'], ['Surgeon', 'Scalpel'], ['Farmer', 'Plough'], ['Tailor', 'Needle'], ['Writer', 'Pen'], ['Barber', 'Scissors'], ['Chef', 'Knife'], ['Photographer', 'Camera'], ['Gardener', 'Rake']],
  'home of': [['Bee', 'Hive'], ['Bird', 'Nest'], ['Horse', 'Stable'], ['Spider', 'Web'], ['Lion', 'Den'], ['Pig', 'Sty'], ['Rabbit', 'Burrow'], ['Dog', 'Kennel'], ['Monk', 'Monastery'], ['Eskimo', 'Igloo']],
  'part of whole': [['Petal', 'Flower'], ['Page', 'Book'], ['Wheel', 'Car'], ['Finger', 'Hand'], ['Key', 'Keyboard'], ['Leaf', 'Tree'], ['Brick', 'Wall'], ['Chapter', 'Novel'], ['Player', 'Team'], ['Star', 'Galaxy']],
  'measured with': [['Temperature', 'Thermometer'], ['Weight', 'Scale'], ['Time', 'Clock'], ['Pressure', 'Barometer'], ['Speed', 'Speedometer'], ['Earthquake', 'Seismograph'], ['Length', 'Ruler'], ['Current', 'Ammeter']],
  'group of': [['Fish', 'School'], ['Wolves', 'Pack'], ['Cows', 'Herd'], ['Bees', 'Swarm'], ['Lions', 'Pride'], ['Ships', 'Fleet'], ['Stars', 'Constellation'], ['Singers', 'Choir'], ['Grapes', 'Bunch'], ['Birds', 'Flock']],
  'opposite': [['Hot', 'Cold'], ['Day', 'Night'], ['Rich', 'Poor'], ['Begin', 'End'], ['Victory', 'Defeat'], ['Ancient', 'Modern'], ['Expand', 'Contract'], ['Accept', 'Refuse']],
  'sound of': [['Dog', 'Bark'], ['Lion', 'Roar'], ['Snake', 'Hiss'], ['Cat', 'Meow'], ['Horse', 'Neigh'], ['Owl', 'Hoot'], ['Elephant', 'Trumpet'], ['Cow', 'Moo'], ['Duck', 'Quack'], ['Bee', 'Buzz']],
};
const COMPLETE = [
  ['Despite the heavy rain, the match was not ____.', ['cancelled', 'played', 'watched', 'started']], ['She was so ____ that she finished the 500-page novel in a day.', ['engrossed', 'bored', 'tired', 'distracted']],
  ['The manager praised Arjun for his ____ report; not a single detail was missing.', ['thorough', 'brief', 'careless', 'vague']], ['Because the instructions were ____, everyone interpreted them differently.', ['ambiguous', 'clear', 'precise', 'short']],
  ['His ____ remarks hurt everyone in the meeting.', ['tactless', 'thoughtful', 'kind', 'gentle']], ['The startup grew ____, doubling its users every month.', ['rapidly', 'slowly', 'rarely', 'barely']],
  ['After the long hike, they were completely ____.', ['exhausted', 'energetic', 'refreshed', 'restless']], ['The scientist\'s theory was later ____ by new evidence.', ['confirmed', 'ignored', 'invented', 'hidden']],
  ['The old bridge was declared ____ and closed to traffic.', ['unsafe', 'beautiful', 'popular', 'modern']], ['Meera is known for being ____: she always arrives on time.', ['punctual', 'lazy', 'forgetful', 'late']],
  ['The negotiations reached a ____, and neither side would move.', ['deadlock', 'conclusion', 'celebration', 'beginning']], ['To save money, the family decided to be more ____ with their spending.', ['frugal', 'lavish', 'careless', 'generous']],
  ['The ____ of the festival drew crowds from across the state.', ['grandeur', 'silence', 'absence', 'cost']], ['His explanation was so ____ that even a child could follow it.', ['lucid', 'confusing', 'lengthy', 'technical']],
  ['The team\'s ____ effort finally paid off with a trophy.', ['relentless', 'half-hearted', 'occasional', 'reluctant']], ['She remained ____ even when everyone around her panicked.', ['composed', 'anxious', 'hysterical', 'confused']],
  ['The evidence was ____, so the court dismissed the case.', ['insufficient', 'overwhelming', 'conclusive', 'strong']], ['Fresh fruit is ____; it spoils within days.', ['perishable', 'durable', 'permanent', 'frozen']],
  ['Neither the coach ____ the players were happy with the result.', ['nor', 'or', 'and', 'but']], ['He apologised ____ being late.', ['for', 'of', 'to', 'at']],
  ['She is good ____ solving puzzles.', ['at', 'in', 'on', 'for']], ['The train had already ____ when we reached the station.', ['left', 'leave', 'leaves', 'leaving']],
  ['If I ____ you, I would accept the offer.', ['were', 'was', 'am', 'be']], ['They have lived in Pune ____ 2018.', ['since', 'for', 'from', 'by']],
  ['This is the ____ book I have ever read.', ['best', 'better', 'good', 'well']], ['He insisted ____ paying the bill.', ['on', 'for', 'at', 'to']],
  ['By next year, she ____ her degree.', ['will have completed', 'completes', 'completed', 'has completed']], ['The committee ____ divided in its opinion.', ['were', 'was being', 'is been', 'be']],
  ['The bakery was so ____ that people queued for an hour.', ['popular', 'empty', 'quiet', 'expensive']], ['He spoke so ____ that nobody at the back could hear him.', ['softly', 'loudly', 'clearly', 'proudly']],
  ['After weeks of drought, the rain was a ____ for the farmers.', ['blessing', 'burden', 'problem', 'warning']], ['The detective found a ____ clue hidden under the carpet.', ['crucial', 'useless', 'boring', 'tiny']],
  ['Her ____ attitude made the whole team feel hopeful.', ['positive', 'gloomy', 'careless', 'lazy']], ['The movie was so ____ that half the audience fell asleep.', ['dull', 'thrilling', 'funny', 'short']],
  ['Prices have risen ____ over the last year.', ['steadily', 'never', 'rarely', 'barely']], ['The judge must remain ____ and listen to both sides.', ['neutral', 'angry', 'biased', 'absent']],
  ['We must ____ water during the summer shortage.', ['conserve', 'waste', 'spill', 'ignore']], ['He was ____ of the risks but went ahead anyway.', ['aware', 'unaware', 'proud', 'afraid']],
  ['She is senior ____ me in the office.', ['to', 'than', 'from', 'over']], ['The book is divided ____ ten chapters.', ['into', 'in', 'among', 'by']],
  ['I look forward to ____ you soon.', ['meeting', 'meet', 'met', 'have met']], ['Hardly had he arrived ____ it began to rain.', ['when', 'than', 'then', 'that']],
  ['Each of the players ____ a new jersey.', ['has', 'have', 'are having', 'were']], ['He has been ill ____ last Monday.', ['since', 'for', 'from', 'by']],
];
const SPELL = ['Accommodate', 'Achievement', 'Acquaintance', 'Apparent', 'Argument', 'Beginning', 'Believe', 'Business', 'Calendar', 'Colleague', 'Committee', 'Conscience', 'Conscious', 'Definitely', 'Discipline', 'Embarrass', 'Environment', 'Exaggerate', 'Existence', 'Familiar', 'February', 'Fluorescent', 'Government', 'Guarantee', 'Harass', 'Immediately', 'Independent', 'Knowledge', 'Liaison', 'Maintenance', 'Millennium', 'Necessary', 'Noticeable', 'Occasion', 'Occurrence', 'Parliament', 'Perseverance', 'Possession', 'Privilege', 'Pronunciation', 'Questionnaire', 'Receive', 'Recommend', 'Reference', 'Rhythm', 'Schedule', 'Separate', 'Successful', 'Surprise', 'Threshold', 'Tomorrow', 'Twelfth', 'Unnecessary', 'Vacuum', 'Weird', 'Withhold', 'Entrepreneur', 'Bureaucracy', 'Restaurant', 'Mischievous'];
const IDIOMS = [
  ['Break the ice', 'Start a conversation in an awkward situation'], ['Hit the nail on the head', 'Describe exactly what is causing a problem'], ['Once in a blue moon', 'Very rarely'], ['A piece of cake', 'Something very easy'], ['Burn the midnight oil', 'Work late into the night'],
  ['Cost an arm and a leg', 'Be very expensive'], ['Let the cat out of the bag', 'Reveal a secret'], ['Under the weather', 'Feeling slightly ill'], ['Spill the beans', 'Reveal secret information'], ['Bite off more than you can chew', 'Take on too much'],
  ['Call it a day', 'Stop working for now'], ['In hot water', 'In trouble'], ['Beat around the bush', 'Avoid the main topic'], ['Back to square one', 'Start again from the beginning'], ['The ball is in your court', 'It is your decision now'],
  ['Cry over spilt milk', 'Regret what cannot be undone'], ['Keep your chin up', 'Stay cheerful in difficulty'], ['On cloud nine', 'Extremely happy'], ['Turn a blind eye', 'Ignore something wrong deliberately'], ['A blessing in disguise', 'Something good that seemed bad at first'],
  ['Pull someone\'s leg', 'Tease someone playfully'], ['Hit the sack', 'Go to bed'], ['Add fuel to the fire', 'Make a bad situation worse'], ['Get cold feet', 'Become nervous before a big step'], ['Throw in the towel', 'Give up'],
  ['Kill two birds with one stone', 'Achieve two things with one action'], ['Under the same roof', 'Living in the same house'], ['Go the extra mile', 'Make more effort than expected'], ['A drop in the ocean', 'A very small amount compared to what is needed'],
  ['Hit the books', 'Study hard'], ['Miss the boat', 'Lose an opportunity'], ['On thin ice', 'In a risky situation'], ['Sit on the fence', 'Avoid choosing a side'], ['The last straw', 'The final problem that makes a situation unbearable'],
  ['Make ends meet', 'Earn just enough to live on'], ['Steal the show', 'Get the most attention'], ['A penny for your thoughts', 'Asking what someone is thinking'], ['Down to earth', 'Practical and humble'], ['Face the music', 'Accept the consequences'], ['Get the ball rolling', 'Start something'],
];
const ONEWORD = [
  ['A person who cannot be corrected', 'Incorrigible'], ['Fear of heights', 'Acrophobia'], ['A speech made without preparation', 'Extempore'], ['One who knows everything', 'Omniscient'], ['A life history written by oneself', 'Autobiography'],
  ['That which cannot be read', 'Illegible'], ['A person who does not believe in God', 'Atheist'], ['One who eats too much', 'Glutton'], ['Something no longer in use', 'Obsolete'], ['A place where bees are kept', 'Apiary'],
  ['A cure for all diseases', 'Panacea'], ['One who loves mankind', 'Philanthropist'], ['A word with the same meaning as another', 'Synonym'], ['Government by the people', 'Democracy'], ['A person who is new to a field', 'Novice'],
  ['That which cannot be avoided', 'Inevitable'], ['A place where dead bodies are kept', 'Mortuary'], ['Animals that eat only plants', 'Herbivores'], ['A person who speaks many languages', 'Polyglot'], ['Happening once a year', 'Annual'],
  ['Study of birds', 'Ornithology'], ['A collection of poems', 'Anthology'], ['Fear of water', 'Hydrophobia'], ['One who walks in sleep', 'Somnambulist'], ['Incapable of being seen', 'Invisible'],
  ['A person who hates women', 'Misogynist'], ['A handwriting that cannot be read', 'Illegible'], ['Medicine that kills germs', 'Antiseptic'], ['A person who leaves their country to live elsewhere', 'Emigrant'], ['A list of items for discussion at a meeting', 'Agenda'],
  ['A person who is unable to pay debts', 'Insolvent'], ['One who doubts everything', 'Sceptic'], ['A person with long experience in a field', 'Veteran'], ['One who thinks only of himself', 'Egoist'], ['That which cannot be wrong', 'Infallible'],
  ['A lack of variety; dull sameness', 'Monotony'], ['A person who always expects the worst', 'Pessimist'], ['A word opposite in meaning', 'Antonym'], ['Fear of closed spaces', 'Claustrophobia'], ['A place where birds are kept', 'Aviary'],
  ['A list of books referred to', 'Bibliography'], ['Murder of a king', 'Regicide'], ['A person who eats no meat', 'Vegetarian'], ['That which can be eaten', 'Edible'], ['A building where weapons are stored', 'Armoury'],
];
const OW_POOL = ONEWORD.map((x) => x[1]).concat(['Optimist', 'Egoist', 'Pessimist', 'Hypocrite', 'Monotony', 'Sceptic', 'Veteran', 'Fanatic', 'Infallible', 'Insolvent']);

// Para jumbles: correct order of 4 sentences
const JUMBLES = [
  ['Rohan wanted to learn to swim.', 'He signed up for lessons at the local pool.', 'At first, he was too scared to leave the shallow end.', 'By the end of the month, he could swim a full length.'],
  ['The startup began in a tiny garage.', 'Its first product was rejected by most investors.', 'The founders kept improving it based on user feedback.', 'Five years later, it was used in over forty countries.'],
  ['Water evaporates from oceans and lakes.', 'The vapour rises and cools in the atmosphere.', 'It condenses into tiny droplets that form clouds.', 'Eventually the droplets fall back to earth as rain.'],
  ['Meera noticed her plants were wilting.', 'She checked the soil and found it completely dry.', 'She began watering them every morning.', 'Within a week, the leaves were green and firm again.'],
  ['The library announced a reading challenge.', 'Members had to read ten books in two months.', 'Hundreds of people signed up in the first week.', 'Winners were honoured at a ceremony in June.'],
  ['The power went out during the storm.', 'The family lit candles in the living room.', 'Without screens, they started playing old board games.', 'It turned out to be their most fun evening in months.'],
  ['Kabir set a goal to run a half marathon.', 'He built a twelve-week training plan.', 'He increased his distance gradually each week.', 'On race day, he finished well under his target time.'],
  ['A new café opened near the college.', 'It offered free Wi-Fi and cheap coffee.', 'Students soon made it their favourite study spot.', 'The owner later opened a second branch across town.'],
  ['First, rinse the rice until the water runs clear.', 'Then soak it for about twenty minutes.', 'Next, cook it with twice its volume of water.', 'Finally, let it rest covered for five minutes before serving.'],
  ['The town had no proper waste collection.', 'Residents formed a committee to tackle the problem.', 'They introduced separate bins for wet and dry waste.', 'Within a year, the streets were noticeably cleaner.'],
  ['Ancient sailors navigated using the stars.', 'Later, the magnetic compass made navigation easier.', 'In the twentieth century, radio signals helped ships find their position.', 'Today, satellites give locations accurate to a few metres.'],
  ['Neha applied for her dream job.', 'She was called for three rounds of interviews.', 'The final round was a tricky case study.', 'A week later, she received the offer letter.'],
  ['Priya opened a small home bakery.', 'She posted photos of her cakes online.', 'Orders started coming from across the neighbourhood.', 'Soon she hired two helpers to keep up.'],
  ['The monsoon arrived early this year.', 'Rivers rose quickly in the hills.', 'Authorities warned villages near the banks.', 'Families moved to higher ground until the water fell.'],
  ['Arjun forgot his umbrella at home.', 'Halfway to the office, dark clouds gathered.', 'He ducked into a café as the rain began.', 'He ended up meeting an old friend there.'],
  ['A team of students built a simple water filter.', 'They tested it with muddy river water.', 'The filtered water came out clear.', 'Their school decided to install it in the canteen.'],
];
// Reading comprehension: [passage, [question, correct, wrong×3]...]
const RC = [
  ['Many people believe that multitasking makes them more productive. Research, however, suggests that the brain does not truly do two demanding tasks at once; it switches rapidly between them. Each switch costs a little time and attention, and over a day these costs add up. People who focus on one task at a time often finish sooner and make fewer mistakes.',
    [['What does research suggest about multitasking?', 'The brain switches between tasks rather than doing them together', 'The brain handles two hard tasks at the same time', 'Multitasking always saves time', 'Switching tasks has no cost'],
      ['What is the passage\'s main point?', 'Single-tasking is often more efficient than multitasking', 'People should never work on two projects', 'Mistakes are unavoidable at work', 'The brain is slow at simple tasks']]],
  ['Mangroves are trees that grow in salty coastal water. Their tangled roots slow down waves and trap mud, which protects the shore from erosion. They also shelter young fish and crabs, making them important for local fishing communities. Despite this, large areas of mangroves have been cleared for farms and buildings.',
    [['How do mangroves protect the coast?', 'Their roots slow waves and trap mud', 'They block rain from reaching the shore', 'They make the water less salty', 'They attract larger fish'],
      ['Why are mangroves important to fishing communities?', 'They shelter young fish and crabs', 'They provide wood for boats', 'They keep tourists away', 'They prevent storms entirely'],
      ['What threat to mangroves does the passage mention?', 'Clearing for farms and buildings', 'Rising fish populations', 'Too much rainfall', 'Coastal tourism laws']]],
  ['When Indian Railways introduced online ticket booking in the early 2000s, many doubted that people would trust the internet with payments. Within a decade, however, the majority of reserved tickets were being booked online. The change reduced queues at stations and made travel planning easier for millions.',
    [['What was the initial doubt about online booking?', 'Whether people would trust online payments', 'Whether trains would run on time', 'Whether stations would close', 'Whether ticket prices would rise'],
      ['According to the passage, one effect of online booking was', 'shorter queues at stations', 'fewer trains on popular routes', 'higher fares for reserved seats', 'the end of paper tickets']]],
  ['Sleep is not simply rest for the body. During deep sleep, the brain sorts and stores the day\'s memories, which is why students who sleep well after studying often remember more. Skipping sleep before an exam may give extra hours of revision, but it can make it harder to recall what was learned.',
    [['What happens in the brain during deep sleep?', 'Memories are sorted and stored', 'The brain stops working', 'New skills are forgotten', 'Dreams erase old memories'],
      ['What does the author imply about studying all night before an exam?', 'It may hurt recall despite extra revision time', 'It is the best strategy', 'It has no effect on memory', 'It improves deep sleep']]],
  ['A small village in Rajasthan faced severe water shortages every summer. Instead of waiting for outside help, villagers revived old stepwells and built small check dams to capture monsoon rain. Within a few years, groundwater levels rose and farmers could grow a second crop.',
    [['What did the villagers do about the water shortage?', 'Revived stepwells and built check dams', 'Moved to a nearby city', 'Waited for government tankers', 'Stopped farming completely'],
      ['What was a result of their efforts?', 'Farmers could grow a second crop', 'The monsoon became stronger', 'The village had floods every year', 'Groundwater levels fell']]],
  ['Bees do more than make honey. As they move from flower to flower, they carry pollen, which many plants need to produce fruit and seeds. Scientists estimate that a large share of the crops people eat depend at least partly on pollinators. Falling bee numbers therefore worry farmers as much as beekeepers.',
    [['Why do farmers worry about falling bee numbers?', 'Many crops depend on bees for pollination', 'Bees damage crops', 'Honey prices will fall', 'Bees compete with farm animals'],
      ['What do bees carry between flowers?', 'Pollen', 'Seeds', 'Water', 'Honey']]],
  ['Public libraries in many cities are changing. Besides lending books, they now offer free internet, study spaces and workshops on skills such as coding and resume writing. For people without a computer at home, the library has become an important link to jobs and education.',
    [['According to the passage, how are libraries changing?', 'They offer services beyond lending books', 'They are closing down', 'They only lend e-books now', 'They charge high fees'],
      ['Who benefits most from these changes, according to the passage?', 'People without a computer at home', 'Professional writers', 'Book publishers', 'Library staff']]],
];

// Error spotting patterns: parts, index of part that can carry the error, wrong version, explanation
const ERR = [
  (k) => { const n = k.pick(['students', 'players', 'engineers', 'singers', 'interns', 'managers']); const o = k.pick(['the form', 'the report', 'the task', 'the assignment']); return [[`Each of the ${n}`, 'has submitted', `${o} on time.`], 1, 'have submitted', '"Each" is singular, so the verb is "has".']; },
  (k) => { const c = k.pick(['Pune', 'Delhi', 'Kochi', 'Jaipur', 'Mumbai']); return [['One of my friends', `lives in ${c}`, 'with his family.'], 1, `live in ${c}`, '"One of…" takes a singular verb.']; },
  (k) => { const n = k.pick(NAMES); return [[`${n} is taller`, 'than any other boy', 'in the class.'], 1, 'than any boy', 'Compare with "any other", or you compare him with himself.']; },
  () => [['He is', 'an honest man', 'who never lies.'], 1, 'a honest man', '"Honest" starts with a vowel sound, so use "an".'],
  () => [['The news', 'is surprisingly good', 'this morning.'], 1, 'are surprisingly good', '"News" is uncountable and takes a singular verb.'],
  (k) => { const n = k.pick(NAMES); return [[`This secret is`, `between you and me,`, `so don't tell ${n}.`], 1, 'between you and I,', 'After a preposition use the object form "me".']; },
  (k) => { const y = k.ri(2010, 2022); return [['She has been', `working here since ${y}`, 'without a break.'], 1, `working here for ${y}`, 'Use "since" with a point in time.']; },
  () => [['Scarcely had we', 'reached the station', 'when the train left.'], 2, 'than the train left.', '"Scarcely" pairs with "when", not "than".'],
  (k) => { const d = k.pick(['coffee', 'juice', 'soda']); return [['She prefers', `tea to ${d}`, 'in the morning.'], 1, `tea than ${d}`, '"Prefer" is followed by "to", not "than".']; },
  () => [['If I had known,', 'I would have come', 'to the party.'], 1, 'I would come', 'Past unreal condition: "had known… would have come".'],
  (k) => { const n = k.pick(NAMES); return [[`Neither ${n} nor his friends`, 'were invited', 'to the wedding.'], 1, 'was invited', 'With neither…nor, the verb agrees with the nearer subject ("friends").']; },
  () => [['The furniture', 'in the new office', 'is very modern.'], 2, 'are very modern.', '"Furniture" is uncountable and singular.'],
  () => [['He did not', 'have any', 'money left.'], 1, 'have no', 'Avoid a double negative: "did not have any".'],
  (k) => { const n = k.pick(NAMES); return [[`${n} and I`, 'went to the market', 'after lunch.'], 0, `Me and ${n}`, 'The subject needs "I", not "me".']; },
  () => [['The number of tourists', 'has increased', 'this year.'], 1, 'have increased', '"The number of" is singular.'],
  () => [['Mathematics', 'is my favourite', 'subject.'], 1, 'are my favourite', 'Subject names like "Mathematics" are singular.'],
  () => [['He is one of the', 'tallest boys', 'in our class.'], 1, 'tallest boy', '"One of the" is followed by a plural noun.'],
  (k) => { const n = k.pick(['Riya', 'Sana', 'Isha', 'Meera']); return [[`${n} has`, 'lived here', 'for five years.'], 1, 'living here', 'Present perfect needs the past participle: "has lived".']; },
  () => [['The committee', 'has submitted', 'its report.'], 1, 'have submitted', 'The committee acts as one unit here, so it takes a singular verb.'],
  () => [['I have', 'fewer friends', 'than my brother.'], 1, 'less friends', 'Use "fewer" with countable nouns.'],
];


/* Meaning groups, so a "wrong" option is never secretly another right answer
   (e.g. "Cowardly" can't be a distractor for "Opposite of BOLD"). Synonym pairs are merged in automatically. */
const GROUPS = [
  ['strong', 'robust', 'sturdy', 'tough', 'resilient', 'durable', 'long-lasting'], ['weak', 'feeble', 'frail', 'fragile', 'delicate'],
  ['brave', 'bold', 'valiant', 'daring', 'courage', 'bravery', 'audacious'], ['timid', 'cowardly', 'shy', 'cowardice', 'diffident', 'unconfident'],
  ['calm', 'placid', 'tranquil', 'peaceful', 'serene', 'composed'], ['agitated', 'turbulent', 'chaotic', 'restless', 'chaos', 'disorder', 'turmoil', 'confusion'],
  ['happy', 'jovial', 'cheerful', 'joyful', 'elated', 'jubilant', 'overjoyed', 'delight', 'joy'], ['sad', 'gloomy', 'dismal', 'morose', 'despair'],
  ['rich', 'wealthy', 'affluent', 'opulent', 'lavish', 'luxurious', 'extravagant', 'showy', 'ostentatious'], ['poor', 'scarce', 'rare', 'poverty'],
  ['plentiful', 'abundant', 'ample', 'enough'], ['fast', 'quick', 'rapid', 'swift', 'hasten', 'hurry', 'hasty'], ['slow', 'deliberate'],
  ['big', 'huge', 'enormous', 'immense', 'vast', 'greatest', 'utmost'], ['clear', 'lucid', 'evident', 'obvious', 'apparent', 'transparent', 'definite'],
  ['unclear', 'vague', 'ambiguous', 'obscure', 'confusing', 'opaque', 'enigmatic', 'mysterious', 'cryptic'], ['careful', 'meticulous', 'cautious', 'wary', 'watchful', 'vigilant', 'precise', 'exact'],
  ['careless', 'reckless', 'negligent', 'rash', 'impetuous'], ['lazy', 'idle', 'inactive'], ['hard-working', 'diligent'],
  ['honest', 'genuine', 'sincere', 'truthful', 'candid', 'frank', 'real', 'authentic'], ['fake', 'spurious', 'secretive', 'evasive'],
  ['friendly', 'amiable', 'amicable', 'sociable', 'gregarious', 'kind', 'benevolent', 'generous'], ['hostile', 'unfriendly', 'belligerent', 'malevolent', 'malicious', 'spiteful', 'stingy', 'treacherous'],
  ['begin', 'start', 'commence'], ['end', 'stop', 'cease', 'terminate'], ['increase', 'expand', 'augment', 'amplify', 'grow', 'enhance', 'improve', 'wax'],
  ['decrease', 'reduce', 'diminish', 'shrink', 'dwindle', 'contract', 'wane', 'decline', 'lessen', 'mitigate', 'alleviate', 'ease', 'abate', 'subside'],
  ['hide', 'conceal'], ['reveal', 'disclose'], ['brief', 'short', 'concise', 'laconic', 'brief in speech', 'shortness', 'brevity'], ['wordy', 'verbose', 'talkative', 'garrulous'],
  ['boring', 'tedious', 'dull', 'mundane'], ['permanent', 'eternal'], ['temporary', 'ephemeral', 'transient', 'short-lived'],
  ['humble', 'modest'], ['proud', 'arrogant', 'haughty'], ['wise', 'sagacious', 'prudent', 'astute', 'shrewd', 'wisdom'], ['foolish', 'folly', 'ignorance'],
  ['stubborn', 'obstinate', 'rigid', 'stiff'], ['flexible', 'docile', 'obedient'], ['unruly', 'defiant'], ['easy', 'simple'], ['complex', 'arduous'],
  ['strict', 'harsh'], ['lenient', 'gentle'], ['help', 'assist', 'aid'], ['hinder', 'obstruct'], ['danger', 'hazard', 'jeopardy'], ['dry', 'arid', 'barren'], ['fertile'],
  ['copy', 'imitate', 'mimic', 'emulate'], ['unwilling', 'reluctant'], ['willing', 'eager', 'keen', 'zeal', 'enthusiasm', 'zealous', 'passionate', 'fervent', 'intense'],
  ['apathy'], ['sparse', 'meagre', 'scanty', 'partial'], ['agree', 'accept', 'concur', 'accord', 'agreement', 'consensus'], ['disagree', 'reject', 'refuse', 'decline', 'dissent'],
  ['allow', 'permit', 'liberty'], ['forbid', 'prohibit', 'discourage', 'captivity'], ['encourage'], ['create', 'construct', 'build'], ['destroy', 'demolish'], ['possible', 'feasible'], ['impossible'], ['lucky', 'fortunate'], ['scold', 'rebuke', 'admonish', 'warn', 'criticise'], ['praise'],
];
const GID = {}; GROUPS.forEach((g, i) => g.forEach((w) => { GID[w] = i; }));
let NEXT = GROUPS.length;
const gid = (w) => { const k = String(w).toLowerCase(); if (GID[k] == null) GID[k] = NEXT++; return GID[k]; };
// merge synonym pairs into one group
SYN.forEach(([w, a]) => { const x = gid(w), y = gid(a); if (x !== y) Object.keys(GID).forEach((k) => { if (GID[k] === y) GID[k] = x; }); });
const same = (a, b) => gid(a) === gid(b);

// rough word class from the ending, so distractors look like the answer (adjective with adjectives …)
const cls = (w) => { const x = String(w).toLowerCase().split(' ')[0]; if (/ly$/.test(x)) return 'adv'; if (/(tion|sion|ness|ment|ity|ance|ence|ship|dom|hood|ism|ure|age|ery)$/.test(x)) return 'n'; if (/(ous|ful|ive|able|ible|ent|ant|al|ic|id|less|ish|ary|ile|ed|y|ing)$/.test(x)) return 'adj'; if (/(ate|ify|ise|ize|en)$/.test(x)) return 'v'; return '?'; };
const sameCls = (list, a) => { const c = cls(a); if (c === '?') return list; const f = list.filter((x) => cls(x) === c); return f.length >= 6 ? f : list; };

export default [
  Q({ id: 'v.syn', sub: 'Synonyms', time: 10, gen(k, L) {
    const pool = SYN.filter((x) => x[2] <= L + 0 && x[2] >= Math.max(1, L - 1)); const [w, a] = k.pick(pool.length ? pool : SYN);
    return { prompt: 'Closest meaning of', emph: w.toUpperCase(), ans: a, wrong: sameCls(SYN.map((x) => x[1]).filter((x) => !same(x, a) && !same(x, w)), a), why: `${w} means ${a.toLowerCase()}`, p: [w] };
  } }),
  Q({ id: 'v.ant', sub: 'Antonyms', time: 10, gen(k, L) {
    const pool = ANT.filter((x) => x[2] <= L && x[2] >= Math.max(1, L - 1)); const [w, a] = k.pick(pool.length ? pool : ANT);
    return { prompt: 'Opposite of', emph: w.toUpperCase(), ans: a, wrong: sameCls(ANT.map((x) => x[1]).filter((x) => !same(x, a) && !same(x, w)), a), why: `${w} is the opposite of ${a.toLowerCase()}`, p: [w] };
  } }),
  Q({ id: 'v.vocab', sub: 'Vocabulary', time: 14, gen(k, L) {
    const pool = VOCAB.filter((x) => x[2] <= L && x[2] >= Math.max(1, L - 1)); const [w, m] = k.pick(pool.length ? pool : VOCAB); const rev = k.chance(0.4);
    if (rev) return { prompt: `Which word means: “${m}”?`, ans: w, wrong: VOCAB.filter((x) => x[0] !== w && !same(x[0], w) && x[1] !== m).map((x) => x[0]), why: `${w}: ${m.toLowerCase()}`, p: [w, 1] };
    return { prompt: 'What does this word mean?', emph: w.toUpperCase(), ans: m, wrong: VOCAB.filter((x) => x[0] !== w && !same(x[0], w)).map((x) => x[1]), why: `${w}: ${m.toLowerCase()}`, p: [w, 0] };
  } }),
  Q({ id: 'v.analogy', sub: 'Word Analogies', lv: [1, 3], time: 15, gen(k) {
    const rels = Object.keys(ANALOGY); const rel = k.pick(rels); const [p1, p2] = k.pickN(ANALOGY[rel], 2); if (p1[0] === p2[0] || p1[1] === p2[1]) return null;
    const others = rels.filter((r) => r !== rel).flatMap((r) => ANALOGY[r].map((x) => x[1])); const same = ANALOGY[rel].map((x) => x[1]).filter((x) => x !== p2[1] && x !== p1[1]);
    return { prompt: 'Complete the analogy', emph: `${p1[0]} : ${p1[1]} :: ${p2[0]} : ?`, emphSmall: true, ans: p2[1], opts: [p2[1], k.pick(same), ...k.pickN(others.filter((x) => x !== p2[1]), 2)], why: `relation: ${rel}`, p: [p1[0], p2[0]] };
  } }),
  Q({ id: 'v.complete', sub: 'Sentence Completion', lv: [1, 3], time: 15, gen(k) {
    const [s, opts] = k.pick(COMPLETE); return { prompt: 'Fill in the blank', emph: s, emphSmall: true, ans: opts[0], opts, why: `“${s.replace('____', opts[0])}”`, p: [s] };
  } }),
  Q({ id: 'v.error', sub: 'Error Spotting', lv: [2, 3], time: 25, gen(k) {
    const [parts, idx, wrongPart, rule] = k.pick(ERR)(k); const hasErr = k.chance(0.75); const shown = [...parts]; if (hasErr) shown[idx] = wrongPart;
    const ans = hasErr ? shown[idx] : 'No error';
    return { prompt: 'Which part has an error?', emph: shown.join(' '), emphSmall: true, ans, opts: [...shown, 'No error'], keepOrder: true, why: hasErr ? `${rule} Correct: “${parts[idx]}”` : `The sentence is correct. (${rule})`, p: [...shown] };
  } }),
  Q({ id: 'v.spell', sub: 'Spelling', lv: [1, 2], time: 10, gen(k) {
    const w = k.pick(SPELL); const muts = new Set();
    const rules = [
      (s) => s.replace(/([^aeiou])\1/i, '$1'), (s) => s.replace(/ie/, 'ei'), (s) => s.replace(/ei/, 'ie'), (s) => s.replace(/([cmrlst])(?!\1)([aeiou])/i, '$1$1$2'), (s) => s.replace(/ance$/, 'ence'), (s) => s.replace(/ence$/, 'ance'), (s) => s.replace(/ary$/, 'ery'), (s) => s.replace(/ate$/, 'ait'), (s) => s.replace(/a/, 'e'), (s) => s.replace(/e(?=[^e]*$)/, 'a'), (s) => s.replace(/ous$/, 'eous'), (s) => s.replace(/(.)(.)$/, '$2$1'),
    ];
    for (const r of k.shuffle(rules)) { const m = r(w); if (m !== w && m.toLowerCase() !== w.toLowerCase()) muts.add(m); if (muts.size >= 3) break; }
    if (muts.size < 3) return null;
    return { prompt: 'Which spelling is correct?', ans: w, opts: [w, ...[...muts].slice(0, 3)], why: (() => { const d = [...new Set((w.match(/([a-z])\1/gi) || []).map((x) => x.toLowerCase()))]; const f = []; if (d.length) f.push(`double ${d.map((x) => x[0]).join(' and double ')}`); if (/ie/.test(w)) f.push('ie'); if (/ei/.test(w)) f.push('ei'); if (/ance$/.test(w)) f.push('ends -ance'); if (/ence$/.test(w)) f.push('ends -ence'); return `Correct spelling: ${w}${f.length ? ` (${f.join(', ')})` : ''}`; })(), p: [w, ...muts] };
  } }),
  Q({ id: 'v.idiom', sub: 'Idioms', lv: [2, 3], time: 12, gen(k) {
    const [i, m] = k.pick(IDIOMS); return { prompt: 'What does this idiom mean?', emph: `“${i}”`, emphSmall: true, ans: m, wrong: IDIOMS.map((x) => x[1]).filter((x) => x !== m), why: `“${i}” means: ${m.charAt(0).toLowerCase()}${m.slice(1)}`, p: [i] };
  } }),
  Q({ id: 'v.oneword', sub: 'One-word Substitution', lv: [2, 3], time: 12, gen(k) {
    const [d, w] = k.pick(ONEWORD); return { prompt: `One word for: “${d}”`, ans: w, wrong: OW_POOL.filter((x) => x !== w && !ONEWORD.some(([d2, w2]) => w2 === x && d2 === d)), why: `${w}: ${d.toLowerCase()}`, p: [d] };
  } }),
  Q({ id: 'v.jumble', sub: 'Para Jumbles', lv: [2, 3], fast: false, deep: true, time: 60, gen(k) {
    const s = k.pick(JUMBLES); const lab = k.shuffle([0, 1, 2, 3]); // lab[j] = sentence index shown at label j
    const L = 'PQRS'; const label = (si) => L[lab.indexOf(si)];
    const order = (ord2) => ord2.map(label).join('');
    const ans = order([0, 1, 2, 3]); const wrongs = new Set(); while (wrongs.size < 3) { const o = order(k.shuffle([0, 1, 2, 3])); if (o !== ans) wrongs.add(o); }
    return { prompt: 'Arrange the sentences in the right order', passage: lab.map((si, j) => `${L[j]}. ${s[si]}`).join('\n'), ans, opts: [ans, ...wrongs], why: `${ans}: it opens with “${s[0]}”, then each sentence follows from the one before`, steps: `Find the opening sentence (it introduces the subject), then follow time words and pronouns.\nOrder: ${s.join(' ')}`, p: [s[0], ...lab] };
  } }),
  Q({ id: 'v.rc', sub: 'Reading Comprehension', lv: [2, 4], fast: false, deep: true, time: 75, gen(k) {
    const [passage, qs] = k.pick(RC); const [q, a, ...w] = k.pick(qs);
    const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'in', 'is', 'are', 'it', 'they', 'that', 'for', 'on', 'with', 'by', 'as', 'be', 'their', 'them', 'was', 'were', 'more', 'than', 'this']);
    const words = (t) => t.toLowerCase().match(/[a-z]+/g).filter((x) => !STOP.has(x)).map((x) => x.slice(0, 5));
    const aw = new Set(words(`${a} ${q}`)); const sents = passage.match(/[^.!?]+[.!?]/g) || [passage];
    const best = sents.map((t) => [words(t).filter((x) => aw.has(x)).length, t.trim()]).sort((x, y) => y[0] - x[0])[0][1];
    return { prompt: q, passage, ans: a, opts: [a, ...w], why: `The passage says: “${best}”`, steps: 'Find the sentence the question points to; the right option restates it, while the wrong ones exaggerate, twist or add ideas not in the text.', p: [q] };
  } }),
];
