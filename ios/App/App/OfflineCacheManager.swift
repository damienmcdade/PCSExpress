import Foundation

/// File-based JSON cache for Comms-Dark (no-signal) environments.
///
/// All cache files are written with `.completeUntilFirstUserAuthentication` Data Protection —
/// the file-system equivalent of `kSecAttrAccessibleAfterFirstUnlock`. Files remain
/// readable after the device has been unlocked at least once, even in airplane mode,
/// which covers the Comms-Dark / austere-network scenario.
///
/// The cache directory lives in Application Support (excluded from iCloud backup)
/// and inherits the protection policy applied at directory creation time.
final class OfflineCacheManager {

    // MARK: - Cache Keys

    enum CacheKey: String, CaseIterable {
        case profile    = "profile.json"
        case checklist  = "checklist.json"
        case orders     = "orders.json"
        case expenses   = "expenses.json"
        case milestones = "milestones.json"
    }

    // MARK: - Errors

    enum CacheError: LocalizedError {
        case encodingFailed
        case decodingFailed(String)
        case itemNotFound(CacheKey)

        var errorDescription: String? {
            switch self {
            case .encodingFailed:
                return "Failed to encode data for offline cache."
            case .decodingFailed(let msg):
                return "Offline cache decode error: \(msg)"
            case .itemNotFound(let key):
                return "No cached data found for '\(key.rawValue)'."
            }
        }
    }

    // MARK: - Singleton

    static let shared = OfflineCacheManager()
    private init() { createDirectoryIfNeeded() }

    // MARK: - Directory

    private var cacheDirectoryURL: URL {
        let base = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first!
        return base.appendingPathComponent("PCSExpressCache", isDirectory: true)
    }

    private func createDirectoryIfNeeded() {
        guard !FileManager.default.fileExists(atPath: cacheDirectoryURL.path) else { return }
        try? FileManager.default.createDirectory(
            at: cacheDirectoryURL,
            withIntermediateDirectories: true,
            // Directory-level protection is inherited by files written inside.
            attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication]
        )
    }

    private func url(for key: CacheKey) -> URL {
        cacheDirectoryURL.appendingPathComponent(key.rawValue)
    }

    // MARK: - Public API

    /// Encodes and writes any `Codable` value to the protected cache.
    func save<T: Encodable>(_ value: T, for key: CacheKey) throws {
        let data: Data
        do {
            data = try JSONEncoder().encode(value)
        } catch {
            throw CacheError.encodingFailed
        }
        // Write atomically with Data Protection — equivalent to kSecAttrAccessibleAfterFirstUnlock.
        try data.write(
            to: url(for: key),
            options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]
        )
    }

    /// Reads and decodes a cached value. Throws `.itemNotFound` if no cache exists yet.
    func load<T: Decodable>(_ type: T.Type, for key: CacheKey) throws -> T {
        let fileURL = url(for: key)
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            throw CacheError.itemNotFound(key)
        }
        let data = try Data(contentsOf: fileURL)
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw CacheError.decodingFailed(error.localizedDescription)
        }
    }

    /// Returns `true` if a cache file exists for the given key.
    func hasCachedData(for key: CacheKey) -> Bool {
        FileManager.default.fileExists(atPath: url(for: key).path)
    }

    /// Returns the modification date of the cache file, or nil if it doesn't exist.
    func cacheAge(for key: CacheKey) -> Date? {
        let attrs = try? FileManager.default.attributesOfItem(atPath: url(for: key).path)
        return attrs?[.modificationDate] as? Date
    }

    /// Deletes a single cache entry.
    func invalidate(key: CacheKey) {
        try? FileManager.default.removeItem(at: url(for: key))
    }

    /// Wipes all cached data. Call on user reset / re-onboard.
    func invalidateAll() {
        CacheKey.allCases.forEach { invalidate(key: $0) }
    }

    /// Returns a map of cache key → file size in bytes (for debug / status reporting).
    func cacheInventory() -> [CacheKey: Int] {
        CacheKey.allCases.reduce(into: [:]) { result, key in
            if let attrs = try? FileManager.default.attributesOfItem(atPath: url(for: key).path),
               let size  = attrs[.size] as? Int {
                result[key] = size
            }
        }
    }
}

// MARK: - Raw JSON Envelope

/// Thin `Codable` wrapper so arbitrary JSON strings can be stored/retrieved
/// through the typed `OfflineCacheManager` API without a concrete schema.
struct RawJSONWrapper: Codable {
    let json: String
}
