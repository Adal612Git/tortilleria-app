export enum CryptoDigestAlgorithm {
  SHA256 = 'SHA-256',
}

export const digestStringAsync = jest.fn(async (_algorithm: CryptoDigestAlgorithm, value: string) => {
  return `mock-hash-${value}`;
});
