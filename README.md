# Step & Water - Health Tracking App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020.svg?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.74.5-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6.svg?logo=typescript)
![License](https://img.shields.io/badge/license-Private-red.svg)

A modern, beautiful, and feature-rich cross-platform mobile app built with Expo and React Native for tracking daily steps and water intake.

[Features](#-features) • [Installation](#-getting-started) • [Documentation](#-documentation) • [Building](#-building-for-production) • [Support](#-support)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screens & Navigation](#-screens--navigation)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Building for Production](#-building-for-production)
- [Permissions](#-permissions)
- [Data Storage](#-data-storage)
- [Known Limitations](#-known-limitations)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Step & Water** is a comprehensive health tracking application that combines step counting and water intake monitoring into a single, delightful user experience. Built with modern React Native and Expo, the app provides real-time activity tracking, beautiful visualizations, smart reminders, and seamless data synchronization.

### Key Highlights

- 🚶 **Real-time Step Tracking** - Uses device sensors to track your daily steps
- 💧 **Water Intake Monitoring** - Log water consumption with quick presets or custom amounts
- 📊 **Visual Progress Indicators** - Beautiful animated SVG rings showing progress toward goals
- 🎯 **Customizable Goals** - Set personalized daily step and water goals
- 📈 **History & Analytics** - View your activity history with weekly charts
- 🔔 **Smart Reminders** - Configurable water reminders with repeat schedules
- ☁️ **Cloud Sync** - Optional Supabase integration for data synchronization
- 📱 **Cross-Platform** - Works seamlessly on both iOS and Android

---

## 🌟 Features

### Core Functionality

#### Step Tracking
- **Real-time Step Counter**: Track your daily steps using device pedometer sensors
- **Live Updates**: Steps update in real-time as you walk
- **Distance Calculation**: Automatic distance calculation based on steps
- **Calorie Estimation**: Estimated calories burned based on activity
- **Background Tracking**: Best-effort background step tracking (platform dependent)
- **Pause/Resume**: Ability to pause and resume step tracking

#### Water Intake Tracking
- **Quick Presets**: Fast water logging with preset buttons (100ml, 200ml, 300ml)
- **Custom Amounts**: Log any custom water amount
- **Daily Goal Tracking**: Visual progress toward daily water goal
- **Water Log History**: Detailed log of all water consumption entries
- **Automatic Daily Reset**: Daily totals reset at midnight

#### Visual Progress
- **Animated Progress Rings**: Beautiful SVG circular progress indicators
- **Smooth Animations**: Powered by React Native Reanimated for fluid interactions
- **Achievement Celebrations**: Confetti animations when goals are reached
- **Weekly Charts**: Visual representation of weekly activity trends

#### Goal Management
- **Customizable Step Goals**: Set your daily step target (default: 10,000)
- **Customizable Water Goals**: Set your daily water target (default: 2,000ml)
- **Goal Progress Tracking**: Real-time progress updates toward goals
- **Achievement Notifications**: Celebrate when you reach your goals

#### History & Analytics
- **Daily History**: View detailed daily summaries of steps and water
- **Weekly Charts**: Visual charts showing weekly trends
- **Export Functionality**: Export your data as JSON
- **Import Functionality**: Restore data from JSON backup

#### Reminders
- **Customizable Reminders**: Set multiple water reminder times
- **Repeat Schedules**: Configure reminders for specific days of the week
- **Local Notifications**: Push notifications to remind you to drink water
- **Enable/Disable**: Toggle reminders on or off

### UX Enhancements

- **Achievement Celebrations**: Confetti animations with Lottie when goals are reached
- **Smooth Animations**: Polished micro-interactions powered by React Native Reanimated v3
- **Haptic Feedback**: Tactile responses for better user experience
- **Dark Mode Ready**: Theme system prepared for light/dark mode switching
- **Responsive Design**: Beautiful UI that works on all screen sizes
- **Error Handling**: Graceful error boundaries and fallbacks
- **Loading States**: Skeleton loaders and smooth transitions
- **Onboarding Flow**: Guided onboarding for new users
- **Profile Setup**: User profile configuration with gender, height, and weight

### Advanced Features

- **Offline Support**: Full functionality works without internet connection
- **Cloud Sync**: Optional Supabase integration for data synchronization across devices
- **Data Export/Import**: Backup and restore your data
- **Foreground Service** (Android): Persistent notification for step tracking
- **Background Tasks**: Background step counting where supported
- **Error Recovery**: Automatic data recovery and restoration
- **Unit Conversion**: Support for metric and imperial units

---

## 🛠 Tech Stack

### Core Framework
- **Expo SDK 51** - React Native framework for cross-platform development
- **React Native 0.74.5** - Mobile app framework
- **TypeScript 5.3.3** - Type-safe JavaScript
- **React 18.2.0** - UI library

### Navigation & Routing
- **React Navigation v6** - Navigation library
  - `@react-navigation/native` - Core navigation
  - `@react-navigation/native-stack` - Stack navigator
  - `@react-navigation/bottom-tabs` - Tab navigator

### State Management
- **Zustand 4.5.0** - Lightweight state management

### Animations & Graphics
- **React Native Reanimated v3** - High-performance animations
- **React Native Gesture Handler** - Gesture recognition
- **React Native SVG 15.2.0** - SVG rendering for charts and progress rings
- **Lottie React Native 6.7.0** - Lottie animations

### Storage & Data
- **AsyncStorage 1.23.1** - Local persistent storage
- **Supabase JS 2.86.0** - Cloud database and authentication (optional)
- **UUID 9.0.1** - Unique identifier generation

### Platform Features
- **Expo Sensors 13.0.1** - Device sensors (Pedometer)
- **Expo Notifications 0.28.0** - Push notifications
- **Expo Haptics 13.0.1** - Haptic feedback
- **Expo File System 17.0.1** - File operations
- **Expo Sharing 12.0.1** - Share files
- **Expo Crypto 13.0.2** - Cryptographic functions

### UI Components
- **Expo Vector Icons 14.1.0** - Icon library
- **Expo Linear Gradient 13.0.2** - Gradient backgrounds
- **React Native Safe Area Context** - Safe area handling
- **React Native Screens** - Native screen components

### Utilities
- **date-fns 3.0.0** - Date manipulation and formatting
- **React Freeze** - Performance optimization

### Development Tools
- **TypeScript** - Type checking
- **Babel** - JavaScript compiler
- **EAS Build** - Cloud build service

---

## 📱 Screens & Navigation

### Navigation Structure

The app uses a bottom tab navigator with the following screens:

1. **Home** - Main dashboard with step and water progress
2. **History** - Activity history and weekly charts
3. **Goals** - Goal configuration screen
4. **Reminders** - Reminder management
5. **Settings** - App settings and preferences

### Screen Details

#### 1. Splash Screen
- App initialization
- Data restoration
- Permission requests
- Supabase connection test

#### 2. Onboarding Screen
- Welcome slides
- Feature introduction
- Permission requests
- Smooth transitions

#### 3. Home Screen (Dashboard)
- **Step Progress Ring**: Animated circular progress for daily steps
- **Water Progress Ring**: Animated circular progress for daily water
- **Stat Cards**: Steps, distance, calories, water consumed
- **Floating Action Button**: Quick water logging
- **Today's Summary**: Current day statistics
- **Goal Progress**: Visual indicators for goal completion

#### 4. Add Water Modal
- Quick preset buttons (100ml, 200ml, 300ml)
- Custom amount input
- Recent amounts display
- Smooth animations

#### 5. History Screen
- Daily history list
- Weekly chart visualization
- Date filtering
- Export functionality
- Swipe-to-delete (future)

#### 6. Goals Screen
- Step goal configuration
- Water goal configuration
- Goal recommendations
- Progress indicators

#### 7. Reminders Screen
- List of active reminders
- Add new reminder
- Edit existing reminder
- Enable/disable reminders
- Day-of-week selection

#### 8. Settings Screen
- Unit preferences (metric/imperial)
- Theme settings (light/dark/auto)
- Notification preferences
- Data export/import
- About section
- Privacy settings

#### 9. Profile Screen
- User profile information
- Gender selection
- Height and weight configuration
- Profile completion status

#### 10. Profile Setup Screen
- Initial profile configuration
- Guided setup flow
- Data collection for statistics

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **iOS Simulator** (Mac only) - Requires Xcode
- **Android Emulator** - Requires Android Studio
- **Expo Go App** (optional) - For testing on physical devices

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Stepwater_App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables** (optional):
   ```bash
   cp env.example .env
   # Edit .env and add your Supabase credentials (if using cloud sync)
   ```

4. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

### First Run

1. The app will show an onboarding screen for first-time users
2. Grant necessary permissions:
   - **Motion & Fitness** (iOS) or **Activity Recognition** (Android) for step tracking
   - **Notifications** for water reminders
3. Complete profile setup (optional)
4. Set your daily goals
5. Start tracking!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory (copy from `env.example`):

```env
# Supabase Configuration (Optional)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Environment
NODE_ENV=development
```

**Note:** The app works perfectly without Supabase - it will use local storage only if Supabase is not configured.

### Supabase Setup (Optional)

If you want to enable cloud sync:

1. **Create a Supabase project** at [https://app.supabase.com](https://app.supabase.com)
2. **Get your API keys** from Settings → API
3. **Create database tables** (see `SUPABASE_SETUP.md` for SQL scripts)
4. **Add credentials** to `.env` file
5. **Restart Expo** after configuration

For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

### App Configuration

The app configuration is in `app.config.js`:

- **App Name**: "Step & Water"
- **Bundle ID**: `com.stepwater.app` (iOS)
- **Package Name**: `com.stepwater.app` (Android)
- **Version**: 1.0.0
- **Orientation**: Portrait

### EAS Build Configuration

EAS build configuration is in `eas.json`:

- **Development**: Development client builds
- **Preview**: Internal distribution builds
- **Production**: Production builds with auto-increment

---

## 📁 Project Structure

```
Stepwater_App/
├── assets/                 # Images, icons, Lottie animations
├── ios/                    # iOS native code and configuration
│   ├── StepWater/         # iOS app source
│   └── Pods/              # CocoaPods dependencies
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AchievementModal.tsx
│   │   ├── Chart.tsx
│   │   ├── FAB.tsx
│   │   ├── GoalRing.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryList.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── PresetButtons.tsx
│   │   ├── StatCard.tsx
│   │   └── WeeklyProgress.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useHydration.ts
│   │   ├── usePedometer.ts
│   │   └── useReminders.ts
│   ├── navigation/         # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/            # Screen components
│   │   ├── AddWaterModal.tsx
│   │   ├── GenderSelectionScreen.tsx
│   │   ├── GoalsScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── RemindersScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── services/           # Business logic services
│   │   ├── backgroundTask.ts
│   │   ├── exportService.ts
│   │   ├── foregroundNotification.ts
│   │   ├── foregroundServiceManager.ts
│   │   ├── notifications.ts
│   │   ├── pedometer.ts
│   │   ├── pedometerService.ts
│   │   ├── restoreService.ts
│   │   ├── storage.ts
│   │   ├── supabase.ts
│   │   ├── supabaseStorage.ts
│   │   └── supabaseTest.ts
│   ├── state/              # State management
│   │   └── store.ts        # Zustand store
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Utility functions
│       ├── constants.ts
│       ├── errorBoundary.tsx
│       ├── formatting.ts
│       ├── progressBar.ts
│       ├── responsive.ts
│       ├── statistics.ts
│       ├── theme.ts
│       └── uuid.ts
├── App.tsx                 # Root component
├── app.config.js           # Expo configuration
├── babel.config.js         # Babel configuration
├── eas.json                # EAS build configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Environment variables template
├── README.md               # This file
├── SUPABASE_SETUP.md       # Supabase setup guide
├── PRODUCTION_BUILD.md     # Production build guide
└── PRODUCTION_CHECKLIST.md # Production checklist
```

### Key Directories

- **`src/components/`**: Reusable UI components (GoalRing, StatCard, FAB, etc.)
- **`src/screens/`**: Screen components for each app screen
- **`src/hooks/`**: Custom React hooks (usePedometer, useHydration, useReminders)
- **`src/services/`**: Business logic and external service integrations
- **`src/state/`**: Zustand store for global state management
- **`src/utils/`**: Helper functions and utilities
- **`src/types/`**: TypeScript type definitions

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited functionality)
npm run web

# Build for Android (Preview)
npm run build:android:preview

# Build for Android (Production)
npm run build:android:production

# Build for iOS (Preview)
npm run build:ios:preview

# Build for iOS (Production)
npm run build:ios:production

# Submit to Google Play Store
npm run submit:android

# Submit to Apple App Store
npm run submit:ios
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Functional Components**: Use hooks instead of class components
- **Naming Conventions**: 
  - Components: PascalCase (e.g., `GoalRing.tsx`)
  - Hooks: camelCase with "use" prefix (e.g., `usePedometer.ts`)
  - Services: PascalCase (e.g., `StorageService`)
  - Utils: camelCase (e.g., `formatting.ts`)
- **File Organization**: Group related files in appropriate directories

### Adding New Features

1. **Create components** in `src/components/`
2. **Add screens** in `src/screens/`
3. **Create hooks** in `src/hooks/` for business logic
4. **Add services** in `src/services/` for external integrations
5. **Update types** in `src/types/index.ts` if needed
6. **Update store** in `src/state/store.ts` for global state
7. **Follow existing patterns** for consistency

### Testing

- **Physical Device**: Test step tracking on a physical device (not emulator)
- **Permissions**: Test with permissions granted and denied
- **Offline Mode**: Test functionality without internet connection
- **Error Handling**: Test error scenarios and edge cases

### Debugging

- **React Native Debugger**: Use for debugging React components
- **Expo Dev Tools**: Built-in debugging tools in Expo Go
- **Console Logs**: Check console for errors and warnings
- **Device Logs**: 
  - Android: `adb logcat`
  - iOS: Xcode console

---

## 🏗 Building for Production

### Prerequisites

1. **EAS CLI** - Install globally:
   ```bash
   npm install -g eas-cli
   ```

2. **EAS Account** - Sign up at [https://expo.dev](https://expo.dev) and login:
   ```bash
   eas login
   ```

3. **App Assets** (recommended):
   - `assets/icon.png` - 1024x1024px PNG (app icon)
   - `assets/splash.png` - 2048x2048px PNG (splash screen)

### Build Steps

1. **Prepare Assets** (if available):
   - Create app icon (1024x1024px)
   - Create splash screen (2048x2048px)
   - Place in `assets/` folder

2. **Configure Environment** (if using Supabase):
   - Create `.env` file with Supabase credentials
   - Ensure `.env` is in `.gitignore`

3. **Update Version**:
   - Update `version` in `app.config.js`
   - Version code auto-increments in production builds

4. **Build**:
   ```bash
   # Android Preview
   eas build --platform android --profile preview
   
   # Android Production
   eas build --platform android --profile production
   
   # iOS Preview
   eas build --platform ios --profile preview
   
   # iOS Production
   eas build --platform ios --profile production
   ```

5. **Test Build**:
   - Download build from EAS dashboard
   - Install on physical device
   - Test all features

6. **Submit to Stores**:
   ```bash
   # Google Play Store
   eas submit --platform android --profile production
   
   # Apple App Store
   eas submit --platform ios --profile production
   ```

For detailed production build instructions, see [PRODUCTION_BUILD.md](./PRODUCTION_BUILD.md) and [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

---

## 🔐 Permissions

### iOS Permissions

The app requires the following permissions on iOS:

- **Motion & Fitness** (`NSMotionUsageDescription`): Required for step tracking
- **Health Share** (`NSHealthShareUsageDescription`): For accessing health data
- **Health Update** (`NSHealthUpdateUsageDescription`): For updating health data
- **Notifications**: For water reminders

Configured in `app.config.js` → `ios.infoPlist`.

### Android Permissions

The app requires the following permissions on Android:

- **ACTIVITY_RECOGNITION**: Required for step tracking (Android 10+)
- **POST_NOTIFICATIONS**: For water reminders (Android 13+)
- **FOREGROUND_SERVICE**: For persistent step tracking notification
- **FOREGROUND_SERVICE_HEALTH**: For health-related foreground service
- **WAKE_LOCK**: For background step tracking
- **RECEIVE_BOOT_COMPLETED**: For restarting services after device reboot
- **ACCESS_FINE_LOCATION**: For distance calculation (optional)

Configured in `app.config.js` → `android.permissions`.

### Permission Handling

- Permissions are requested during onboarding
- Users can grant/deny permissions
- App gracefully handles denied permissions with fallbacks
- Permission status is checked before using features

---

## 💾 Data Storage

### Storage Strategy

The app uses a **hybrid storage approach**:

1. **Local Storage (AsyncStorage)**: 
   - Always used for immediate access
   - Works offline
   - Fast read/write operations
   - Stores: Daily summaries, water logs, goals, reminders, settings

2. **Cloud Storage (Supabase)** - Optional:
   - Used for data synchronization across devices
   - Requires internet connection
   - Automatic sync when configured
   - Stores: Same data as local storage

### Data Models

#### DaySummary
```typescript
{
  date: string;           // YYYY-MM-DD
  steps: number;
  stepDistanceMeters?: number;
  calories?: number;
  waterMl: number;
  notes?: string;
}
```

#### WaterLogItem
```typescript
{
  id: string;             // UUID
  date: string;           // YYYY-MM-DD
  time: string;           // ISO time
  amountMl: number;
}
```

#### UserGoals
```typescript
{
  dailySteps: number;     // Default: 10,000
  dailyWaterMl: number;   // Default: 2,000
}
```

#### Reminder
```typescript
{
  id: string;
  time: string;           // HH:mm format
  enabled: boolean;
  daysOfWeek: number[];  // 0-6, Sunday-Saturday
}
```

### Data Export/Import

- **Export**: Export all data as JSON file
- **Import**: Restore data from JSON backup
- **Location**: Settings → Data Management

### Data Persistence

- Data persists across app restarts
- Daily summaries reset at midnight
- Water logs are append-only
- Goals and settings persist until changed

---

## ⚠️ Known Limitations

### Platform Limitations

1. **Step Tracking**:
   - Requires physical device (not available in emulator)
   - Accuracy varies by device manufacturer
   - Background tracking is best-effort on managed Expo workflow
   - Some Android devices may require Google Fit integration for reliable background counting

2. **Background Updates**:
   - Limited by Android battery optimization
   - iOS background execution is restricted
   - Foreground service is Android-only (iOS doesn't support)

3. **Notifications**:
   - Notification permissions can be denied
   - Background notifications may be delayed on some devices
   - Do Not Disturb mode may suppress notifications

4. **Supabase Sync**:
   - Requires internet connection
   - Optional feature - app works without it
   - Sync may fail if credentials are invalid

### Technical Limitations

1. **Expo Managed Workflow**:
   - Some native features require ejecting to bare workflow
   - Background step counting is limited
   - HealthKit/Google Fit integration requires native modules

2. **Performance**:
   - Large data sets may impact performance
   - Charts may lag with extensive history
   - Animations may be slower on low-end devices

### Future Improvements

- [ ] Dark mode implementation
- [ ] HealthKit/Google Fit integration
- [ ] Social sharing features
- [ ] Weekly/monthly statistics
- [ ] Achievement badges system
- [ ] Custom themes
- [ ] Widget support (iOS/Android)
- [ ] Export to CSV/PDF
- [ ] Multi-language support
- [ ] Apple Watch support
- [ ] Wear OS support

---

## 🐛 Troubleshooting

### Common Issues

#### App Won't Start
- **Solution**: Clear cache and restart
  ```bash
  npm start -- --clear
  ```

#### Step Tracking Not Working
- **Solution**: 
  - Test on physical device (not emulator)
  - Grant Motion & Fitness permission (iOS) or Activity Recognition (Android)
  - Check if pedometer is available on your device
  - Restart the app

#### Notifications Not Appearing
- **Solution**:
  - Grant notification permission
  - Check device notification settings
  - Ensure reminders are enabled in app
  - Check Do Not Disturb mode

#### Supabase Connection Errors
- **Solution**:
  - Verify `.env` file has correct credentials
  - Restart Expo after changing `.env`
  - Check Supabase project is active
  - Verify tables are created in Supabase dashboard
  - App works without Supabase - check if it's optional

#### Build Fails
- **Solution**:
  - Check EAS build logs in dashboard
  - Verify `app.config.js` syntax is correct
  - Ensure all dependencies are in `package.json`
  - Check for TypeScript errors

#### Foreground Service Not Working (Android)
- **Solution**:
  - Test on physical device (not emulator)
  - Check notification permissions are granted
  - Verify Android version is 8.0+ (API 26+)
  - Check battery optimization settings

#### Data Not Persisting
- **Solution**:
  - Check AsyncStorage permissions
  - Verify storage service is working
  - Check for storage errors in console
  - Try exporting and importing data

### Getting Help

1. **Check Documentation**:
   - Read this README thoroughly
   - Check `SUPABASE_SETUP.md` for Supabase issues
   - Review `PRODUCTION_BUILD.md` for build issues

2. **Check Logs**:
   - React Native Debugger
   - Expo Dev Tools
   - Device logs (`adb logcat` for Android)

3. **Common Solutions**:
   - Clear cache: `npm start -- --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Reset Metro bundler: `npm start -- --reset-cache`

---

## 🤝 Contributing

This is a private project. For questions or issues:

1. Check existing documentation
2. Review code comments
3. Contact the development team

### Development Guidelines

- Follow existing code patterns
- Write TypeScript with proper types
- Add error handling for all async operations
- Test on both iOS and Android
- Test with permissions granted and denied
- Test offline functionality

---

## 📄 License

This project is **private and proprietary**. All rights reserved.

---

## 📚 Documentation

Additional documentation files:

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase setup guide
- **[PRODUCTION_BUILD.md](./PRODUCTION_BUILD.md)** - Production build instructions
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-production checklist
- **[context.md](./context.md)** - Project context and requirements

---

## 🎨 Design & UX

### Color Scheme
- **Primary Color**: Indigo (#6366f1)
- **Success**: Green
- **Warning**: Yellow/Orange
- **Error**: Red
- **Background**: Light/Dark theme support

### Typography
- System fonts for optimal performance
- Responsive sizing for different screen sizes

### Animations
- Smooth transitions using React Native Reanimated
- Haptic feedback for important interactions
- Lottie animations for celebrations
- SVG animations for progress indicators

---

## 📊 Performance

### Optimizations

- **Native Driver**: Animations use native driver for 60fps
- **React.memo**: Components optimized with memoization
- **Lazy Loading**: Screens and components loaded on demand
- **Efficient Storage**: Async operations don't block UI
- **SVG Rendering**: Efficient chart and progress ring rendering

### Best Practices

- Test on low-end devices
- Monitor performance with React DevTools
- Optimize images and assets
- Minimize re-renders
- Use appropriate data structures

---

## 🔒 Security & Privacy

### Data Privacy

- All data stored locally by default
- Optional cloud sync with Supabase
- No data shared with third parties
- User controls data export/import

### Security Measures

- Environment variables for sensitive data
- `.env` file excluded from git
- Secure UUID generation
- Error handling prevents data leaks

---

## 🌐 Platform Support

### iOS
- **Minimum Version**: iOS 13.0+
- **Recommended**: iOS 15.0+
- **Features**: Full feature support
- **Testing**: iOS Simulator and physical devices

### Android
- **Minimum SDK**: 23 (Android 6.0)
- **Target SDK**: 34 (Android 14)
- **Recommended**: Android 8.0+ (API 26+)
- **Features**: Full feature support including foreground service
- **Testing**: Android Emulator and physical devices

---

## 📞 Support

For support and questions:

- **Documentation**: Check this README and other docs
- **Issues**: Review troubleshooting section
- **Development**: Contact the development team

---

## 🙏 Acknowledgments

Built with:
- [Expo](https://expo.dev) - React Native framework
- [React Native](https://reactnative.dev) - Mobile app framework
- [Supabase](https://supabase.com) - Backend as a Service (optional)
- [React Navigation](https://reactnavigation.org) - Navigation library
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Animation library

---

<div align="center">

**Built with ❤️ using Expo and React Native**

[Back to Top](#step--water---health-tracking-app)

</div>
