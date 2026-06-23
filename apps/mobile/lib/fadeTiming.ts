/**
 * Shared timing for the auto-fading flow end screens ("Logged.", "Saved.",
 * "Craving beaten.", …). One source of truth so every confirmation screen feels
 * the same — and so the HOLD scales with how much there is to read rather than
 * being a hand-picked constant per screen.
 *
 * Model: the user needs a fixed beat to register the checkmark + heading, plus
 * reading time proportional to the body copy. Fade in/out are constant.
 */

export const FADE_IN_MS = 400;
export const FADE_OUT_MS = 600;

// Base beat to take in the icon + heading before the body matters.
const HOLD_BASE_MS = 1400;
// Reading time per body word (~300 wpm ≈ 200ms/word, rounded up for a calm pace).
const HOLD_PER_WORD_MS = 110;
// Clamp so a one-liner still lingers and a long message doesn't overstay.
const HOLD_MIN_MS = 2200;
const HOLD_MAX_MS = 4200;

/** Word count of the body copy that sets the reading load. */
export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Hold (ms) the screen stays fully visible, scaled to the body copy's length.
 * Pass the end screen's supporting line; the heading is covered by HOLD_BASE_MS.
 */
export function holdForText(body: string): number {
  const ms = HOLD_BASE_MS + wordCount(body) * HOLD_PER_WORD_MS;
  return Math.max(HOLD_MIN_MS, Math.min(HOLD_MAX_MS, ms));
}
