import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const genSalt = (): Promise<string> =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(BCRYPT_ROUNDS, (err, salt) => {
      if (err || !salt) {
        reject(err ?? new Error('Unable to generate salt'));
        return;
      }
      resolve(salt);
    });
  });

const hashWithSalt = (password: string, salt: string): Promise<string> =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err || !hash) {
        reject(err ?? new Error('Unable to hash password'));
        return;
      }
      resolve(hash);
    });
  });

const compareAsync = (password: string, hash: string): Promise<boolean> =>
  new Promise((resolve) => {
    bcrypt.compare(password, hash, (err, result) => {
      resolve(!err && !!result);
    });
  });

export const isBcryptHash = (value: string | null | undefined): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  return BCRYPT_REGEX.test(value);
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt();
  return hashWithSalt(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!isBcryptHash(hashedPassword)) {
    return false;
  }
  return compareAsync(password, hashedPassword);
}

export class EncryptionService {
  static hashPassword(password: string) {
    return hashPassword(password);
  }

  static verifyPassword(password: string, hashedPassword: string) {
    return comparePassword(password, hashedPassword);
  }
}
