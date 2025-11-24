import cron from "cron";
import { updateMarketData } from "../controllers/marketController.js";
import { pool } from "./db.js";

// Actualizar datos de mercado cada hora
const marketDataJob = new cron.CronJob("0 * * * *", async function () {
  console.log("🔄 Actualizando datos de mercado...");
  const startTime = Date.now();
  
  try {
    await updateMarketData();
    const executionTime = Date.now() - startTime;
    
    // Registrar en logs
    await pool.execute(
      'INSERT INTO scraping_logs (type, status, records_updated, execution_time_ms) VALUES (?, "success", ?, ?)',
      ['full', 0, executionTime]
    );
    
    console.log("✅ Datos de mercado actualizados exitosamente");
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Registrar error en logs
    await pool.execute(
      'INSERT INTO scraping_logs (type, status, error_message, execution_time_ms) VALUES (?, "error", ?, ?)',
      ['full', error.message, executionTime]
    );
    
    console.error("❌ Error en actualización automática:", error);
  }
});

// Limpiar logs antiguos cada día a las 2 AM
const cleanupJob = new cron.CronJob("0 2 * * *", async function () {
  console.log("🧹 Limpiando logs antiguos...");
  try {
    // Eliminar logs de más de 30 días
    await pool.execute(
      'DELETE FROM scraping_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    
    // Eliminar uso de IA de más de 90 días
    await pool.execute(
      'DELETE FROM ai_usage WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );
    
    console.log("✅ Limpieza de logs completada");
  } catch (error) {
    console.error("❌ Error en limpieza de logs:", error);
  }
});

// Verificar configuración de scraping cada 6 horas
const configJob = new cron.CronJob("0 */6 * * *", async function () {
  console.log("⚙️ Verificando configuración de scraping...");
  try {
    const [config] = await pool.execute('SELECT * FROM scraping_config WHERE id = 1');
    
    if (config.length === 0) {
      // Crear configuración por defecto
      await pool.execute(
        'INSERT INTO scraping_config (id, scraping_enabled, update_interval_minutes) VALUES (1, TRUE, 60)'
      );
      console.log("✅ Configuración de scraping creada");
    }
    
    console.log("✅ Configuración de scraping verificada");
  } catch (error) {
    console.error("❌ Error verificando configuración:", error);
  }
});

// Verificar recordatorios cada hora
const remindersJob = new cron.CronJob("0 * * * *", function () {
  console.log("Verificando recordatorios...");
  // Aquí se implementaría la lógica de notificaciones
});

// Análisis diario de tendencias
const analysisJob = new cron.CronJob("0 9 * * *", function () {
  console.log("Ejecutando análisis diario de tendencias...");
  // Aquí se implementaría el análisis diario
});

// Reportes semanales
const reportsJob = new cron.CronJob("0 9 * * 1", function () {
  console.log("Generando reportes semanales...");
  // Aquí se implementarían los reportes semanales
});

// Función para iniciar todos los cron jobs
const startAllJobs = () => {
  marketDataJob.start();
  cleanupJob.start();
  configJob.start();
  remindersJob.start();
  analysisJob.start();
  reportsJob.start();
  console.log("📅 Todos los cron jobs iniciados");
};

// Función para detener todos los cron jobs
const stopAllJobs = () => {
  marketDataJob.stop();
  cleanupJob.stop();
  configJob.stop();
  remindersJob.stop();
  analysisJob.stop();
  reportsJob.stop();
  console.log("📅 Todos los cron jobs detenidos");
};

export { startAllJobs, stopAllJobs };
export default { startAllJobs, stopAllJobs };


// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals
// we want to send 1 GET request for every 14 minutes

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of 5 fields representing:

//! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

//? EXAMPLES && EXPLANATION:
//* 14 * * * * - Every 14 minutes
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight, on January 1st
//* 0 * * * * - Every hour