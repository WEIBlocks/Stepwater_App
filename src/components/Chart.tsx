import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { DaySummary } from '../types';
import { formatSteps, formatWater } from '../utils/formatting';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { format, parseISO, subDays, isSameDay } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 200;
const BAR_WIDTH = (CHART_WIDTH - 32) / 7;
const GAP = 4;

interface ChartProps {
  summaries: DaySummary[];
  type?: 'steps' | 'water';
  days?: number;
  unit?: 'metric' | 'imperial';
}

const Chart: React.FC<ChartProps> = ({
  summaries,
  type = 'steps',
  days = 7,
  unit = 'metric',
}) => {
  // Get last N days
  const today = new Date();
  const dateRange = Array.from({ length: days }, (_, i) => subDays(today, i)).reverse();

  // Map summaries to dates
  const summaryMap = new Map(summaries.map(s => [s.date, s]));
  
  // Get values for each day
  const data = dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const summary = summaryMap.get(dateStr);
    const value = type === 'steps' 
      ? summary?.steps || 0
      : summary?.waterMl || 0;
    return { date, value, isToday: isSameDay(date, today) };
  });

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const goal = type === 'steps' ? 10000 : 2000;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * (CHART_HEIGHT - 40);
  };

  const getBarColor = (value: number, isToday: boolean) => {
    if (value >= goal) return theme.colors.steps; // Success green
    if (isToday) return type === 'steps' ? theme.colors.steps : theme.colors.water;
    return type === 'steps' ? theme.colors.steps : theme.colors.water;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Last {days} Days - {type === 'steps' ? 'Steps' : 'Water'}
      </Text>
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {data.map((item, index) => {
            const barHeight = getBarHeight(item.value);
            const x = 16 + index * (BAR_WIDTH + GAP);
            const y = CHART_HEIGHT - 20 - barHeight;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  fill={getBarColor(item.value, item.isToday)}
                  rx={4}
                />
                {item.value > 0 && (
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={y - 5}
                    fontSize="10"
                    fill={theme.colors.textSecondary}
                    textAnchor="middle"
                  >
                    {type === 'steps' 
                      ? formatSteps(item.value)
                      : formatWater(item.value, unit)
                    }
                  </SvgText>
                )}
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT - 5}
                  fontSize="10"
                  fill={theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {format(item.date, 'EEE')}
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

