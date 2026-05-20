# ICAO RT Phraseology Implementation Guide

This document describes the ICAO standard radiotelephony (RT) phraseology conversion feature implemented in the pilot-note RTR Part 2 system.

## Overview

The RT Phraseology feature converts aviation text into realistic ICAO-compliant pilot-ATC communication as used in:
- CPL RTR exams (DGCA)
- Real-world airline operations
- Tower and ground communications
- Radar communications
- Emergency procedures

## Architecture

### Core Components

#### 1. **Conversion Engine** (`lib/icao-rt-converter.ts`)
The main conversion library that handles all ICAO RT phraseology rules.

**Key Functions:**
- `convertToRTPhraseology(text: string): string` - Main conversion function
- `convertWithBreakdown(text: string)` - Returns detailed breakdown for debugging
- `CONVERSION_EXAMPLES` - Pre-defined examples for reference

**Features Implemented:**
- ✅ ICAO Phonetic Alphabet (A→Alfa, Z→Zulu)
- ✅ ICAO Number Pronunciation (0→Zero, 3→Tree, 9→Niner, etc.)
- ✅ Aircraft Registration Conversion (VT-ABC → Victor Tango Alfa Bravo Charlie)
- ✅ Airline Callsign Handling (AI101 → Air India One Zero One)
- ✅ Flight Level Conversion (FL350 → Flight Level Tree Fife Zero)
- ✅ Heading Conversion (HDG090 → Heading Zero Niner Zero)
- ✅ Runway Designation (RWY27L → Runway Two Seven Left)
- ✅ Frequency Handling (121.5 → One Two One Decimal Fife)
- ✅ Altitude Conversion (4500FT → Four Thousand Five Hundred)
- ✅ Squawk Codes (SQ4271 → Squawk Four Two Seven One)
- ✅ Q-Code Preservation (QNH, QFE, QDM remain unchanged)
- ✅ Standard RT Words (ROGER, WILCO, AFFIRM preserved)
- ✅ Abbreviation Expansion (RWY→Runway, TWY→Taxiway, etc.)

#### 2. **RTR Help & Learning** (`lib/rtr-help.tsx`)
Educational components for students.

**Components:**
- `RTRHelpModal()` - Comprehensive guide to RT conversion rules
- `RTRQuickReference()` - Quick reference cards for common conversions
- `RTR_CONVERSION_GUIDE` - Structured guide data

#### 3. **Phraseology Guide Page** (`app/rtr-phraseology-guide/page.tsx`)
Public-facing page for learning and practice.

**Features:**
- Real-time text converter
- Common conversion examples (clickable for practice)
- Learning guide with rule breakdowns
- Quick reference cards
- Tips for RTR Part 2 success

#### 4. **API Endpoint** (`app/api/rtr/convert-phraseology/route.ts`)
REST API for programmatic access.

**Endpoints:**
- `POST /api/rtr/convert-phraseology` - JSON-based conversion
- `GET /api/rtr/convert-phraseology?text=...` - Query-based conversion

### Integration Points

#### RTR Exam Page (`app/rtr-exam/page.tsx`)
- Replaced old basic converter with comprehensive engine
- Shows RT format feedback for student answers in Part 2
- Added help icon linking to phraseology guide
- Displays real-time RT conversion as students type/dictate

**Implementation Details:**
- Text-to-speech now uses converted RT phraseology
- Student answers show RT format in feedback section
- Help button in top navigation for Part 2 exams

## ICAO RT Rules Implemented

### 1. Phonetic Alphabet
- Aircraft registrations converted entirely to phonetic
- Individual letters in designations (A→Alfa, B→Bravo, etc.)
- Taxiway designations converted to phonetic

### 2. Number Pronunciation
```
0 = Zero     3 = Tree     6 = Six      9 = Niner
1 = Wun      4 = Fower    7 = Seven
2 = Too      5 = Fife     8 = Ait
```

### 3. Frequency Handling
- Always say "Decimal" (never "Point" or "Dot")
- Digits spoken individually
- Example: 121.5 → One Two One Decimal Fife

### 4. Flight Level Format
- Must begin with "Flight Level"
- Digits spoken individually
- Example: FL350 → Flight Level Tree Fife Zero

### 5. Heading Format
- Always digit-by-digit
- Example: HDG090 → Heading Zero Niner Zero

### 6. Runway Designation
- "Runway" prefix expanded
- Left/Right/Center suffixes spelled out
- Example: RWY27L → Runway Two Seven Left

### 7. Altitude
- Spoken naturally with thousands/hundreds
- Example: 4500FT → Four Thousand Five Hundred

### 8. Squawk Codes
- Digit-by-digit format
- Example: SQUAWK4271 → Squawk Four Two Seven One

### 9. Q-Codes
- Never modified
- Examples: QNH, QFE, QDM remain as-is

### 10. Standard RT Words
- Common aviation phrases preserved
- Examples: ROGER, WILCO, AFFIRM, NEGATIVE, STANDBY, etc.

## Usage Examples

### Example 1: Basic Transmission
```
Input:  "Contact Delhi Tower on 121.5"
Output: "Contact Delhi Tower on One Two One Decimal Fife"
```

### Example 2: Aircraft Identification
```
Input:  "Victor Tango Alfa Bravo Charlie"
Output: "Victor Tango Alfa Bravo Charlie"
(Already in phonetic, preserved as-is)
```

### Example 3: Clearance
```
Input:  "Cleared to land runway 27 left, descend to FL80"
Output: "Cleared to land Runway Two Seven Left, descend to Flight Level Eight Zero"
```

### Example 4: Complex Transmission
```
Input:  "AI102, Climb FL350, heading 270, squawk 1234"
Output: "Air India One Zero Two, Climb Flight Level Tree Fife Zero, 
         Heading Two Seven Zero, Squawk One Two Tree Four"
```

## Testing

The conversion engine has been tested with:
- All ICAO rules from the provided specification
- Real-world aviation communications
- RTR exam scenarios
- Edge cases (hyphenated registrations, multiple conversions, etc.)

### Test Examples
```javascript
// Aircraft Registration
convertToRTPhraseology("VT-ABC") 
// Output: "Victor Tango Alfa Bravo Charlie"

// Airline Callsign
convertToRTPhraseology("AI101") 
// Output: "Air India One Zero One"

// Flight Level
convertToRTPhraseology("FL350") 
// Output: "Flight Level Tree Fife Zero"

// Frequency
convertToRTPhraseology("121.5") 
// Output: "One Two One Decimal Fife"

// Mixed
convertToRTPhraseology("Contact Delhi Tower on 121.5, descend to FL80") 
// Output: "Contact Delhi Tower on One Two One Decimal Fife, descend to Flight Level Eight Zero"
```

## User Flows

### Student Learning Flow
1. Student visits `/rtr-phraseology-guide`
2. Reads learning guide and conversion rules
3. Uses real-time converter to practice
4. Clicks on example conversions to see rule in action
5. References quick guide during RTR Part 2 exam

### RTR Part 2 Exam Flow
1. Student takes RTR Part 2 exam
2. Types or dictates answer
3. System shows real-time RT format feedback
4. Student can click help icon to review phraseology guide
5. System reads back answer in proper RT format
6. Student can verify their response matches expected phraseology

### API Integration Flow
1. Third-party applications can convert text via API
2. `POST /api/rtr/convert-phraseology` with JSON payload
3. Receive converted text in response
4. Use for generating study materials, feedback, etc.

## Files Modified/Created

### New Files Created
1. `lib/icao-rt-converter.ts` - Core conversion engine
2. `lib/rtr-help.tsx` - Help components
3. `app/rtr-phraseology-guide/page.tsx` - Guide page
4. `app/api/rtr/convert-phraseology/route.ts` - API endpoint
5. `RTR_IMPLEMENTATION_GUIDE.md` - This file

### Files Modified
1. `app/rtr-exam/page.tsx` - Integrated converter, added feedback, help button

## Performance Considerations

- Conversion happens in real-time with minimal latency
- Client-side processing (no server calls needed)
- Suitable for speech synthesis input
- Optimized for text-to-speech engines
- Works offline (no external dependencies)

## Future Enhancements

1. **Audio Pronunciation**
   - Real audio samples of proper RT pronunciation
   - Interactive listening practice

2. **Scenario-Based Practice**
   - Realistic ATC scenarios with proper phraseology
   - Score based on phraseology accuracy

3. **Readback Verification**
   - Compare student readback against expected format
   - Highlight phraseology errors

4. **Export Functions**
   - Generate study sheets with conversions
   - Practice drills with phraseology

5. **Multi-Language Support**
   - English (current)
   - Regional variations (DGCA format, regional ATC formats)

## Troubleshooting

### Issue: Text not converting
- Check for unsupported special characters
- Ensure proper spacing between words
- Verify text is not already in RT format

### Issue: Numbers not pronouncing correctly
- Verify ICAO_NUMBERS mapping is correct
- Check for mixed formats (ensure consistency)

### Issue: Aircraft registration not converting
- Verify it matches aircraft registration pattern
- Check for non-standard formats

## Support

For issues or feature requests:
1. Check the RTR Phraseology Guide page
2. Review conversion examples
3. Test with the converter tool
4. Report issues with details and example inputs

## Resources

- ICAO Annex 10 - Radio Telephony (RT)
- DGCA RTR Exam Standards
- Real-world ATC Communications
- Airline Operations Manuals
