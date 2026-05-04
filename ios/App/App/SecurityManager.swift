import Foundation
import Security

/// High-level security facade for PCS Express.
///
/// Provides named storage for PII fields (SSN fragment, DoD ID, bank routing)
/// using the iOS Keychain with `kSecAttrAccessibleAfterFirstUnlock` — the minimum
/// protection standard specified in the government contract requirements.
///
/// For document blobs (travel orders, vouchers), use `KeychainDocumentService` directly.
/// For app-state caching (profile JSON, checklist), use `OfflineCacheManager`.
final class SecurityManager {

    static let shared = SecurityManager()
    private init() {}

    // MARK: - PII Key Registry

    /// Named PII fields stored in the Keychain.
    enum PIIKey: String, CaseIterable {
        case ssnLast4         = "pii.ssn_last4"
        case dodId            = "pii.dod_id"
        case edipi            = "pii.edipi"
        case bankRoutingLast4 = "pii.bank_routing_last4"
        case bankAccountLast4 = "pii.bank_account_last4"
    }

    // MARK: - Public PII API

    /// Stores a PII string in the Keychain.
    /// - Note: Only store fragments (last-4 SSN, not full numbers).
    func storePII(_ value: String, for key: PIIKey) throws {
        guard let data = value.data(using: .utf8) else { throw SecurityError.encodingFailed }
        try writeItem(account: key.rawValue, data: data)
    }

    /// Retrieves a stored PII string, or `nil` if it has not been set.
    func retrievePII(for key: PIIKey) throws -> String? {
        guard let data = try readItem(account: key.rawValue) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Removes a specific PII entry from the Keychain.
    func deletePII(for key: PIIKey) throws {
        try deleteItem(account: key.rawValue)
    }

    /// Purges all PCS Express PII from the Keychain.
    /// Call on user reset / re-onboard alongside `OfflineCacheManager.shared.invalidateAll()`.
    func wipeAllPII() {
        PIIKey.allCases.forEach { try? deletePII(for: $0) }
    }

    // MARK: - Secure Profile Snapshot

    /// Persists the active user profile as an encrypted JSON snapshot.
    /// Uses `OfflineCacheManager` (file-based, `kSecAttrAccessibleAfterFirstUnlock` equivalent)
    /// rather than the Keychain, because profile data can be large and may be updated frequently.
    func saveProfileSnapshot<T: Encodable>(_ profile: T) throws {
        try OfflineCacheManager.shared.save(profile, for: .profile)
    }

    func loadProfileSnapshot<T: Decodable>(_ type: T.Type) throws -> T {
        try OfflineCacheManager.shared.load(type, for: .profile)
    }

    // MARK: - Audit / Status

    struct SecurityStatus {
        let keychainItemsStored: [PIIKey]
        let cacheInventory:      [OfflineCacheManager.CacheKey: Int]
    }

    /// Returns a non-sensitive status summary (no values, only presence flags).
    func securityStatus() -> SecurityStatus {
        let present = PIIKey.allCases.filter { (try? retrievePII(for: $0)) != nil }
        return SecurityStatus(
            keychainItemsStored: present,
            cacheInventory:      OfflineCacheManager.shared.cacheInventory()
        )
    }

    // MARK: - Errors

    enum SecurityError: LocalizedError {
        case encodingFailed
        case keychainError(OSStatus)

        var errorDescription: String? {
            switch self {
            case .encodingFailed:           return "Failed to encode PII for secure storage."
            case .keychainError(let code):  return "Keychain error (OSStatus \(code))."
            }
        }
    }

    // MARK: - Keychain Primitives

    // kSecAttrAccessibleAfterFirstUnlock: data is accessible after the device has been
    // unlocked at least once, even when subsequently locked. Required for background
    // operations and Comms-Dark scenarios where the device may lock during data access.
    private static let service      = "com.pcsexpress.pii"
    private static let accessPolicy = kSecAttrAccessibleAfterFirstUnlock

    private func writeItem(account: String, data: Data) throws {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrService: SecurityManager.service,
            kSecAttrAccount: account,
        ]
        let attrs: [CFString: Any] = [
            kSecValueData:      data,
            kSecAttrAccessible: SecurityManager.accessPolicy,
        ]
        var status = SecItemUpdate(query as CFDictionary, attrs as CFDictionary)
        if status == errSecItemNotFound {
            var add = query
            add[kSecValueData]      = data
            add[kSecAttrAccessible] = SecurityManager.accessPolicy
            status = SecItemAdd(add as CFDictionary, nil)
        }
        guard status == errSecSuccess else { throw SecurityError.keychainError(status) }
    }

    private func readItem(account: String) throws -> Data? {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrService: SecurityManager.service,
            kSecAttrAccount: account,
            kSecReturnData:  true,
            kSecMatchLimit:  kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw SecurityError.keychainError(status) }
        return result as? Data
    }

    private func deleteItem(account: String) throws {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrService: SecurityManager.service,
            kSecAttrAccount: account,
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SecurityError.keychainError(status)
        }
    }
}
