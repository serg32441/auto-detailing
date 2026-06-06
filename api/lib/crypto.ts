import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
import { env } from "./env";

// Шифрование секретов клиентов (ключи OpenRouter, доступы к iiko и т.п.)
// at rest. Формат хранения: base64( iv[12] | authTag[16] | ciphertext ).
//
// Мастер-ключ берётся из SECRETS_MASTER_KEY. В проде это должна быть длинная
// случайная строка (например `openssl rand -base64 48`), хранимая ТОЛЬКО в env
// control-plane, а не в БД и не в репозитории.

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function masterKey(): Buffer {
  const raw = env.secretsMasterKey;
  if (!raw) {
    throw new Error(
      "SECRETS_MASTER_KEY is required to encrypt/decrypt tenant secrets",
    );
  }
  // Нормализуем произвольную строку к 32 байтам ключа через SHA-256.
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, masterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

// Удобные обёртки для JSON-секретов (например, набор доступов к интеграциям).
export function encryptJson(value: unknown): string {
  return encryptSecret(JSON.stringify(value));
}

export function decryptJson<T = unknown>(encoded: string): T {
  return JSON.parse(decryptSecret(encoded)) as T;
}
