export interface SmsSender {
  send(to: string, text: string): Promise<void>;
}

/** Implémentation par défaut : écrit le SMS dans les logs. Fournisseur réel à brancher ici. */
class ConsoleSmsSender implements SmsSender {
  async send(to: string, text: string) {
    console.info(`[sms] to=${to}\n${text}`);
  }
}

export function getSmsSender(): SmsSender {
  // SMS_PROVIDER : seul "console" est disponible pour l'instant.
  return new ConsoleSmsSender();
}
