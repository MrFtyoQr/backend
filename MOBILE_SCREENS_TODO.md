## ✅ To‑Do de pantallas móviles y endpoints – Private Wallet

Este documento mapea **cada pantalla de la app móvil** con **los endpoints reales del backend**.  
La idea es que sirva como **lista de tareas** para el desarrollo y como contrato entre **frontend y backend**.

- **Backend base URL**: `http://localhost:5001/api`
- **Auth**: JWT en header `Authorization: Bearer {token}`

> Regla clave: **no hay pantallas sobrantes**.  
> Si un endpoint no tiene pantalla, se explica explícitamente por qué (uso interno/backend only).

---

## 1. Lista de pantallas (resumen rápido)

- **Auth**
  - [x] `LoginScreen` – Login del usuario.
  - [x] `RegisterScreen` – Registro de usuario.
  - [x] `ForgotPasswordScreen` – Recuperar contraseña (email → token). `ResetPasswordScreen` – Restablecer con código.

- **Shell / navegación**
  - [x] `MainApp` / `AuthGate` – Decide entre login y dashboard según tokens.

- **Dashboard & transacciones**
  - [x] `DashboardScreen` – Resumen general, balance, acciones rápidas.
  - [x] `TransactionsScreen` – Lista de transacciones.
  - [x] `AddTransactionScreen` – Crear/editar transacción.
  - [x] `TransactionDetailScreen` – Ver detalles y eliminar transacción.

- **Metas (Goals)**
  - [x] `GoalsScreen` – Lista + resumen de metas.
  - [x] `AddGoalScreen` – Crear meta.
  - [x] `GoalDetailScreen` – Detalle, progreso, plan de ahorro, estado.

- **Recordatorios (Reminders)**
  - [x] `RemindersScreen` – Lista, filtros, próximos, resumen.
  - [x] `AddReminderScreen` – Crear/editar recordatorio.

- **IA / Asistente financiero**
  - [x] `AiChatScreen` – Chat con IA + consumo de IA del usuario.

- **Analytics**
  - [x] `AnalyticsScreen` – Dashboard de analytics (tendencias, categorías, predicciones).
  - [x] `ReportsScreen` – Reportes mensuales / históricos.

- **Mercado & Inversiones**
  - [x] `MarketScreen` – Crypto, acciones y análisis de mercado.
  - [x] `InvestmentAnalysisScreen` – Análisis de inversiones, portfolio, recomendaciones, alertas.

- **Suscripción & pagos**
  - [x] `SubscriptionScreen` – Estado de plan (free/premium), info de suscripción.
  - [x] `PaymentScreen` – Flujo de pago premium + historial de pagos.

- **Perfil & configuración**
  - [x] `ProfileScreen` – Datos del usuario + plan actual.
  - [x] `SettingsScreen` – Preferencias locales (tema, idioma, logout, etc.).

---

## 2. Detalle por pantalla (con endpoints)

### 2.1. Auth – `LoginScreen`

- **Archivo sugerido**: `lib/features/auth/screens/login_screen.dart`
- **Objetivo**: Permitir login y llevar al usuario al dashboard.
- **Endpoints usados**:
  - [x] `POST /api/auth/login`
    - **Uso**: Enviar `user_id` y `password`.  
    - **Resultado en UI**:
      - Guarda `accessToken` y `refreshToken` en almacenamiento seguro.
      - Navega a `DashboardScreen` en caso de éxito.
      - Muestra error en `SnackBar` en caso de fallo.
  - [x] `POST /api/auth/refresh` (uso automático vía `ApiService`)
    - **Uso**: Refrescar token cuando el backend responde `401`.  
    - **Resultado en UI**:
      - Seamless: el usuario no ve pantalla, pero evita cierres de sesión inesperados.

### 2.2. Auth – `RegisterScreen`

- **Archivo sugerido**: `lib/features/auth/screens/register_screen.dart`
- **Objetivo**: Registrar un nuevo usuario.
- **Endpoints usados**:
  - [x] `POST /api/auth/register`
    - **Uso**: Crear usuario con `user_id`, `email`, `password`.
    - **Resultado en UI**:
      - Feedback de éxito (mensaje + posible navegación a `LoginScreen`).
      - Manejo de errores de validación/duplicados.

> **No se implementa por ahora**: `ForgotPasswordScreen`, porque el backend no expone endpoints de recuperación de contraseña.

---

### 2.3. Shell – `MainApp` / `AuthGate`

- **Archivo sugerido**: `lib/main.dart`
- **Objetivo**: Decidir si el usuario ve `LoginScreen` o `DashboardScreen`.
- **Endpoints usados indirectamente**:
  - [x] Verificación de token (`AuthService.isLoggedIn` usando storage local).
  - [ ] Uso indirecto de `GET /api/users/profile` para validar token al cargar el dashboard (ver `ProfileScreen`).

---

### 2.4. Dashboard – `DashboardScreen`

- **Archivo sugerido**: `lib/features/dashboard/screens/dashboard_screen.dart`
- **Objetivo**: Vista principal con resumen financiero y accesos rápidos.
- **Endpoints usados**:
  - [ ] `GET /api/transactions/summary`
    - **Uso**: Mostrar balance, ingresos y gastos en la tarjeta principal.
  - [ ] `GET /api/transactions`
    - **Uso**: Listar últimas transacciones (ej. top 5) en “Transacciones recientes”.
  - [ ] Opcional futura integración:
    - [ ] `GET /api/analytics/dashboard?period=30`
      - **Uso**: Refrescar resumen con métricas avanzadas (ej. gasto promedio, variación).

---

### 2.5. Transacciones – `TransactionsScreen`

- **Archivo sugerido**: `lib/features/transactions/screens/transactions_screen.dart`
- **Objetivo**: Listar todas las transacciones del usuario con filtros básicos.
- **Endpoints usados**:
  - [ ] `GET /api/transactions`
    - **Uso**: Cargar lista completa de transacciones.
    - **UI**: ListView con ítems (`TransactionItem`), filtros por tipo/categoría.
  - [ ] `GET /api/transactions/summary`
    - **Uso**: Mostrar resumen en cabecera (total, ingresos, gastos).

### 2.6. Transacciones – `AddTransactionScreen`

- **Archivo sugerido**: `lib/features/transactions/screens/add_transaction_screen.dart`
- **Objetivo**: Crear o editar una transacción.
- **Endpoints usados**:
  - [ ] `POST /api/transactions`
    - **Uso**: Crear nueva transacción con `title`, `amount`, `category`, `type`.
    - **UI**: Formulario con validaciones, feedback de éxito y navegación de vuelta.
  - [ ] `PUT /api/transactions/{id}` (definido en `ApiService`)
    - **Uso**: Actualizar transacción existente cuando se abre en modo edición.

### 2.7. Transacciones – `TransactionDetailScreen`

- **Archivo sugerido**: `lib/features/transactions/screens/transaction_detail_screen.dart`
- **Objetivo**: Ver detalle de una transacción y permitir eliminarla.
- **Endpoints usados**:
  - [ ] `GET /api/transactions` (lista cacheada o fetch individual según implementación)
  - [ ] `DELETE /api/transactions/{id}`
    - **Uso**: Eliminar transacción desde botón “Eliminar”.
    - **UI**: Confirmación, feedback y refresco de lista al volver.

---

### 2.8. Metas – `GoalsScreen`

- **Archivo sugerido**: `lib/features/goals/screens/goals_screen.dart`
- **Objetivo**: Listar metas, ver estado y resumen agregado.
- **Endpoints usados**:
  - [ ] `GET /api/goals`
    - **Uso**: Cargar lista de metas (con filtros opcionales `status`).
  - [ ] `GET /api/goals/summary`
    - **Uso**: Mostrar totales de metas (monto objetivo, ahorrado, etc.).

### 2.9. Metas – `AddGoalScreen`

- **Archivo sugerido**: `lib/features/goals/screens/add_goal_screen.dart`
- **Objetivo**: Crear una nueva meta.
- **Endpoints usados**:
  - [ ] `POST /api/goals`
    - **Uso**: Crear meta con `title`, `description`, `target_amount`, `deadline`.

### 2.10. Metas – `GoalDetailScreen`

- **Archivo sugerido**: `lib/features/goals/screens/goal_detail_screen.dart`
- **Objetivo**: Gestionar una meta concreta (progreso, plan, estado).
- **Endpoints usados**:
  - [ ] `GET /api/goals` (para obtener detalle de una meta concreta o endpoint dedicado si se añade).
  - [ ] `PUT /api/goals/{id}/progress`
    - **Uso**: Actualizar progreso sumando `amount`.
  - [ ] `GET /api/goals/{id}/plan`
    - **Uso**: Mostrar plan de ahorro sugerido (ej. monto mensual recomendado).
  - [ ] `PUT /api/goals/{id}/status`
    - **Uso**: Marcar como `completed`, `paused`, etc.
  - [ ] `DELETE /api/goals/{id}`
    - **Uso**: Eliminar meta.

---

### 2.11. Recordatorios – `RemindersScreen`

- **Archivo sugerido**: `lib/features/reminders/screens/reminders_screen.dart`
- **Objetivo**: Ver todos los recordatorios, próximos pagos y resumen.
- **Endpoints usados**:
  - [ ] `GET /api/reminders`
    - **Uso**: Lista completa de recordatorios (`status` filtrable).
  - [ ] `GET /api/reminders/upcoming?days=7`
    - **Uso**: Sección de “Próximos 7 días”.
  - [ ] `GET /api/reminders/summary`
    - **Uso**: Resumen de recordatorios activos, vencidos, completados.
  - [ ] `GET /api/reminders/notifications`
    - **Uso**: Sincronizar con `NotificationService` para programar notificaciones locales.

### 2.12. Recordatorios – `AddReminderScreen`

- **Archivo sugerido**: `lib/features/reminders/screens/add_reminder_screen.dart`
- **Objetivo**: Crear o editar un recordatorio.
- **Endpoints usados**:
  - [ ] `POST /api/reminders`
    - **Uso**: Crear nuevo recordatorio (con o sin recurrencia).
  - [ ] `PUT /api/reminders/{id}`
    - **Uso**: Actualizar campos de un recordatorio existente.
  - [ ] `PUT /api/reminders/{id}/complete`
    - **Uso**: Marcar recordatorio como completado (puede estar accesible desde detalle).
  - [ ] `DELETE /api/reminders/{id}`
    - **Uso**: Eliminar recordatorio desde detalle o lista.

---

### 2.13. IA – `AiChatScreen`

- **Archivo sugerido**: `lib/features/ai_chat/screens/ai_chat_screen.dart`
- **Objetivo**: Chat de texto con IA + indicador de uso (free vs premium).
- **Endpoints usados**:
  - [ ] `GET /api/users/usage`
    - **Uso**: Mostrar cuántas preguntas IA lleva usadas el usuario free.
  - [ ] `POST /api/ai/chat`
    - **Uso**: Enviar mensaje de usuario y recibir respuesta de IA.
  - [ ] `GET /api/ai/conversations`
    - **Uso**: Historial de conversaciones, para reabrir chats pasados.
  - [ ] `GET /api/ai/conversations/{conversationId}`
    - **Uso**: Cargar mensajes de una conversación concreta.
  - [ ] `GET /api/ai/analysis`
    - **Uso**: Botón tipo “Ver análisis financiero” que muestra un resumen generado por IA.

---

### 2.14. Analytics – `AnalyticsScreen`

- **Archivo sugerido**: `lib/features/analytics/screens/analytics_screen.dart`
- **Objetivo**: Mostrar gráficas y estadísticas de comportamiento financiero.
- **Endpoints usados**:
  - [ ] `GET /api/analytics/dashboard?period=30`
    - **Uso**: Datos base para tarjetas/resumenes de gasto/ingreso.
  - [ ] `GET /api/analytics/trends?period=month` o con rango de fechas
    - **Uso**: Gráficas de tendencias en el tiempo (`ChartWidget`).
  - [ ] `GET /api/analytics/categories?period=30`
    - **Uso**: Distribución por categorías (ej. gráfica de pastel / barras).

### 2.15. Analytics – `ReportsScreen`

- **Archivo sugerido**: `lib/features/analytics/screens/reports_screen.dart`
- **Objetivo**: Reportes más pesados e históricos.
- **Endpoints usados**:
  - [ ] `GET /api/analytics/predictions`
    - **Uso**: Mostrar predicciones de gasto/ingreso futuro.
  - [ ] `GET /api/analytics/monthly-report?year=YYYY&month=MM`
    - **Uso**: Descargar/mostrar reporte detallado por mes.

---

### 2.16. Mercado – `MarketScreen`

- **Archivo sugerido**: `lib/features/market/screens/market_screen.dart`
- **Objetivo**: Mostrar datos de mercado (crypto y acciones) y análisis general.
- **Endpoints usados**:
  - [ ] `GET /api/market/crypto`
    - **Uso**: Lista de criptomonedas y precios.
  - [ ] `GET /api/market/stocks`
    - **Uso**: Lista de acciones y precios.
  - [ ] `GET /api/market/analysis`
    - **Uso**: Módulo de análisis general de mercado (panel con insights).

### 2.17. Mercado & Inversiones – `InvestmentAnalysisScreen`

- **Archivo sugerido**: `lib/features/market/screens/investment_analysis_screen.dart`
- **Objetivo**: Profundizar en inversiones del usuario.
- **Endpoints usados**:
  - [ ] `GET /api/market/personalized-analysis`
    - **Uso**: Análisis de mercado personalizado al perfil.
  - [ ] `GET /api/investments/analysis`
    - **Uso**: Resumen general de inversiones.
  - [ ] `POST /api/investments/recommend`
    - **Uso**: Generar recomendación puntual (ej. para símbolo concreto).
  - [ ] `GET /api/investments/portfolio`
    - **Uso**: Mostrar portfolio actual del usuario.
  - [ ] `POST /api/investments/alert`
    - **Uso**: Crear alerta de precio (ej. para BTC, AAPL, etc.).
  - [ ] `GET /api/investments/trends`
    - **Uso**: Tendencias específicas de inversión (gráficas).

---

### 2.18. Suscripción – `SubscriptionScreen`

- **Archivo sugerido**: `lib/features/subscription/screens/subscription_screen.dart`
- **Objetivo**: Mostrar estado de plan (free/premium) y beneficios.
- **Endpoints usados**:
  - [ ] `GET /api/payments/subscription`
    - **Uso**: Saber si el usuario es `free` o `premium`, y detalle de su suscripción.
  - [ ] `POST /api/payments/cancel`
    - **Uso**: Opción de cancelar suscripción premium desde la pantalla.
  - [ ] `GET /api/users/profile`
    - **Uso**: Mostrar datos básicos del usuario y tipo de suscripción (`subscriptionType`).

### 2.19. Pagos – `PaymentScreen`

- **Archivo sugerido**: `lib/features/subscription/screens/payment_screen.dart`
- **Objetivo**: Ejecutar el flujo de pago y ver historial.
- **Endpoints usados**:
  - [ ] `POST /api/payments/create`
    - **Uso**: Crear `PaymentIntent` (monto, moneda, tipo de suscripción).
  - [ ] `POST /api/payments/confirm`
    - **Uso**: Confirmar pago después de completar el flujo con Stripe.
  - [ ] `GET /api/payments/history`
    - **Uso**: Mostrar historial de pagos y recibos dentro de la misma pantalla.

> **Nota**:  
> `POST /api/payments/webhook/stripe` **no tiene pantalla**, es usado por Stripe para notificaciones server‑to‑server.  
> Solo se monitorea desde backend.

---

### 2.20. Perfil – `ProfileScreen`

- **Archivo sugerido**: `lib/features/profile/screens/profile_screen.dart`
- **Objetivo**: Mostrar información del usuario y su plan actual.
- **Endpoints usados**:
  - [ ] `GET /api/users/profile`
    - **Uso**: Mostrar `userId`, `email`, `subscriptionType`, `aiQuestionsUsed`.
  - [ ] `GET /api/payments/subscription`
    - **Uso**: Mostrar detalles de suscripción en la misma pantalla (fecha, tipo).

---

### 2.21. Configuración – `SettingsScreen`

- **Archivo sugerido**: `lib/features/profile/screens/settings_screen.dart`
- **Objetivo**: Preferencias de la app (tema, idioma, logout).
- **Endpoints usados**:
  - Principalmente **lógica local**:
    - Limpieza de tokens (`logout` vía `AuthService.logout`).
    - Cambios de tema/idioma (almacenados localmente).
  - No requiere endpoints adicionales del backend actual.

---

## 3. Endpoints sin pantalla directa

Estos endpoints **no tienen una pantalla dedicada**, pero siguen siendo parte del sistema:

- **GET `/api/health`**
  - Uso recomendado: chequeo silencioso al abrir la app o al mostrar un mensaje tipo “No hay conexión con el servidor”.
- **POST `/api/payments/webhook/stripe`**
  - Uso: solo para comunicación entre Stripe y el backend (webhook).

---

## 4. Checklist de finalización por módulo

- **Auth**
  - [x] `LoginScreen` conectado a `POST /api/auth/login`.
  - [x] `RegisterScreen` conectado a `POST /api/auth/register`.
  - [x] `ApiService` manejando `POST /api/auth/refresh`.

- **Dashboard & transacciones**
  - [x] `DashboardScreen` usando `GET /api/transactions` + `GET /api/transactions/summary`.
  - [x] `TransactionsScreen` con lista completa.
  - [x] `AddTransactionScreen` con `POST /api/transactions` y `PUT /api/transactions/{id}`.
  - [x] `TransactionDetailScreen` con `DELETE /api/transactions/{id}`.

- **Metas**
  - [x] `GoalsScreen` con `GET /api/goals` + `GET /api/goals/summary`.
  - [x] `AddGoalScreen` con `POST /api/goals`.
  - [x] `GoalDetailScreen` con `PUT /api/goals/{id}/progress`, `GET /api/goals/{id}/plan`, `PUT /api/goals/{id}/status`, `DELETE /api/goals/{id}`.

- **Recordatorios**
  - [x] `RemindersScreen` con `GET /api/reminders`, `GET /api/reminders/upcoming`, `GET /api/reminders/summary`, `GET /api/reminders/notifications`.
  - [x] `AddReminderScreen` con `POST /api/reminders`, `PUT /api/reminders/{id}`, `PUT /api/reminders/{id}/complete`, `DELETE /api/reminders/{id}`.

- **IA**
  - [x] `AiChatScreen` con `GET /api/users/usage`, `POST /api/ai/chat`, `GET /api/ai/conversations`, `GET /api/ai/conversations/{id}`, `GET /api/ai/analysis`.

- **Analytics**
  - [x] `AnalyticsScreen` con `GET /api/analytics/dashboard`, `GET /api/analytics/trends`, `GET /api/analytics/categories`.
  - [x] `ReportsScreen` con `GET /api/analytics/predictions`, `GET /api/analytics/monthly-report`.

- **Mercado & inversiones**
  - [x] `MarketScreen` con `GET /api/market/crypto`, `GET /api/market/stocks`, `GET /api/market/analysis`.
  - [x] `InvestmentAnalysisScreen` con `GET /api/market/personalized-analysis`, `GET /api/investments/analysis`, `POST /api/investments/recommend`, `GET /api/investments/portfolio`, `POST /api/investments/alert`, `GET /api/investments/trends`.

- **Suscripción & pagos**
  - [x] `SubscriptionScreen` con `GET /api/payments/subscription`, `POST /api/payments/cancel`, `GET /api/users/profile`.
  - [x] `PaymentScreen` con `POST /api/payments/create`, `POST /api/payments/confirm`, `GET /api/payments/history`.

- **Perfil & settings**
  - [x] `ProfileScreen` con `GET /api/users/profile` + `GET /api/payments/subscription`.
  - [x] `SettingsScreen` con logout y preferencias locales funcionando.

Con este archivo, puedes ir marcando cada **pantalla** y cada **endpoint** a medida que se implementan y se validan con el backend, garantizando que **no queda ningún endpoint huérfano ni pantalla sobrante**.

