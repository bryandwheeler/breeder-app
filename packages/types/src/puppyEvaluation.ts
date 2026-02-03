// Puppy Evaluation Types
// Supports Volhard PAT, Avidog APET, and Bernhard Flinks tests

// =============================================================================
// Common Types
// =============================================================================

export type EvaluationTestType = 'volhard' | 'apet' | 'flinks';

export interface PuppyEvaluationBase {
  id: string;
  puppyId: string;
  litterId: string;
  userId: string;
  testType: EvaluationTestType;
  evaluatorName: string;
  evaluationDate: string; // ISO date string
  puppyAgeWeeks: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// Volhard Puppy Aptitude Test (PAT)
// 10 tests, scored 1-6
// =============================================================================

export type VolhardScore = 1 | 2 | 3 | 4 | 5 | 6;

export type VolhardTestName =
  | 'social_attraction'
  | 'following'
  | 'restraint'
  | 'social_dominance'
  | 'elevation_dominance'
  | 'retrieving'
  | 'touch_sensitivity'
  | 'sound_sensitivity'
  | 'sight_sensitivity'
  | 'stability';

export interface VolhardTestResult {
  testName: VolhardTestName;
  score: VolhardScore;
  behaviorObserved?: string;
  notes?: string;
}

export type VolhardInterpretation =
  | 'dominant_aggressive'      // Mostly 1s
  | 'high_drive_needs_training' // Mostly 2s
  | 'high_energy_good'          // Mostly 3s
  | 'ideal_pet'                 // Mostly 4s
  | 'shy_fearful'               // Mostly 5s
  | 'independent';              // Mostly 6s

export interface VolhardEvaluation extends PuppyEvaluationBase {
  testType: 'volhard';
  results: VolhardTestResult[];
  interpretation: VolhardInterpretation;
  averageScore: number;
  scoreDistribution: Record<VolhardScore, number>;
}

// Volhard test definitions with descriptions and score meanings
export const VOLHARD_TESTS: Record<VolhardTestName, {
  name: string;
  description: string;
  purpose: string;
  procedure: string;
}> = {
  social_attraction: {
    name: 'Social Attraction',
    description: 'Degree of social attraction to people, confidence or dependence',
    purpose: 'Measures how attracted the puppy is to people',
    procedure: 'Place puppy in test area. Tester coaxes puppy to come by clapping hands gently and kneeling down.',
  },
  following: {
    name: 'Following',
    description: 'Willingness to follow a person',
    purpose: 'Measures how willing the puppy is to follow you',
    procedure: 'Stand up and walk away from the puppy in a normal manner. Make sure the puppy sees you walk away.',
  },
  restraint: {
    name: 'Restraint',
    description: 'Degree of dominant or submissive tendency, ease of handling',
    purpose: 'Measures how the puppy accepts stress when socially/physically dominated',
    procedure: 'Gently roll the puppy on its back and hold it with one hand for 30 seconds.',
  },
  social_dominance: {
    name: 'Social Dominance',
    description: 'Degree of acceptance of social dominance by a person',
    purpose: 'Measures how the puppy accepts social dominance',
    procedure: 'Crouch down and stroke the puppy from head to back while leaning over it.',
  },
  elevation_dominance: {
    name: 'Elevation Dominance',
    description: 'Degree of accepting dominance while in a position of no control',
    purpose: 'Measures how the puppy accepts dominance when it has no control',
    procedure: 'Lift the puppy under the chest with both hands, holding it just off the ground for 30 seconds.',
  },
  retrieving: {
    name: 'Retrieving',
    description: 'Willingness to do something for you',
    purpose: 'Measures willingness to work with a human. Key indicator for trainability.',
    procedure: 'Attract the puppy\'s attention with a crumpled paper ball. Throw it 4-6 feet in front of the puppy.',
  },
  touch_sensitivity: {
    name: 'Touch Sensitivity',
    description: 'Degree of sensitivity to touch',
    purpose: 'Indicates type of training equipment required',
    procedure: 'Take the puppy\'s front paw and press between finger and thumb. Count to 10, gradually increasing pressure.',
  },
  sound_sensitivity: {
    name: 'Sound Sensitivity',
    description: 'Response to loud sounds',
    purpose: 'Measures how the puppy reacts to sharp sounds',
    procedure: 'Place puppy in center of area. Assistant makes a sharp noise (metal spoon on pan) at the perimeter.',
  },
  sight_sensitivity: {
    name: 'Sight Sensitivity',
    description: 'Response to visual stimuli',
    purpose: 'Measures how the puppy reacts to moving objects',
    procedure: 'Place puppy in center of area. Tie string around a towel and jerk it across the floor 2 feet away.',
  },
  stability: {
    name: 'Stability',
    description: 'Startle response to strange objects',
    purpose: 'Measures how the puppy responds to strange objects',
    procedure: 'Place puppy in center of area. Open an umbrella about 4 feet away and set it on the ground.',
  },
};

// Score descriptions for each Volhard test
export const VOLHARD_SCORE_DESCRIPTIONS: Record<VolhardTestName, Record<VolhardScore, string>> = {
  social_attraction: {
    1: 'Came readily, tail up, jumped, bit at hands',
    2: 'Came readily, tail up, pawed, licked at hands',
    3: 'Came readily, tail up',
    4: 'Came readily, tail down',
    5: 'Came hesitantly, tail down',
    6: 'Did not come at all',
  },
  following: {
    1: 'Followed readily, tail up, got underfoot, bit at feet',
    2: 'Followed readily, tail up, got underfoot',
    3: 'Followed readily, tail up',
    4: 'Followed readily, tail down',
    5: 'Followed hesitantly, tail down',
    6: 'Did not follow or went away',
  },
  restraint: {
    1: 'Struggled fiercely, flailed, bit',
    2: 'Struggled fiercely, flailed',
    3: 'Settled, struggled, settled with some eye contact',
    4: 'Struggled, then settled',
    5: 'No struggle',
    6: 'No struggle, strained to avoid eye contact',
  },
  social_dominance: {
    1: 'Jumped, pawed, bit, growled',
    2: 'Jumped, pawed',
    3: 'Cuddled up to tester and tried to lick face',
    4: 'Squirmed, licked at hands',
    5: 'Rolled over, licked at hands',
    6: 'Went away and stayed away',
  },
  elevation_dominance: {
    1: 'Struggled fiercely, tried to bite',
    2: 'Struggled fiercely',
    3: 'Struggled, settled, struggled, settled',
    4: 'No struggle, relaxed',
    5: 'No struggle, body stiff',
    6: 'No struggle, froze',
  },
  retrieving: {
    1: 'Chased object, picked up, ran away',
    2: 'Chased object, stood over it, did not return',
    3: 'Chased object, picked up, returned to tester',
    4: 'Chased object, returned without it to tester',
    5: 'Started to chase, lost interest',
    6: 'Did not chase object',
  },
  touch_sensitivity: {
    1: 'Counted 8-10 before response',
    2: 'Counted 6-8 before response',
    3: 'Counted 5-6 before response',
    4: 'Counted 3-4 before response',
    5: 'Counted 2-3 before response',
    6: 'Counted 1-2 before response',
  },
  sound_sensitivity: {
    1: 'Listened, located sound, walked toward it barking',
    2: 'Listened, located sound, barked',
    3: 'Listened, located sound, showed curiosity and walked toward it',
    4: 'Listened, located sound',
    5: 'Cringed, backed off, hid',
    6: 'Ignored sound, showed no curiosity',
  },
  sight_sensitivity: {
    1: 'Looked, attacked and bit',
    2: 'Looked, barked, tail up',
    3: 'Looked curiously, attempted to investigate',
    4: 'Looked, barked, tail tucked',
    5: 'Ran away, hid',
    6: 'Ignored, showed no curiosity',
  },
  stability: {
    1: 'Looked, attacked and bit',
    2: 'Looked, barked, tail up',
    3: 'Looked curiously, attempted to investigate',
    4: 'Sat and looked, but did not move',
    5: 'Ran away, hid',
    6: 'Ignored, showed no curiosity',
  },
};

// Interpretation descriptions
export const VOLHARD_INTERPRETATIONS: Record<VolhardInterpretation, {
  title: string;
  description: string;
  suitableFor: string[];
  notSuitableFor: string[];
  trainingNotes: string;
}> = {
  dominant_aggressive: {
    title: 'Dominant/Aggressive',
    description: 'Strong desire to be pack leader. Has a predisposition to be aggressive to people or other dogs and may bite.',
    suitableFor: ['Experienced handler only', 'Working roles with proper training'],
    notSuitableFor: ['First-time owners', 'Families with children', 'Elderly', 'Other pets'],
    trainingNotes: 'Requires an experienced home where the dog will be trained and worked on a regular basis. Strict schedule, loads of exercise, and consistent training essential.',
  },
  high_drive_needs_training: {
    title: 'High Drive - Needs Training',
    description: 'Also has leadership aspirations. May be hard to manage and has the capacity to bite. High self-confidence.',
    suitableFor: ['Experienced owners', 'Active families', 'Sport/working homes'],
    notSuitableFor: ['Inexperienced owners', 'Homes with small children', 'Elderly'],
    trainingNotes: 'Should not be placed into an inexperienced home. Too unruly to be good with children and elderly people. Needs strict schedule, loads of exercise and lots of training.',
  },
  high_energy_good: {
    title: 'High Energy - Good with Training',
    description: 'Can be a high-energy dog and may need lots of exercise. Good with people and other animals.',
    suitableFor: ['Active families', 'Sport homes', 'Agility/obedience'],
    notSuitableFor: ['Sedentary households', 'Owners who cannot commit to training'],
    trainingNotes: 'Can be a bit of a handful to live with. Needs consistent training to channel energy appropriately.',
  },
  ideal_pet: {
    title: 'Ideal Pet',
    description: 'The kind of dog that makes the perfect pet. Rarely will buck for a promotion in the family.',
    suitableFor: ['First-time owners', 'Families with children', 'Elderly', 'Therapy work'],
    notSuitableFor: ['High-drive sport/working roles'],
    trainingNotes: 'Easy to train and rather quiet. Good with elderly people and children, although may need protection from rough children.',
  },
  shy_fearful: {
    title: 'Shy/Fearful',
    description: 'Fearful, shy and needs special handling. Will run away at the slightest stress in its life.',
    suitableFor: ['Quiet homes', 'Patient experienced owners', 'Adults only'],
    notSuitableFor: ['Active households', 'Families with children', 'Public/therapy work'],
    trainingNotes: 'Strange people, places, and surfaces may upset it. Often afraid of loud noises. May submissively urinate. Needs patience and confidence building.',
  },
  independent: {
    title: 'Independent',
    description: 'So independent that it doesn\'t need you or other people. Doesn\'t care if trained or not.',
    suitableFor: ['Owners who appreciate independent dogs', 'Those not seeking close bonding'],
    notSuitableFor: ['Those wanting close companionship', 'Obedience competition', 'Therapy work'],
    trainingNotes: 'Unlikely to bond closely since it doesn\'t feel the need. May be difficult to motivate in training.',
  },
};

// =============================================================================
// Avidog APET (Avidog Puppy Evaluation Test)
// 23 exercises evaluating 33 traits, scored 1-10
// =============================================================================

export type APETScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type APETTraitName =
  | 'energy_level'
  | 'forgiveness'
  | 'persistence'
  | 'biddability'
  | 'play_drive'
  | 'prey_drive'
  | 'retrieve_drive'
  | 'tug_drive'
  | 'food_drive'
  | 'sight_sensitivity'
  | 'sound_sensitivity'
  | 'touch_tolerance'
  | 'restraint_tolerance'
  | 'self_confidence'
  | 'environmental_confidence'
  | 'social_attraction_human'
  | 'social_attraction_dog'
  | 'human_focus'
  | 'independence'
  | 'startle_recovery'
  | 'problem_solving'
  | 'body_awareness'
  | 'three_dimensionality'
  | 'adaptability'
  | 'frustration_tolerance'
  | 'resource_guarding'
  | 'handler_softness'
  | 'handler_hardness'
  | 'novelty_seeking'
  | 'engagement'
  | 'calmness'
  | 'arousal_regulation'
  | 'cooperation';

export type APETExerciseName =
  | 'novel_environment'
  | 'tester_approach'
  | 'social_attraction'
  | 'following'
  | 'restraint'
  | 'elevation'
  | 'tug_game'
  | 'retrieve_test'
  | 'food_motivation'
  | 'touch_examination'
  | 'auditory_startle'
  | 'visual_startle'
  | 'novel_object'
  | 'unstable_surface'
  | 'tunnel_climb'
  | 'problem_solving_box'
  | 'barrier_test'
  | 'isolation_test'
  | 'recovery_observation'
  | 'play_style'
  | 'toy_possession'
  | 'handler_engagement'
  | 'breeder_recall';

export interface APETExerciseResult {
  exerciseName: APETExerciseName;
  traitsEvaluated: APETTraitName[];
  scores: Partial<Record<APETTraitName, APETScore>>;
  observations?: string;
}

export type APETScoreCategory = 'low' | 'below_average' | 'average' | 'above_average' | 'high';

export interface APETTraitProfile {
  trait: APETTraitName;
  score: APETScore;
  category: APETScoreCategory;
  isStableTrait: boolean; // Stable traits don't change much; tweakable traits can be influenced by training
  trainingRecommendations: string[];
  homeMatchNotes: string;
}

export interface APETEvaluation extends PuppyEvaluationBase {
  testType: 'apet';
  exerciseResults: APETExerciseResult[];
  traitProfile: APETTraitProfile[];
  overallSummary: string;
  idealHomeDescription: string;
  trainingPriorityAreas: string[];
}

// APET trait definitions
export const APET_TRAITS: Record<APETTraitName, {
  name: string;
  description: string;
  isStable: boolean; // Stable traits change little; tweakable traits can be developed
  lowDescription: string;
  highDescription: string;
}> = {
  energy_level: {
    name: 'Energy Level',
    description: 'Overall activity level and need for physical/mental stimulation',
    isStable: true,
    lowDescription: 'Calm, relaxed, content with minimal exercise',
    highDescription: 'Very active, needs lots of exercise and stimulation',
  },
  forgiveness: {
    name: 'Forgiveness',
    description: 'How quickly puppy bounces back from corrections or negative experiences',
    isStable: true,
    lowDescription: 'Sensitive, takes corrections to heart, remembers negative experiences',
    highDescription: 'Resilient, quickly moves past corrections, doesn\'t hold grudges',
  },
  persistence: {
    name: 'Persistence',
    description: 'Determination to complete a task despite obstacles',
    isStable: true,
    lowDescription: 'Gives up easily when frustrated',
    highDescription: 'Keeps trying despite difficulties, determined',
  },
  biddability: {
    name: 'Biddability',
    description: 'Desire to work with and please the handler',
    isStable: false,
    lowDescription: 'Works for self, less interested in pleasing',
    highDescription: 'Eager to please, works readily for approval',
  },
  play_drive: {
    name: 'Play Drive',
    description: 'Interest in and enthusiasm for play activities',
    isStable: false,
    lowDescription: 'Less interested in play, prefers calm activities',
    highDescription: 'Loves to play, easily engaged with toys and games',
  },
  prey_drive: {
    name: 'Prey Drive',
    description: 'Instinct to chase moving objects',
    isStable: true,
    lowDescription: 'Little interest in chasing things',
    highDescription: 'Strong chase instinct, highly motivated by movement',
  },
  retrieve_drive: {
    name: 'Retrieve Drive',
    description: 'Desire to fetch and return objects',
    isStable: false,
    lowDescription: 'Little interest in retrieving',
    highDescription: 'Natural retriever, loves to fetch and return',
  },
  tug_drive: {
    name: 'Tug Drive',
    description: 'Interest in tug-of-war games',
    isStable: false,
    lowDescription: 'Little interest in tugging',
    highDescription: 'Loves to tug, strong grip and engagement',
  },
  food_drive: {
    name: 'Food Drive',
    description: 'Motivation by food rewards',
    isStable: false,
    lowDescription: 'Not very food motivated',
    highDescription: 'Highly food motivated, will work hard for treats',
  },
  sight_sensitivity: {
    name: 'Sight Sensitivity',
    description: 'Reaction to visual stimuli and movement',
    isStable: false,
    lowDescription: 'Not bothered by visual surprises',
    highDescription: 'Very reactive to visual stimuli, easily startled by movement',
  },
  sound_sensitivity: {
    name: 'Sound Sensitivity',
    description: 'Reaction to auditory stimuli',
    isStable: false,
    lowDescription: 'Not bothered by loud or sudden sounds',
    highDescription: 'Very reactive to sounds, easily startled',
  },
  touch_tolerance: {
    name: 'Touch Tolerance',
    description: 'Acceptance of being handled and touched',
    isStable: false,
    lowDescription: 'Uncomfortable with handling',
    highDescription: 'Enjoys being touched, relaxed during handling',
  },
  restraint_tolerance: {
    name: 'Restraint Tolerance',
    description: 'Acceptance of being restrained or confined',
    isStable: false,
    lowDescription: 'Struggles against restraint',
    highDescription: 'Accepts restraint calmly',
  },
  self_confidence: {
    name: 'Self-Confidence',
    description: 'Overall confidence in self and abilities',
    isStable: true,
    lowDescription: 'Uncertain, needs reassurance',
    highDescription: 'Very confident, takes on challenges readily',
  },
  environmental_confidence: {
    name: 'Environmental Confidence',
    description: 'Comfort exploring new environments',
    isStable: false,
    lowDescription: 'Cautious in new places',
    highDescription: 'Explores new environments confidently',
  },
  social_attraction_human: {
    name: 'Human Social Attraction',
    description: 'Desire to be near and interact with people',
    isStable: true,
    lowDescription: 'Independent, doesn\'t seek human contact',
    highDescription: 'Loves people, seeks interaction constantly',
  },
  social_attraction_dog: {
    name: 'Dog Social Attraction',
    description: 'Desire to be near and interact with other dogs',
    isStable: true,
    lowDescription: 'Prefers humans to dogs',
    highDescription: 'Very drawn to other dogs',
  },
  human_focus: {
    name: 'Human Focus',
    description: 'Ability to focus on handler despite distractions',
    isStable: false,
    lowDescription: 'Easily distracted from handler',
    highDescription: 'Maintains focus on handler even with distractions',
  },
  independence: {
    name: 'Independence',
    description: 'Ability to function without handler direction',
    isStable: true,
    lowDescription: 'Depends on handler for direction',
    highDescription: 'Works independently, makes own decisions',
  },
  startle_recovery: {
    name: 'Startle Recovery',
    description: 'Speed of recovery after being startled',
    isStable: false,
    lowDescription: 'Slow to recover from startle',
    highDescription: 'Quickly recovers and investigates',
  },
  problem_solving: {
    name: 'Problem Solving',
    description: 'Ability to figure out solutions to challenges',
    isStable: true,
    lowDescription: 'Gives up or waits for help',
    highDescription: 'Actively works to solve problems',
  },
  body_awareness: {
    name: 'Body Awareness',
    description: 'Awareness of own body in space',
    isStable: true,
    lowDescription: 'Clumsy, unaware of body position',
    highDescription: 'Coordinated, good spatial awareness',
  },
  three_dimensionality: {
    name: 'Three-Dimensionality',
    description: 'Comfort with height and climbing',
    isStable: false,
    lowDescription: 'Prefers ground level',
    highDescription: 'Comfortable climbing and at height',
  },
  adaptability: {
    name: 'Adaptability',
    description: 'Ability to adjust to new situations',
    isStable: false,
    lowDescription: 'Struggles with change',
    highDescription: 'Quickly adapts to new situations',
  },
  frustration_tolerance: {
    name: 'Frustration Tolerance',
    description: 'Ability to handle frustration without giving up or melting down',
    isStable: true,
    lowDescription: 'Low tolerance, gives up or acts out when frustrated',
    highDescription: 'Handles frustration well, persists calmly',
  },
  resource_guarding: {
    name: 'Resource Guarding Tendency',
    description: 'Tendency to guard food, toys, or other resources',
    isStable: false,
    lowDescription: 'Shares readily, no guarding behavior',
    highDescription: 'Shows guarding behaviors, needs management',
  },
  handler_softness: {
    name: 'Handler Softness',
    description: 'Sensitivity to handler corrections/pressure',
    isStable: true,
    lowDescription: 'Not affected by soft corrections',
    highDescription: 'Very responsive to gentle corrections',
  },
  handler_hardness: {
    name: 'Handler Hardness',
    description: 'Resilience to firm handling',
    isStable: true,
    lowDescription: 'Shuts down with firm handling',
    highDescription: 'Handles firm corrections without shutting down',
  },
  novelty_seeking: {
    name: 'Novelty Seeking',
    description: 'Interest in investigating new things',
    isStable: true,
    lowDescription: 'Prefers familiar things',
    highDescription: 'Always investigating something new',
  },
  engagement: {
    name: 'Engagement',
    description: 'Willingness to interact and work with tester',
    isStable: false,
    lowDescription: 'Difficult to engage, prefers own activities',
    highDescription: 'Readily engages, wants to interact',
  },
  calmness: {
    name: 'Calmness',
    description: 'Ability to settle and remain calm',
    isStable: true,
    lowDescription: 'Difficulty settling, always on the go',
    highDescription: 'Settles easily, can relax',
  },
  arousal_regulation: {
    name: 'Arousal Regulation',
    description: 'Ability to manage excitement levels',
    isStable: false,
    lowDescription: 'Gets over-excited easily, hard to calm down',
    highDescription: 'Manages arousal well, can wind up and down',
  },
  cooperation: {
    name: 'Cooperation',
    description: 'Willingness to cooperate with handling and requests',
    isStable: false,
    lowDescription: 'Resists cooperation',
    highDescription: 'Cooperates readily',
  },
};

// APET score category ranges
export const APET_SCORE_CATEGORIES: Record<APETScoreCategory, { min: number; max: number; label: string }> = {
  low: { min: 1, max: 2, label: 'Low' },
  below_average: { min: 3, max: 4, label: 'Below Average' },
  average: { min: 5, max: 6, label: 'Average' },
  above_average: { min: 7, max: 8, label: 'Above Average' },
  high: { min: 9, max: 10, label: 'High' },
};

// APET exercise definitions
export const APET_EXERCISES: Record<APETExerciseName, {
  name: string;
  description: string;
  procedure: string;
  traitsEvaluated: APETTraitName[];
}> = {
  novel_environment: {
    name: 'Novel Environment',
    description: 'Observe puppy\'s reaction to being placed in unfamiliar testing area',
    procedure: 'Place puppy in testing area and observe for 30 seconds without interaction',
    traitsEvaluated: ['environmental_confidence', 'novelty_seeking', 'self_confidence', 'energy_level'],
  },
  tester_approach: {
    name: 'Tester Approach',
    description: 'Observe puppy\'s reaction as tester approaches',
    procedure: 'Tester slowly approaches puppy, kneels down, and offers hand',
    traitsEvaluated: ['social_attraction_human', 'self_confidence'],
  },
  social_attraction: {
    name: 'Social Attraction',
    description: 'Call puppy to come',
    procedure: 'Tester moves away and calls puppy with encouraging voice and gestures',
    traitsEvaluated: ['social_attraction_human', 'biddability', 'engagement'],
  },
  following: {
    name: 'Following',
    description: 'Walk away and observe if puppy follows',
    procedure: 'Tester stands and walks away at normal pace without calling',
    traitsEvaluated: ['social_attraction_human', 'biddability', 'independence'],
  },
  restraint: {
    name: 'Restraint',
    description: 'Gently restrain puppy on its back',
    procedure: 'Roll puppy onto back and hold gently for 30 seconds',
    traitsEvaluated: ['restraint_tolerance', 'handler_softness', 'cooperation'],
  },
  elevation: {
    name: 'Elevation',
    description: 'Lift puppy off ground',
    procedure: 'Lift puppy under chest and hold elevated for 30 seconds',
    traitsEvaluated: ['restraint_tolerance', 'self_confidence', 'handler_softness'],
  },
  tug_game: {
    name: 'Tug Game',
    description: 'Offer tug toy and play',
    procedure: 'Present tug toy, encourage grip, play tug for 30 seconds',
    traitsEvaluated: ['tug_drive', 'play_drive', 'engagement', 'persistence'],
  },
  retrieve_test: {
    name: 'Retrieve Test',
    description: 'Throw object for puppy to retrieve',
    procedure: 'Throw crumpled paper or small toy, encourage return, repeat 3 times',
    traitsEvaluated: ['retrieve_drive', 'prey_drive', 'biddability', 'cooperation'],
  },
  food_motivation: {
    name: 'Food Motivation',
    description: 'Test food drive with treats',
    procedure: 'Offer treats, observe interest and willingness to work for food',
    traitsEvaluated: ['food_drive'],
  },
  touch_examination: {
    name: 'Touch Examination',
    description: 'Handle puppy\'s body, ears, paws, mouth',
    procedure: 'Systematically examine entire body as vet would',
    traitsEvaluated: ['touch_tolerance', 'cooperation', 'handler_softness'],
  },
  auditory_startle: {
    name: 'Auditory Startle',
    description: 'Make sudden loud sound',
    procedure: 'Drop metal pan or clap loudly near puppy, observe reaction and recovery',
    traitsEvaluated: ['sound_sensitivity', 'startle_recovery', 'self_confidence'],
  },
  visual_startle: {
    name: 'Visual Startle',
    description: 'Present sudden visual stimulus',
    procedure: 'Open umbrella or shake tarp near puppy',
    traitsEvaluated: ['sight_sensitivity', 'startle_recovery', 'self_confidence'],
  },
  novel_object: {
    name: 'Novel Object',
    description: 'Present unfamiliar object',
    procedure: 'Place novel object (robot toy, balloon) in area, observe approach',
    traitsEvaluated: ['novelty_seeking', 'environmental_confidence', 'self_confidence'],
  },
  unstable_surface: {
    name: 'Unstable Surface',
    description: 'Place puppy on wobbly surface',
    procedure: 'Encourage puppy onto wobble board or unstable platform',
    traitsEvaluated: ['body_awareness', 'self_confidence', 'adaptability'],
  },
  tunnel_climb: {
    name: 'Tunnel/Climb',
    description: 'Encourage through tunnel or over obstacle',
    procedure: 'Lure puppy through tunnel and over small climb',
    traitsEvaluated: ['three_dimensionality', 'body_awareness', 'environmental_confidence'],
  },
  problem_solving_box: {
    name: 'Problem Solving Box',
    description: 'Hide treat in puzzle',
    procedure: 'Place treat under cup or in simple puzzle, observe attempts',
    traitsEvaluated: ['problem_solving', 'persistence', 'frustration_tolerance', 'food_drive'],
  },
  barrier_test: {
    name: 'Barrier Test',
    description: 'Place barrier between puppy and reward',
    procedure: 'Place treat behind barrier with opening to one side',
    traitsEvaluated: ['problem_solving', 'persistence', 'frustration_tolerance'],
  },
  isolation_test: {
    name: 'Isolation Test',
    description: 'Leave puppy alone briefly',
    procedure: 'Tester leaves area for 30 seconds, observe puppy behavior',
    traitsEvaluated: ['independence', 'calmness', 'social_attraction_human'],
  },
  recovery_observation: {
    name: 'Recovery Observation',
    description: 'Observe recovery from testing stress',
    procedure: 'After all tests, observe how quickly puppy returns to baseline',
    traitsEvaluated: ['forgiveness', 'arousal_regulation', 'calmness'],
  },
  play_style: {
    name: 'Play Style',
    description: 'Observe play preferences',
    procedure: 'Offer various toys and observe play style and intensity',
    traitsEvaluated: ['play_drive', 'energy_level', 'prey_drive'],
  },
  toy_possession: {
    name: 'Toy Possession',
    description: 'Observe reaction when toy is taken',
    procedure: 'Trade toy for treat, observe willingness to give up resources',
    traitsEvaluated: ['resource_guarding', 'cooperation', 'handler_softness'],
  },
  handler_engagement: {
    name: 'Handler Engagement',
    description: 'Overall engagement throughout testing',
    procedure: 'Score based on cumulative observations during all exercises',
    traitsEvaluated: ['engagement', 'human_focus', 'biddability'],
  },
  breeder_recall: {
    name: 'Breeder Recall',
    description: 'Have breeder call puppy at end',
    procedure: 'Breeder calls puppy from distance, observe response',
    traitsEvaluated: ['social_attraction_human', 'biddability'],
  },
};

// =============================================================================
// Bernhard Flinks Test (Police/Sport Dog Evaluation)
// 5 categories with qualitative ratings
// =============================================================================

export type FlinksRating = 'excellent' | 'good' | 'acceptable' | 'poor' | 'fail';

export type FlinksTestCategory =
  | 'environmental_exploration'
  | 'social_approach'
  | 'prey_drive'
  | 'possession'
  | 'nerve_stability';

export interface FlinksTestResult {
  category: FlinksTestCategory;
  rating: FlinksRating;
  behaviorDescriptor: string;
  score: number; // Numeric equivalent: excellent=5, good=4, acceptable=3, poor=2, fail=1
  notes?: string;
}

export type WorkingDogPotential = 'high' | 'moderate' | 'low' | 'not_suitable';
export type WorkingDiscipline = 'protection' | 'tracking' | 'detection' | 'patrol' | 'sport_schutzhund' | 'sport_ring';

export interface FlinksEvaluation extends PuppyEvaluationBase {
  testType: 'flinks';
  results: FlinksTestResult[];
  overallRating: FlinksRating;
  totalScore: number;
  workingDogPotential: WorkingDogPotential;
  recommendedDisciplines: WorkingDiscipline[];
  strengthAreas: FlinksTestCategory[];
  improvementAreas: FlinksTestCategory[];
  summary: string;
}

// Flinks rating numeric values
export const FLINKS_RATING_SCORES: Record<FlinksRating, number> = {
  excellent: 5,
  good: 4,
  acceptable: 3,
  poor: 2,
  fail: 1,
};

// Flinks test category definitions
export const FLINKS_TESTS: Record<FlinksTestCategory, {
  name: string;
  description: string;
  procedure: string;
  importance: string;
}> = {
  environmental_exploration: {
    name: 'Environmental Exploration',
    description: 'Evaluates confidence and boldness in unfamiliar environments',
    procedure: 'Place puppy in unfamiliar area with various surfaces, objects, and obstacles. Observe exploration behavior.',
    importance: 'Critical for all working disciplines. Dog must be confident in any environment.',
  },
  social_approach: {
    name: 'Social Approach',
    description: 'Evaluates reaction to strangers and social confidence',
    procedure: 'Have unfamiliar person approach puppy in neutral, then slightly threatening manner.',
    importance: 'Important for patrol and protection work. Dog must show appropriate social responses.',
  },
  prey_drive: {
    name: 'Prey Drive',
    description: 'Evaluates chase instinct and engagement with moving objects',
    procedure: 'Present various prey items (rag, ball on string, flirt pole). Observe chase, catch, and grip.',
    importance: 'Foundation of all bite work training. Essential for protection and sport work.',
  },
  possession: {
    name: 'Possession',
    description: 'Evaluates willingness to fight for and hold onto objects',
    procedure: 'After puppy catches prey item, apply mild pressure. Observe grip strength and fighting spirit.',
    importance: 'Critical for bite work. Dog must possess and fight for reward.',
  },
  nerve_stability: {
    name: 'Nerve Stability',
    description: 'Evaluates recovery from stress and startle responses',
    procedure: 'Present sudden stimuli (loud sounds, falling objects, pressure). Observe reaction and recovery.',
    importance: 'Essential for all working roles. Dog must recover quickly and not hold stress.',
  },
};

// Flinks behavior descriptors for each rating
export const FLINKS_DESCRIPTORS: Record<FlinksTestCategory, Record<FlinksRating, string>> = {
  environmental_exploration: {
    excellent: 'Explores immediately and confidently, investigates all areas without hesitation, relaxed body posture throughout',
    good: 'Explores readily after brief orientation, confident body posture, approaches most areas willingly',
    acceptable: 'Explores with some hesitation, needs encouragement for some areas, recovers from uncertainty',
    poor: 'Reluctant to explore, avoids certain areas, tense body posture, needs significant encouragement',
    fail: 'Refuses to explore, shows clear fear/avoidance, frozen or tries to escape',
  },
  social_approach: {
    excellent: 'Approaches stranger confidently, appropriate greeting behavior, shows no fear of neutral pressure',
    good: 'Approaches willingly, may show brief uncertainty with pressure but recovers quickly',
    acceptable: 'Approaches with encouragement, some uncertainty with stranger, recovers from mild pressure',
    poor: 'Hesitant to approach, shows fear or avoidance of stranger, slow recovery from pressure',
    fail: 'Refuses to approach, extreme fear/avoidance, or inappropriate aggression',
  },
  prey_drive: {
    excellent: 'Immediate chase response, strong pursuit, confident catch, full grip, high intensity maintained',
    good: 'Quick chase response, good pursuit, catches prey, maintains grip with engagement',
    acceptable: 'Chase response present, will catch and hold briefly, moderate intensity',
    poor: 'Weak chase response, loses interest quickly, half-hearted catches',
    fail: 'No chase response, no interest in prey items, or fear of movement',
  },
  possession: {
    excellent: 'Full strong grip, fights for object under pressure, will not release, strong head shaking/pulling',
    good: 'Good grip, maintains under mild pressure, some fighting spirit, engaged',
    acceptable: 'Will grip and hold briefly, releases under pressure but will re-engage',
    poor: 'Weak grip, releases easily, little fighting spirit',
    fail: 'Will not grip, or releases immediately under any pressure',
  },
  nerve_stability: {
    excellent: 'Startles appropriately, immediate recovery, approaches to investigate, no lasting effect',
    good: 'Brief startle, quick recovery, willing to approach after recovery',
    acceptable: 'Moderate startle, recovers within reasonable time, may need encouragement to approach',
    poor: 'Strong startle response, slow recovery, avoidance behavior persists',
    fail: 'Extreme panic response, does not recover, or freezes/shuts down',
  },
};

// Working dog potential thresholds
export const FLINKS_POTENTIAL_THRESHOLDS: Record<WorkingDogPotential, { minScore: number; description: string }> = {
  high: {
    minScore: 22, // 5 categories, avg 4.4+
    description: 'Excellent candidate for professional working roles. Strong foundation in all areas.',
  },
  moderate: {
    minScore: 17, // avg 3.4+
    description: 'Good potential with proper development. May excel in specific disciplines.',
  },
  low: {
    minScore: 12, // avg 2.4+
    description: 'Limited working potential. May suit certain sport venues with experienced handler.',
  },
  not_suitable: {
    minScore: 0,
    description: 'Not recommended for working or sport roles. May make good pet with appropriate home.',
  },
};

// Discipline requirements
export const FLINKS_DISCIPLINE_REQUIREMENTS: Record<WorkingDiscipline, {
  name: string;
  minRatings: Partial<Record<FlinksTestCategory, FlinksRating>>;
  description: string;
}> = {
  protection: {
    name: 'Protection Work',
    minRatings: { prey_drive: 'good', possession: 'good', nerve_stability: 'good', social_approach: 'acceptable' },
    description: 'Personal protection, executive protection, family protection',
  },
  tracking: {
    name: 'Tracking/Detection',
    minRatings: { environmental_exploration: 'good', prey_drive: 'acceptable', nerve_stability: 'acceptable' },
    description: 'Search and rescue, cadaver, article search',
  },
  detection: {
    name: 'Detection Work',
    minRatings: { environmental_exploration: 'good', prey_drive: 'good', nerve_stability: 'good' },
    description: 'Narcotics, explosives, agricultural detection',
  },
  patrol: {
    name: 'Patrol/Police K9',
    minRatings: { prey_drive: 'good', possession: 'good', nerve_stability: 'excellent', social_approach: 'good', environmental_exploration: 'good' },
    description: 'Police patrol, apprehension, building searches',
  },
  sport_schutzhund: {
    name: 'IPO/Schutzhund',
    minRatings: { prey_drive: 'good', possession: 'acceptable', nerve_stability: 'acceptable' },
    description: 'IPO/IGP sport competition',
  },
  sport_ring: {
    name: 'Ring Sport',
    minRatings: { prey_drive: 'excellent', possession: 'good', nerve_stability: 'good' },
    description: 'French Ring, Belgian Ring, Mondioring',
  },
};

// =============================================================================
// Union Type
// =============================================================================

export type PuppyEvaluation = VolhardEvaluation | APETEvaluation | FlinksEvaluation;

// Type guards
export function isVolhardEvaluation(eval_: PuppyEvaluation): eval_ is VolhardEvaluation {
  return eval_.testType === 'volhard';
}

export function isAPETEvaluation(eval_: PuppyEvaluation): eval_ is APETEvaluation {
  return eval_.testType === 'apet';
}

export function isFlinksEvaluation(eval_: PuppyEvaluation): eval_ is FlinksEvaluation {
  return eval_.testType === 'flinks';
}
