/**
 * ARPT Guinée - Test Setup
 *
 * Configuration globale pour tous les tests.
 */

// Variables d'environnement pour les tests
process.env.DATABASE_URL = "file:./test.db";
process.env.NEXTAUTH_SECRET = "test-secret-for-ci";
process.env.JWT_SECRET = "test-jwt-secret-for-ci";
process.env.SESSION_SECRET = "test-session-secret-for-ci";
process.env.NODE_ENV = "test";
