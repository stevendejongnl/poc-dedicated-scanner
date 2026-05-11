import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import type {ScanEvent} from '@/domain/scanner/ScanEvent';

interface Props {
  events: ScanEvent[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
}

export function ScanLog({events}: Props) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No scans yet — aim the scanner at a barcode</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[...events].reverse()}
      keyExtractor={item => item.id}
      style={styles.list}
      renderItem={({item, index}) => (
        <View style={[styles.row, index === 0 && styles.latest]}>
          <Text style={styles.barcode}>{item.barcode}</Text>
          <Text style={styles.meta}>
            {formatTime(item.timestamp)} · {item.source.toUpperCase()}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  latest: {
    backgroundColor: '#F0FFF4',
  },
  barcode: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  meta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
