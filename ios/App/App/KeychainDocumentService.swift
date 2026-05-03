import Foundation
import Security

/// Stores sensitive PCS documents (travel orders, vouchers, etc.) in the iOS Keychain
/// with Data Protection so they are only readable when the device is unlocked.
final class KeychainDocumentService {

    // MARK: - Types

    struct DocumentMeta: Codable {
        let id: String
        let filename: String
        let docType: String        // e.g. "travel_orders", "voucher", "orders"
        let storedAt: Date
        var sizeBytes: Int
    }

    enum KeychainError: LocalizedError {
        case encodingFailed
        case itemNotFound
        case duplicateItem
        case unexpectedStatus(OSStatus)

        var errorDescription: String? {
            switch self {
            case .encodingFailed:       return "Failed to encode document data."
            case .itemNotFound:         return "Document not found in secure storage."
            case .duplicateItem:        return "A document with this ID already exists."
            case .unexpectedStatus(let s): return "Keychain error (OSStatus \(s))."
            }
        }
    }

    // MARK: - Private helpers

    /// Service label written to every Keychain item for scoping queries.
    private static let service = "com.pcsexpress.documents"

    /// kSecAttrAccessibleWhenUnlockedThisDeviceOnly enforces:
    ///   1. Data is unreadable when the device is locked.
    ///   2. Data never migrates to another device (no iCloud Keychain backup).
    private static let accessPolicy = kSecAttrAccessibleWhenUnlockedThisDeviceOnly

    private static func metaKey(for id: String) -> String { "meta:\(id)" }
    private static func dataKey(for id: String) -> String { "data:\(id)" }

    // MARK: - Public API

    /// Stores a document's raw bytes plus metadata. Call on a background thread.
    @discardableResult
    static func store(id: String,
                      filename: String,
                      docType: String,
                      data: Data) throws -> DocumentMeta {
        let meta = DocumentMeta(id: id,
                                filename: filename,
                                docType: docType,
                                storedAt: Date(),
                                sizeBytes: data.count)

        let metaData = try JSONEncoder().encode(meta)
        try writeItem(account: metaKey(for: id), value: metaData)
        try writeItem(account: dataKey(for: id), value: data)
        return meta
    }

    /// Retrieves raw document bytes. Returns nil if not found.
    static func retrieve(id: String) throws -> Data {
        guard let raw = try readItem(account: dataKey(for: id)) else {
            throw KeychainError.itemNotFound
        }
        return raw
    }

    /// Returns metadata for a stored document without loading the full payload.
    static func metadata(for id: String) throws -> DocumentMeta {
        guard let raw = try readItem(account: metaKey(for: id)) else {
            throw KeychainError.itemNotFound
        }
        return try JSONDecoder().decode(DocumentMeta.self, from: raw)
    }

    /// Lists metadata for every document currently in secure storage.
    static func allMetadata() throws -> [DocumentMeta] {
        let query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecAttrService:      service,
            kSecReturnAttributes: true,
            kSecMatchLimit:       kSecMatchLimitAll,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unexpectedStatus(status)
        }

        let attrs = (result as? [[CFString: Any]]) ?? []
        var metas: [DocumentMeta] = []
        for attr in attrs {
            guard let account = attr[kSecAttrAccount] as? String,
                  account.hasPrefix("meta:") else { continue }
            let docId = String(account.dropFirst(5))
            if let m = try? metadata(for: docId) { metas.append(m) }
        }
        return metas
    }

    /// Permanently removes a document and its metadata from the Keychain.
    static func delete(id: String) throws {
        try deleteItem(account: dataKey(for: id))
        try deleteItem(account: metaKey(for: id))
    }

    // MARK: - Low-level Keychain primitives

    private static func writeItem(account: String, value: Data) throws {
        // Try updating first; fall back to adding a new item.
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ]
        let update: [CFString: Any] = [
            kSecValueData:        value,
            kSecAttrAccessible:   accessPolicy,
        ]
        var status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if status == errSecItemNotFound {
            var addQuery = query
            addQuery[kSecValueData]      = value
            addQuery[kSecAttrAccessible] = accessPolicy
            status = SecItemAdd(addQuery as CFDictionary, nil)
        }
        guard status == errSecSuccess else { throw KeychainError.unexpectedStatus(status) }
    }

    private static func readItem(account: String) throws -> Data? {
        let query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecAttrService:      service,
            kSecAttrAccount:      account,
            kSecReturnData:       true,
            kSecMatchLimit:       kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw KeychainError.unexpectedStatus(status) }
        return result as? Data
    }

    private static func deleteItem(account: String) throws {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unexpectedStatus(status)
        }
    }
}
