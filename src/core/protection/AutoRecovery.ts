export const autoRecovery = {
  criticalOperation: async (operation: () => Promise<any>, context: string) => {
    try {
      return await operation();
    } catch (error) {
      console.error(`Error en ${context}:`, error);
      throw error;
    }
  },
  emergencyReset: async (): Promise<boolean> => {
    console.warn('autoRecovery.emergencyReset no esta configurado; omitiendo');
    return false;
  },
};
