/**
 * ICAO Standard Radio Telephony (RT) Phraseology Converter
 * Converts aviation text to realistic ICAO-compliant pilot-ATC communication
 */

// ICAO Phonetic Alphabet
const PHONETIC_ALPHABET: Record<string, string> = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu'
};

// ICAO Aviation Number Pronunciation
const ICAO_NUMBERS: Record<string, string> = {
  '0': 'zero', '1': 'wun', '2': 'too', '3': 'tree',
  '4': 'fower', '5': 'fife', '6': 'six', '7': 'seven',
  '8': 'ait', '9': 'niner'
};

// Standard RT Words (should not be converted)
const RT_WORDS = new Set([
  'ROGER', 'WILCO', 'AFFIRM', 'NEGATIVE', 'MAYDAY', 'PAN',
  'CLEARED', 'TAXI', 'HOLD', 'SHORT', 'POSITION', 'LINE', 'UP', 'WAIT',
  'RUNWAY', 'WIND', 'KNOTS', 'DEGREES', 'CONTACT', 'TOWER', 'GROUND',
  'APPROACH', 'DEPARTURE', 'RADAR', 'SQUAWK', 'ALTITUDE', 'FLIGHT',
  'LEVEL', 'CLIMB', 'DESCEND', 'MAINTAIN', 'TURN', 'LEFT', 'RIGHT',
  'HEADING', 'PROCEED', 'DIRECT', 'REPORT', 'READY', 'TAKEOFF', 'LANDING',
  'FINAL', 'BASE', 'DOWNWIND', 'CROSSWIND', 'CIRCUIT', 'PATTERN', 'OVERHEAD',
  'FEET', 'METRES', 'MILES', 'NAUTICAL', 'VISIBILITY', 'ATIS', 'INFORMATION',
  'STANDBY', 'GO', 'AHEAD', 'QNH', 'QFE', 'QFF', 'QNE', 'SAY', 'AGAIN',
  'CORRECTION', 'DISREGARD', 'ACKNOWLEDGE', 'COPY', 'READ', 'BACK', 'OVER',
  'OUT', 'BREAK', 'REQUEST', 'PERMISSION', 'APPROVED', 'UNABLE', 'EXPECT',
  'TRAFFIC', 'NO', 'DELAY', 'IMMEDIATELY', 'EXPEDITE', 'UP', 'AND', 'FOR',
  'TO', 'THE', 'AT', 'ON', 'FROM', 'WITH', 'VIA', 'IS', 'ARE', 'AFTER',
  'BEFORE', 'ABOVE', 'BELOW', 'THOUSAND', 'HUNDRED', 'STOP', 'GOOD',
  'MORNING', 'EVENING', 'AFTERNOON', 'DAY', 'HEAVY', 'SUPER', 'LIGHT',
  'MEDIUM', 'CAUTION', 'WAKE', 'TURBULENCE', 'CLOUD', 'CLEAR', 'ESTABLISHED',
  'LOCALISER', 'GLIDESLOPE', 'MISSED', 'CONTINUE', 'ORBIT', 'EXTEND',
  'REDUCE', 'SPEED', 'IDENTIFIED', 'NOT', 'AVAILABLE', 'CLOSED', 'OPEN',
  'ENTER', 'LEAVE', 'JOIN', 'CROSS', 'BEHIND', 'FOLLOW', 'PASSING', 'REACHING',
  'VACATE', 'BACKTRACK', 'EXPEDITE', 'REDUCE', 'VACATE', 'V', 'O', 'R',
  'D', 'M', 'E', 'I', 'L', 'S'
]);

// Aviation Abbreviations and their expansions
const ABBREVIATIONS: Record<string, string> = {
  'RWY': 'Runway', 'TWY': 'Taxiway', 'FL': 'Flight Level',
  'HDG': 'Heading', 'ALT': 'Altitude', 'APP': 'Approach',
  'DEP': 'Departure', 'TWR': 'Tower', 'GND': 'Ground',
  'FREQ': 'Frequency', 'ATIS': 'ATIS', 'VOR': 'V O R',
  'DME': 'D M E', 'ILS': 'I L S', 'ETA': 'E T A',
  'ETD': 'E T D', 'UTC': 'Zulu', 'NM': 'Nautical Miles',
  'KT': 'Knots', 'SPD': 'Speed', 'SQ': 'Squawk'
};

// Airline callsigns (should NOT be converted to phonetic)
const AIRLINE_CALLSIGNS = new Set([
  'AIR INDIA', 'IFLY', 'INDIGO', 'VISTARA', 'SPICEJET', 'GOAIR',
  'EXPRESS INDIA', 'AKASA AIR', 'ALLIED', 'STAR AIR', 'BLUE DART', 'FLY91',
  'BRITISH AIRWAYS', 'LUFTHANSA', 'AIR FRANCE', 'KLM', 'EMIRATES',
  'QATAR', 'SINGAPORE', 'CATHAY', 'ANA', 'JAL', 'UNITED', 'AMERICAN',
  'DELTA', 'SOUTHWEST', 'JETBLUE', 'VIRGIN', 'AEROFLOT', 'IBERIA'
]);

// Q-Codes (should not be modified)
const Q_CODES = new Set([
  'QNH', 'QFE', 'QFF', 'QNE', 'QDM', 'QDR', 'QTE', 'QUJ', 'QME', 'QMU'
]);

/**
 * Convert a single character to its phonetic alphabet equivalent
 */
function charToPhonetic(char: string): string {
  const upper = char.toUpperCase();
  return PHONETIC_ALPHABET[upper] || upper;
}

/**
 * Convert a number digit to its ICAO pronunciation
 */
function digitToICAO(digit: string): string {
  return ICAO_NUMBERS[digit] || digit;
}

/**
 * Convert multi-digit number to ICAO pronunciation
 */
function numberToICAO(num: string): string {
  return num.split('').map(d => digitToICAO(d)).join(' ');
}

/**
 * Check if a string is an aircraft registration (VT-ABC, N123AB, A6-EFG format)
 * These should be converted to phonetic alphabet
 */
function isAircraftRegistration(word: string): boolean {
  // Matches patterns like VT-ABC, N123AB, A6-EFG, etc.
  return /^[A-Z]{1,2}(?:-|[0-9])[A-Z0-9]{2,4}$/.test(word.toUpperCase());
}

/**
 * Check if a word is an airline callsign (AI101, 6E231, UK955)
 * These should NOT be converted to phonetic
 */
function isAirlineCallsign(word: string): boolean {
  // Format: 1-3 letters + 2-4 digits (e.g., AI101, 6E231)
  return /^[A-Z0-9]{2,4}[0-9]{2,4}$/.test(word.toUpperCase());
}

/**
 * Convert aircraft registration to phonetic alphabet
 * E.g., VT-ABC → Victor Tango Alfa Bravo Charlie
 */
function registrationToPhonetic(registration: string): string {
  return registration
    .toUpperCase()
    .replace(/[-]/g, '')
    .split('')
    .map(ch => {
      if (ch >= '0' && ch <= '9') return digitToICAO(ch);
      return charToPhonetic(ch);
    })
    .join(' ');
}

/**
 * Convert airline callsign to aviation format
 * E.g., AI101 → Air India One Zero One
 */
function airlineCallsignToRT(callsign: string): string {
  const upper = callsign.toUpperCase();

  // Map of common airline codes — values are the spoken RT callsign that the
  // TTS engine reads aloud. Indian carrier names follow the DGCA-published
  // RT callsigns (e.g. IndiGo is "IFLY", Alliance Air is "ALLIED").
  const airlineCodes: Record<string, string> = {
    // Indian carriers
    'AI': 'Air India',
    '6E': 'Ifly',
    'UK': 'Vistara',
    'SG': 'SpiceJet',
    'IX': 'Express India',
    'QP': 'Akasa Air',
    '9I': 'Allied',
    'S5': 'Star Air',
    'BZ': 'Blue Dart',
    'IC': 'Fly Niner One',
    'G8': 'GoAir',
    // International carriers
    'BA': 'British Airways', 'LH': 'Lufthansa',
    'AF': 'Air France', 'KL': 'KLM', 'EK': 'Emirates', 'QR': 'Qatar',
    'SQ': 'Singapore', 'CX': 'Cathay', 'ANA': 'ANA', 'JAL': 'JAL',
    'UA': 'United', 'AA': 'American', 'DL': 'Delta', 'WN': 'Southwest',
  };

  // Extract airline code and flight number. The code is the alpha/alpha-digit
  // prefix (e.g. AI, 6E, 9I, G8, ANA, JAL) and the rest is the digit-only
  // flight number. The greedy `[A-Z0-9]{2,3}` form on its own would swallow
  // the first flight-number digit into the code (e.g. AI101 → "AI1" + "01").
  let match = upper.match(/^([A-Z]{2,3}|\d[A-Z]|[A-Z]\d)(\d+)$/);
  if (!match) return upper;

  const [, code, flightNum] = match;
  const airlineName = airlineCodes[code] || code;
  const flightNumber = numberToICAO(flightNum);

  return `${airlineName} ${flightNumber}`;
}

/**
 * Convert frequency (with decimal) to ICAO format
 * E.g., 121.5 → One Two One Decimal Fife
 */
function frequencyToRT(freq: string): string {
  const parts = freq.split('.');
  let result = numberToICAO(parts[0]);
  if (parts[1]) {
    result += ' Decimal ' + parts[1].split('').map(d => digitToICAO(d)).join(' ');
  }
  return result;
}

/**
 * Convert heading to ICAO format (digit-by-digit)
 * E.g., 090 → Zero Niner Zero
 */
function headingToRT(heading: string): string {
  return numberToICAO(heading);
}

/**
 * Convert altitude to natural aviation format
 * E.g., 4500 → Four Thousand Five Hundred
 */
function altitudeToRT(altStr: string): string {
  const alt = parseInt(altStr);
  if (isNaN(alt)) return altStr;

  const thousands = Math.floor(alt / 1000);
  const remainder = alt % 1000;

  let result = '';
  if (thousands > 0) {
    result += `${digitToICAO(thousands.toString())} Thousand`;
  }

  if (remainder > 0) {
    if (result) result += ' ';
    if (remainder < 100) {
      result += numberToICAO(remainder.toString());
    } else {
      const hundreds = Math.floor(remainder / 100);
      const tens = remainder % 100;
      result += `${digitToICAO(hundreds.toString())} Hundred`;
      if (tens > 0) {
        result += ` ${numberToICAO(tens.toString())}`;
      }
    }
  }

  return result || '0';
}

/**
 * Convert runway designation to RT format
 * E.g., 27L → Two Seven Left
 */
function runwayToRT(runway: string): string {
  // Matches patterns like 27, 27L, 27R, 27C, 09
  const match = runway.match(/^(\d{2})([LRC]?)$/);
  if (!match) return runway;

  const [, num, suffix] = match;
  const suffixes: Record<string, string> = { 'L': 'Left', 'R': 'Right', 'C': 'Center' };

  let result = numberToICAO(num);
  if (suffix) {
    result += ` ${suffixes[suffix] || suffix}`;
  }

  return result;
}

/**
 * Convert squawk code (digit-by-digit)
 * E.g., 4271 → Four Two Seven One
 */
function squawkToRT(squawk: string): string {
  return numberToICAO(squawk);
}

/**
 * Convert taxiway designations to phonetic
 * E.g., Taxiway A → Taxiway Alfa
 */
function taxiwayToRT(taxiway: string): string {
  return charToPhonetic(taxiway);
}

/**
 * Check if a word looks like a frequency
 */
function isFrequency(word: string): boolean {
  return /^\d{2,3}\.\d{1,3}$/.test(word);
}

/**
 * Check if a word is a runway designation
 */
function isRunway(word: string): boolean {
  return /^(RWY|RW)?(\d{2}[LRC]?)$/i.test(word);
}

/**
 * Check if a word is a flight level designation
 */
function isFlightLevel(word: string): boolean {
  return /^FL\d{2,3}$/i.test(word);
}

/**
 * Check if a word is a heading designation
 */
function isHeading(word: string): boolean {
  return /^HDG\d{3}$/i.test(word);
}

/**
 * Check if a word is an altitude designation
 */
function isAltitude(word: string): boolean {
  return /^ALT\d{4,5}$/i.test(word) || /^\d{4,5}FT$/i.test(word);
}

/**
 * Check if a word is a squawk code
 */
function isSquawk(word: string): boolean {
  return /^(SQ|SQUAWK)\d{4}$/i.test(word);
}

/**
 * Main conversion function for a single word
 */
function convertWord(word: string): string {
  if (!word) return '';

  // Remove and save trailing punctuation
  const match = word.match(/^(.+?)([,.;:!?\-]*)$/);
  if (!match) return word;

  const core = match[1];
  const trailing = match[2];
  const upper = core.toUpperCase();

  // 1. Check for Q-Codes (must not be modified)
  if (Q_CODES.has(upper)) {
    return core + trailing;
  }

  // 2. Check for standard RT words
  if (RT_WORDS.has(upper)) {
    return core + trailing;
  }

  // 3. Check for aircraft registration (must be converted to phonetic)
  if (isAircraftRegistration(core)) {
    return registrationToPhonetic(core) + trailing;
  }

  // 4. Check for airline callsign (do NOT convert to phonetic)
  if (isAirlineCallsign(core)) {
    return airlineCallsignToRT(core) + trailing;
  }

  // 5. Flight Level: FL130 → Flight Level One Tree Zero
  if (isFlightLevel(core)) {
    const match = core.match(/^FL(\d+)$/i);
    if (match) {
      return `Flight Level ${numberToICAO(match[1])}${trailing}`;
    }
  }

  // 6. Heading: HDG090 → Heading Zero Niner Zero
  if (isHeading(core)) {
    const match = core.match(/^HDG(\d{3})$/i);
    if (match) {
      return `Heading ${numberToICAO(match[1])}${trailing}`;
    }
  }

  // 7. Altitude: ALT4500 or 4500FT → Four Thousand Five Hundred
  if (isAltitude(core)) {
    const match = core.match(/^ALT(\d+)$/i) || core.match(/^(\d+)FT$/i);
    if (match) {
      return `${altitudeToRT(match[1])}${trailing}`;
    }
  }

  // 8. Runway: RWY27L → Runway Two Seven Left
  if (isRunway(core)) {
    const match = core.match(/^(?:RWY|RW)?(\d{2}[LRC]?)$/i);
    if (match) {
      return `Runway ${runwayToRT(match[1])}${trailing}`;
    }
  }

  // 9. Squawk: SQUAWK4271 or SQ4271 → Squawk Four Two Seven One
  if (isSquawk(core)) {
    const match = core.match(/^(?:SQ|SQUAWK)(\d{4})$/i);
    if (match) {
      return `Squawk ${squawkToRT(match[1])}${trailing}`;
    }
  }

  // 10. Frequency: 121.5 → One Two One Decimal Fife
  if (isFrequency(core)) {
    return frequencyToRT(core) + trailing;
  }

  // 11. Abbreviations (must be expanded)
  if (ABBREVIATIONS[upper]) {
    return ABBREVIATIONS[upper] + trailing;
  }

  // 12. Pure numbers (digit-by-digit)
  if (/^\d+$/.test(core)) {
    return numberToICAO(core) + trailing;
  }

  // 13. Default: return as-is
  return core + trailing;
}

/**
 * Convert an entire text to ICAO RT phraseology
 */
export function convertToRTPhraseology(text: string): string {
  if (!text || !text.trim()) return '';

  return text
    .split(/(\s+)/)
    .map(chunk => {
      // Preserve whitespace
      if (/^\s+$/.test(chunk)) return chunk;

      // Convert words
      const words = chunk.split(/(?=[A-Z])/);
      return words
        .map(word => {
          // Handle hyphenated words
          if (word.includes('-') && !isAircraftRegistration(word)) {
            return word.split('-').map(convertWord).join('-');
          }
          return convertWord(word);
        })
        .join('');
    })
    .join('');
}

/**
 * Convert and return detailed breakdown (for debugging/learning)
 */
export function convertWithBreakdown(text: string): { original: string; converted: string; breakdown: Array<{word: string; converted: string}> } {
  const words = text.split(/\s+/);
  const breakdown = words.map(word => ({
    word,
    converted: convertWord(word)
  }));

  return {
    original: text,
    converted: breakdown.map(b => b.converted).join(' '),
    breakdown
  };
}

/**
 * Get list of supported conversions for UI tooltips/help
 */
export const CONVERSION_EXAMPLES = [
  { input: 'VT-ABC', output: 'Victor Tango Alfa Bravo Charlie', type: 'Aircraft Registration' },
  { input: 'AI101', output: 'Air India One Zero One', type: 'Airline Callsign' },
  { input: 'FL350', output: 'Flight Level Tree Fife Zero', type: 'Flight Level' },
  { input: 'HDG090', output: 'Heading Zero Niner Zero', type: 'Heading' },
  { input: 'RWY27L', output: 'Runway Two Seven Left', type: 'Runway' },
  { input: '121.5', output: 'One Two One Decimal Fife', type: 'Frequency' },
  { input: 'ALT4500', output: 'Four Thousand Five Hundred', type: 'Altitude' },
  { input: 'SQUAWK4271', output: 'Squawk Four Two Seven One', type: 'Squawk' },
  { input: 'QNH', output: 'QNH', type: 'Q-Code' },
  { input: 'ROGER', output: 'ROGER', type: 'RT Word' },
];
