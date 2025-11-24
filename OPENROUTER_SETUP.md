# 🤖 Configuración de OpenRouter para IA

## ¿Qué es OpenRouter?

OpenRouter es un servicio que permite acceder a múltiples modelos de IA (como GPT, Claude, Llama, etc.) a través de una sola API. Esto nos permite ofrecer análisis financieros avanzados y personalizados.

## Configuración

### 1. Obtener API Key

1. Ve a [OpenRouter.ai](https://openrouter.ai/)
2. Crea una cuenta
3. Ve a "API Keys" en tu dashboard
4. Genera una nueva API key

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# OpenRouter AI Configuration
OPENROUTER_API_KEY=tu_api_key_aqui

# Otras variables necesarias
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=private_wallet
DB_PORT=3306

JWT_SECRET=tu_jwt_secret
JWT_REFRESH_SECRET=tu_jwt_refresh_secret

PORT=5001
NODE_ENV=development
```

### 3. Instalar Dependencias

```bash
cd backend
npm install
```

### 4. Iniciar el Servidor

```bash
npm start
```

## Funcionalidades de IA

### Para Usuarios Gratuitos
- **1 análisis de mercado por día**
- Análisis básico con recomendaciones generales
- Explicaciones simples y accesibles

### Para Usuarios Premium
- **3 análisis de mercado por semana**
- Análisis más detallados
- Recomendaciones específicas por categoría

### Para Usuarios Premium+
- **Análisis ilimitados**
- Análisis personalizados basados en su balance
- Acceso a modelos de IA más avanzados (Claude, GPT-4)
- Recomendaciones de inversión específicas
- Estrategias personalizadas

## Modelos de IA Utilizados

### Análisis General (Todos los usuarios)
- **Modelo**: `meta-llama/llama-3.1-8b-instruct:free`
- **Uso**: Análisis básico de mercado
- **Características**: Gratuito, rápido, bueno para explicaciones simples

### Análisis Personalizado (Premium+)
- **Modelo**: `anthropic/claude-3-haiku`
- **Uso**: Análisis personalizados basados en perfil del usuario
- **Características**: Más avanzado, análisis contextual

## Endpoints de IA

### 1. Análisis de Mercado
```
GET /api/market/analysis
```
- Requiere autenticación
- Respeta límites de suscripción
- Incluye análisis de IA si está disponible

### 2. Análisis Personalizado (Premium+)
```
GET /api/market/personalized-analysis
```
- Solo para usuarios Premium+
- Análisis basado en balance del usuario
- Recomendaciones específicas

### 3. Chat con IA
```
POST /api/ai/chat
```
- Chat general con IA
- Límites según suscripción
- Historial de conversaciones

## Límites de Uso

| Suscripción | Análisis de Mercado | Chat con IA |
|-------------|-------------------|-------------|
| Gratuito    | 1 por día         | 3 por día   |
| Premium     | 3 por semana      | 10 por día  |
| Premium+    | Ilimitado         | Ilimitado   |

## Monitoreo y Logs

El sistema registra automáticamente:
- Uso de IA por usuario
- Tiempo de respuesta
- Errores y fallos
- Análisis generados

## Troubleshooting

### Error: "OpenRouter no disponible"
- Verifica que la API key esté configurada correctamente
- Revisa que el archivo `.env` esté en la carpeta `backend/`
- Reinicia el servidor después de agregar la API key

### Error: "Límite de análisis alcanzado"
- El usuario ha alcanzado su límite diario/semanal
- Para usuarios Premium+, verifica que la suscripción esté activa

### Error: "Análisis personalizado solo disponible para Premium+"
- Solo usuarios con suscripción Premium+ pueden acceder a análisis personalizados
- Verifica el tipo de suscripción del usuario

## Costos

OpenRouter cobra por uso de tokens. Los costos aproximados son:

- **Llama 3.1 8B**: ~$0.20 por 1M tokens
- **Claude 3 Haiku**: ~$0.25 por 1M tokens

Para una app con 1000 usuarios activos:
- Análisis básico: ~$5-10/mes
- Análisis personalizado: ~$15-25/mes

## Mejores Prácticas

1. **Cache de análisis**: Los análisis se guardan en BD para evitar llamadas repetidas
2. **Límites estrictos**: Respetar límites de suscripción
3. **Fallback**: Si OpenRouter falla, usar análisis básico
4. **Monitoreo**: Revisar logs regularmente
5. **Optimización**: Usar modelos más baratos para análisis básicos

## Soporte

Si tienes problemas con la configuración:

1. Revisa los logs del servidor
2. Verifica la configuración de variables de entorno
3. Confirma que la API key de OpenRouter sea válida
4. Revisa la documentación de OpenRouter

---

**Nota**: Esta funcionalidad requiere una API key válida de OpenRouter. Sin ella, la app funcionará con análisis básicos pero sin IA avanzada.
