import Foundation
import ExternalAccessory

@objc(BluetoothAccessoryPicker)
class BluetoothAccessoryPicker: NSObject {

  @objc func showPicker(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      EAAccessoryManager.shared().showBluetoothAccessoryPicker(withNameFilter: nil) { error in
        guard let error = error as NSError? else {
          resolve(nil)
          return
        }
        let code: String
        switch EABluetoothAccessoryPickerError.Code(rawValue: error.code) {
        case .alreadyConnected:
          // Treat as success — already paired
          resolve(nil)
          return
        case .resultNotFound:
          code = "NO_ACCESSORIES_FOUND"
        case .resultCancelled:
          code = "USER_CANCELED"
        case .resultFailed:
          code = "NOT_SUPPORTED"
        default:
          code = "UNKNOWN"
        }
        reject(code, error.localizedDescription, error)
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
