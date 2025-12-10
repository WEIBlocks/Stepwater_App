// Temporary type declarations until node_modules are installed
// Run 'npm install' to install dependencies

declare module 'react-native-gesture-handler' {
  import { Component, ReactNode } from 'react';
  import { ViewStyle, StyleProp, Animated } from 'react-native';

  export interface GestureHandlerRootViewProps {
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }

  export class GestureHandlerRootView extends Component<GestureHandlerRootViewProps> {}

  export interface SwipeableProps {
    renderRightActions?: (
      progressAnimatedValue: Animated.AnimatedInterpolation<number>,
      dragAnimatedValue: Animated.AnimatedInterpolation<number>,
      swipeable: any
    ) => ReactNode;
    renderLeftActions?: (
      progressAnimatedValue: Animated.AnimatedInterpolation<number>,
      dragAnimatedValue: Animated.AnimatedInterpolation<number>,
      swipeable: any
    ) => ReactNode;
    enabled?: boolean;
    children?: ReactNode;
    overshootRight?: boolean;
    overshootLeft?: boolean;
    friction?: number;
    overshootFriction?: number;
  }

  export class Swipeable extends Component<SwipeableProps> {}
}

declare module 'react-native-safe-area-context' {
  import { Component } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface SafeAreaProviderProps {
    children?: React.ReactNode;
    initialMetrics?: any;
  }

  export interface SafeAreaViewProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
  }

  export class SafeAreaProvider extends Component<SafeAreaProviderProps> {}
  export class SafeAreaView extends Component<SafeAreaViewProps> {}
}



