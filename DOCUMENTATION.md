# 🏦 Private Wallet Backend API

## 📋 Descripción General

Sistema backend para aplicación de billetera privada con IA integrada, análisis de mercado, metas financieras y recordatorios inteligentes.

## 🏗️ Arquitectura

### Base de Datos (MySQL)
- **Host**: localhost:3306
- **Usuario**: root
- **Contraseña**: 654321
- **Base de datos**: private_wallet_db

### Estructura de Controladores
```
src/controllers/
├── transactionsController.js ✅ (Transacciones básicas)
├── usersController.js          (Autenticación + Suscripciones)
├── aiController.js            (Chat con IA + Memoria)
├── marketController.js        (Datos de mercado)
├── goalsController.js         (Metas y logros)
├── analyticsController.js     (Gráficas y estadísticas)
├── remindersController.js     (Recordatorios)
└── investmentController.js    (Análisis de inversiones)
```

## 🔐 Autenticación JWT

### Sistema de Tokens
- **Access Token**: 15 minutos de duración
- **Refresh Token**: 7 días de duración
- **Middleware**: Verificación en todas las rutas protegidas

### Endpoints de Autenticación
```
POST /api/auth/register     - Registro de usuario
POST /api/auth/login        - Inicio de sesión
POST /api/auth/refresh      - Renovar token
POST /api/auth/logout       - Cerrar sesión
```

## 💰 Sistema de Suscripciones Freemium

### Planes
- **Free**: 3 preguntas IA/mes, funciones básicas
- **Premium**: IA ilimitada, análisis avanzados, recordatorios inteligentes

### Límites
- **Free**: 3 consultas IA por mes
- **Premium**: Consultas ilimitadas
- **Tracking**: Seguimiento automático de uso

## 🤖 Sistema de IA (OpenRouter)

### Configuración
- **API Key**: OPENROUTER (desde .env)
- **Memoria**: Conversaciones persistentes
- **Contexto**: Historial financiero del usuario

### Funcionalidades
- Chat inteligente sobre finanzas
- Recomendaciones personalizadas
- Análisis de patrones de gasto
- Consejos de ahorro e inversión

## 📊 Datos de Mercado

### Fuentes de Datos
- **Scraping**: CoinGecko, Yahoo Finance
- **Actualización**: Cada 5 minutos via cron
- **Almacenamiento**: Base de datos local

### Tipos de Datos
- Criptomonedas
- Acciones
- Metales preciosos
- Índices bursátiles

## 🎯 Sistema de Metas

### Funcionalidades
- Crear metas personalizadas
- Seguimiento de progreso
- Planes de ahorro sugeridos por IA
- Notificaciones de progreso

### Tipos de Metas
- Compras específicas (laptop, carro)
- Ahorro por cantidad
- Objetivos temporales

## 📈 Analytics y Gráficas

### Dashboard Principal
- Ingresos vs Egresos
- Tendencias temporales
- Análisis por categorías
- Predicciones IA

### Períodos de Consulta
- Diario
- Mensual
- Anual
- Personalizado

## 🔔 Sistema de Recordatorios

### Tipos de Recordatorios
- Gastos recurrentes (renta, servicios)
- Pagos únicos
- Recordatorios personalizados

### Notificaciones
- 3 días antes
- 1 día antes
- Día del vencimiento
- Recordatorios de seguimiento

## 🚀 Instalación y Configuración

### Dependencias
```bash
npm install mysql2 jsonwebtoken bcryptjs axios cheerio node-cron cors express dotenv
```

### Variables de Entorno
```env
DATABASE_URL=mysql://root:654321@localhost:3306/private_wallet_db
OPENROUTER=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_aqui
```

### Inicialización
```bash
npm run dev
```

## 📝 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Usuarios
- `GET /api/users/profile` - Perfil del usuario
- `PUT /api/users/subscription` - Actualizar suscripción
- `GET /api/users/usage` - Uso actual (preguntas IA)

### Transacciones
- `GET /api/transactions/:userId` - Obtener transacciones
- `POST /api/transactions` - Crear transacción
- `DELETE /api/transactions/:id` - Eliminar transacción
- `GET /api/transactions/:userId/summary` - Resumen financiero

### IA
- `POST /api/ai/chat` - Enviar mensaje a IA
- `GET /api/ai/conversations/:userId` - Historial de conversaciones
- `GET /api/ai/usage/:userId` - Uso de IA del usuario

### Mercado
- `GET /api/market/crypto` - Datos de criptomonedas
- `GET /api/market/stocks` - Datos de acciones
- `GET /api/market/analysis` - Análisis de mercado

### Metas
- `POST /api/goals` - Crear meta
- `GET /api/goals/:userId` - Metas del usuario
- `PUT /api/goals/:id/progress` - Actualizar progreso
- `GET /api/goals/:id/plan` - Plan de ahorro sugerido

### Analytics
- `GET /api/analytics/dashboard/:userId` - Dashboard principal
- `GET /api/analytics/trends/:userId` - Tendencias temporales
- `GET /api/analytics/categories/:userId` - Análisis por categoría

### Recordatorios
- `POST /api/reminders` - Crear recordatorio
- `GET /api/reminders/:userId` - Recordatorios del usuario
- `PUT /api/reminders/:id/complete` - Marcar como completado
- `GET /api/reminders/upcoming/:userId` - Próximos vencimientos

### Inversiones
- `GET /api/investments/analysis` - Análisis IA de mercado
- `POST /api/investments/recommend` - Recomendación personalizada
- `GET /api/investments/portfolio/:userId` - Portfolio del usuario

## 🔄 Cron Jobs

### Actualización de Datos
- **Mercado**: Cada 5 minutos
- **Recordatorios**: Cada hora
- **Análisis IA**: Diario
- **Reportes**: Semanal

## 🛡️ Seguridad

### Middleware de Seguridad
- Rate limiting por usuario
- Verificación JWT en todas las rutas
- Validación de entrada
- Sanitización de datos

### Privacidad
- Datos encriptados en tránsito
- Tokens seguros
- Límites de acceso por suscripción
- Logs de auditoría

## 📱 Integración Flutter

### APIs RESTful
- Autenticación JWT
- WebSockets para notificaciones
- Upload de archivos
- Push notifications

### Formato de Respuesta
```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🚀 Estado del Proyecto

### ✅ COMPLETADO
1. ✅ Configuración de base de datos MySQL
2. ✅ Implementación de autenticación JWT con refresh tokens
3. ✅ Sistema de usuarios y suscripciones freemium
4. ✅ Integración con OpenRouter para IA
5. ✅ Sistema de datos de mercado con scraping
6. ✅ Implementación completa de todos los controladores
7. ✅ Sistema de metas y logros
8. ✅ Analytics y gráficas
9. ✅ Sistema de recordatorios
10. ✅ Análisis de inversiones
11. ✅ Cron jobs para actualización automática

### 📋 ESTRUCTURA COMPLETA IMPLEMENTADA

#### Controladores
- ✅ `usersController.js` - Autenticación y suscripciones
- ✅ `aiController.js` - Chat con IA y análisis financiero
- ✅ `marketController.js` - Datos de mercado y scraping
- ✅ `goalsController.js` - Metas y planes de ahorro
- ✅ `analyticsController.js` - Dashboard y estadísticas
- ✅ `remindersController.js` - Recordatorios inteligentes
- ✅ `investmentController.js` - Análisis de inversiones
- ✅ `transactionsController.js` - Transacciones básicas

#### Rutas
- ✅ `/api/auth/*` - Autenticación
- ✅ `/api/users/*` - Gestión de usuarios
- ✅ `/api/ai/*` - Chat con IA
- ✅ `/api/market/*` - Datos de mercado
- ✅ `/api/goals/*` - Metas y objetivos
- ✅ `/api/analytics/*` - Analytics y gráficas
- ✅ `/api/reminders/*` - Recordatorios
- ✅ `/api/investments/*` - Inversiones
- ✅ `/api/transactions/*` - Transacciones

#### Base de Datos
- ✅ 7 tablas implementadas con relaciones
- ✅ Índices optimizados para consultas
- ✅ Sistema de suscripciones freemium
- ✅ Almacenamiento de conversaciones IA
- ✅ Datos de mercado en tiempo real

#### Funcionalidades Avanzadas
- ✅ Autenticación JWT con refresh tokens
- ✅ Sistema freemium (3 preguntas gratis)
- ✅ IA con contexto financiero personalizado
- ✅ Scraping automático de datos de mercado
- ✅ Cron jobs para actualización automática
- ✅ Análisis de inversiones con IA
- ✅ Recordatorios inteligentes
- ✅ Dashboard con gráficas
- ✅ Sistema de metas con progreso

## 🎯 PRÓXIMOS PASOS PARA FLUTTER

### Integración con Flutter
1. **Autenticación**: Implementar login/registro con JWT
2. **Dashboard**: Mostrar resumen financiero
3. **Chat IA**: Interfaz de chat con contexto financiero
4. **Metas**: Crear y gestionar objetivos
5. **Recordatorios**: Notificaciones push
6. **Analytics**: Gráficas con Chart.js o similar
7. **Mercado**: Mostrar datos en tiempo real

### APIs Listas para Flutter
- ✅ Todas las rutas implementadas
- ✅ Autenticación JWT completa
- ✅ Respuestas JSON estandarizadas
- ✅ Manejo de errores consistente
- ✅ Rate limiting implementado

---

**Versión**: 1.0.0  
**Estado**: ✅ COMPLETO - Listo para integración Flutter  
**Última actualización**: 2024-01-01  
**Mantenido por**: Equipo de desarrollo
## Notas de seguridad y configuraci�n (2025-10-23)
- Configuraci�n de base de datos ahora depende de variables de entorno (`DATABASE_URL` o `DB_HOST`/`DB_USER`...).
- Archivo `.env.example` agregado con placeholders para facilitar la rotaci�n de secretos.
- Middleware de rate limiting combina IP y usuario autenticado cuando es posible y se degrada con mensajes claros si Upstash no est� disponible.
- M�dulo de transacciones protegido por JWT y validaci�n de propiedad del recurso.
- Consultas de analytics sanitizan el periodo solicitado y validan rangos de fechas personalizados.
- Integraci�n con Stripe responde con errores controlados cuando no hay credenciales y pospone la verificaci�n de webhooks hasta contar con la configuraci�n segura.

### Evaluaci�n de calidad
| Categor�a        | Calificaci�n (1-5) | Observaciones breves |
| ---------------- | ------------------ | -------------------- |
| Seguridad        | 3                  | Autenticaci�n aplicada en transacciones y validaciones adicionales; pendiente verificaci�n de webhooks y rotaci�n de secretos existentes. |
| Arquitectura     | 3                  | Separaci�n por capas consistente; cron jobs y controladores a�n acoplados. |
| Calidad de c�digo| 3                  | Manejo de errores m�s uniforme y validaciones expl�citas; controladores siguen siendo extensos. |
| Rendimiento      | 3                  | Consultas parametrizadas y rate limiter estable; sin caching adicional. |
| Observabilidad   | 2                  | Logging sigue basado en `console.log`, sin m�tricas ni trazas. |
| Documentaci�n    | 3                  | Informaci�n de configuraci�n actualizada, describe limitaciones pendientes. |
| Pruebas          | 1                  | No se a�adieron pruebas automatizadas. |




import mysql from 'mysql2/promise';

async function createDatabase() {
    try {
        // Conectar sin especificar base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            transaction: 3306,
            user: 'root',
            password: '654321'
        });

        // Crear la base de datos
        await connection.execute('CREATE DATABASE IF NOT EXISTS private_wallet_db');
        console.log('✅ Base de datos creada exitosamente');
        
        await connection.end();
    } catch (error) {
        console.log('❌ Error creando base de datos:', error.message);
    }
}

createDatabase();