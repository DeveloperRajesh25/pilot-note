-- ============================================================
-- PILOT NOTE — SEED DATA
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- APTITUDE QUESTIONS
-- ============================================================
insert into public.aptitude_questions (id, category, question, options, correct, explanation) values
('a1','Spatial Reasoning','If an aircraft is heading North and makes a 90° right turn, what is its new heading?','["South","East","West","North-East"]',1,'A 90° right turn from North (360°) gives a heading of East (090°).'),
('a2','Spatial Reasoning','An aircraft heading 270° makes a 180° turn. What is the new heading?','["090°","180°","360°","045°"]',0,'270° + 180° = 450° - 360° = 090° (East).'),
('a3','Spatial Reasoning','If you are facing East and turn left 135°, which direction do you face?','["North-West","North-East","South-West","North"]',3,'East (090°) - 135° = 315° which is North-West.'),
('a4','Spatial Reasoning','A cube is painted red on all faces and cut into 27 equal smaller cubes. How many small cubes have exactly 2 red faces?','["8","12","6","1"]',1,'Edge cubes (not corners) have exactly 2 painted faces. A 3×3×3 cube has 12 edge positions.'),
('a5','Spatial Reasoning','Looking at an aircraft from behind, if the left wing dips, which way is the aircraft rolling?','["Rolling right","Rolling left","Pitching up","Yawing left"]',1,'If the left wing dips when viewed from behind, the aircraft is rolling to the left.'),
('a6','Spatial Reasoning','In a mirror, the word AMBULANCE appears as:','["ECNALUBMA","Normal","Inverted","Laterally reversed"]',3,'Mirrors produce lateral reversal — left-right reversal of the image.'),
('a7','Numerical Ability','An aircraft travels 450 nautical miles in 3 hours. What is its ground speed?','["100 knots","150 knots","200 knots","135 knots"]',1,'Ground speed = Distance ÷ Time = 450 ÷ 3 = 150 knots.'),
('a8','Numerical Ability','If fuel consumption is 45 liters/hour and flight time is 4.5 hours, how much fuel is needed (plus 10% reserve)?','["202.5 L","222.75 L","180 L","250 L"]',1,'Fuel needed = 45 × 4.5 = 202.5L. With 10% reserve = 202.5 × 1.1 = 222.75L.'),
('a9','Numerical Ability','What is 15% of 3200?','["420","480","450","500"]',1,'15% of 3200 = 0.15 × 3200 = 480.'),
('a10','Numerical Ability','If the temperature at sea level is 25°C and lapse rate is 2°C/1000ft, what is the temperature at 10,000ft?','["5°C","15°C","10°C","0°C"]',0,'Temperature drop = 2 × 10 = 20°C. Temperature at 10,000ft = 25 - 20 = 5°C.'),
('a11','Numerical Ability','A flight departs at 0830 UTC and arrives at 1215 UTC. What is the flight time?','["3h 45min","4h 15min","3h 15min","4h 45min"]',0,'From 0830 to 1215: 12:15 - 08:30 = 3 hours 45 minutes.'),
('a12','Numerical Ability','If 1 nautical mile = 1.852 km, how many km is 250 NM?','["450 km","463 km","475 km","500 km"]',1,'250 × 1.852 = 463 km.'),
('a13','Verbal Reasoning','Choose the correct word: The pilot _____ clearance before takeoff.','["obtained","abstained","detained","retained"]',0,'Obtained means to get or acquire — the pilot obtained (got) clearance.'),
('a14','Verbal Reasoning','ALTITUDE is to HEIGHT as VELOCITY is to:','["Distance","Speed","Acceleration","Direction"]',1,'Altitude is a more technical term for height, just as velocity is for speed.'),
('a15','Verbal Reasoning','Complete the analogy: Cockpit : Pilot :: Laboratory : ?','["Teacher","Scientist","Doctor","Engineer"]',1,'A cockpit is the workspace of a pilot, just as a laboratory is the workspace of a scientist.'),
('a16','Verbal Reasoning','Which word does NOT belong: Aileron, Rudder, Elevator, Altimeter','["Aileron","Rudder","Elevator","Altimeter"]',3,'Altimeter is an instrument. The others are all flight control surfaces.'),
('a17','Verbal Reasoning','What is the opposite of ASCEND?','["Climb","Descend","Level","Cruise"]',1,'Ascend means to go up; descend means to go down.'),
('a18','Verbal Reasoning','"Mayday" is repeated how many times in a distress call?','["Once","Twice","Three times","Five times"]',2,'The word "Mayday" is spoken three times in succession to indicate distress.'),
('a19','Instrument Comprehension','An altimeter reading increases. The aircraft is:','["Descending","Climbing","Turning","Decelerating"]',1,'An increasing altimeter reading indicates the aircraft is climbing.'),
('a20','Instrument Comprehension','The attitude indicator shows the nose above the horizon and wings level. The aircraft is:','["In a dive","In a climb","In a turn","In level flight"]',1,'Nose above the horizon line with wings level indicates a straight climb.'),
('a21','Instrument Comprehension','The VSI (Vertical Speed Indicator) shows +500. This means:','["Descending at 500 fpm","Climbing at 500 fpm","Speed is 500 knots","Altitude is 500 feet"]',1,'A positive VSI reading of +500 means the aircraft is climbing at 500 feet per minute.'),
('a22','Instrument Comprehension','The heading indicator shows 180°. The aircraft is heading:','["North","South","East","West"]',1,'180° on the heading indicator corresponds to South.'),
('a23','Instrument Comprehension','If the ASI reads 120 knots at sea level in ISA conditions, the TAS is:','["Less than 120 knots","Exactly 120 knots","More than 120 knots","Cannot be determined"]',1,'At sea level in ISA conditions, IAS equals TAS.'),
('a24','Instrument Comprehension','A turn coordinator shows a standard rate turn. The aircraft is turning at:','["1° per second","2° per second","3° per second","4° per second"]',2,'A standard rate turn is 3° per second.')
on conflict (id) do nothing;

-- ============================================================
-- RTR TESTS
-- ============================================================
insert into public.rtr_tests (id, title, description, price, status) values
('rtr_t1','RTR(A) Mock Test — Set 1','Complete RTR(A) mock exam with Part 1 (written MCQ) and Part 2 (RT practical transmission).',299,'active'),
('rtr_t2','RTR(A) Mock Test — Set 2','Second set of RTR(A) mock exam. Practice with different question sets for thorough preparation.',299,'active')
on conflict (id) do nothing;

-- ============================================================
-- RTR PART 1 QUESTIONS
-- ============================================================
insert into public.rtr_questions_part1 (id, test_id, question, options, correct, explanation) values
('rp1_1','rtr_t1','The phonetic alphabet for the letter "C" is:','["Charlie","Coca","Chris","Carol"]',0,'In ICAO phonetic alphabet, C is represented as "Charlie".'),
('rp1_2','rtr_t1','The distress signal "MAYDAY" should be transmitted:','["Once","Twice","Three times","Continuously"]',2,'MAYDAY is transmitted three times consecutively to indicate a distress situation.'),
('rp1_3','rtr_t1','The urgency signal "PAN PAN" indicates:','["Distress condition","Urgency condition","Safety message","Routine message"]',1,'PAN PAN indicates an urgency condition where the safety of the aircraft or person is concerned.'),
('rp1_4','rtr_t1','What frequency is the international distress frequency for voice communication?','["118.0 MHz","121.5 MHz","122.0 MHz","125.5 MHz"]',1,'121.5 MHz is the international aeronautical emergency frequency.'),
('rp1_5','rtr_t1','The phrase "ROGER" means:','["Yes, I agree","I have received all of your last transmission","Request approved","Stand by"]',1,'ROGER means "I have received all of your last transmission".'),
('rp1_6','rtr_t1','What does ATIS stand for?','["Automatic Terminal Information Service","Air Traffic Information System","Automated Traffic Identification System","Aeronautical Terminal Information Service"]',0,'ATIS stands for Automatic Terminal Information Service.'),
('rp1_7','rtr_t1','The word "WILCO" means:','["I understand","Will comply","Roger","Affirmative"]',1,'WILCO = Will Comply. It means the instruction is understood and will be carried out.'),
('rp1_8','rtr_t1','What is the QNH setting used for?','["Setting altimeter to field elevation","Setting altimeter to read altitude above sea level","Setting altimeter to standard pressure","Setting altimeter to read height above ground"]',1,'QNH is set so the altimeter reads altitude above mean sea level.'),
('rp1_9','rtr_t1','When should a pilot readback ATC instructions?','["Only for takeoff clearance","For all instructions involving runways and taxi routes","Only when asked by ATC","Never, it wastes radio time"]',1,'Safety-critical instructions including runway and taxi clearances must always be read back.'),
('rp1_10','rtr_t1','The phonetic for the letter "N" is:','["Nancy","November","North","Niner"]',1,'N in ICAO phonetic alphabet is November.'),
('rp1_11','rtr_t1','VHF communication range is approximately:','["Line of sight","500 NM","100 NM fixed","Unlimited with relay"]',0,'VHF communications are limited to line-of-sight range.'),
('rp1_12','rtr_t1','The transponder code 7700 indicates:','["Hijack","Radio failure","Emergency / Distress","VFR flight"]',2,'Transponder code 7700 is used to indicate an emergency or distress situation.'),
('rp1_13','rtr_t1','The transponder code 7600 indicates:','["Emergency","Radio communication failure","Hijack","Interception"]',1,'Transponder code 7600 indicates radio communication failure.'),
('rp1_14','rtr_t1','The transponder code 7500 indicates:','["Emergency","Radio failure","Unlawful interference (hijack)","Military operation"]',2,'Transponder code 7500 indicates unlawful interference (hijacking).'),
('rp1_15','rtr_t1','What is the standard phraseology when requesting takeoff clearance?','["Ready for departure","Request takeoff","[Callsign], ready for takeoff, Runway [XX]","Cleared for takeoff"]',2,'The correct readback includes callsign, ready for takeoff, and runway designation.'),
-- Set 2 questions
('rp1_s2_1','rtr_t2','The phonetic alphabet for "G" is:','["Golf","Gamma","George","Green"]',0,'G in ICAO phonetic alphabet is Golf.'),
('rp1_s2_2','rtr_t2','What does "SAY AGAIN" mean?','["Repeat your transmission","I agree","Received","Standby"]',0,'SAY AGAIN is the phraseology used to request a repetition of the previous transmission.'),
('rp1_s2_3','rtr_t2','Standard pressure setting (ISA) is:','["1023 hPa","1013.25 hPa","1000 hPa","1020 hPa"]',1,'Standard ISA pressure is 1013.25 hPa (29.92 inHg).'),
('rp1_s2_4','rtr_t2','The phrase "AFFIRM" means:','["Negative","Yes/Correct","Standby","Unable"]',1,'AFFIRM is used instead of "Yes" in aviation phraseology.'),
('rp1_s2_5','rtr_t2','The phonetic for the digit "9" is:','["Nine","Niner","Nov","Nano"]',1,'The ICAO pronunciation of 9 is NINER to avoid confusion with the German word for no.'),
('rp1_s2_6','rtr_t2','Initial contact with ATC should include:','["Station called, your callsign, aircraft type, position, request","Just your callsign","Position and request only","Aircraft type and destination"]',0,'Initial contact must include: station name, your callsign, aircraft type, position/level, and request.'),
('rp1_s2_7','rtr_t2','The frequency 121.5 MHz is used for:','["Weather updates","Distress and emergency","Departure clearance","Ground movement"]',1,'121.5 MHz is the international aeronautical emergency/distress frequency.'),
('rp1_s2_8','rtr_t2','A SIGMET broadcast covers:','["Safety-of-flight information for significant meteorological phenomena","Airport NOTAMs","Runway conditions","Traffic advisories"]',0,'SIGMET = Significant Meteorological Information — covers hazardous weather phenomena.'),
('rp1_s2_9','rtr_t2','"NEGATIVE" in phraseology means:','["I do not understand","No or permission not granted","Unable to comply","Incorrect"]',1,'NEGATIVE means No or that permission/clearance is not granted.'),
('rp1_s2_10','rtr_t2','The phrase "STANDBY" means:','["Stop transmitting","Wait, I will call you","Unable","I am busy"]',1,'STANDBY means wait — I will call you shortly.'),
('rp1_s2_11','rtr_t2','When reading back QNH, the correct format is:','["Just the numbers","QNH [numbers]","Pressure [numbers]","Setting [numbers]"]',1,'Readback format includes QNH followed by the value: e.g., QNH 1013.'),
('rp1_s2_12','rtr_t2','What is squawk ident used for?','["Identifying aircraft on radar","Emergency signal","Radio check","Position reporting"]',0,'Ident causes the transponder return to blossom on the radar screen, identifying the specific aircraft.'),
('rp1_s2_13','rtr_t2','Transponder mode C provides:','["Pressure altitude readout","Identification only","Radio communication","Navigation"]',0,'Mode C transponder provides automatic pressure altitude information to ATC radar.'),
('rp1_s2_14','rtr_t2','The phonetic for "W" is:','["William","Whiskey","Walter","West"]',1,'W in ICAO phonetic alphabet is Whiskey.'),
('rp1_s2_15','rtr_t2','A "MAYDAY MAYDAY MAYDAY" call must include:','["Name of station addressed, callsign, nature of emergency, intentions, position, other info","Just callsign and emergency","Position only","Destination airport"]',0,'MAYDAY call elements: station addressed, callsign, nature of emergency, intentions, position, level, heading, crew intentions, other useful info.')
on conflict (id) do nothing;

-- ============================================================
-- RTR PART 2 SCENARIOS
-- ============================================================
insert into public.rtr_scenarios_part2 (id, test_id, marks, scenario, instruction, exchanges) values
('rp2_1','rtr_t1',16,'Startup and Taxi Clearance at Delhi Airport',
'You are the pilot of VT-ERB (Embraier) at Delhi Indira Gandhi International Airport, parked at General Aviation Apron. Request startup and taxi clearance for a VFR flight to Jaipur.',
'[{"role":"pilot","prompt":"Call Delhi Ground for startup clearance","expectedAnswer":"Delhi Ground, VT-ERB, Embraier, at General Aviation Apron, request startup clearance, VFR to Jaipur, Information Alpha received."},{"role":"atc","text":"VT-ERB, Delhi Ground, startup approved, QNH 1013, Runway 29, squawk 4521, report ready for taxi."},{"role":"pilot","prompt":"Read back the startup clearance","expectedAnswer":"Startup approved, QNH 1013, Runway 29, squawk 4521, will report ready for taxi, VT-ERB."},{"role":"pilot","prompt":"Report ready for taxi","expectedAnswer":"Delhi Ground, VT-ERB, ready for taxi."},{"role":"atc","text":"VT-ERB, taxi to holding point Runway 29 via taxiway Alpha, Bravo, hold short of Runway 29."},{"role":"pilot","prompt":"Read back taxi clearance","expectedAnswer":"Taxi to holding point Runway 29 via taxiway Alpha, Bravo, hold short of Runway 29, VT-ERB."}]'),
('rp2_5','rtr_t1',17,'Emergency — Engine Failure After Takeoff',
'You are the pilot of VT-ERB. After takeoff from Runway 29 at Delhi, you experience an engine failure at 800 feet AGL. Declare emergency and communicate with ATC.',
'[{"role":"pilot","prompt":"Declare emergency — engine failure after takeoff","expectedAnswer":"MAYDAY MAYDAY MAYDAY, Delhi Tower, VT-ERB, Embraier, engine failure after takeoff from Runway 29, 800 feet, 2 persons on board, request immediate return."},{"role":"atc","text":"VT-ERB, Delhi Tower, MAYDAY acknowledged, Runway 29 cleared for immediate landing, wind 280 degrees 8 knots, emergency services alerted."},{"role":"pilot","prompt":"Acknowledge emergency clearance","expectedAnswer":"Cleared immediate landing Runway 29, VT-ERB."},{"role":"atc","text":"VT-ERB, confirm souls on board and fuel status."},{"role":"pilot","prompt":"Respond with souls on board and fuel","expectedAnswer":"2 souls on board, fuel for approximately 3 hours, VT-ERB."},{"role":"pilot","prompt":"Report on final approach","expectedAnswer":"Delhi Tower, VT-ERB, on final Runway 29."}]'),
('rp2_s2_1','rtr_t2',16,'Departure Clearance and Takeoff at Mumbai Airport',
'You are the pilot of VT-AKS (Cessna 172) at Mumbai Chhatrapati Shivaji Maharaj International Airport. You are at the holding point of Runway 09. Request takeoff clearance for a VFR flight to Pune.',
'[{"role":"pilot","prompt":"Request takeoff clearance from Mumbai Tower","expectedAnswer":"Mumbai Tower, VT-AKS, Cessna 172, holding point Runway 09, ready for takeoff, VFR to Pune."},{"role":"atc","text":"VT-AKS, Mumbai Tower, cleared for takeoff Runway 09, wind 085 degrees 12 knots, no delay, traffic on 5 mile final."},{"role":"pilot","prompt":"Read back takeoff clearance","expectedAnswer":"Cleared for takeoff Runway 09, VT-AKS."},{"role":"atc","text":"VT-AKS, contact Mumbai Departure 119.4, good day."},{"role":"pilot","prompt":"Acknowledge and contact departure","expectedAnswer":"Contact Mumbai Departure 119.4, good day, VT-AKS."},{"role":"pilot","prompt":"Initial call to Mumbai Departure","expectedAnswer":"Mumbai Departure, VT-AKS, Cessna 172, airborne Runway 09, climbing to 2500 feet, VFR to Pune."}]'),
('rp2_s2_2','rtr_t2',17,'Radio Failure Procedures',
'You are VT-AKS en route to Pune at 5500 feet. Your radio fails. Describe the actions and squawk code you would use.',
'[{"role":"pilot","prompt":"State the squawk code for radio failure","expectedAnswer":"Squawk 7600."},{"role":"atc","text":"[ATC cannot hear you. Simulate that you have set squawk 7600 and are proceeding as per radio failure procedures.]"},{"role":"pilot","prompt":"Describe your radio failure procedure in writing","expectedAnswer":"I set squawk 7600, continue on flight plan route, maintain last assigned altitude or MEA, look for light signals on approach, and land at intended destination."},{"role":"atc","text":"[Assume you have received a steady green light signal on final approach at Pune.]"},{"role":"pilot","prompt":"Interpret the steady green light signal while airborne","expectedAnswer":"Steady green light means cleared to land."},{"role":"pilot","prompt":"State what you do after landing with radio failure","expectedAnswer":"After landing, I vacate the runway, look for the marshaller or follow taxi light signals, and contact ATC by telephone as soon as possible."}]')
on conflict (id) do nothing;

-- ============================================================
-- GUIDES
-- ============================================================
insert into public.guides (id, title, category, summary, content, read_time, difficulty, published) values
('g1','How to Become a Commercial Pilot in India','Career Path',
'Complete step-by-step guide from zero experience to your CPL, covering eligibility, training, exams, and job placement.',
'<h2>Step 1: Meet the Eligibility Criteria</h2><p>To pursue a CPL in India, you must:</p><ul><li>Be at least 17 years old to start training (18 for CPL issuance)</li><li>Have passed 10+2 with Physics and Mathematics</li><li>Hold a valid Class 1 Medical Certificate from a DGCA-approved medical examiner</li><li>Be an Indian citizen or meet applicable nationality requirements</li></ul><h2>Step 2: Obtain a Student Pilot License (SPL)</h2><p>The SPL is your first step into actual flying. Apply through a DGCA-approved Flying Training Organization (FTO). You will need to pass a medical, a written test, and a radio telephony exam.</p><h2>Step 3: Complete Flying Training</h2><p>You need a minimum of 200 hours of flying experience, which includes solo flying hours, cross-country navigation, night flying, and instrument flying. This is typically done at an FTO over 18–24 months.</p><h2>Step 4: Clear DGCA Ground Exams</h2><p>You must pass 7 subjects: Air Navigation, Meteorology, Air Regulations, Technical General, Technical Specific, RTR(A), and Radio Telephony. Each exam has 100 MCQs and requires 70% to pass.</p><h2>Step 5: Apply for CPL</h2><p>After completing flight hours and clearing all exams, apply to DGCA for your CPL. The process includes verification of log book, medical, ground exam results, and a skill test with a DGCA examiner.</p>',
'12 min read','Beginner',true),
('g2','DGCA CPL Ground Exam Preparation Strategy','Exam Prep',
'Proven strategies to clear all 5 CPL ground subjects in minimum attempts with focused study techniques.',
'<h2>Understanding the Exam Pattern</h2><p>Each DGCA CPL ground exam consists of 100 multiple choice questions with a 2-hour time limit. The passing score is 70%. Questions are sourced from previous DGCA papers, CAP documents, and approved textbooks.</p><h2>Subject-wise Strategy</h2><p><strong>Air Navigation:</strong> Focus on calculation problems — time-speed-distance, fuel calculations, wind corrections, and chart reading. Practice daily arithmetic without a calculator.</p><p><strong>Meteorology:</strong> Understand atmospheric phenomena conceptually. SIGMET categories, cloud types, frontal systems, and weather radar interpretation are scoring areas.</p><p><strong>Air Regulations:</strong> Pure rote learning. Study DGCA CAR Series, ICAO Annexes, and AIP India. Make a glossary of definitions.</p><p><strong>Technical General:</strong> Covers engines, airframes, instruments, and systems. Focus on piston and turbine engine principles, electrical systems, and hydraulics.</p><p><strong>Technical Specific:</strong> Aircraft-type specific, usually covered in your FTO training.</p><h2>Study Plan Template</h2><p>Spend 3–4 months per subject. First month: read the textbook. Second month: solve past papers. Third month: identify weak areas and revise. Take mock tests religiously in the last 2 weeks before the exam.</p><h2>Common Mistakes to Avoid</h2><ul><li>Skipping past year papers — they are your single best resource</li><li>Not understanding why an answer is correct — rote learning without understanding fails</li><li>Leaving time management for the last day — practice under time pressure from day one</li></ul>',
'8 min read','Intermediate',true),
('g3','Class 1 Medical Certificate: Complete Guide','Medical',
'Everything you need to know about the Class 1 Medical examination for pilots — requirements, tests, and common disqualifiers.',
'<h2>What is a Class 1 Medical?</h2><p>A Class 1 Medical Certificate is the highest category of aviation medical certification, mandatory for CPL and ATPL holders. It is issued by DGCA-approved Aviation Medical Examiners (AMEs).</p><h2>Who Needs It?</h2><p>All commercial pilot license applicants must hold a valid Class 1 Medical. Student pilots start with a Class 2 Medical which is easier to obtain.</p><h2>What is Tested?</h2><ul><li><strong>Vision:</strong> Distant visual acuity 6/9 or better in each eye (with glasses); colour vision tested with Ishihara plates</li><li><strong>Hearing:</strong> Conversational speech at 2 metres; audiogram if any doubt</li><li><strong>ECG:</strong> Resting ECG, and exercise ECG for applicants over 40</li><li><strong>Blood Tests:</strong> CBC, blood sugar (fasting & PP), lipid profile, kidney & liver function tests</li><li><strong>Urine Analysis:</strong> Routine examination</li><li><strong>Chest X-Ray:</strong> PA view to check for lung pathology</li><li><strong>ENT examination:</strong> Ear, nose, throat, and sinuses</li><li><strong>Neurological:</strong> Reflexes, coordination tests</li><li><strong>Psychiatric assessment:</strong> Mental health evaluation</li></ul><h2>Common Disqualifiers</h2><p>Colour blindness (failure of Ishihara), insulin-dependent diabetes, epilepsy history, and certain cardiac conditions are common disqualifiers. However, many conditions can be assessed on a case-by-case basis by DGCA.</p><h2>Where to Get It Done?</h2><p>Contact the DGCA-approved AMEs at major cities: Delhi (Safdarjung Hospital), Mumbai (JJ Hospital), Bangalore (HAL Hospital), Chennai (MMC), and others listed on the DGCA website.</p>',
'6 min read','Beginner',true),
('g4','Understanding DGCA RTR(A) Exam Pattern','Exam Prep',
'A detailed breakdown of the Radio Telephony Restricted (Aeronautical) exam structure, marking, and preparation approach.',
'<h2>What is RTR(A)?</h2><p>The Radio Telephony Restricted (Aeronautical) license is mandatory for all pilots who operate aircraft radio equipment. It is issued by WPC (Wireless Planning & Coordination Wing) under the Ministry of Communications, and is required for your CPL.</p><h2>Exam Structure</h2><p>The RTR(A) exam has two parts:</p><p><strong>Part 1 — Written:</strong> 50 MCQ questions. Duration: 2 hours. Total marks: 100. Passing: 70%. Topics include ICAO phonetic alphabet, phraseology, frequencies, and regulations.</p><p><strong>Part 2 — Practical Radio Transmission:</strong> 5 scenarios. Duration: 25 minutes. Total marks: 100. Passing: 75%. You speak into a microphone and are evaluated on correct phraseology, readbacks, and procedure.</p><h2>Part 1 Key Topics</h2><ul><li>ICAO phonetic alphabet (alpha to zulu)</li><li>Distress, urgency, and safety phraseology</li><li>Transponder codes (7500, 7600, 7700)</li><li>Emergency frequencies (121.5 MHz)</li><li>Readback requirements</li><li>QNH, QFE, QFF, QNE definitions</li></ul><h2>Part 2 Preparation Tips</h2><p>Practice out loud every day. Record yourself and compare with the model phraseology. Key scenarios: startup clearance, taxi, takeoff, en route position reports, approach, landing, and MAYDAY calls. Get familiar with the call sign format: VT-XXX, aircraft type, position, request.</p>',
'10 min read','Intermediate',true),
('g5','Choosing the Right Flying School in India','Career Path',
'How to evaluate and select a DGCA-approved Flying Training Organisation (FTO) that matches your goals and budget.',
'<h2>Why the Right School Matters</h2><p>Your flying school directly impacts your quality of training, the aircraft you fly on, the instructors you learn from, and your career outcomes. A poor choice can mean years of delays and wasted money.</p><h2>Key Criteria to Evaluate</h2><p><strong>DGCA Approval:</strong> Only train at a DGCA-approved FTO. Verify approval on the official DGCA website. An unapproved school means your hours will not be counted.</p><p><strong>Fleet Condition:</strong> Ask about the age, serviceability rate, and types of training aircraft. Modern aircraft with glass cockpits are a major advantage.</p><p><strong>Instructor Experience:</strong> Qualified instructors with significant experience in both flying and teaching are critical. Ask about CPL-holder instructors vs. PPL instructors.</p><p><strong>Infrastructure:</strong> A well-maintained meteorological station, classroom facilities, simulator access, and good accommodation matter for consistent training.</p><p><strong>Completion Rate & Time:</strong> Ask how long average CPL completion takes at the school. Delays due to aircraft grounding or instructor shortage add cost.</p><h2>Popular FTOs in India</h2><p>Indira Gandhi Rashtriya Uran Akademi (IGRUA), National Flying Training Institute (NFTI), and several private FTOs in Gondia, Baramati, Belagavi, Jalgaon, and other locations. Compare fee structure (typically ₹40–75 lakhs all-inclusive for CPL).</p><h2>Red Flags</h2><ul><li>No fixed fee structure; hidden costs</li><li>Very old or frequently grounded fleet</li><li>Alumni who have had significant delays</li><li>No proper track record of DGCA exam pass rates</li></ul>',
'9 min read','Beginner',true)
on conflict (id) do nothing;

-- ============================================================
-- EXAMS (PARIKSHA)
-- ============================================================
insert into public.exams (id, title, subject, description, exam_date, exam_time, duration, total_questions, fee, status) values
('e1','All India Air Navigation Mock','Air Navigation',
'National level mock exam for Air Navigation. Test your preparation against students from all over India. 100 MCQ questions in DGCA exam format. Get your All India rank.',
'2026-04-15','10:00',120,100,499,'Upcoming'),
('e2','Meteorology Championship 2026','Meteorology',
'Comprehensive Meteorology exam covering all DGCA patterns and recently asked questions. Full paper with explanations after submission.',
'2026-04-20','14:00',120,100,499,'Upcoming'),
('e3','Air Regulations Grand Mock','Air Regulations',
'Test your knowledge of DGCA CARs, ICAO Annexes, and AIP India in this national-level simulation exam.',
'2026-05-05','10:00',120,100,499,'Upcoming'),
('e4','Technical General All India Test','Technical General',
'Aircraft systems, engines, instruments, and electrical — compete with student pilots from across the country.',
'2026-05-12','14:00',120,100,499,'Upcoming')
on conflict (id) do nothing;

-- ============================================================
-- EXAM QUESTIONS (Air Navigation - e1, sample set)
-- ============================================================
insert into public.exam_questions (exam_id, question, options, correct, explanation) values
('e1','What does TAS stand for?','["True Airspeed","Total Air Speed","True Altitude Speed","Thermal Air Speed"]',0,'TAS = True Airspeed — the actual speed of the aircraft relative to undisturbed air.'),
('e1','The angle between true north and magnetic north is called:','["Variation","Deviation","Drift","Inclination"]',0,'Magnetic variation is the angle between true north and magnetic north.'),
('e1','An aircraft is flying on a magnetic heading of 270° with a 20° port crosswind. The track will be:','["290°","270°","250°","280°"]',2,'Port (left) crosswind pushes the aircraft right; to compensate, the track will drift left of heading → 250°.'),
('e1','METAR stands for:','["Meteorological Aerodrome Report","Monthly Estimated Terminal Aerodrome Report","Meteorological Estimation for Terminal Approach Route","Minimum En-route Temperature Aerodrome Report"]',0,'METAR = Meteorological Aerodrome Report — routine weather report for aerodromes.'),
('e1','A rhumb line on a Mercator chart appears as:','["A curve","A straight line","An arc","A great circle"]',1,'On a Mercator chart, a rhumb line (constant bearing track) appears as a straight line.'),
('e1','What is the standard temperature at FL150?','["-14.5°C","-15°C","-14°C","-17.5°C"]',0,'ISA: 15°C - (2°C × 15) = 15 - 30 = -15°C. However at FL150 (15,000ft) lapse rate gives -14.5°C.'),
('e1','Wind correction angle (WCA) is also known as:','["Crab Angle","Drift angle","Track angle","Variation"]',0,'WCA is the angle between heading and track, also called the crab angle.'),
('e1','On a 1:500,000 scale chart, 1 cm represents:','["5 km","50 km","500 km","0.5 km"]',0,'1:500,000 means 1 unit on chart = 500,000 units in reality = 5 km.'),
('e1','The 1-in-60 rule states that 1° of heading error produces a track error of:','["1 NM per 60 NM flown","60 NM per 1 NM flown","1 NM per 6 NM flown","6 NM per 60 NM flown"]',0,'The 1-in-60 rule: 1° off heading → 1 NM track error per 60 NM distance traveled.'),
('e1','ETA is calculated as:','["ETD + Flight Time","ATD + Flight Time","ETD + Block Time","ATD - Flight Time"]',1,'ETA (Estimated Time of Arrival) = ATD (Actual Time of Departure) + Estimated Flight Time.'),
('e2','Isobars on a surface chart connect points of:','["Equal temperature","Equal pressure","Equal humidity","Equal wind speed"]',1,'Isobars are lines connecting points of equal atmospheric pressure.'),
('e2','A cold front is indicated on a weather chart by:','["Blue line with triangles","Red line with semicircles","Alternating blue/red line","Green dashed line"]',0,'Cold fronts are shown with blue lines and blue triangles pointing in the direction of movement.'),
('e2','The tropopause is:','["The top of the ionosphere","The boundary between troposphere and stratosphere","The bottom of the troposphere","A layer within the troposphere"]',1,'The tropopause is the boundary between the troposphere and the stratosphere.'),
('e2','Virga is:','["Rain that reaches the ground","Rain that evaporates before reaching the ground","A type of fog","Lightning without thunder"]',1,'Virga is precipitation (rain or snow) that evaporates before reaching the surface.'),
('e2','The standard lapse rate in ISA is:','["1°C/1000ft","2°C/1000ft","3°C/1000ft","1.5°C/1000ft"]',1,'The ISA standard lapse rate is 2°C per 1000ft up to the tropopause.'),
('e2','A SIGMET covers:','["Significant meteorological phenomena hazardous to aircraft","Surface wind reports","Airport weather","Pilot reports only"]',0,'SIGMETs warn of significant meteorological conditions that may affect all aircraft, regardless of type.'),
('e2','CB clouds are associated with:','["Light rain","Severe turbulence and icing","Only lightning","Good visibility"]',1,'Cumulonimbus (CB) clouds bring severe turbulence, icing, heavy rain, hail, and lightning.'),
('e2','Wind shear is defined as:','["Steady strong wind","A change in wind speed and/or direction over a short distance","Crosswind component","Turbulent air near mountains"]',1,'Wind shear is a change in wind speed and/or direction over a relatively short distance in the atmosphere.')
on conflict do nothing;
