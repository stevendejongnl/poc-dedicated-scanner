/**
 * Converts a stream of individual characters (from a HID keyboard-wedge barcode
 * scanner) into discrete barcode strings.
 *
 * Scanners send characters one-by-one at high speed and usually terminate with
 * Enter (\n or \r). Some scanners are configured to send no terminator at all.
 * We handle both by:
 *   1. Flushing immediately on Enter/CR.
 *   2. Flushing after IDLE_MS of silence (covers no-terminator scanners).
 */

const IDLE_MS = 50;

export type BarcodeCallback = (barcode: string) => void;

export class HidCaptureBuffer {
  private buffer = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onBarcode: BarcodeCallback;

  constructor(onBarcode: BarcodeCallback) {
    this.onBarcode = onBarcode;
  }

  push(text: string): void {
    this.cancelTimer();

    for (const char of text) {
      if (char === '\n' || char === '\r') {
        this.flush();
        return;
      }
      this.buffer += char;
    }

    if (this.buffer.length > 0) {
      this.timer = setTimeout(() => this.flush(), IDLE_MS);
    }
  }

  /** Call when the text input fires onSubmitEditing (Enter key). */
  submit(): void {
    this.cancelTimer();
    this.flush();
  }

  reset(): void {
    this.cancelTimer();
    this.buffer = '';
  }

  private flush(): void {
    const barcode = this.buffer.trim();
    this.buffer = '';
    if (barcode.length > 0) {
      this.onBarcode(barcode);
    }
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
