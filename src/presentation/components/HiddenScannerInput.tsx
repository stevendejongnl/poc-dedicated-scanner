import React, {useCallback, useRef, useState} from 'react';
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
  // Changing this key forces a full remount of the TextInput, which is the
  // only reliable way to guarantee an empty native value between scans.
  // setNativeProps is async and loses the race against fast HID scanners.
  const [inputKey, setInputKey] = useState(0);

  // Keep onBarcode ref fresh so the buffer callback always calls the latest.
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  // After each emitted barcode, increment the key to remount the input.
  // We store this in a ref so the buffer (created once) can always reach it.
  const remountInputRef = useRef(() => {});
  remountInputRef.current = () => setInputKey(k => k + 1);

  const bufferRef = useRef(
    new HidCaptureBuffer(barcode => {
      onBarcodeRef.current(barcode);
      remountInputRef.current();
    }),
  );

  // Tracks the last native value to compute per-event deltas.
  // NOT reset after submit — the delta logic handles both the case where the
  // input already remounted (new text shorter than prev → treat whole text as
  // delta) and the race where the scanner starts before remount (new text
  // longer than prev → slice off the prefix we already processed).
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
      key={inputKey}
      ref={inputRef}
      style={styles.hidden}
      autoFocus
      autoCorrect={false}
      autoCapitalize="none"
      keyboardType="default"
      showSoftInputOnFocus={false}
      onBlur={refocus}
      onChangeText={text => {
        const prev = prevNativeTextRef.current;
        // text.length < prev.length means the input was cleared or remounted;
        // treat the entire new value as fresh input rather than a suffix.
        const delta = text.length >= prev.length ? text.slice(prev.length) : text;
        prevNativeTextRef.current = text;
        if (delta) {
          bufferRef.current.push(delta);
        }
      }}
      onSubmitEditing={() => {
        // Flush immediately on Enter; remount is triggered by the buffer
        // callback above after it emits the barcode.
        bufferRef.current.submit();
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
