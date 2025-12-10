# Project: Step & Water — Expo React Native App

**Short description**
A modern, energetic, and aesthetic cross-platform mobile app (Android + iOS) built with Expo + React Native. Combines a step counter (activity tracking) and water consumption tracker into a single delightful experience with high-quality graphics, SVGs, icons, and smooth animations.

---

## Goals for Cursor-generated app
- Fully functional Expo app scaffolded to run on Android and iOS.
- Clean, modern UI with energetic theme, lively micro-interactions and transitions.
- Uses device sensors for step counting (Pedometer) with graceful fallbacks.
- Persistent storage of daily steps and water logs; goal setting and reminders.
- Extensible architecture (TypeScript, hooks, modular components) so you can iterate fast.

---

## Key features
### Core
- Real-time step counter (live steps + daily total).
- Water intake tracker (ml/oz, configurable daily goal).
- Combined home dashboard showing step progress ring and water progress ring.
- Quick-add water (preset buttons + custom amount).
- Step & water goals, weekly/monthly history.

### UX & polish
- Onboarding & permission prompts.
- Beautiful animated progress rings (SVG + Reanimated) and micro interactions.
- Lottie animations for onboarding / achievements.
- Animated stat cards, swipeable history list, haptics for interactions.
- Theme (light/dark) + color accent customization.

### Utility
- Local persistence (AsyncStorage and optional SQLite backup).
- Reminders & local notifications to drink water (configurable cadence).
- Export/Import JSON of history.
- Background step tracking support where possible (best-effort: depends on platform and APIs).

---

## Screens and flow
1. **Splash / Onboarding**
   - App logo, short animations, request permissions (Activity/Physical Activity, Notifications).
2. **Home (Dashboard)**
   - Step ring + count, Water ring + consumed/goal, quick add water floating button, today summary, step goal button.
3. **Add Water**
   - Quick presets (100ml, 200ml, 300ml) and custom input.
4. **Activity / History**
   - Daily history list, weekly chart, export button.
5. **Goals**
   - Set step goal, set water goal.
6. **Reminders**
   - Add notification reminders for water (times or repeat intervals).
7. **Settings**
   - Units (metric/imperial), theme, data backup/restore, privacy.
8. **Achievement modal**
   - Celebrate when goals reached (confetti + Lottie + sound option).

---

## UI components (atomic)
- `GoalRing` — SVG circular progress, animated with Reanimated.
- `StatCard` — Elevated card for steps, distance, calories, water.
- `FAB` — Floating action button for quick water add.
- `PresetButtons` — quick water amounts.
- `HistoryList` — swipeable list with delete, expand.
- `Chart` — weekly bar/line chart (SVG-based).
- `OnboardingSlide` — Lottie + text.

---

## Tech stack & rationale
- **Expo (managed workflow)** — fastest cross-platform dev, easy sensors and assets handling.
- **React Native + TypeScript** — type safety, modern patterns.
- **React Navigation (v6)** — industry standard navigation.
- **Reanimated (v2+/v3)** + **react-native-gesture-handler** — performant animations and gestures.
- **Lottie (lottie-react-native)** — expressive onboarding/achievement animations.
- **react-native-svg** — dynamic SVG progress rings and charts.
- **zustand** or **React Context + hooks** — lightweight state management.
- **@react-native-async-storage/async-storage** — persistent storage for user data.
- **expo-sensors (Pedometer)** — access step counts (best-effort across platforms).
- **expo-notifications** — schedule local reminders.
- **expo-secure-store** (optional) — secure data storage for privacy-sensitive tokens.
- **expo-image / expo-asset** — optimized image and asset management.
- **expo-file-system / expo-sharing** — export/import data.
- **react-native-svg-charts** or **victory-native** — charts (optional; you can also custom-draw with react-native-svg).

> Note: All package names are intentionally generic in this context.md. When you generate the app using Cursor or npm/yarn, install the latest stable versions of each package (prefer `^` semver). Example commands are included below.

---

## Permissions & platform notes
- **Android**
  - `ACTIVITY_RECOGNITION` (required for step sensors on recent Android versions).
  - `POST_NOTIFICATIONS` (Android 13+) for reminders.
- **iOS**
  - Motion & Fitness (for pedometer data).
  - Notifications permission.
  - If you later integrate HealthKit for richer data, additional entitlements are required.

**Background tracking caveats**
- Full continuous background step tracking is platform dependent. Use `expo-sensors` Pedometer for foreground or periodic reads; consider native integrations (Google Fit / Apple HealthKit) for robust background data (requires ejecting from Expo managed workflow or using Bare workflow). This project will implement best-effort background reads and clearly explain limitations.

---

## Data model (local)
```ts
// example TypeScript interfaces
interface DaySummary {
  date: string; // YYYY-MM-DD
  steps: number;
  stepDistanceMeters?: number;
  calories?: number;
  waterMl: number;
  notes?: string;
}

interface WaterLogItem {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  time: string; // ISO time
  amountMl: number;
}
```

Storage strategy: store daily DaySummary entries keyed by date, and an append-only array for `WaterLogItem`s. Persist in AsyncStorage; periodically snapshot to SQLite (expo-sqlite) for large volumes.

---

## Suggested project folder structure
```
/src
  /assets      # images, svgs, lotties
  /components  # reusable UI
  /screens     # screen components
  /hooks       # custom hooks (usePedometer, useReminders, useHydration)
  /state       # zustand or context providers
  /services    # sensor, storage, notifications, export/import
  /navigation  # react-navigation stacks
  /utils       # helpers, formatting
  app.config.js / app.json
  App.tsx
```

---

## UX details and micro-interactions
- **GoalRing**: animate from 0 -> progress on load, smooth easing using Reanimated.
- **Add water**: tapping presets triggers a subtle pop + haptic + increment animation on the water ring.
- **Achievement**: confetti + Lottie; optional share button to share achievement image.
- **Swipe history**: swipe-to-delete with confirm and undo snack.

---

## Packages (install suggestions)
Use `expo install` for Expo-compatible packages where possible, and `npm/yarn add` for JS libs.

Examples:
```
expo init StepWaterApp --template expo-template-blank-typescript
cd StepWaterApp

# Core libraries
expo install react-native-gesture-handler react-native-reanimated react-native-svg
npm install @react-navigation/native @react-navigation/native-stack
npm install zustand

# Sensors & platform features
expo install expo-sensors expo-notifications expo-asset expo-file-system @react-native-async-storage/async-storage

# Animations & visuals
npm install lottie-react-native
npm install react-native-svg-charts or npm install victory-native

# Optional
expo install expo-secure-store expo-sqlite
```

---

## Key hooks / service responsibilities
- `usePedometer` — subscribes to Pedometer updates, normalizes steps, handles platform permission logic and fallbacks.
- `useHydration` — manages water state, presets, quick-add logic, daily reset at midnight.
- `NotificationService` — schedule/cancel local notifications (expo-notifications), handle permission prompts.
- `StorageService` — read/write DaySummary / WaterLog (AsyncStorage + optional SQLite snapshot).

---

## Example implementation notes (critical snippets)
- **Pedometer subscription (concept)**
```ts
import { Pedometer } from 'expo-sensors';

// subscribe
const subscription = Pedometer.watchStepCount(result => {
  // result.steps is delta since subscription started on some platforms
});

// query historical steps for a day
Pedometer.getStepCountAsync(start, end).then(...)
```
> Keep in mind platform differences — always test on device.

- **Animated SVG ring (concept)**
Use `react-native-svg` + `react-native-reanimated` to animate strokeDashoffset.

- **Notifications**
Use `expo-notifications` to create local scheduled reminders. Persist scheduled IDs so they can be canceled.

---

## Cursor `context.md` content required fields
Below is a ready-to-use `context.md` payload for Cursor or similar generator. Copy this entire block into the tool that needs `context.md`.

---
# CONTEXT.md

Project: Step & Water — Expo React Native App

Description: A combined step counter and water consumption tracking app with an energetic, modern UI. Will be built with Expo managed workflow and TypeScript. Uses device pedometer sensor for steps and local notifications for water reminders. Persist data locally.

Primary screens: Splash/Onboarding, Dashboard (Steps + Water), Add Water modal, History, Goals, Reminders, Settings, Achievements.

Primary components: GoalRing (SVG + animated), StatCard, FAB, PresetButtons, Chart, HistoryList.

Tech stack: Expo, React Native, TypeScript, React Navigation, Reanimated, react-native-svg, **Supabase (database + auth)**, AsyncStorage (for local caching), expo-sensors, expo-notifications, zustand (or context/hooks), lottie-react-native.

Platform notes: Request Motion/Activity permissions (Android `ACTIVITY_RECOGNITION`, iOS Motion & Fitness). Use best-effort background reads; document limitations and optionally integrate Google Fit / HealthKit later.

User flows: onboarding -> permissions -> dashboard. Quick-add water via FAB. Goals reachable with animations; reminders configured in settings.

Storage: Supabase database for all persistent user data (steps history, water logs, goals, reminders). AsyncStorage used only for short‑term caching and offline mode. Export/import JSON supported.

Assets: Provide high-res SVG icons, Lottie animations for onboarding and achievement, 2-3 hero images for store screenshots.

Development recommendations:
- Use functional components + hooks.
- Centralize sensor logic in `services/pedometer`.
- Keep UI responsive; test on low-end devices.

Commands to start:
```
expo init StepWaterApp --template expo-template-blank-typescript
cd StepWaterApp
# install packages listed above
```

Edge-cases & limitations:
- Pedometer availability and accuracy is device dependent. On some Android devices you may need manufacturer-specific settings or Google Fit integration for reliable background counting.
- Background step counting is inconsistent on managed Expo; for guaranteed background sync, consider integrating native Google Fit / HealthKit or ejecting to Bare workflow.
- Notification permissions can be denied — UI must handle disabled reminders gracefully.

---

## Assets checklist (for best-looking app)
- App icon (1024x1024) + adaptive icons for Android.
- Splash images for light/dark themes.
- Lottie files: onboarding (loopable), achievement (fireworks/confetti).
- SVG icon set (tab bar icons, action icons).
- A handful of high-res background illustrations (hero cards) — optimized with expo-asset.

---

## Deliverables for Cursor to generate code
- Use this `context.md` as the project description.
- Provide `App.tsx` + navigation stacks, the `HomeScreen` with the animated rings, `AddWaterModal`, `HistoryScreen`, `SettingsScreen`.
- Implement basic `usePedometer` hook using `expo-sensors`.
- Implement local persistence using AsyncStorage.
- Hook up `expo-notifications` for reminders.
- Include sample assets (placeholder Lottie + SVG icons) and README for how to replace them.

---

## Final notes & next steps
- When you generate the app, test on physical Android and iOS devices to verify pedometer and notification behavior.
- If you want seamless background steps and Apple Health / Google Fit sync, we can add an optional integration plan that requires ejecting to Bare workflow or building native modules.

Good to go — this `context.md` contains everything Cursor needs to bootstrap a high-quality Expo app combining Step Counter + Water Tracking. Replace placeholder assets and tune animations/colors to your taste.


---

*End of context.md*

