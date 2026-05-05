//
//  SecurityExtensions.swift
//  PCS Express
//
//  Purpose: Additive DoD-oriented security helpers for encrypted persistence,
//  privacy shielding, and local audit accountability.
//  Third-party dependencies: CryptoKit, UIKit, Foundation; no external packages.
//

import CryptoKit
import Foundation
import UIKit

// MARK: - AES-256 GCM Local Encryption

enum PCSSecureStorage {
    private static let keychainAccount = "pcs-express.aes-gcm.master-key"
    private static let keychainService = "com.pcsexpress.security"

    static func encrypt<T: Encodable>(_ value: T) throws -> Data {
        let plaintext = try JSONEncoder().encode(value)
        let sealedBox = try AES.GCM.seal(plaintext, using: symmetricKey())
        guard let combined = sealedBox.combined else {
            throw SecurityExtensionError.encryptionFailed
        }
        return combined
    }

    static func decrypt<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        let plaintext = try AES.GCM.open(sealedBox, using: symmetricKey())
        return try JSONDecoder().decode(type, from: plaintext)
    }

    private static func symmetricKey() throws -> SymmetricKey {
        if let existing = try readKeyData() {
            return SymmetricKey(data: existing)
        }
        var bytes = [UInt8](repeating: 0, count: 32)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard status == errSecSuccess else { throw SecurityExtensionError.keyGenerationFailed(status) }
        let data = Data(bytes)
        try writeKeyData(data)
        return SymmetricKey(data: data)
    }

    private static func readKeyData() throws -> Data? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw SecurityExtensionError.keychainError(status) }
        return result as? Data
    }

    private static func writeKeyData(_ data: Data) throws {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount,
            kSecValueData: data,
            kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw SecurityExtensionError.keychainError(status) }
    }
}

enum SecurityExtensionError: LocalizedError {
    case encryptionFailed
    case keyGenerationFailed(OSStatus)
    case keychainError(OSStatus)

    var errorDescription: String? {
        switch self {
        case .encryptionFailed:
            return "Unable to create AES-GCM sealed box."
        case .keyGenerationFailed(let status):
            return "Unable to generate encryption key. OSStatus \(status)."
        case .keychainError(let status):
            return "Keychain operation failed. OSStatus \(status)."
        }
    }
}

extension UserDefaults {
    func setEncrypted<T: Encodable>(_ value: T, forKey key: String) throws {
        let data = try PCSSecureStorage.encrypt(value)
        set(data, forKey: key)
    }

    func encryptedValue<T: Decodable>(_ type: T.Type, forKey key: String) throws -> T? {
        guard let data = data(forKey: key) else { return nil }
        return try PCSSecureStorage.decrypt(type, from: data)
    }
}

extension Data {
    func pcsEncryptedForCoreData() throws -> Data {
        try PCSSecureStorage.encrypt(self)
    }

    func pcsDecryptedFromCoreData() throws -> Data {
        try PCSSecureStorage.decrypt(Data.self, from: self)
    }
}

// MARK: - Privacy Shield

final class PCSPrivacyShield {
    static let shared = PCSPrivacyShield()
    private weak var shieldView: UIVisualEffectView?

    private init() {}

    func install(on window: UIWindow?) {
        guard let window, shieldView == nil else { return }
        let blur = UIBlurEffect(style: .systemUltraThinMaterialDark)
        let view = UIVisualEffectView(effect: blur)
        view.frame = window.bounds
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let label = UILabel()
        label.text = "PCS Express Privacy Shield"
        label.textColor = .white
        label.font = .preferredFont(forTextStyle: .headline)
        label.adjustsFontForContentSizeCategory = true
        label.translatesAutoresizingMaskIntoConstraints = false
        view.contentView.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.contentView.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.contentView.centerYAnchor),
        ])

        window.addSubview(view)
        shieldView = view
    }

    func remove() {
        shieldView?.removeFromSuperview()
        shieldView = nil
    }
}

// MARK: - Audit Trail

struct PCSAuditEvent: Codable {
    let id: UUID
    let action: String
    let details: [String: String]
    let timestamp: Date
}

final class AuditLogger {
    static let shared = AuditLogger()
    private let key = "pcs.audit.events"

    private init() {}

    func record(_ action: String, details: [String: String] = [:]) {
        var events = list()
        events.insert(PCSAuditEvent(id: UUID(), action: action, details: details, timestamp: Date()), at: 0)
        events = Array(events.prefix(250))
        try? UserDefaults.standard.setEncrypted(events, forKey: key)
    }

    func list() -> [PCSAuditEvent] {
        (try? UserDefaults.standard.encryptedValue([PCSAuditEvent].self, forKey: key)) ?? []
    }
}
