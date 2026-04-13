# Credenciales de prueba

Tras iniciar el backend, si no existe ningún usuario, se crea automáticamente:

| Campo    | Valor              |
|----------|--------------------|
| **Usuario (user_id)** | `user_test` |
| **Contraseña**        | `Password123` |
| **Email** (registro)  | `user_test@example.com` |

En la app móvil, en la pantalla de **Login** usa:
- **Usuario**: `user_test`
- **Contraseña**: `Password123`

---

**Importante**: En el proyecto Flutter (`smart_wallet/lib/core/constants/api_constants.dart`) la constante `hostIP` debe ser la **IP de la PC** donde corre el backend. Al arrancar el backend verás en consola las IPs disponibles; usa esa misma IP en `hostIP` para que el móvil se conecte. Ambas máquinas deben estar en la misma red Wi‑Fi.
