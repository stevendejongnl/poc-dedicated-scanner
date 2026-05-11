export interface ScanEvent {
  id: string;
  barcode: string;
  timestamp: Date;
  source: 'hid' | 'ble';
}
