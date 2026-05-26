/** @type {import('tailwindcss').Config} */
const color = (name) => `var(--color-${name})`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: color("surface-hover"),
          100: color("surface-active"),
          200: color("line-bubble"),
          300: color("line-active"),
          400: color("accent-cyan"),
          500: color("brand-strong"),
          600: color("brand-primary"),
          700: color("brand-dark"),
          800: color("brand-dark"),
          900: color("brand-dark"),
        },
        accent: {
          cyan: color("accent-cyan"),
          green: color("accent-green"),
          500: color("accent-green"),
          600: color("brand-strong"),
        },
        surface: {
          app: color("surface-app"),
          sidebar: color("surface-sidebar"),
          chat: color("surface-chat"),
          card: color("surface-card"),
          hover: color("surface-hover"),
          active: color("surface-active"),
          selected: color("surface-selected"),
        },
        ink: {
          main: color("ink-main"),
          secondary: color("ink-secondary"),
          muted: color("ink-muted"),
          inverse: color("ink-inverse"),
        },
        line: {
          main: color("line-main"),
          light: color("line-light"),
          input: color("line-input"),
          divider: color("line-divider"),
          active: color("line-active"),
          bubble: color("line-bubble"),
        },
      },
      backgroundImage: {
        "teal-cyan": "var(--gradient-teal-cyan)",
      },
      boxShadow: {
        teal: "var(--shadow-teal-soft)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
