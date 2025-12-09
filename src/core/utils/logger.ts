// Logger simplificado
export class Logger {
  static async logAuthEvent(event: string, userEmail?: string, success: boolean = true) {
    console.log(`📝 Auth log: ${event} - ${userEmail || 'unknown'} - ${success ? 'SUCCESS' : 'FAILED'}`);
  }
}
