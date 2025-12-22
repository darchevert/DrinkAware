import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeWheelPickerProps {
  hour: number;
  minute: number;
  onHourChange: (value: number) => void;
  onMinuteChange: (value: number) => void;
  textColor?: string;
  highlightColor?: string;
  itemBackground?: string;
  accentColor?: string;
}

interface TimeSelectorProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  textColor?: string;
  highlightColor?: string;
  accentColor?: string;
}

function TimeSelector({ value, min, max, onChange, textColor = '#333', highlightColor = '#e0f2f1', accentColor = '#2e7d32', itemBackground = '#fff' }: TimeSelectorProps & { itemBackground?: string }) {
  const increment = () => {
    const newValue = value >= max ? min : value + 1;
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = value <= min ? max : value - 1;
    onChange(newValue);
  };

  return (
    <View style={styles.selectorContainer}>
      <TouchableOpacity
        style={[styles.arrowButton, { borderColor: accentColor, backgroundColor: itemBackground }]}
        onPress={increment}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-up" size={24} color={accentColor} />
      </TouchableOpacity>
      
      <View style={[styles.valueContainer, { backgroundColor: highlightColor, borderColor: accentColor }]}>
        <Text style={[styles.valueText, { color: textColor }]}>
          {String(value).padStart(2, '0')}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.arrowButton, { borderColor: accentColor, backgroundColor: itemBackground }]}
        onPress={decrement}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-down" size={24} color={accentColor} />
      </TouchableOpacity>
    </View>
  );
}

export function TimeWheelPicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  textColor = '#333',
  highlightColor = '#e0f2f1',
  itemBackground = '#fff',
  accentColor = '#2e7d32',
}: TimeWheelPickerProps) {
  return (
    <View style={styles.container}>
      <TimeSelector
        value={hour}
        min={0}
        max={23}
        onChange={onHourChange}
        textColor={textColor}
        highlightColor={highlightColor}
        accentColor={accentColor}
        itemBackground={itemBackground}
      />
      
      <View style={styles.separator}>
        <Text style={[styles.separatorText, { color: textColor }]}>:</Text>
      </View>
      
      <TimeSelector
        value={minute}
        min={0}
        max={59}
        onChange={onMinuteChange}
        textColor={textColor}
        highlightColor={highlightColor}
        accentColor={accentColor}
        itemBackground={itemBackground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 16,
  },
  selectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  arrowButton: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
  },
  valueContainer: {
    width: 70,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 8,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  separator: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  separatorText: {
    fontSize: 32,
    fontWeight: '600',
  },
});

export default TimeWheelPicker;
