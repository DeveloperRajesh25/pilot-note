/**
 * RTR Phraseology Help Component and utilities
 */

export const RTR_CONVERSION_GUIDE = {
  title: 'ICAO RT Phraseology Conversion Guide',
  rules: [
    {
      category: 'Phonetic Alphabet',
      description: 'Aircraft registrations are converted to ICAO phonetic alphabet',
      examples: [
        { input: 'VT-ABC', output: 'Victor Tango Alfa Bravo Charlie' },
        { input: 'N123AB', output: 'November One Two Tree Alfa Bravo' },
        { input: 'A6-EFG', output: 'Alfa Six Echo Foxtrot Golf' }
      ]
    },
    {
      category: 'Airline Callsigns',
      description: 'Airline callsigns are NOT converted to phonetic, only flight numbers are',
      examples: [
        { input: 'AI101', output: 'Air India One Zero One' },
        { input: '6E231', output: 'Indigo Two Tree One' },
        { input: 'UK955', output: 'Vistara Niner Fife Fife' }
      ]
    },
    {
      category: 'Number Pronunciation',
      description: 'Numbers follow ICAO aviation pronunciation',
      rules: [
        '0 → Zero',
        '1 → Wun',
        '2 → Too',
        '3 → Tree',
        '4 → Fower',
        '5 → Fife',
        '6 → Six',
        '7 → Seven',
        '8 → Ait',
        '9 → Niner'
      ],
      examples: [
        { input: '27', output: 'Two Seven' },
        { input: '350', output: 'Tree Fife Zero' },
        { input: '118', output: 'One One Eight' }
      ]
    },
    {
      category: 'Frequency',
      description: 'Always use "Decimal" (never "Point" or "Dot")',
      examples: [
        { input: '121.5', output: 'One Two One Decimal Fife' },
        { input: '118.750', output: 'One One Eight Decimal Seven Fife Zero' },
        { input: '124.350', output: 'One Two Four Decimal Tree Fife Zero' }
      ]
    },
    {
      category: 'Flight Level',
      description: 'Must start with "Flight Level"',
      examples: [
        { input: 'FL130', output: 'Flight Level One Tree Zero' },
        { input: 'FL350', output: 'Flight Level Tree Fife Zero' },
        { input: 'FL090', output: 'Flight Level Zero Niner Zero' }
      ]
    },
    {
      category: 'Heading',
      description: 'Always digit-by-digit format',
      examples: [
        { input: 'HDG090', output: 'Heading Zero Niner Zero' },
        { input: 'HDG275', output: 'Heading Two Seven Fife' },
        { input: 'HDG360', output: 'Heading Tree Six Zero' }
      ]
    },
    {
      category: 'Runway',
      description: 'Full word "Runway" with left/right/center designation',
      examples: [
        { input: 'RWY27', output: 'Runway Two Seven' },
        { input: 'RWY09L', output: 'Runway Zero Niner Left' },
        { input: 'RWY27R', output: 'Runway Two Seven Right' }
      ]
    },
    {
      category: 'Altitude',
      description: 'Spoken naturally (thousands and hundreds)',
      examples: [
        { input: 'ALT4500', output: 'Four Thousand Five Hundred' },
        { input: 'ALT9500', output: 'Niner Thousand Five Hundred' },
        { input: 'ALT10000', output: 'One Zero Thousand' }
      ]
    },
    {
      category: 'Squawk Code',
      description: 'Digit-by-digit format',
      examples: [
        { input: 'SQUAWK4271', output: 'Squawk Four Two Seven One' },
        { input: 'SQ7500', output: 'Squawk Seven Fife Zero Zero' }
      ]
    },
    {
      category: 'Q-Codes',
      description: 'Spoken exactly as written (never convert)',
      examples: [
        { input: 'QNH', output: 'QNH' },
        { input: 'QFE', output: 'QFE' },
        { input: 'QDM', output: 'QDM' }
      ]
    },
    {
      category: 'Standard RT Words',
      description: 'Common aviation phrases are not modified',
      examples: [
        { input: 'ROGER', output: 'ROGER' },
        { input: 'WILCO', output: 'WILCO' },
        { input: 'AFFIRM', output: 'AFFIRM' },
        { input: 'NEGATIVE', output: 'NEGATIVE' },
        { input: 'STANDBY', output: 'STANDBY' }
      ]
    },
    {
      category: 'Abbreviation Expansion',
      description: 'Common abbreviations are expanded to full words',
      examples: [
        { input: 'RWY', output: 'Runway' },
        { input: 'TWY', output: 'Taxiway' },
        { input: 'FL', output: 'Flight Level' },
        { input: 'APP', output: 'Approach' },
        { input: 'TWR', output: 'Tower' }
      ]
    }
  ]
};

export function RTRHelpModal() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display text-neutral-900 mb-2">{RTR_CONVERSION_GUIDE.title}</h2>
        <p className="text-neutral-600">Learn how aviation text is converted to ICAO-standard radiotelephony (RT) phraseology.</p>
      </div>

      <div className="space-y-6">
        {RTR_CONVERSION_GUIDE.rules.map((rule, idx) => (
          <div key={idx} className="border border-neutral-200 rounded-2xl p-6">
            <h3 className="font-bold text-neutral-900 mb-2">{rule.category}</h3>
            <p className="text-sm text-neutral-600 mb-4">{rule.description}</p>

            {'rules' in rule && rule.rules && (
              <div className="mb-4 bg-neutral-50 rounded-lg p-3 text-sm space-y-1">
                {rule.rules.map((r, i) => (
                  <div key={i} className="font-mono text-neutral-700">{r}</div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {rule.examples.map((ex, i) => (
                <div key={i} className="flex gap-4 items-center text-sm">
                  <div className="flex-1">
                    <span className="font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-900">{ex.input}</span>
                  </div>
                  <span className="text-neutral-400">→</span>
                  <div className="flex-1">
                    <span className="font-mono bg-emerald-50 px-2 py-1 rounded text-emerald-900">{ex.output}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
        <h3 className="font-bold text-amber-900 mb-2">Key Points to Remember</h3>
        <ul className="text-sm text-amber-900 space-y-2 list-disc list-inside">
          <li><strong>Aircraft registrations</strong> → Always convert to phonetic alphabet</li>
          <li><strong>Airline callsigns</strong> → Do NOT convert to phonetic, only flight numbers</li>
          <li><strong>Frequencies</strong> → Always say "Decimal" (never "Point")</li>
          <li><strong>Numbers</strong> → Use ICAO pronunciation (tree, fower, fife, niner, ait)</li>
          <li><strong>Q-Codes</strong> → Never modify (QNH, QFE, etc. remain unchanged)</li>
          <li><strong>RT Words</strong> → Standard phrases like ROGER, WILCO stay the same</li>
          <li><strong>Readback</strong> → Always read back runway, altitude, heading, and squawk</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Quick reference card for students
 */
export function RTRQuickReference() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-neutral-200 rounded-xl p-4">
        <h4 className="font-bold text-sm mb-2 text-neutral-900">ICAO Numbers</h4>
        <div className="text-xs space-y-1 font-mono">
          <div><span className="font-bold">0</span> = zero, <span className="font-bold">1</span> = wun, <span className="font-bold">2</span> = too</div>
          <div><span className="font-bold">3</span> = tree, <span className="font-bold">4</span> = fower, <span className="font-bold">5</span> = fife</div>
          <div><span className="font-bold">6</span> = six, <span className="font-bold">7</span> = seven, <span className="font-bold">8</span> = ait</div>
          <div><span className="font-bold">9</span> = niner</div>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl p-4">
        <h4 className="font-bold text-sm mb-2 text-neutral-900">Standard RT Words</h4>
        <div className="text-xs space-y-1">
          <div><span className="font-bold">ROGER</span> - Message received</div>
          <div><span className="font-bold">WILCO</span> - Will comply</div>
          <div><span className="font-bold">AFFIRM</span> - Yes</div>
          <div><span className="font-bold">NEGATIVE</span> - No</div>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl p-4">
        <h4 className="font-bold text-sm mb-2 text-neutral-900">Conversions</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>FL350 = Flight Level Three Five Zero</div>
          <div>HDG090 = Heading Zero Niner Zero</div>
          <div>RWY27L = Runway Two Seven Left</div>
          <div>121.5 = One Two One Decimal Fife</div>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl p-4">
        <h4 className="font-bold text-sm mb-2 text-neutral-900">Emergency</h4>
        <div className="text-xs space-y-1">
          <div><span className="font-bold">MAYDAY</span> - Distress (3x)</div>
          <div><span className="font-bold">PAN PAN</span> - Urgency (3x)</div>
          <div className="text-rose-600 font-bold">Always repeat 3 times</div>
        </div>
      </div>
    </div>
  );
}
