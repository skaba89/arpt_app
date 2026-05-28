/**
 * ARPT Guinée - Graceful Shutdown Handler
 *
 * Gère l'arrêt propre du serveur en production :
 * - Intercepte SIGTERM, SIGINT, SIGHUP
 * - Ferme les connexions DB proprement
 * - Ferme les connexions Redis
 * - Log les métriques de shutdown
 */

import { logger } from "./logger";

interface Shutdownable {
  disconnect?: () => Promise<void>;
  close?: () => Promise<void>;
  quit?: () => Promise<void>;
}

const connections: { name: string; client: Shutdownable }[] = [];
let isShuttingDown = false;

/**
 * Enregistre une connexion à fermer lors du shutdown
 */
export function registerConnection(name: string, client: Shutdownable): void {
  connections.push({ name, client });
  logger.debug(`Connexion enregistrée: ${name}`);
}

/**
 * Ferme toutes les connexions proprement
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Signal ${signal} reçu — début du graceful shutdown`);

  const shutdownTimeout = setTimeout(() => {
    logger.error("Timeout de shutdown atteint — fermeture forcée");
    process.exit(1);
  }, 10000); // 10 secondes max

  // Fermer les connexions dans l'ordre inverse d'enregistrement
  for (let i = connections.length - 1; i >= 0; i--) {
    const { name, client } = connections[i];
    try {
      if (client.quit) {
        await client.quit();
        logger.info(`Connexion fermée: ${name} (quit)`);
      } else if (client.close) {
        await client.close();
        logger.info(`Connexion fermée: ${name} (close)`);
      } else if (client.disconnect) {
        await client.disconnect();
        logger.info(`Connexion fermée: ${name} (disconnect)`);
      }
    } catch (err) {
      logger.error(`Erreur fermeture ${name}`, err);
    }
  }

  clearTimeout(shutdownTimeout);
  logger.info("Graceful shutdown terminé avec succès");
  process.exit(0);
}

/**
 * Initialise les handlers de graceful shutdown
 * À appeler au démarrage de l'application
 */
export function setupGracefulShutdown(): void {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Gestion des uncaught exceptions
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", err);
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", reason instanceof Error ? reason : new Error(String(reason)));
    // Ne pas quitter pour les rejections, juste logger
  });

  logger.info("Graceful shutdown handlers configurés");
}
