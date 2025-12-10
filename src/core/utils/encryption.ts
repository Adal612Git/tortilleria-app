import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const digest = await hashPassword(password);
  return digest === hashedPassword;
}

export class EncryptionService {
  static hashPassword(password: string) {
    return hashPassword(password);
  }

  static verifyPassword(password: string, hashedPassword: string) {
    return comparePassword(password, hashedPassword);
  }
}
