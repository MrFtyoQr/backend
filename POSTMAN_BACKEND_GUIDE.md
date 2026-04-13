## 🧾 Guía práctica para probar el backend con Postman

Esta guía está pensada para **copiar y pegar directamente en Postman**.  
Todas las URLs usan `http://localhost:5001`, que es donde levanta el backend por defecto.

---

## 1. Preparar el backend

1. Abre una terminal en la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea el archivo `.env` (en `backend/.env`) con al menos:
   ```env
   DATABASE_URL=mysql://root:654321@localhost:3306/private_wallet_db

   JWT_SECRET=tu_clave_jwt_segura
   JWT_REFRESH_SECRET=tu_clave_refresh_segura

   # Opcionales
   OPENROUTER=tu_api_key_openrouter
   STRIPE_SECRET_KEY=tu_clave_stripe
   ```
4. Arranca el servidor:
   ```bash
   npm run dev
   ```
5. Verás algo como:
   ```text
   Database initialized successfully
   Server is up and running on http://0.0.0.0:5001
   ```

---

## 2. Preparar Postman (opcional pero recomendado)

En Postman, crea un **Environment** y añade:

- `baseUrl` = `http://localhost:5001`
- `accessToken` = *(se llenará después del login)*
- `refreshToken` = *(opcional)*

En los ejemplos de abajo usaré **URLs completas** para que puedas copiarlas tal cual,  
pero si quieres, puedes cambiar `http://localhost:5001` por `{{baseUrl}}`.

### Headers comunes

Para requests con JSON:

- `Content-Type: application/json`

Para rutas protegidas (requieren JWT):

- `Authorization: Bearer <ACCESS_TOKEN>`

---

## 3. Paso 1 – Healthcheck (sin autenticación)

Para comprobar que el backend está vivo:

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/health`

No necesita headers especiales.  
Respuesta esperada:

```json
{ "status": "ok" }
```

---

## 4. Paso 2 – Registro (`POST /api/auth/register`)

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/auth/register`  
- **Headers**:
  - `Content-Type: application/json`
- **Body (raw / JSON)**:

```json
{
  "user_id": "user_test",
  "email": "user_test@example.com",
  "password": "Password123"
}
```

Respuesta esperada: `201` con un JSON tipo:

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "....",
    "refreshToken": "...."
  }
}
```

---

## 5. Paso 3 – Login (`POST /api/auth/login`) y guardar tokens

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/auth/login`  
- **Headers**:
  - `Content-Type: application/json`
- **Body**:

```json
{
  "user_id": "user_test",
  "password": "Password123"
}
```

En la respuesta copia:

- `data.accessToken` → úsalo como `<ACCESS_TOKEN>` en los siguientes ejemplos.
- `data.refreshToken` → opcional, para renovar el token.

Si usas variables de Postman:

- `accessToken` = valor de `data.accessToken`
- `refreshToken` = valor de `data.refreshToken`

---

## 5.1. Recuperar contraseña (`POST /api/auth/forgot-password`)

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/auth/forgot-password`  
- **Headers**: `Content-Type: application/json`
- **Body (raw / JSON)**:

```json
{
  "email": "user_test@example.com"
}
```

Respuesta esperada: `200` con mensaje genérico (por seguridad no se indica si el correo existe). En desarrollo (`NODE_ENV !== production`) la respuesta puede incluir `data.token` para pruebas.

---

## 5.2. Restablecer contraseña (`POST /api/auth/reset-password`)

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/auth/reset-password`  
- **Headers**: `Content-Type: application/json`
- **Body (raw / JSON)**:

```json
{
  "token": "EL_TOKEN_RECIBIDO_POR_CORREO_O_DEV",
  "newPassword": "NuevaPassword123"
}
```

Respuesta esperada: `200` con mensaje de éxito. Si el token expiró o es inválido: `400`.

---

## 6. Paso 4 – Probar primera ruta protegida (`GET /api/users/profile`)

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/users/profile`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`

Respuesta esperada: `200` con datos del usuario:

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user_test",
      "email": "user_test@example.com",
      "subscriptionType": "free",
      "aiQuestionsUsed": 0
    }
  }
}
```

Si esto funciona, la autenticación JWT está bien configurada.

---

## 7. Transacciones (`/api/transactions`)

### 7.1. Crear transacción

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/transactions`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "title": "Sueldo",
  "amount": 1500.5,
  "category": "salary",
  "type": "income"
}
```

### 7.2. Listar transacciones

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/transactions`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 7.3. Resumen (balance / ingresos / gastos)

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/transactions/summary`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 7.4. Eliminar transacción

- **Method**: `DELETE`  
- **URL**: `http://localhost:5001/api/transactions/ID`  
  (reemplaza `ID` por el id real de la transacción)  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 8. Metas (`/api/goals`)

### 8.1. Crear meta

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/goals`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "title": "Comprar laptop",
  "description": "MacBook para trabajo",
  "target_amount": 1200,
  "deadline": "2025-12-31"
}
```

### 8.2. Listar metas

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/goals`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Opcional (query)**: `?status=active` / `completed` / `paused`

### 8.3. Actualizar progreso

- **Method**: `PUT`  
- **URL**: `http://localhost:5001/api/goals/ID/progress`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "amount": 100
}
```

### 8.4. Plan de ahorro sugerido

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/goals/ID/plan`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 8.5. Cambiar estado de meta

- **Method**: `PUT`  
- **URL**: `http://localhost:5001/api/goals/ID/status`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "status": "completed"
}
```

### 8.6. Eliminar meta

- **Method**: `DELETE`  
- **URL**: `http://localhost:5001/api/goals/ID`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 8.7. Resumen de metas

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/goals/summary`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 9. Recordatorios (`/api/reminders`)

### 9.1. Crear recordatorio

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/reminders`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "title": "Pagar renta",
  "description": "Depto centro",
  "amount": 500,
  "due_date": "2025-03-10",
  "reminder_days": 3,
  "is_recurring": true,
  "recurrence_type": "monthly"
}
```

### 9.2. Listar recordatorios

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/reminders`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Opcional**: `?status=pending|completed|overdue`

### 9.3. Próximos recordatorios

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/reminders/upcoming?days=7`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 9.4. Marcar como completado

- **Method**: `PUT`  
- **URL**: `http://localhost:5001/api/reminders/ID/complete`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 9.5. Actualizar recordatorio

- **Method**: `PUT`  
- **URL**: `http://localhost:5001/api/reminders/ID`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body (ejemplo)**:

```json
{
  "title": "Pagar renta actualizada",
  "amount": 550
}
```

### 9.6. Eliminar recordatorio

- **Method**: `DELETE`  
- **URL**: `http://localhost:5001/api/reminders/ID`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 9.7. Recordatorios para notificación

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/reminders/notifications`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 9.8. Resumen de recordatorios

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/reminders/summary`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 10. IA (`/api/ai`)

> Ten en cuenta que los usuarios **free** tienen límites de uso (controlados por `checkAIUsage`).

### 10.1. Chat con IA

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/ai/chat`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "message": "¿Cómo puedo mejorar mis ahorros?",
  "conversationId": "opcional-uuid"
}
```

### 10.2. Listar conversaciones

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/ai/conversations`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Opcional**: `?conversationId=<ID>`

### 10.3. Obtener una conversación por ID

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/ai/conversations/CONVERSATION_ID`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 10.4. Análisis financiero

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/ai/analysis`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 11. Analytics (`/api/analytics`)

### 11.1. Dashboard

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/analytics/dashboard?period=30`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 11.2. Tendencias

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/analytics/trends?period=month`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

O bien, con rango de fechas:

- **URL**: `http://localhost:5001/api/analytics/trends?startDate=2025-01-01&endDate=2025-02-01`

### 11.3. Análisis por categorías

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/analytics/categories?period=30`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 11.4. Predicciones

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/analytics/predictions`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 11.5. Reporte mensual

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/analytics/monthly-report?year=2025&month=2`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 12. Mercado (`/api/market`)

### 12.1. Criptomonedas

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/market/crypto`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 12.2. Acciones

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/market/stocks`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 12.3. Análisis de mercado

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/market/analysis`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 12.4. Análisis personalizado

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/market/personalized-analysis`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

> Algunas funciones avanzadas pueden requerir suscripciones como `premium` o `premium+`.

---

## 13. Inversiones (`/api/investments`)

### 13.1. Análisis de inversiones

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/investments/analysis`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 13.2. Recomendación personalizada

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/investments/recommend`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body (ejemplo básico)**:

```json
{
  "symbol": "AAPL",
  "notes": "Perfil moderado, horizonte 3 años"
}
```

### 13.3. Portfolio del usuario

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/investments/portfolio`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 13.4. Alertas de inversión

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/investments/alert`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body (ejemplo)**:

```json
{
  "symbol": "BTC",
  "target_price": 60000,
  "direction": "above"
}
```

### 13.5. Tendencias de inversión

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/investments/trends`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 14. Pagos (`/api/payments`)

### 14.1. Webhook Stripe (solo para integración con Stripe)

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/payments/webhook/stripe`  
- **Auth**: sin JWT (lo usa Stripe).

En Postman normalmente no necesitas tocar esto salvo pruebas específicas.

### 14.2. Crear pago

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/payments/create`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**:

```json
{
  "amount": 9.99,
  "currency": "usd",
  "subscriptionType": "premium"
}
```

### 14.3. Confirmar pago

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/payments/confirm`  
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 14.4. Historial de pagos

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/payments/history`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 14.5. Información de suscripción

- **Method**: `GET`  
- **URL**: `http://localhost:5001/api/payments/subscription`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### 14.6. Cancelar suscripción

- **Method**: `POST`  
- **URL**: `http://localhost:5001/api/payments/cancel`  
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`

---

## 15. Resumen de flujo recomendado

1. **Levantar backend** con `npm run dev` en `backend/`.
2. Probar `GET http://localhost:5001/api/health`.
3. Hacer **registro** y **login** para obtener `accessToken`.
4. Probar `GET http://localhost:5001/api/users/profile` con el token.
5. Ir probando módulos: transacciones, metas, recordatorios, IA, analytics, mercado, inversiones y pagos.

Con este archivo puedes **copiar y pegar directamente** cada bloque en Postman y verificar que todo el backend responde como se espera.

