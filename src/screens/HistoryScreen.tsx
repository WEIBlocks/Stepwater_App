import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { StorageService } from '../services/storage';
import { DaySummary } from '../types';
import { useStore } from '../state/store';
import { formatSteps, formatWater, getTodayDateString, formatDateToLocalIsoDate } from '../utils/formatting';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';
import { Header, Chart } from '../components';

type RangeFilter = 'daily' | 'weekly' | 'monthly';

// Calculate available width: Screen - ContentPad - CardPad - ChartContainerPad - ChartInternalPad
const CHART_WIDTH = SCREEN_WIDTH - (rp(20) * 2) - (rp(20) * 2) - (rp(16) * 2) - (theme.spacing.md * 2);
const CHART_HEIGHT = hp(20);

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, stepGoal, waterGoal, currentSteps, waterConsumed, loadTodayData } = useStore();
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRange, setActiveRange] = useState<RangeFilter>('daily');

  const todayKey = getTodayDateString();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    await loadTodayData(); // Ensure today's data is fresh from pedometer and DB
    const data = await StorageService.getAllDaySummaries();
    setSummaries(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const series = useMemo(() => {
    if (!summaries.length) {
      return {
        axisLabels: [] as string[],
        readableLabels: [] as string[],
        steps: [] as number[],
        water: [] as number[],
        totalSteps: 0,
        totalWater: 0,
      };
    }

    const now = new Date(todayKey);
    const axisLabels: string[] = [];
    const readableLabels: string[] = [];
    const steps: number[] = [];
    const water: number[] = [];

    // Normalize summaries and merge with live pedometer/water data for today
    // Steps come from pedometer, water comes from DB/state
    const normalized = summaries.map((s) => {
      const isToday = s.date === todayKey;
      return {
        ...s,
        dateObj: new Date(s.date),
        // For today: use live pedometer steps, live water from state
        // For history: use saved summary data
        steps: isToday ? currentSteps : (s.steps || 0),
        waterMl: isToday ? waterConsumed : (s.waterMl || 0),
      };
    });

    if (activeRange === 'daily') {
      // Last 7 days, bucketed by day
      const start = new Date(now);
      start.setDate(now.getDate() - 6);

      const byDate: Record<string, { steps: number; water: number }> = {};
      normalized.forEach((s) => {
        const d = new Date(s.dateObj);
        d.setHours(12, 0, 0, 0); // Normalize to noon for comparison
        const startNormalized = new Date(start);
        startNormalized.setHours(0, 0, 0, 0);
        const nowNormalized = new Date(now);
        nowNormalized.setHours(23, 59, 59, 999);
        if (d >= startNormalized && d <= nowNormalized) {
          const key = s.date;
          byDate[key] = {
            steps: (byDate[key]?.steps || 0) + (s.steps || 0),
            water: (byDate[key]?.water || 0) + (s.waterMl || 0),
          };
        }
      });

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = formatDateToLocalIsoDate(d);
        const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        const readable = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        axisLabels.push(weekdayShort.charAt(0));
        readableLabels.push(readable);
        steps.push(byDate[key]?.steps || 0);
        water.push(byDate[key]?.water || 0);
      }
    } else if (activeRange === 'weekly') {
      // Last 4 weeks, each point = one week block (7 days)
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);

        // Get ISO date strings for range
        const weekStartStr = formatDateToLocalIsoDate(weekStart);
        const weekEndStr = formatDateToLocalIsoDate(weekEnd);

        let weekSteps = 0;
        let weekWater = 0;

        // Sum all summaries within this week's date range
        normalized.forEach((s) => {
          const sDateStr = s.date; // Already in YYYY-MM-DD format
          if (sDateStr >= weekStartStr && sDateStr <= weekEndStr) {
            weekSteps += s.steps || 0;
            weekWater += s.waterMl || 0;
          }
        });

        const label = `W${4 - i}`;
        const readable = `${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} – ${weekEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`;

        axisLabels.push(label);
        readableLabels.push(readable);
        steps.push(weekSteps);
        water.push(weekWater);
      }
    } else {
      // Monthly: last 3 months, bucketed by calendar month
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Get ISO date strings for range
        const monthStartStr = formatDateToLocalIsoDate(monthStart);
        const monthEndStr = formatDateToLocalIsoDate(monthEnd);

        let monthSteps = 0;
        let monthWater = 0;

        // Sum all summaries within this month's date range
        normalized.forEach((s) => {
          const sDateStr = s.date; // Already in YYYY-MM-DD format
          if (sDateStr >= monthStartStr && sDateStr <= monthEndStr) {
            monthSteps += s.steps || 0;
            monthWater += s.waterMl || 0;
          }
        });

        const axisLabel = monthDate.toLocaleDateString('en-US', {
          month: 'short',
        });
        const readable = monthDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        axisLabels.push(axisLabel);
        readableLabels.push(readable);
        steps.push(monthSteps);
        water.push(monthWater);
      }
    }

    const totalSteps = steps.reduce((sum, v) => sum + v, 0);
    const totalWater = water.reduce((sum, v) => sum + v, 0);

    return { axisLabels, readableLabels, steps, water, totalSteps, totalWater };
  }, [summaries, activeRange, todayKey, currentSteps, waterConsumed]);

  const summaryStats = useMemo(() => {
    if (!summaries.length) {
      return { streak: 0, bestSteps: 0 };
    }

    // Current streak of days meeting the step goal, ending today
    const sorted = [...summaries].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    let streak = 0;
    let bestSteps = 0;

    const dateToSteps: Record<string, number> = {};
    sorted.forEach((s) => {
      // Use live pedometer data for today, saved data for history
      const steps = s.date === todayKey ? currentSteps : (s.steps || 0);
      dateToSteps[s.date] = Math.max(dateToSteps[s.date] || 0, steps);
      bestSteps = Math.max(bestSteps, steps);
    });

    let cursor = new Date(todayKey);

    while (true) {
      const key = formatDateToLocalIsoDate(cursor);
      const steps = dateToSteps[key] || 0;
      if (steps >= stepGoal && cursor >= new Date(sorted[0].date)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return { streak, bestSteps };
  }, [summaries, todayKey, stepGoal, currentSteps]);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeWaterIndex, setActiveWaterIndex] = useState(0);

  useEffect(() => {
    if (series.steps.length > 0) {
      setActiveStepIndex(series.steps.length - 1);
    } else {
      setActiveStepIndex(0);
    }
    if (series.water.length > 0) {
      setActiveWaterIndex(series.water.length - 1);
    } else {
      setActiveWaterIndex(0);
    }
  }, [series.steps.length, series.water.length, activeRange]);

  const { stepScale, waterScale } = useMemo(() => {
    switch (activeRange) {
      case 'weekly':
        return { stepScale: stepGoal * 7, waterScale: waterGoal * 7 };
      case 'monthly':
        return { stepScale: stepGoal * 30, waterScale: waterGoal * 30 };
      case 'daily':
      default:
        return { stepScale: stepGoal, waterScale: waterGoal };
    }
  }, [activeRange, stepGoal, waterGoal]);

  const renderStepsLineChart = () => {
    const { axisLabels, readableLabels, steps } = series;

    if (!axisLabels.length) {
      return (
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>No data yet</Text>
        </View>
      );
    }

    const selectedLabel = readableLabels[activeStepIndex] || '--';
    const selectedValue = steps[activeStepIndex] || 0;

    const chartData = steps.map((value, index) => ({
      label: axisLabels[index],
      value,
      labelSecondary: readableLabels[index],
    }));

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartInfoRow}>
          <View style={styles.chartInfoLeft}>
            <Text style={styles.chartInfoLabel}>
              {activeRange === 'daily' ? 'Selected day' : activeRange === 'weekly' ? 'Selected week' : 'Selected month'}
            </Text>
            <Text
              style={styles.chartInfoValue}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {selectedLabel}
            </Text>
          </View>
          <View style={styles.chartInfoRight}>
            <Text style={styles.chartInfoLabel}>Steps</Text>
            <Text
              style={styles.chartInfoBig}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatSteps(selectedValue)}
            </Text>
          </View>
        </View>

        <Chart
          data={chartData}
          barColor={theme.colors.steps}
          activeBarColor={theme.colors.steps}
          selectedIndex={activeStepIndex}
          onSelect={setActiveStepIndex}
          formatValue={(v) => formatSteps(v)}
          height={CHART_HEIGHT}
          width={CHART_WIDTH}
          maxScaleValue={stepScale}
        />
      </View>
    );
  };

  const renderWaterBarChart = () => {
    const { axisLabels, readableLabels, water } = series;

    if (!axisLabels.length) {
      return (
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>No data yet</Text>
        </View>
      );
    }

    const selectedLabel = readableLabels[activeWaterIndex] || '--';
    const selectedValue = water[activeWaterIndex] || 0;

    const chartData = water.map((value, index) => ({
      label: axisLabels[index],
      value,
      labelSecondary: readableLabels[index],
    }));

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartInfoRow}>
          <View style={styles.chartInfoLeft}>
            <Text style={styles.chartInfoLabel}>
              {activeRange === 'daily' ? 'Selected day' : activeRange === 'weekly' ? 'Selected week' : 'Selected month'}
            </Text>
            <Text
              style={styles.chartInfoValue}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {selectedLabel}
            </Text>
          </View>
          <View style={styles.chartInfoRight}>
            <Text style={styles.chartInfoLabel}>Water</Text>
            <Text
              style={[styles.chartInfoBig, { color: COLORS.secondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatWater(selectedValue, settings.unit)}
            </Text>
          </View>
        </View>

        <Chart
          data={chartData}
          barColor={theme.colors.water}
          activeBarColor={theme.colors.water}
          selectedIndex={activeWaterIndex}
          onSelect={setActiveWaterIndex}
          formatValue={(v) => formatWater(v, settings.unit)}
          height={CHART_HEIGHT}
          width={CHART_WIDTH}
          maxScaleValue={waterScale}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="Stats Overview"
        rightIcon="bar-chart"
        onBackPress={() => navigation.navigate('Home')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* Filter Tabs Section */}
        <View style={styles.filterTabs}>
          {(['daily', 'weekly', 'monthly'] as RangeFilter[]).map((range) => {
            const active = activeRange === range;
            return (
              <TouchableOpacity
                key={range}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setActiveRange(range)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    active && styles.filterTabTextActive,
                  ]}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Steps Line Chart Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>Steps</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {activeRange === 'daily'
                  ? 'Last 7 days'
                  : activeRange === 'weekly'
                    ? 'Last 4 weeks'
                    : 'Last 3 months'}
              </Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeLabel}>Total</Text>
              <Text
                style={styles.cardBadgeValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatSteps(series.totalSteps || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.chartContainer}>{renderStepsLineChart()}</View>
        </View>

        {/* Water Bar Chart Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>Water</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {activeRange === 'daily'
                  ? 'Last 7 days'
                  : activeRange === 'weekly'
                    ? 'Last 4 weeks'
                    : 'Last 3 months'}
              </Text>
            </View>
            <View style={[styles.cardBadge, { backgroundColor: theme.colors.water + '20' }]}>
              <Text style={styles.cardBadgeLabel}>Total</Text>
              <Text
                style={[styles.cardBadgeValue, { color: theme.colors.water }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatWater(series.totalWater || 0, settings.unit)}
              </Text>
            </View>
          </View>
          <View style={styles.chartContainer}>{renderWaterBarChart()}</View>
        </View>

        {/* Stats Summary Section */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Streak</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
              {summaryStats.streak} Days
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best Day</Text>
            <Text
              style={styles.summaryValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatSteps(summaryStats.bestSteps)} Steps
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: rp(20),
    paddingTop: rm(20),
    paddingBottom: rp(32),
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: rm(24),
    paddingHorizontal: rp(4),
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: rp(20),
    paddingVertical: rp(10),
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.border + '30',
    ...theme.shadows.button,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  filterTabText: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    paddingVertical: rp(20),
    paddingHorizontal: rp(20),
    ...theme.shadows.card,
    marginBottom: rm(18),
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rm(6),
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: rm(14),
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: rm(4),
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    marginTop: rm(2),
    lineHeight: rf(18),
    fontWeight: theme.typography.fontWeight.medium,
  },
  chartWrapper: {
    width: '100%',
  },
  chartContainer: {
    marginTop: rm(16),
    paddingVertical: rp(20),
    paddingHorizontal: rp(16),
    borderRadius: rs(14),
    backgroundColor: COLORS.light.background,
    alignItems: 'center',
  },
  chartSvgContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rp(8),
    paddingVertical: rp(8),
  },
  chartInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rm(16),
    paddingHorizontal: rp(4),
  },
  chartInfoLeft: {
    flex: 1,
    marginRight: rm(16),
    minWidth: 0,
  },
  chartInfoRight: {
    alignItems: 'flex-end',
    minWidth: rs(90),
    maxWidth: rs(140),
  },
  chartInfoLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(5),
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartInfoValue: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: rm(3),
    lineHeight: rf(19),
    letterSpacing: -0.2,
  },
  chartInfoBig: {
    fontSize: rf(22),
    fontWeight: '700',
    color: theme.colors.steps,
    marginTop: rm(3),
    minHeight: rs(28),
    maxWidth: '100%',
    letterSpacing: -0.5,
  },
  chartBarsContainer: {
    marginVertical: rm(12),
    paddingVertical: rp(12),
    paddingHorizontal: rp(12),
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: rs(120),
    paddingHorizontal: rp(8),
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: rp(4),
    justifyContent: 'flex-end',
  },
  chartBarContainer: {
    width: '100%',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarTrack: {
    width: rs(14),
    height: '100%',
    borderRadius: rs(7),
    backgroundColor: theme.colors.border + '40',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  chartBarTrackActive: {
    borderWidth: 1.5,
    borderColor: theme.colors.water,
    shadowColor: theme.colors.water,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.3,
    shadowRadius: rs(4),
    elevation: 3,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: rs(7),
    minHeight: rs(2),
  },
  chartBarValueContainer: {
    marginTop: rm(6),
    paddingHorizontal: rp(4),
    paddingVertical: rp(2),
    borderRadius: rs(6),
    backgroundColor: theme.colors.water + '15',
    minWidth: rs(50),
    alignItems: 'center',
  },
  chartEmpty: {
    height: rs(80),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(20),
  },
  chartEmptyText: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rm(12),
    paddingHorizontal: rp(8),
  },
  chartLabelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: rp(2),
  },
  chartLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  chartLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.caption,
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(22),
    marginTop: rm(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: rp(10),
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(8),
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    minHeight: rs(26),
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: rs(40),
    backgroundColor: theme.colors.border + '60',
    marginHorizontal: rm(16),
  },
  cardBadge: {
    paddingHorizontal: rp(14),
    paddingVertical: rp(10),
    borderRadius: rs(14),
    backgroundColor: theme.colors.steps + '15',
    alignItems: 'flex-end',
    minWidth: rs(75),
    maxWidth: rs(130),
    borderWidth: 1,
    borderColor: theme.colors.steps + '20',
  },
  cardBadgeLabel: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(3),
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBadgeValue: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.steps,
    marginTop: rm(2),
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  chartBarValue: {
    fontSize: rf(11),
    color: theme.colors.water,
    textAlign: 'center',
    fontWeight: '700',
    minWidth: rs(50),
    letterSpacing: 0.2,
  },
});

export default HistoryScreen;

