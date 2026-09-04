export const SMALLER_UNIT = { kg: "g", l: "ml" };
export const UNIT_FACTOR = { g: 1000, ml: 1000 }; // how many of the smaller unit make 1 of the base unit

const NUM_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, dozen: 12,
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10, "आधा": 0.5, "दर्जन": 12,
};
const UNIT_WORD_MAP = {
  g: "g", gm: "g", gms: "g", gram: "g", grams: "g",
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  ml: "ml", millilitre: "ml", millilitres: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  pcs: "pcs", piece: "pcs", pieces: "pcs", packet: "packet", packets: "packet",
  "किलो": "kg", "किलोग्राम": "kg", "ग्राम": "g", "ग्रा": "g", "लीटर": "l", "मिली": "ml", "मिलीलीटर": "ml", "पीस": "pcs", "पैकेट": "packet",
};

// Extracts a spoken quantity (digits or number-words) plus any unit spoken alongside it
// (e.g. "250 grams", "1.5 liters"), then converts it into the item's actual stock unit
// so grams/kg and ml/litres are both accepted no matter which one is said.
export function parseSpokenQuantity(text, itemUnit) {
  const t = text.toLowerCase();
  let qty = null;
  let spokenUnit = null;

  const digitMatch = t.match(/(\d+(\.\d+)?)\s*([a-z]+)?/);
  if (digitMatch) {
    qty = parseFloat(digitMatch[1]);
    if (digitMatch[3] && UNIT_WORD_MAP[digitMatch[3]]) spokenUnit = UNIT_WORD_MAP[digitMatch[3]];
  } else {
    const words = t.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (NUM_WORDS[words[i]] !== undefined) {
        qty = NUM_WORDS[words[i]];
        if (words[i + 1] && UNIT_WORD_MAP[words[i + 1]]) spokenUnit = UNIT_WORD_MAP[words[i + 1]];
        break;
      }
    }
  }
  if (qty == null) return null;
  if (!spokenUnit || !itemUnit || spokenUnit === itemUnit) return qty;
  if (spokenUnit === "g" && itemUnit === "kg") return qty / 1000;
  if (spokenUnit === "kg" && itemUnit === "g") return qty * 1000;
  if (spokenUnit === "ml" && itemUnit === "l") return qty / 1000;
  if (spokenUnit === "l" && itemUnit === "ml") return qty * 1000;
  return qty; // no matching conversion (e.g. said "liters" for a pcs item) — use the raw number
}

const VOICE_STOPWORDS = [
  "add", "please", "kg", "kgs", "kilo", "kilos", "liter", "litre", "liters", "litres", "l", "ml", "gram", "grams",
  "gms", "gm", "g", "pcs", "piece", "pieces", "packet", "packets", "of", "the", "a", "an", "to", "bill", "and",
  "जोड़ो", "डालो", "डालिए", "कृपया", "का", "की", "के", "और", "बिल", "में", "को", "से",
];

export function matchItemFromSpeech(items, transcript) {
  const t = transcript.toLowerCase().trim();
  const codeMatch = t.match(/\b(\d{2})\b/);
  if (codeMatch) {
    const byCode = items.find((i) => i.code === codeMatch[1]);
    if (byCode) return byCode;
  }
  let stripped = t.replace(/\d+(\.\d+)?/g, " ");
  Object.keys(NUM_WORDS).forEach((w) => {
    stripped = stripped.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  });
  VOICE_STOPWORDS.forEach((w) => {
    stripped = stripped.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  });
  stripped = stripped.replace(/\s+/g, " ").trim();
  if (!stripped) return null;

  let best = null,
    bestScore = 0;
  items.forEach((i) => {
    const name = i.name.toLowerCase();
    const hindiName = (i.hindi_name || "").toLowerCase();
    let score = 0;
    if (name.includes(stripped)) score += 5;
    if (hindiName && hindiName.includes(stripped)) score += 5;
    stripped.split(" ").forEach((w) => {
      if (w.length > 1 && (name.includes(w) || hindiName.includes(w))) score += 1;
    });
    if (i.category.toLowerCase().includes(stripped)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore > 0 ? best : null;
}

// Split a sentence like "2 kg sugar and 3 biscuits aur 1 litre oil" into
// individual item segments, then match each one to inventory.
export function parseMultiItemSpeech(text, items) {
  const segments = text
    .toLowerCase()
    .split(/,\s*|\s+and\s+|\s+aur\s+|\s+then\s+|\s+also\s+|\s+or\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const seg of segments) {
    const item = matchItemFromSpeech(items, seg);
    if (item) {
      const qty = parseSpokenQuantity(seg, item.unit) || 1;
      results.push({ item, qty });
    }
  }
  return results;
}

// Voice command classifier — returns the command type and payload
export function classifyVoiceCommand(text) {
  const t = text.toLowerCase().trim();
  if (/\b(print|generate|done|ho gaya|bas|finish|complete|bill karo|bill banao)\b/.test(t))
    return { cmd: "generate" };
  if (/\b(total|kitna|how much|kya hua|amount|sum)\b/.test(t))
    return { cmd: "total" };
  if (/\b(clear|sab hatao|start over|reset|new bill|naya bill)\b/.test(t))
    return { cmd: "clear" };
  if (/\b(udhaar|udhar|credit)\b/.test(t))
    return { cmd: "billtype", value: "credit" };
  if (/\b(cash|paid|naqad)\b/.test(t) && !/udhaar|credit/.test(t))
    return { cmd: "billtype", value: "cash" };
  const removeMatch = t.match(/\b(remove|hatao|nikalo|cancel|delete)\b\s+(.+)/);
  if (removeMatch) return { cmd: "remove", query: removeMatch[2] };
  return { cmd: "items" };
}
