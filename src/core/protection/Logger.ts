export const logger = {
    info: (message: string, ...args: any[]) => console.log(`ℹ️ INFO: ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`⚠️ WARN: ${message}`, ...args),
    error: (message: string, error?: any) => console.error(`❌ ERROR: ${message}`, error),
    debug: (message: string, ...args: any[]) => console.debug(`🐛 DEBUG: ${message}`, ...args)
};
