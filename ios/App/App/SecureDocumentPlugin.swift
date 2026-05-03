import Capacitor
import Foundation

/// Capacitor plugin — exposes KeychainDocumentService to the React web layer.
///
/// JavaScript usage:
///   import { Plugins } from '@capacitor/core';
///   const { SecureDocumentPlugin } = Plugins;
///
///   // Store a document (pass base64-encoded bytes)
///   await SecureDocumentPlugin.storeDocument({ id, filename, docType, dataBase64 });
///
///   // Retrieve bytes
///   const { dataBase64 } = await SecureDocumentPlugin.retrieveDocument({ id });
///
///   // List all stored document metadata
///   const { documents } = await SecureDocumentPlugin.listDocuments();
///
///   // Delete a document
///   await SecureDocumentPlugin.deleteDocument({ id });
@objc(SecureDocumentPlugin)
public class SecureDocumentPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier    = "SecureDocumentPlugin"
    public let jsName        = "SecureDocumentPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storeDocument",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "retrieveDocument", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listDocuments",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteDocument",   returnType: CAPPluginReturnPromise),
    ]

    // MARK: - Plugin methods

    @objc func storeDocument(_ call: CAPPluginCall) {
        guard let id       = call.getString("id"),
              let filename = call.getString("filename"),
              let docType  = call.getString("docType"),
              let b64      = call.getString("dataBase64"),
              let data     = Data(base64Encoded: b64) else {
            call.reject("Missing or invalid parameters: id, filename, docType, dataBase64 required")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let meta = try KeychainDocumentService.store(id: id,
                                                             filename: filename,
                                                             docType: docType,
                                                             data: data)
                call.resolve([
                    "id":         meta.id,
                    "filename":   meta.filename,
                    "docType":    meta.docType,
                    "storedAt":   ISO8601DateFormatter().string(from: meta.storedAt),
                    "sizeBytes":  meta.sizeBytes,
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func retrieveDocument(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing parameter: id")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let data = try KeychainDocumentService.retrieve(id: id)
                call.resolve(["dataBase64": data.base64EncodedString()])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func listDocuments(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let metas = try KeychainDocumentService.allMetadata()
                let fmt   = ISO8601DateFormatter()
                let list  = metas.map { m -> [String: Any] in
                    ["id": m.id,
                     "filename": m.filename,
                     "docType": m.docType,
                     "storedAt": fmt.string(from: m.storedAt),
                     "sizeBytes": m.sizeBytes]
                }
                call.resolve(["documents": list])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func deleteDocument(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing parameter: id")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try KeychainDocumentService.delete(id: id)
                call.resolve(["deleted": true])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }
}
