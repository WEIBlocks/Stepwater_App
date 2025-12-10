import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { DaySummary } from '../types';
import { formatSteps, formatWater, formatDistance } from '../utils/formatting';
import { COLORS } from '../utils/constants';
import { format, parseISO } from 'date-fns';

interface HistoryListProps {
  summaries: DaySummary[];
  onDelete?: (date: string) => void;
  unit?: 'metric' | 'imperial';
}

const HistoryList: React.FC<HistoryListProps> = ({
  summaries,
  onDelete,
  unit = 'metric',
}) => {
  const renderItem = ({ item }: { item: DaySummary }) => (
    <HistoryItem
      summary={item}
      onDelete={onDelete}
      unit={unit}
    />
  );

  if (summaries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No history yet</Text>
        <Text style={styles.emptySubtext}>Start walking to track your progress!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={summaries}
      renderItem={renderItem}
      keyExtractor={(item) => item.date}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const HistoryItem: React.FC<{
  summary: DaySummary;
  onDelete?: (date: string) => void;
  unit: 'metric' | 'imperial';
}> = ({ summary, onDelete, unit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderRightActions = (
    progressAnimatedValue: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>,
    _swipeable: any
  ) => {
    const opacity = progressAnimatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete?.(summary.date)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const date = parseISO(summary.date);
  const isToday = summary.date === format(new Date(), 'yyyy-MM-dd');

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      enabled={!!onDelete}
    >
      <TouchableOpacity
        style={styles.item}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.date}>
              {isToday ? 'Today' : format(date, 'MMM d, yyyy')}
            </Text>
            <Text style={styles.day}>{format(date, 'EEEE')}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Steps</Text>
              <Text style={styles.statValue}>{formatSteps(summary.steps)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Water</Text>
              <Text style={styles.statValue}>
                {formatWater(summary.waterMl, unit)}
              </Text>
            </View>
          </View>
        </View>
        {isExpanded && (summary.stepDistanceMeters || summary.calories) && (
          <View style={styles.expandedContent}>
            {summary.stepDistanceMeters && (
              <Text style={styles.extraInfo}>
                Distance: {formatDistance(summary.stepDistanceMeters, unit)}
              </Text>
            )}
            {summary.calories && (
              <Text style={styles.extraInfo}>
                Calories: {summary.calories} cal
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.light.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
  },
  item: {
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 4,
  },
  day: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.light.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  extraInfo: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
    marginVertical: 4,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HistoryList;

