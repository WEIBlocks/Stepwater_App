import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { theme } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;

export interface ChartDataPoint {
  label: string;
  value: number;
  labelSecondary?: string; // e.g., the date
  isHighlight?: boolean;
}

interface ChartProps {
  data: ChartDataPoint[];
  height?: number;
  width?: number;
  barColor?: string;
  activeBarColor?: string;
  formatValue?: (value: number) => string;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  maxScaleValue?: number;
}

const Chart: React.FC<ChartProps> = ({
  data,
  height = 200,
  barColor = theme.colors.primary,
  activeBarColor,
  formatValue = (v) => v.toString(),
  selectedIndex,
  onSelect,
  width,
  maxScaleValue,
}) => {
  const chartWidth = width || CHART_WIDTH;
  const GAP = 4;
  const BAR_WIDTH = (chartWidth - 32) / Math.max(data.length, 1);

  // Use the larger of: provided max scale value (goal), OR the highest value in the data
  // This ensures that if we exceed the goal, the chart scales down to fit the high value.
  // But if values are low, the chart is scaled to the goal (so bars look small).
  const dataMax = Math.max(...data.map(d => d.value), 0);
  const maxValue = Math.max(dataMax, maxScaleValue || 1, 1);

  const getBarHeight = (value: number) => {
    return (value / maxValue) * (height - 40);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={height}>
          {data.map((item, index) => {
            const barHeight = getBarHeight(item.value);
            // Better x calculation to center bars if count is low, or just spread them:
            // For now, simple spread:
            const effectiveBarWidth = (chartWidth - (GAP * (data.length - 1))) / data.length;
            const barX = index * (effectiveBarWidth + GAP);

            const y = height - 20 - barHeight;
            const isActive = selectedIndex === index;
            const finalBarColor = isActive && activeBarColor ? activeBarColor : (item.isHighlight ? activeBarColor || barColor : barColor);

            return (
              <G key={index} onPress={() => onSelect?.(index)}>
                <Rect
                  x={barX}
                  y={y}
                  width={effectiveBarWidth}
                  height={barHeight}
                  fill={finalBarColor}
                  rx={4}
                  opacity={isActive || selectedIndex === undefined ? 1 : 0.6}
                />

                {/* Value Label (only if active or specifically highlighted?) -> Let's show if active or value > 0 and enough space? 
                    The original showed if value > 0. Let's keep it simple. */}
                {item.value > 0 && (
                  <SvgText
                    x={barX + effectiveBarWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill={theme.colors.textSecondary}
                    textAnchor="middle"
                  >
                    {formatValue(item.value)}
                  </SvgText>
                )}

                {/* X Axis Label */}
                <SvgText
                  x={barX + effectiveBarWidth / 2}
                  y={height - 5}
                  fontSize="10"
                  fill={isActive ? theme.colors.textPrimary : theme.colors.textSecondary}
                  textAnchor="middle"
                  fontWeight={isActive ? "bold" : "normal"}
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  title: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chart;

