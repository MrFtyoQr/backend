import axios from 'axios';

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  // Análisis de mercado con IA avanzada
  async analyzeMarket(marketData, userProfile = null) {
    try {
      const prompt = this.buildMarketAnalysisPrompt(marketData, userProfile);
      
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista financiero experto que explica conceptos complejos de manera simple y accesible para principiantes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Private Wallet AI'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error con OpenRouter:', error.response?.data || error.message);
      throw new Error('Error en análisis de IA');
    }
  }

  // Análisis personalizado para Premium+
  async personalizedAnalysis(userData, marketData) {
    try {
      const prompt = this.buildPersonalizedPrompt(userData, marketData);
      
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'Eres un asesor financiero personal que analiza el perfil del usuario y da recomendaciones específicas basadas en su situación financiera.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.6,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Private Wallet AI'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error con OpenRouter personalizado:', error.response?.data || error.message);
      throw new Error('Error en análisis personalizado');
    }
  }

  // Chat con IA para preguntas generales
  async chatWithAI(message, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Eres un asistente financiero amigable que ayuda con preguntas sobre finanzas personales, inversiones y economía. Explica todo de manera simple y accesible.'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Private Wallet AI'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error en chat con IA:', error.response?.data || error.message);
      throw new Error('Error en chat con IA');
    }
  }

  // Construir prompt para análisis de mercado
  buildMarketAnalysisPrompt(marketData, userProfile) {
    const cryptoData = marketData.crypto || [];
    const stocksData = marketData.stocks || [];
    
    let prompt = `Analiza el estado actual del mercado financiero y da recomendaciones simples para principiantes.

DATOS DEL MERCADO:
`;

    if (cryptoData.length > 0) {
      prompt += `\nCRIPTOMONEDAS:\n`;
      cryptoData.slice(0, 5).forEach(coin => {
        prompt += `• ${coin.symbol}: $${coin.price} (${coin.change_24h > 0 ? '+' : ''}${coin.change_24h}%)\n`;
      });
    }

    if (stocksData.length > 0) {
      prompt += `\nACCIONES:\n`;
      stocksData.slice(0, 5).forEach(stock => {
        prompt += `• ${stock.symbol}: $${stock.price} (${stock.change_24h > 0 ? '+' : ''}${stock.change_24h}%)\n`;
      });
    }

    prompt += `\nPor favor, proporciona:
1. Un resumen simple del estado del mercado
2. 3 recomendaciones básicas para principiantes
3. Explicación de por qué estas recomendaciones son buenas
4. Advertencias importantes sobre riesgos

Explica todo en términos que cualquier persona pueda entender, sin jerga financiera técnica.`;

    return prompt;
  }

  // Construir prompt para análisis personalizado
  buildPersonalizedPrompt(userData, marketData) {
    const { balance, riskTolerance, investmentGoals } = userData;
    
    let prompt = `Analiza la situación financiera de este usuario y da recomendaciones personalizadas.

PERFIL DEL USUARIO:
• Balance actual: $${balance}
• Tolerancia al riesgo: ${riskTolerance}
• Objetivos de inversión: ${investmentGoals || 'No especificados'}

DATOS DEL MERCADO ACTUAL:
`;

    const cryptoData = marketData.crypto || [];
    const stocksData = marketData.stocks || [];

    if (cryptoData.length > 0) {
      prompt += `\nCRIPTOMONEDAS DESTACADAS:\n`;
      cryptoData.slice(0, 3).forEach(coin => {
        prompt += `• ${coin.symbol}: $${coin.price} (${coin.change_24h > 0 ? '+' : ''}${coin.change_24h}%)\n`;
      });
    }

    if (stocksData.length > 0) {
      prompt += `\nACCIONES DESTACADAS:\n`;
      stocksData.slice(0, 3).forEach(stock => {
        prompt += `• ${stock.symbol}: $${stock.price} (${stock.change_24h > 0 ? '+' : ''}${stock.change_24h}%)\n`;
      });
    }

    prompt += `\nProporciona un análisis personalizado que incluya:
1. Evaluación de la situación financiera actual
2. Recomendaciones específicas basadas en su balance y perfil
3. Estrategia de inversión adaptada a su tolerancia al riesgo
4. Pasos concretos que puede tomar ahora mismo
5. Timeline sugerido para sus objetivos

Mantén un tono profesional pero accesible, y explica cada recomendación con claridad.`;

    return prompt;
  }

  // Verificar si el servicio está disponible
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('❌ OpenRouter no disponible:', error.message);
      return false;
    }
  }
}

export default OpenRouterService;
