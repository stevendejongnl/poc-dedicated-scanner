import {NativeModules, Platform} from 'react-native';

export type PickerErrorCode =
  | 'NO_ACCESSORIES_FOUND'
  | 'USER_CANCELED'
  | 'NOT_SUPPORTED'
  | 'PLATFORM_UNSUPPORTED'
  | 'UNKNOWN';

export async function showBluetoothAccessoryPicker(): Promise<void> {
  if (Platform.OS !== 'ios') {
    const err = Object.assign(new Error('iOS only'), {code: 'PLATFORM_UNSUPPORTED' as PickerErrorCode});
    throw err;
  }
  return NativeModules.BluetoothAccessoryPicker.showPicker();
}
