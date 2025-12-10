import { DatabaseService } from '../database/DatabaseService';

export type CashAudit = {
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
};

export class CashAuditRepository {
  private db = DatabaseService.getInstance();

  async list(limit = 20): Promise<CashAudit[]> {
    const database = await this.db.getDatabase();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM cash_audits ORDER BY datetime(createdAt) DESC LIMIT ?',
      [limit]
    );
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
    }));
  }

  async create(audit: Omit<CashAudit, 'id'>): Promise<void> {
    const database = await this.db.getDatabase();
    await database.runAsync(
      `INSERT INTO cash_audits (openingFloat, entries, exits, cashSales, expectedCash, countedCash, difference, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        audit.openingFloat,
        audit.entries,
        audit.exits,
        audit.cashSales,
        audit.expectedCash,
        audit.countedCash,
        audit.difference,
        audit.notes ?? null,
        audit.createdAt,
      ]
    );
  }
}
