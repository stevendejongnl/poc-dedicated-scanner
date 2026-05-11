import React, {useCallback, useRef} from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {HidCaptureBuffer} from '@/infrastructure/hid/HidCaptureBuffer';

interface Props {
  onBarcode: (barcode: string) => void;
}

/**
 * An invisible, always-focused TextInput that captures keystrokes from a
 * HID-mode Bluetooth barcode scanner (which pairs as a keyboard).
 *
 * Keep this mounted for the lifetime of the scanner screen so that focus
 * is never lost. The input sits offscreen (height 0, opacity 0) so it
 * doesn't affect layout.
 */
export function HiddenScannerInput({onBarcode}: Props) {
  const inputRef = useRef<TextInput>(null);
  const bufferRef = useRef(new HidCaptureBuffer(onBarcode));

  const refocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(refocus, 100);
      return () => clearTimeout(timeout);
    }, [refocus]),
  );

  return (
    <TextInput
      ref={inputRef}
      style={styles.hidden}
      autoFocus
      autoCorrect={false}
      autoCapitalize="none"
      keyboardType="default"
      showSoftInputOnFocus={false}
      onBlur={refocus}
      onChangeText={text => {
        bufferRef.current.push(text);
        // Clear the visible value so the next scan starts fresh.
        inputRef.current?.setNativeProps({text: ''});
      }}
      onSubmitEditing={e => {
        bufferRef.current.onSubmit(e.nativeEvent.text);
        inputRef.current?.setNativeProps({text: ''});
      }}
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    height: 0,
    width: 0,
    opacity: 0,
  },
});
