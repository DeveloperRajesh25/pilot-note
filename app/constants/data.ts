export const HERO_CONTENT = {
  badge: "India's #1 CPL Study Platform",
  title: "One stop solution for CPL Pilots",
  subtitle: "DGCA RTR Practice, Study Guides, All India Mock Exams, and Pilot Aptitude Tests. Everything you need. Every subject. Every step of the way.",
};

export const FEATURES = [
  {
    id: 'f1',
    title: 'DGCA RTR',
    desc: 'Practice MCQs for all 5 CPL ground subjects. Exam-pattern questions with detailed explanations.',
    icon: 'green',
    linkText: 'Start Practicing →',
    linkUrl: '/dgca-rtr'
  },
  {
    id: 'f2',
    title: 'Guides',
    desc: 'Complete guides on becoming a pilot, exam preparation strategies, medical requirements, and more.',
    icon: 'violet',
    linkText: 'Read Guides →',
    linkUrl: '/guides'
  },
  {
    id: 'f3',
    title: 'Pariksha',
    desc: 'All India real mock examinations for CPL subjects. Compete with students nationwide — like JEE for pilots.',
    icon: 'blue',
    linkText: 'View Exams →',
    linkUrl: '/pariksha'
  },
  {
    id: 'f4',
    title: 'Pilot Aptitude',
    desc: 'Full COMPASS aptitude test — spatial reasoning, numerical ability, verbal reasoning, and instrument comprehension.',
    icon: 'orange',
    linkText: 'Take Test →',
    linkUrl: '/pilot-aptitude'
  }
];

export const STATS = [
  { id: 's1', target: 12500, suffix: '+', label: 'Student Pilots' },
  { id: 's2', target: 500, suffix: '+', label: 'Practice Questions' },
  { id: 's3', target: 50, suffix: '+', label: 'Exams Conducted' },
  { id: 's4', target: 95, suffix: '%', label: 'Success Rate' }
];

export const WHY_US = [
  {
    id: 'w1',
    title: 'DGCA Exam Pattern Questions',
    desc: 'Our MCQs are curated from actual DGCA exam patterns, previous year papers, and expert analysis to give you the most relevant practice.',
    number: '01'
  },
  {
    id: 'w2',
    title: 'All India Real Exam Experience',
    desc: 'Pariksha gives you the real exam pressure. Compete with students nationwide, get your rank, and measure your readiness.',
    number: '02'
  },
  {
    id: 'w3',
    title: 'Complete Study Guides',
    desc: 'From choosing a flying school to clearing your medical — our guides cover every step with clarity and real-world advice.',
    number: '03'
  },
  {
    id: 'w4',
    title: 'COMPASS Aptitude Assessment',
    desc: 'Prepare for airline selection with our comprehensive COMPASS-style aptitude tests covering spatial, numerical, verbal, and instrument skills.',
    number: '04'
  }
];

export const NAV_LINKS = [
  { id: 'n1', label: 'Home', url: '/' },
  { id: 'n2', label: 'DGCA RTR', url: '/dgca-rtr' },
  { id: 'n3', label: 'Guides', url: '/guides' },
  { id: 'n4', label: 'Pariksha', url: '/pariksha' },
  { id: 'n5', label: 'Pilot Aptitude', url: '/pilot-aptitude' }
];

export const FOOTER_LINKS = [
  {
    id: 'fg1',
    title: 'Study',
    links: [
      { label: 'DGCA RTR Practice', url: '/dgca-rtr' },
      { label: 'Guides', url: '/guides' },
      { label: 'Pariksha Exams', url: '/pariksha' },
      { label: 'Pilot Aptitude', url: '/pilot-aptitude' }
    ]
  },
  {
    id: 'fg2',
    title: 'Company',
    links: [
      { label: 'About Pilot Note', url: '#' },
      { label: 'Careers', url: '#' },
      { label: 'Contact Us', url: '#' },
      { label: 'Partner with Us', url: '#' }
    ]
  },
  {
    id: 'fg3',
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Use', url: '/terms' },
      { label: 'Refund Policy', url: '#' }
    ]
  }
];

export const RTR_CONFIG = {
  part1: {
    duration: 120,
    totalQuestions: 50,
    totalMarks: 100,
    passingMarks: 70
  },
  part2: {
    duration: 25,
    totalQuestions: 5,
    totalMarks: 100,
    passingMarks: 75
  }
};

export const RTR_TESTS = [
  {
    id: 'rtr_t1',
    title: 'RTR(A) Mock Test — Set 1',
    description: 'Complete RTR(A) mock exam with Part 1 (written MCQ) and Part 2 (RT practical transmission).',
    price: 299,
    status: 'active'
  },
  {
    id: 'rtr_t2',
    title: 'RTR(A) Mock Test — Set 2',
    description: 'Second set of RTR(A) mock exam. Practice with different question sets for thorough preparation.',
    price: 299,
    status: 'active'
  }
];

export const GUIDES = [
  {
    id: 'g1',
    title: 'How to Become a Commercial Pilot in India',
    category: 'Career Path',
    summary: 'Complete step-by-step guide from zero experience to your CPL, covering eligibility, training, exams, and job placement.',
    content: `<h2>Step 1: Meet the Eligibility Criteria</h2>
<p>To pursue a CPL in India, you must:</p>
<ul>
<li>Be at least 17 years old to start training (18 for CPL issuance)</li>
<li>Have passed 10+2 with Physics and Mathematics</li>
<li>Hold a valid Class 1 Medical Certificate from a DGCA-approved medical examiner</li>
<li>Be an Indian citizen or meet applicable nationality requirements</li>
</ul>
<h2>Step 2: Obtain a Student Pilot License (SPL)</h2>
<p>The SPL is your first step into actual flying. Apply through a DGCA-approved Flying Training Organization (FTO).</p>
<h2>Step 3: Complete Flying Training</h2>
<p>You need a minimum of 200 hours of flying experience.</p>`,
    readTime: '12 min read',
    difficulty: 'Beginner'
  },
  {
    id: 'g2',
    title: 'DGCA CPL Ground Exam Preparation Strategy',
    category: 'Exam Prep',
    summary: 'Proven strategies to clear all 5 CPL ground subjects in minimum attempts with focused study techniques.',
    content: `<h2>Understanding the Exam Pattern</h2><p>Each DGCA CPL ground exam consists of 100 multiple choice questions with a 2-hour time limit. The passing score is 70%.</p>`,
    readTime: '8 min read',
    difficulty: 'Intermediate'
  },
  {
    id: 'g3',
    title: 'Class 1 Medical Certificate: Complete Guide',
    category: 'Medical',
    summary: 'Everything you need to know about the Class 1 Medical examination for pilots — requirements, tests, and common disqualifiers.',
    content: `<h2>What is a Class 1 Medical?</h2><p>A Class 1 Medical Certificate is the highest category of aviation medical certification.</p>`,
    readTime: '6 min read',
    difficulty: 'Beginner'
  }
];

export const EXAMS = [
  {
    id: 'e1',
    title: 'All India Air Navigation Mock',
    subject: 'Air Navigation',
    description: 'National level mock exam for Air Navigation. Test your preparation against students from all over India.',
    date: '2026-04-15',
    time: '10:00',
    duration: 120,
    totalQuestions: 100,
    fee: 499,
    registrations: 450,
    status: 'Upcoming'
  },
  {
    id: 'e2',
    title: 'Meteorology Championship',
    subject: 'Meteorology',
    description: 'Comprehensive Meteorology exam covering all DGCA patterns and recently asked questions.',
    date: '2026-04-20',
    time: '14:00',
    duration: 120,
    totalQuestions: 100,
    fee: 499,
    registrations: 320,
    status: 'Upcoming'
  }
];

export const APTITUDE_CATEGORIES = [
  'Spatial Reasoning',
  'Numerical Ability',
  'Verbal Reasoning',
  'Instrument Comprehension'
];

export const APTITUDE_QUESTIONS = [
  { id: 'a1', category: 'Spatial Reasoning', question: 'If an aircraft is heading North and makes a 90° right turn, what is its new heading?', options: ['South', 'East', 'West', 'North-East'], correct: 1, explanation: 'A 90° right turn from North (360°) gives a heading of East (090°).' },
  { id: 'a2', category: 'Spatial Reasoning', question: 'An aircraft heading 270° makes a 180° turn. What is the new heading?', options: ['090°', '180°', '360°', '045°'], correct: 0, explanation: '270° + 180° = 450° - 360° = 090° (East).' },
  { id: 'a3', category: 'Spatial Reasoning', question: 'If you are facing East and turn left 135°, which direction do you face?', options: ['North-West', 'North-East', 'South-West', 'North'], correct: 3, explanation: 'East (090°) - 135° = 315° which is North-West.' },
  { id: 'a4', category: 'Spatial Reasoning', question: 'A cube is painted red on all faces and cut into 27 equal smaller cubes. How many small cubes have exactly 2 red faces?', options: ['8', '12', '6', '1'], correct: 1, explanation: 'Edge cubes (not corners) have exactly 2 painted faces. A 3×3×3 cube has 12 edge positions.' },
  { id: 'a5', category: 'Spatial Reasoning', question: 'Looking at an aircraft from behind, if the left wing dips, which way is the aircraft rolling?', options: ['Rolling right', 'Rolling left', 'Pitching up', 'Yawing left'], correct: 1, explanation: 'If the left wing dips when viewed from behind, the aircraft is rolling to the left.' },
  { id: 'a6', category: 'Spatial Reasoning', question: 'In a mirror, the word AMBULANCE appears as:', options: ['ECNALUBMA', 'Normal', 'Inverted', 'Laterally reversed'], correct: 3, explanation: 'Mirrors produce lateral reversal — left-right reversal of the image.' },
  { id: 'a7', category: 'Numerical Ability', question: 'An aircraft travels 450 nautical miles in 3 hours. What is its ground speed?', options: ['100 knots', '150 knots', '200 knots', '135 knots'], correct: 1, explanation: 'Ground speed = Distance ÷ Time = 450 ÷ 3 = 150 knots.' },
  { id: 'a8', category: 'Numerical Ability', question: 'If fuel consumption is 45 liters/hour and flight time is 4.5 hours, how much fuel is needed (plus 10% reserve)?', options: ['202.5 L', '222.75 L', '180 L', '250 L'], correct: 1, explanation: 'Fuel needed = 45 × 4.5 = 202.5L. With 10% reserve = 202.5 × 1.1 = 222.75L.' },
  { id: 'a9', category: 'Numerical Ability', question: 'What is 15% of 3200?', options: ['420', '480', '450', '500'], correct: 1, explanation: '15% of 3200 = 0.15 × 3200 = 480.' },
  { id: 'a10', category: 'Numerical Ability', question: 'If the temperature at sea level is 25°C and lapse rate is 2°C/1000ft, what is the temperature at 10,000ft?', options: ['5°C', '15°C', '10°C', '0°C'], correct: 0, explanation: 'Temperature drop = 2 × 10 = 20°C. Temperature at 10,000ft = 25 - 20 = 5°C.' },
  { id: 'a11', category: 'Numerical Ability', question: 'A flight departs at 0830 UTC and arrives at 1215 UTC. What is the flight time?', options: ['3h 45min', '4h 15min', '3h 15min', '4h 45min'], correct: 0, explanation: 'From 0830 to 1215: 12:15 - 08:30 = 3 hours 45 minutes.' },
  { id: 'a12', category: 'Numerical Ability', question: 'If 1 nautical mile = 1.852 km, how many km is 250 NM?', options: ['450 km', '463 km', '475 km', '500 km'], correct: 1, explanation: '250 × 1.852 = 463 km.' },
  { id: 'a13', category: 'Verbal Reasoning', question: 'Choose the correct word: The pilot _____ clearance before takeoff.', options: ['obtained', 'abstained', 'detained', 'retained'], correct: 0, explanation: 'Obtained means to get or acquire — the pilot obtained (got) clearance.' },
  { id: 'a14', category: 'Verbal Reasoning', question: 'ALTITUDE is to HEIGHT as VELOCITY is to:', options: ['Distance', 'Speed', 'Acceleration', 'Direction'], correct: 1, explanation: 'Altitude is a more technical term for height, just as velocity is for speed.' },
  { id: 'a15', category: 'Verbal Reasoning', question: 'Complete the analogy: Cockpit : Pilot :: Laboratory : ?', options: ['Teacher', 'Scientist', 'Doctor', 'Engineer'], correct: 1, explanation: 'A cockpit is the workspace of a pilot, just as a laboratory is the workspace of a scientist.' },
  { id: 'a16', category: 'Verbal Reasoning', question: 'Which word does NOT belong: Aileron, Rudder, Elevator, Altimeter', options: ['Aileron', 'Rudder', 'Elevator', 'Altimeter'], correct: 3, explanation: 'Altimeter is an instrument. The others are all flight control surfaces.' },
  { id: 'a17', category: 'Verbal Reasoning', question: 'What is the opposite of ASCEND?', options: ['Climb', 'Descend', 'Level', 'Cruise'], correct: 1, explanation: 'Ascend means to go up; descend means to go down.' },
  { id: 'a18', category: 'Verbal Reasoning', question: '"Mayday" is repeated how many times in a distress call?', options: ['Once', 'Twice', 'Three times', 'Five times'], correct: 2, explanation: 'The word "Mayday" is spoken three times in succession to indicate distress.' },
  { id: 'a19', category: 'Instrument Comprehension', question: 'An altimeter reading increases. The aircraft is:', options: ['Descending', 'Climbing', 'Turning', 'Decelerating'], correct: 1, explanation: 'An increasing altimeter reading indicates the aircraft is climbing.' },
  { id: 'a20', category: 'Instrument Comprehension', question: 'The attitude indicator shows the nose above the horizon and wings level. The aircraft is:', options: ['In a dive', 'In a climb', 'In a turn', 'In level flight'], correct: 1, explanation: 'Nose above the horizon line with wings level indicates a straight climb.' },
  { id: 'a21', category: 'Instrument Comprehension', question: 'The VSI (Vertical Speed Indicator) shows +500. This means:', options: ['Descending at 500 fpm', 'Climbing at 500 fpm', 'Speed is 500 knots', 'Altitude is 500 feet'], correct: 1, explanation: 'A positive VSI reading of +500 means the aircraft is climbing at 500 feet per minute.' },
  { id: 'a22', category: 'Instrument Comprehension', question: 'The heading indicator shows 180°. The aircraft is heading:', options: ['North', 'South', 'East', 'West'], correct: 1, explanation: '180° on the heading indicator corresponds to South.' },
  { id: 'a23', category: 'Instrument Comprehension', question: 'If the ASI reads 120 knots at sea level in ISA conditions, the TAS is:', options: ['Less than 120 knots', 'Exactly 120 knots', 'More than 120 knots', 'Cannot be determined'], correct: 1, explanation: 'At sea level in ISA conditions, IAS equals TAS.' },
  { id: 'a24', category: 'Instrument Comprehension', question: 'A turn coordinator shows a standard rate turn. The aircraft is turning at:', options: ['1° per second', '2° per second', '3° per second', '4° per second'], correct: 2, explanation: 'A standard rate turn is 3° per second.' },
];

export const RTR_PART1_QUESTIONS = [
  { id: 'rp1_1', testId: 'rtr_t1', question: 'The phonetic alphabet for the letter "C" is:', options: ['Charlie', 'Coca', 'Chris', 'Carol'], correct: 0, explanation: 'In ICAO phonetic alphabet, C is represented as "Charlie".' },
  { id: 'rp1_2', testId: 'rtr_t1', question: 'The distress signal "MAYDAY" should be transmitted:', options: ['Once', 'Twice', 'Three times', 'Continuously'], correct: 2, explanation: 'MAYDAY is transmitted three times consecutively to indicate a distress situation.' },
  { id: 'rp1_3', testId: 'rtr_t1', question: 'The urgency signal "PAN PAN" indicates:', options: ['Distress condition', 'Urgency condition', 'Safety message', 'Routine message'], correct: 1, explanation: 'PAN PAN indicates an urgency condition where the safety of the aircraft or person is concerned.' },
  { id: 'rp1_4', testId: 'rtr_t1', question: 'What frequency is the international distress frequency for voice communication?', options: ['118.0 MHz', '121.5 MHz', '122.0 MHz', '125.5 MHz'], correct: 1, explanation: '121.5 MHz is the international aeronautical emergency frequency.' },
  { id: 'rp1_5', testId: 'rtr_t1', question: 'The phrase "ROGER" means:', options: ['Yes, I agree', 'I have received all of your last transmission', 'Request approved', 'Stand by'], correct: 1, explanation: 'ROGER means "I have received all of your last transmission".' },
  { id: 'rp1_12', testId: 'rtr_t1', question: 'The transponder code 7700 indicates:', options: ['Hijack', 'Radio failure', 'Emergency / Distress', 'VFR flight'], correct: 2, explanation: 'Transponder code 7700 is used to indicate an emergency or distress situation.' },
  { id: 'rp1_13', testId: 'rtr_t1', question: 'The transponder code 7600 indicates:', options: ['Emergency', 'Radio communication failure', 'Hijack', 'Interception'], correct: 1, explanation: 'Transponder code 7600 indicates radio communication failure.' },
  { id: 'rp1_14', testId: 'rtr_t1', question: 'The transponder code 7500 indicates:', options: ['Emergency', 'Radio failure', 'Unlawful interference (hijack)', 'Military operation'], correct: 2, explanation: 'Transponder code 7500 indicates unlawful interference (hijacking).' },
];

export const RTR_PART2_QUESTIONSByTestId: Record<string, any[]> = {
  'rtr_t1': [
    {
      id: 'rp2_1',
      marks: 16,
      scenario: 'Startup and Taxi Clearance at Delhi Airport',
      instruction: 'You are the pilot of VT-ERB (Embraier) at Delhi Indira Gandhi International Airport, parked at General Aviation Apron. Request startup and taxi clearance for a VFR flight to Jaipur.',
      exchanges: [
        { role: 'pilot', prompt: 'Call Delhi Ground for startup clearance', expectedAnswer: 'Delhi Ground, VT-ERB, Embraier, at General Aviation Apron, request startup clearance, VFR to Jaipur, Information Alpha received.' },
        { role: 'atc', text: 'VT-ERB, Delhi Ground, startup approved, QNH 1013, Runway 29, squawk 4521, report ready for taxi.' },
        { role: 'pilot', prompt: 'Read back the startup clearance', expectedAnswer: 'Startup approved, QNH 1013, Runway 29, squawk 4521, will report ready for taxi, VT-ERB.' },
        { role: 'pilot', prompt: 'Report ready for taxi', expectedAnswer: 'Delhi Ground, VT-ERB, ready for taxi.' },
        { role: 'atc', text: 'VT-ERB, taxi to holding point Runway 29 via taxiway Alpha, Bravo, hold short of Runway 29.' },
        { role: 'pilot', prompt: 'Read back taxi clearance', expectedAnswer: 'Taxi to holding point Runway 29 via taxiway Alpha, Bravo, hold short of Runway 29, VT-ERB.' },
      ]
    },
    {
      id: 'rp2_5',
      marks: 17,
      scenario: 'Emergency — Engine Failure After Takeoff',
      instruction: 'You are the pilot of VT-ERB. After takeoff from Runway 29 at Delhi, you experience an engine failure at 800 feet AGL. Declare emergency and communicate with ATC.',
      exchanges: [
        { role: 'pilot', prompt: 'Declare emergency — engine failure after takeoff', expectedAnswer: 'MAYDAY MAYDAY MAYDAY, Delhi Tower, VT-ERB, Embraier, engine failure after takeoff from Runway 29, 800 feet, 2 persons on board, request immediate return.' },
        { role: 'atc', text: 'VT-ERB, Delhi Tower, MAYDAY acknowledged, Runway 29 cleared for immediate landing, wind 280 degrees 8 knots, emergency services alerted.' },
        { role: 'pilot', prompt: 'Acknowledge emergency clearance', expectedAnswer: 'Cleared immediate landing Runway 29, VT-ERB.' },
        { role: 'atc', text: 'VT-ERB, confirm souls on board and fuel status.' },
        { role: 'pilot', prompt: 'Respond with souls on board and fuel', expectedAnswer: '2 souls on board, fuel for approximately 3 hours, VT-ERB.' },
        { role: 'pilot', prompt: 'Report on final approach', expectedAnswer: 'Delhi Tower, VT-ERB, on final Runway 29.' },
      ]
    }
  ]
};
