# Step & Water - Health Tracking App

A modern, beautiful, and feature-rich cross-platform mobile app built with Expo and React Native for tracking daily steps and water intake.

## 🌟 Features

### Core Functionality
- **Real-time Step Counter**: Track your daily steps using device sensors
- **Water Intake Tracker**: Log water consumption with quick presets or custom amounts
- **Visual Progress Rings**: Beautiful animated SVG rings showing your progress toward daily goals
- **Goal Setting**: Customize your daily step and water goals
- **History Tracking**: View your activity history with weekly charts
- **Smart Reminders**: Set customizable water reminders with repeat schedules

### UX Enhancements
- **Achievement Celebrations**: Confetti animations when you reach your goals
- **Smooth Animations**: Polished micro-interactions powered by React Native Reanimated
- **Haptic Feedback**: Tactile responses for better user experience
- **Dark Mode Ready**: Theme system prepared for light/dark mode switching
- **Responsive Design**: Beautiful UI that works on all screen sizes
- **Error Handling**: Graceful error boundaries and fallbacks

## 🛠 Tech Stack

- **Framework**: Expo SDK 51 (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Animations**: React Native Reanimated v3
- **Charts**: React Native SVG
- **Storage**: AsyncStorage
- **Sensors**: Expo Sensors (Pedometer)
- **Notifications**: Expo Notifications
- **Haptics**: Expo Haptics

## 📱 Screenshots

The app includes:
- Onboarding flow with smooth transitions
- Home dashboard with animated progress rings
- History screen with weekly charts
- Goals configuration screen
- Reminder management
- Settings with theme customization

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd step-counter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
expo start
```

4. Run on device/simulator:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GoalRing.tsx    # Animated progress ring
│   ├── StatCard.tsx    # Stat display cards
│   ├── FAB.tsx         # Floating action button
│   ├── AchievementModal.tsx  # Goal celebration modal
│   └── ...
├── screens/            # Screen components
│   ├── HomeScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── GoalsScreen.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── usePedometer.ts
│   ├── useHydration.ts
│   └── useReminders.ts
├── services/           # Business logic services
│   ├── pedometer.ts
│   ├── storage.ts
│   └── notifications.ts
├── state/              # State management
│   └── store.ts        # Zustand store
├── navigation/         # Navigation setup
│   └── AppNavigator.tsx
├── utils/              # Utilities
│   ├── constants.ts
│   ├── formatting.ts
│   └── theme.ts
└── types/              # TypeScript types
    └── index.ts
```

## 🎨 Key Components

### GoalRing
Animated SVG circular progress indicator showing step/water progress toward daily goals.

### AchievementModal
Celebration modal with confetti animation that appears when goals are reached.

### StatCard
Elevated card component for displaying stats with smooth animations and haptic feedback.

## ⚙️ Configuration

### Permissions

The app requires the following permissions:

**iOS:**
- Motion & Fitness (for step tracking)
- Notifications (for reminders)

**Android:**
- ACTIVITY_RECOGNITION (for step tracking)
- POST_NOTIFICATIONS (Android 13+)

These are configured in `app.config.js`.

## 🔧 Development

### Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- Consistent naming conventions
- Component-based architecture

### Adding Features

1. Create components in `src/components/`
2. Add screens in `src/screens/`
3. Create hooks in `src/hooks/` for business logic
4. Use Zustand store for global state
5. Follow existing patterns for consistency

## 📝 Data Storage

All data is stored locally using AsyncStorage:
- Daily summaries (steps, water, distance, calories)
- Water log entries
- User goals
- Reminders
- Settings

Data can be exported/imported via JSON in Settings.

## 🐛 Known Limitations

- Background step tracking depends on device capabilities
- Some Android devices may require Google Fit integration for reliable tracking
- Pedometer accuracy varies by device
- Background step counting is best-effort on managed Expo workflow

## 🚧 Future Enhancements

- [ ] Dark mode implementation
- [ ] HealthKit/Google Fit integration
- [ ] Social sharing features
- [ ] Weekly/monthly statistics
- [ ] Achievement badges
- [ ] Custom themes
- [ ] Widget support
- [ ] Export to CSV/PDF

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development Notes

### Testing on Device

For best results, test step counting on a physical device:
- iOS: Motion & Fitness data requires physical device
- Android: Step sensor accuracy varies by manufacturer

### Performance

- Animations use native driver (Reanimated)
- Storage operations are async and non-blocking
- Charts render efficiently with SVG
- Components are optimized with React.memo where needed

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

Built with ❤️ using Expo and React Native
