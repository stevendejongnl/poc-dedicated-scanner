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
  // Tracks the last value we observed from native to compute deltas.
  // We only clear the native input after a complete barcode, never mid-scan,
  // to avoid the setNativeProps race where subsequent onChangeText events
  // arrive before the clear takes effect and deliver accumulated old content.
  const prevNativeTextRef = useRef('');

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
        // onChangeText delivers the FULL current native value, not a delta.
        // Slice off only the characters added since the last event.
        const prev = prevNativeTextRef.current;
        const delta = text.length >= prev.length ? text.slice(prev.length) : text;
        prevNativeTextRef.current = text;
        if (delta) {
          bufferRef.current.push(delta);
        }
      }}
      onSubmitEditing={() => {
        // Scanner sent Enter — flush the buffer and clear the input once.
        bufferRef.current.submit();
        prevNativeTextRef.current = '';
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
