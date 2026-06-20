/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens ported from the team's Lovable design ("Remix of LastOne Home
// Screen"). Source: lovable-design-reference/src/styles.css.
//
// The Lovable file defines colors in OKLCH, which React Native / NativeWind does
// not support. Every value below is the exact sRGB-hex conversion of the original
// OKLCH token (computed via proper OKLab→sRGB math), so the palette is a faithful
// match to the design — not an eyeball approximation.
//
// Theme: "Minimal white, warm accent" — off-white background, white cards, a
// vivid lime-green primary, and a warm orange used for craving/SOS surfaces.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        background: "#FBFAF9",            // warm off-white app background
        foreground: "#15110D",            // near-black primary text
        card: "#FFFFFF",
        "card-foreground": "#15110D",

        // Primary — the signature lime green ("Hi Anish.", primary actions)
        primary: {
          DEFAULT: "#7FC200",
          foreground: "#0D140B",
          glow: "#9CD242",
        },

        secondary: {
          DEFAULT: "#F7F5F1",
          foreground: "#1E1A16",
        },

        muted: {
          DEFAULT: "#F3F1EF",
          foreground: "#76706C",          // section labels, muted body text
        },

        // Accent / craving — warm orange (SOS button, craving FAB)
        accent: {
          DEFAULT: "#FFF1EB",
          foreground: "#A10C00",
        },
        craving: {
          DEFAULT: "#F15025",             // gradient start
          to: "#FF7A3D",                  // gradient end
        },

        destructive: {
          DEFAULT: "#F51B3D",
          foreground: "#FEFBF8",
        },

        success: "#0E9254",
        warning: "#E19100",

        // "Your body" pill green (already hex in the source)
        "dark-green": "#CEF17B",

        // Calm green used for hover/active content surfaces
        "surface-accent": {
          DEFAULT: "#4E9A52",
          foreground: "#F9FDF6",
          from: "#67AC5F",                // gradient start
          to: "#268255",                  // gradient end
        },

        // Dark "chip" pills
        chip: {
          DEFAULT: "#0F0D0B",
          foreground: "#FAF8F5",
        },

        border: "#E9E7E5",
        input: "#F0EEEB",
        ring: "#F84527",
      },

      // Base radius is 1.25rem (20px) in the design; scale mirrors styles.css.
      borderRadius: {
        sm: "16px",   // calc(radius - 4px)
        md: "18px",   // calc(radius - 2px)
        lg: "20px",   // radius
        xl: "24px",   // calc(radius + 4px)
        "2xl": "28px",
        "3xl": "32px",
        "4xl": "36px",
      },

      fontFamily: {
        // Space Grotesk for display/headings, DM Sans for body.
        display: ["SpaceGrotesk_700Bold"],
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
        // Playfair Display (serif) — tool-family card titles, matching the design's
        // `fontFamily: "Playfair Display"; fontWeight: 600`.
        serif: ["PlayfairDisplay_600SemiBold"],
      },
    },
  },
  plugins: [],
}
