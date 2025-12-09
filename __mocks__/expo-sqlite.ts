const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

export const openDatabaseAsync = jest.fn(async () => mockDb);
export const openDatabaseSync = jest.fn(() => mockDb);
export type SQLiteDatabase = typeof mockDb;

export default {
  openDatabaseAsync,
  openDatabaseSync,
};
