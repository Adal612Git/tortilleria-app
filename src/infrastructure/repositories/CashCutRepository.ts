import { DatabaseService } from '../database/DatabaseService';

export type CashCutRecord = {
  id: string;
  openingFloat: number;
  entries: number;
  exits: number;
  cashSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  notes?: string | null;
  createdAt: string;
  userId: number | null;
};

export class CashCutRepository {
  private db = DatabaseService.getInstance();

  async list(limit = 20, userId?: number | null): Promise<CashCutRecord[]> {
    const database = await this.db.getDatabase();
    const params: any[] = [];
    let query = 'SELECT * FROM cash_audits';
    if (typeof userId === 'number') {
      query += ' WHERE userId = ?';
      params.push(userId);
    }
    query += ' ORDER BY datetime(createdAt) DESC LIMIT ?';
    params.push(limit);
    const rows = await database.getAllAsync<any>(query, params);
    return rows.map((row: any) => ({
      id: String(row.id),
      openingFloat: Number(row.openingFloat ?? 0),
      entries: Number(row.entries ?? 0),
      exits: Number(row.exits ?? 0),
      cashSales: Number(row.cashSales ?? 0),
      expectedCash: Number(row.expectedCash ?? 0),
      countedCash: Number(row.countedCash ?? 0),
      difference: Number(row.difference ?? 0),
      notes: row.notes ?? null,
      createdAt: row.createdAt,
      userId: row.userId != null ? Number(row.userId) : null,
    }));
  }

  async create(audit: Omit<CashCutRecord, 'id'>): Promise<void> {
    const database = await this.db.getDatabase();
    await database.runAsync(
      `INSERT INTO cash_audits (openingFloat, entries, exits, cashSales, expectedCash, countedCash, difference, notes, userId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        audit.openingFloat,
        audit.entries,
        audit.exits,
        audit.cashSales,
        audit.expectedCash,
        audit.countedCash,
        audit.difference,
        audit.notes ?? null,
        audit.userId ?? null,
        audit.createdAt,
      ]
    );
  }
}
