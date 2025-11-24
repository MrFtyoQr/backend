# 🚀 INSTRUCCIONES COMPLETAS PARA FLUTTER - PRIVATE WALLET

## 📋 INFORMACIÓN DEL BACKEND

### Base URL
```
http://localhost:5001/api
```

### Autenticación
- **Tipo**: JWT Bearer Token
- **Access Token**: 15 minutos de duración
- **Refresh Token**: 7 días de duración
- **Header**: `Authorization: Bearer {token}`

### Sistema de Suscripciones
- **Free**: 3 preguntas IA/mes, funciones básicas
- **Premium**: IA ilimitada, análisis avanzados, recordatorios inteligentes
- **Precio Premium**: $9.99/mes

---

## 🏗️ ESTRUCTURA DE FLUTTER RECOMENDADA

```
lib/
├── main.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_constants.dart
│   │   └── theme_constants.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── payment_service.dart
│   │   └── storage_service.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── transaction_model.dart
│   │   ├── goal_model.dart
│   │   ├── reminder_model.dart
│   │   └── market_data_model.dart
│   └── utils/
│       ├── validators.dart
│       └── helpers.dart
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   └── forgot_password_screen.dart
│   │   └── widgets/
│   │       └── auth_form.dart
│   ├── dashboard/
│   │   ├── screens/
│   │   │   └── dashboard_screen.dart
│   │   └── widgets/
│   │       ├── balance_card.dart
│   │       ├── quick_actions.dart
│   │       └── recent_transactions.dart
│   ├── transactions/
│   │   ├── screens/
│   │   │   ├── transactions_screen.dart
│   │   │   ├── add_transaction_screen.dart
│   │   │   └── transaction_detail_screen.dart
│   │   └── widgets/
│   │       └── transaction_item.dart
│   ├── ai_chat/
│   │   ├── screens/
│   │   │   └── ai_chat_screen.dart
│   │   └── widgets/
│   │       ├── chat_bubble.dart
│   │       └── usage_indicator.dart
│   ├── goals/
│   │   ├── screens/
│   │   │   ├── goals_screen.dart
│   │   │   ├── add_goal_screen.dart
│   │   │   └── goal_detail_screen.dart
│   │   └── widgets/
│   │       ├── goal_card.dart
│   │       └── progress_bar.dart
│   ├── analytics/
│   │   ├── screens/
│   │   │   ├── analytics_screen.dart
│   │   │   └── reports_screen.dart
│   │   └── widgets/
│   │       ├── chart_widget.dart
│   │       └── category_breakdown.dart
│   ├── reminders/
│   │   ├── screens/
│   │   │   ├── reminders_screen.dart
│   │   │   └── add_reminder_screen.dart
│   │   └── widgets/
│   │       └── reminder_item.dart
│   ├── market/
│   │   ├── screens/
│   │   │   ├── market_screen.dart
│   │   │   └── investment_analysis_screen.dart
│   │   └── widgets/
│   │       ├── market_card.dart
│   │       └── price_chart.dart
│   ├── subscription/
│   │   ├── screens/
│   │   │   ├── subscription_screen.dart
│   │   │   └── payment_screen.dart
│   │   └── widgets/
│   │       └── plan_card.dart
│   └── profile/
│       ├── screens/
│       │   ├── profile_screen.dart
│       │   └── settings_screen.dart
│       └── widgets/
│           └── profile_item.dart
└── shared/
    ├── widgets/
    │   ├── custom_button.dart
    │   ├── custom_text_field.dart
    │   ├── loading_widget.dart
    │   └── error_widget.dart
    └── theme/
        ├── app_theme.dart
        └── colors.dart
```

---

## 📦 DEPENDENCIAS NECESARIAS

### pubspec.yaml
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP y Networking
  http: ^1.1.0
  dio: ^5.3.2
  
  # Estado y Gestión
  provider: ^6.0.5
  riverpod: ^2.4.0
  flutter_riverpod: ^2.4.0
  
  # Almacenamiento
  shared_preferences: ^2.2.2
  secure_storage: ^9.0.0
  
  # UI y Gráficas
  fl_chart: ^0.65.0
  shimmer: ^3.0.0
  lottie: ^2.7.0
  
  # Pagos
  stripe_payment: ^1.1.4
  pay: ^1.1.2
  
  # Notificaciones
  flutter_local_notifications: ^16.3.0
  
  # Utilidades
  intl: ^0.18.1
  uuid: ^4.2.1
  crypto: ^3.0.3
  
  # Navegación
  go_router: ^12.1.1
  
  # Formularios
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

---

## 🔧 SERVICIOS PRINCIPALES

### 1. API Service (lib/core/services/api_service.dart)
```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5001/api';
  late Dio _dio;
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
    ));
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await _refreshToken();
        }
        handler.next(error);
      },
    ));
  }
  
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }
  
  Future<void> _refreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refresh_token');
    
    if (refreshToken != null) {
      try {
        final response = await _dio.post('/auth/refresh', data: {
          'refreshToken': refreshToken,
        });
        
        final newAccessToken = response.data['data']['accessToken'];
        final newRefreshToken = response.data['data']['refreshToken'];
        
        await prefs.setString('access_token', newAccessToken);
        await prefs.setString('refresh_token', newRefreshToken);
      } catch (e) {
        // Logout user
        await prefs.clear();
      }
    }
  }
  
  // Auth endpoints
  Future<Response> login(String userId, String password) {
    return _dio.post('/api/auth/login', data: {
      'user_id': userId,
      'password': password,
    });
  }
  
  Future<Response> register(String userId, String email, String password) {
    return _dio.post('/api/auth/register', data: {
      'user_id': userId,
      'email': email,
      'password': password,
    });
  }
  
  Future<Response> refreshToken(String refreshToken) {
    return _dio.post('/api/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
  }
  
  // Transactions endpoints
  Future<Response> getTransactions(String userId) {
    return _dio.get('/api/transactions/$userId');
  }
  
  Future<Response> createTransaction(Map<String, dynamic> transaction) {
    return _dio.post('/api/transactions', data: transaction);
  }
  
  Future<Response> updateTransaction(String id, Map<String, dynamic> transaction) {
    return _dio.put('/api/transactions/$id', data: transaction);
  }
  
  Future<Response> deleteTransaction(String id) {
    return _dio.delete('/api/transactions/$id');
  }
  
  Future<Response> getSummary(String userId) {
    return _dio.get('/api/transactions/$userId/summary');
  }
  
  // AI endpoints
  Future<Response> chatWithAI(String message, {String? conversationId}) {
    return _dio.post('/api/ai/chat', data: {
      'message': message,
      'conversationId': conversationId,
    });
  }
  
  Future<Response> getConversations() {
    return _dio.get('/api/ai/conversations');
  }
  
  Future<Response> getFinancialAnalysis() {
    return _dio.get('/api/ai/analysis');
  }
  
  // Goals endpoints
  Future<Response> getGoals() {
    return _dio.get('/api/goals');
  }
  
  Future<Response> createGoal(Map<String, dynamic> goal) {
    return _dio.post('/api/goals', data: goal);
  }
  
  Future<Response> updateGoal(String id, Map<String, dynamic> goal) {
    return _dio.put('/api/goals/$id', data: goal);
  }
  
  Future<Response> deleteGoal(String id) {
    return _dio.delete('/api/goals/$id');
  }
  
  Future<Response> getGoalPlan(String id) {
    return _dio.get('/api/goals/$id/plan');
  }
  
  // Market endpoints
  Future<Response> getCryptoData() {
    return _dio.get('/api/market/crypto');
  }
  
  Future<Response> getStocksData() {
    return _dio.get('/api/market/stocks');
  }
  
  Future<Response> getMarketAnalysis() {
    return _dio.get('/api/market/analysis');
  }
  
  // Analytics endpoints
  Future<Response> getDashboardSummary() {
    return _dio.get('/api/analytics/dashboard');
  }
  
  Future<Response> getTrends(String period) {
    return _dio.get('/api/analytics/trends?period=$period');
  }
  
  Future<Response> getCategoriesAnalysis() {
    return _dio.get('/api/analytics/categories');
  }
  
  // Reminders endpoints
  Future<Response> getReminders() {
    return _dio.get('/api/reminders');
  }
  
  Future<Response> createReminder(Map<String, dynamic> reminder) {
    return _dio.post('/api/reminders', data: reminder);
  }
  
  Future<Response> markReminderComplete(String id) {
    return _dio.put('/api/reminders/$id/complete');
  }
  
  Future<Response> getUpcomingReminders() {
    return _dio.get('/api/reminders/upcoming');
  }
  
  // Investment endpoints
  Future<Response> getInvestmentAnalysis() {
    return _dio.get('/api/investments/analysis');
  }
  
  Future<Response> getPersonalizedRecommendation() {
    return _dio.get('/api/investments/recommendation');
  }
  
  Future<Response> getPortfolio() {
    return _dio.get('/api/investments/portfolio');
  }
  
  // Payments endpoints
  Future<Response> createPayment(Map<String, dynamic> payment) {
    return _dio.post('/api/payments/create', data: payment);
  }
  
  Future<Response> confirmPayment(Map<String, dynamic> payment) {
    return _dio.post('/api/payments/confirm', data: payment);
  }
  
  Future<Response> getPaymentHistory() {
    return _dio.get('/api/payments/history');
  }
  
  Future<Response> getSubscriptionInfo() {
    return _dio.get('/api/payments/subscription');
  }
  
  // Users endpoints
  Future<Response> getAIUsage() {
    return _dio.get('/api/users/usage');
  }
}
```

### 2. Auth Service (lib/core/services/auth_service.dart)
```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();
  
  Future<bool> login(String userId, String password) async {
    try {
      final response = await _apiService.login(userId, password);
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        final prefs = await SharedPreferences.getInstance();
        
        await prefs.setString('access_token', data['accessToken']);
        await prefs.setString('refresh_token', data['refreshToken']);
        await prefs.setString('user_id', data['user']['userId']);
        await prefs.setString('subscription_type', data['user']['subscriptionType']);
        
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> register(String userId, String email, String password) async {
    try {
      final response = await _apiService.register(userId, email, password);
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token') != null;
  }
  
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_id');
  }
  
  Future<String?> getSubscriptionType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('subscription_type');
  }
  
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
```

### 3. Payment Service (lib/core/services/payment_service.dart)
```dart
import 'package:stripe_payment/stripe_payment.dart';
import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();
  
  Future<bool> processPayment({
    required double amount,
    required String currency,
  }) async {
    try {
      // 1. Configurar Stripe
      StripePayment.setOptions(
        StripeOptions(
          publishableKey: "pk_test_...", // Tu PUBLISHABLE_KEY de Stripe
          merchantId: "merchant_id",
          androidPayMode: 'test',
        ),
      );
      
      // 2. Crear Payment Intent en el backend
      final createResponse = await _apiService.createPayment({
        'amount': amount,
        'currency': currency,
      });
      
      if (!createResponse.success) {
        throw Exception('Error creando pago');
      }
      
      final clientSecret = createResponse.data['clientSecret'];
      final paymentIntentId = createResponse.data['paymentIntentId'];
      
      // 3. Procesar pago con Stripe
      final paymentMethod = await StripePayment.paymentRequestWithCardForm(
        CardFormPaymentRequest(),
      );
      
      // 4. Confirmar pago con Stripe
      final confirmResult = await StripePayment.confirmPaymentIntent(
        PaymentIntent(
          clientSecret: clientSecret,
          paymentMethodId: paymentMethod.id,
        ),
      );
      
      if (confirmResult.status != PaymentIntentStatus.Succeeded) {
        throw Exception('Pago falló');
      }
      
      // 5. Confirmar pago en el backend
      final confirmResponse = await _apiService.confirmPayment({
        'payment_intent_id': paymentIntentId,
      });
      
      return confirmResponse.success;
    } catch (e) {
      print('Error procesando pago: $e');
      return false;
    }
  }
}
```

---

## 📱 PANTALLAS PRINCIPALES

### 1. Login Screen (lib/features/auth/screens/login_screen.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/auth_service.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/custom_text_field.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _userIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Private Wallet',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                SizedBox(height: 48),
                CustomTextField(
                  controller: _userIdController,
                  label: 'Usuario',
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Usuario requerido';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),
                CustomTextField(
                  controller: _passwordController,
                  label: 'Contraseña',
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Contraseña requerida';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 24),
                CustomButton(
                  text: 'Iniciar Sesión',
                  isLoading: _isLoading,
                  onPressed: _login,
                ),
                SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/register');
                  },
                  child: Text('¿No tienes cuenta? Regístrate'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      final authService = Provider.of<AuthService>(context, listen: false);
      final success = await authService.login(
        _userIdController.text,
        _passwordController.text,
      );
      
      setState(() => _isLoading = false);
      
      if (success) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al iniciar sesión')),
        );
      }
    }
  }
}
```

### 2. Dashboard Screen (lib/features/dashboard/screens/dashboard_screen.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';
import '../widgets/balance_card.dart';
import '../widgets/quick_actions.dart';
import '../widgets/recent_transactions.dart';

class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _summary;
  List<dynamic> _recentTransactions = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }
  
  Future<void> _loadDashboardData() async {
    try {
      final userId = await _getUserId();
      final summaryResponse = await _apiService.get('/transactions/$userId/summary');
      final transactionsResponse = await _apiService.get('/transactions/$userId');
      
      setState(() {
        _summary = summaryResponse.data;
        _recentTransactions = transactionsResponse.data.take(5).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () {
              Navigator.pushNamed(context, '/reminders');
            },
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BalanceCard(summary: _summary),
                    SizedBox(height: 24),
                    QuickActions(),
                    SizedBox(height: 24),
                    Text(
                      'Transacciones Recientes',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    SizedBox(height: 16),
                    RecentTransactions(transactions: _recentTransactions),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/add-transaction');
        },
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### 3. AI Chat Screen (lib/features/ai_chat/screens/ai_chat_screen.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/usage_indicator.dart';

class AiChatScreen extends StatefulWidget {
  @override
  _AiChatScreenState createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _messages = [];
  String? _conversationId;
  Map<String, dynamic>? _usage;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadUsage();
  }
  
  Future<void> _loadUsage() async {
    try {
      final response = await _apiService.get('/users/usage');
      setState(() {
        _usage = response.data['usage'];
      });
    } catch (e) {
      // Handle error
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Asistente IA'),
        actions: [
          if (_usage != null) UsageIndicator(usage: _usage!),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return ChatBubble(message: _messages[index]);
              },
            ),
          ),
          Container(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Escribe tu pregunta...',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: null,
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  onPressed: _isLoading ? null : _sendMessage,
                  icon: _isLoading
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;
    
    setState(() {
      _isLoading = true;
      _messages.add({
        'type': 'user',
        'content': message,
        'timestamp': DateTime.now(),
      });
      _messageController.clear();
    });
    
    _scrollToBottom();
    
    try {
      final response = await _apiService.chatWithAI(message, conversationId: _conversationId);
      
      setState(() {
        _messages.add({
          'type': 'ai',
          'content': response.data['data']['response'],
          'timestamp': DateTime.now(),
        });
        _conversationId = response.data['data']['conversationId'];
        _isLoading = false;
      });
      
      _loadUsage(); // Actualizar uso
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.add({
          'type': 'error',
          'content': 'Error al enviar mensaje',
          'timestamp': DateTime.now(),
        });
        _isLoading = false;
      });
    }
  }
  
  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }
}
```

### 4. Pantalla de Upgrade (lib/features/subscription/screens/subscription_screen.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/payment_service.dart';
import '../../../core/services/auth_service.dart';

class SubscriptionScreen extends StatefulWidget {
  @override
  _SubscriptionScreenState createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final PaymentService _paymentService = PaymentService();
  bool _isLoading = false;
  Map<String, dynamic>? _subscriptionInfo;

  @override
  void initState() {
    super.initState();
    _loadSubscriptionInfo();
  }

  Future<void> _loadSubscriptionInfo() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final response = await authService.getSubscriptionInfo();
      setState(() {
        _subscriptionInfo = response.data['subscriptionInfo'];
      });
    } catch (e) {
      print('Error cargando información de suscripción: $e');
    }
  }

  Future<void> _upgradeToPremium() async {
    setState(() => _isLoading = true);

    try {
      final success = await _paymentService.processPayment(
        amount: 9.99,
        currency: 'usd',
      );

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('¡Upgrade a Premium exitoso!'),
            backgroundColor: Colors.green,
          ),
        );
        _loadSubscriptionInfo(); // Recargar información
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error procesando el pago'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Suscripción'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Información actual
            if (_subscriptionInfo != null) ...[
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Estado Actual',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Tipo: ${_subscriptionInfo!['subscriptionType'] == 'premium' ? 'Premium' : 'Gratis'}',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      if (_subscriptionInfo!['subscriptionType'] == 'free') ...[
                        Text(
                          'Preguntas IA restantes: ${_subscriptionInfo!['remaining']}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),
            ],

            // Plan Premium
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Plan Premium',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          '\$9.99/mes',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    _buildFeature('🤖 IA ilimitada', 'Preguntas sin límite'),
                    _buildFeature('📊 Analytics avanzados', 'Análisis detallados'),
                    _buildFeature('🔔 Recordatorios inteligentes', 'Notificaciones personalizadas'),
                    _buildFeature('💰 Análisis de inversiones', 'Recomendaciones de IA'),
                    _buildFeature('📈 Datos de mercado', 'Información en tiempo real'),
                    SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _subscriptionInfo?['subscriptionType'] == 'premium' 
                            ? null 
                            : _isLoading ? null : _upgradeToPremium,
                        child: _isLoading
                            ? CircularProgressIndicator(color: Colors.white)
                            : Text(
                                _subscriptionInfo?['subscriptionType'] == 'premium' 
                                    ? 'Ya tienes Premium' 
                                    : 'Upgrade a Premium',
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeature(String title, String description) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🎨 WIDGETS PERSONALIZADOS

### 1. Custom Button (lib/shared/widgets/custom_button.dart)
```dart
import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? backgroundColor;
  final Color? textColor;
  
  const CustomButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.backgroundColor,
    this.textColor,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? Theme.of(context).primaryColor,
          foregroundColor: textColor ?? Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    textColor ?? Colors.white,
                  ),
                ),
              )
            : Text(
                text,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
```

### 2. Custom Text Field (lib/shared/widgets/custom_text_field.dart)
```dart
import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffixIcon;
  
  const CustomTextField({
    Key? key,
    required this.controller,
    required this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.suffixIcon,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffixIcon,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
      ),
    );
  }
}
```

---

## 🔄 GESTIÓN DE ESTADO

### Provider Setup (lib/main.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/services/auth_service.dart';
import 'core/services/api_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AuthService>(create: (_) => AuthService()),
        Provider<ApiService>(create: (_) => ApiService()),
      ],
      child: MaterialApp(
        title: 'Private Wallet',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        home: Consumer<AuthService>(
          builder: (context, authService, child) {
            return FutureBuilder<bool>(
              future: authService.isLoggedIn(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  );
                }
                
                if (snapshot.data == true) {
                  return DashboardScreen();
                } else {
                  return LoginScreen();
                }
              },
            );
          },
        ),
        routes: {
          '/login': (context) => LoginScreen(),
          '/register': (context) => RegisterScreen(),
          '/dashboard': (context) => DashboardScreen(),
          '/ai-chat': (context) => AiChatScreen(),
          '/goals': (context) => GoalsScreen(),
          '/analytics': (context) => AnalyticsScreen(),
          '/reminders': (context) => RemindersScreen(),
          '/market': (context) => MarketScreen(),
          '/subscription': (context) => SubscriptionScreen(),
        },
      ),
    );
  }
}
```

---

## 📊 GRÁFICAS Y CHARTS

### Chart Widget (lib/features/analytics/widgets/chart_widget.dart)
```dart
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class ChartWidget extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  final String title;
  
  const ChartWidget({
    Key? key,
    required this.data,
    required this.title,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: data.asMap().entries.map((entry) {
                      return FlSpot(entry.key.toDouble(), entry.value['amount'].toDouble());
                    }).toList(),
                    isCurved: true,
                    color: Theme.of(context).primaryColor,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔔 NOTIFICACIONES

### Notification Service (lib/core/services/notification_service.dart)
```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications = 
      FlutterLocalNotificationsPlugin();
  
  static Future<void> initialize() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    
    await _notifications.initialize(initializationSettings);
  }
  
  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'reminders',
      'Recordatorios',
      channelDescription: 'Notificaciones de recordatorios',
      importance: Importance.max,
      priority: Priority.high,
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _notifications.show(id, title, body, platformChannelSpecifics);
  }
  
  static Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'reminders',
      'Recordatorios',
      channelDescription: 'Notificaciones de recordatorios',
      importance: Importance.max,
      priority: Priority.high,
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _notifications.zonedSchedule(
      id,
      title,
      body,
      scheduledDate,
      platformChannelSpecifics,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }
}
```

---

## 🎯 FUNCIONALIDADES ESPECÍFICAS

### 1. Sistema de Metas con Progreso
- Crear metas personalizadas
- Barras de progreso animadas
- Planes de ahorro sugeridos
- Notificaciones de progreso

### 2. Chat con IA Contextual
- Memoria de conversaciones
- Límites freemium (3 preguntas)
- Análisis financiero personalizado
- Recomendaciones inteligentes

### 3. Dashboard Interactivo
- Resumen financiero en tiempo real
- Gráficas de tendencias
- Acciones rápidas
- Transacciones recientes

### 4. Sistema de Recordatorios
- Notificaciones push
- Recordatorios recurrentes
- Alertas de vencimiento
- Gestión de pagos

### 5. Análisis de Mercado
- Datos en tiempo real
- Gráficas de precios
- Análisis de tendencias
- Recomendaciones de inversión

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### 1. Configuración Inicial
1. Crear proyecto Flutter
2. Agregar dependencias
3. Configurar estructura de carpetas
4. Implementar servicios base

### 2. Autenticación
1. Pantallas de login/registro
2. Gestión de tokens JWT
3. Navegación condicional
4. Logout y refresh tokens

### 3. Dashboard Principal
1. Resumen financiero
2. Gráficas básicas
3. Transacciones recientes
4. Acciones rápidas

### 4. Funcionalidades Core
1. Gestión de transacciones
2. Chat con IA
3. Sistema de metas
4. Recordatorios

### 5. Funcionalidades Avanzadas
1. Analytics detallados
2. Datos de mercado
3. Sistema de pagos
4. Notificaciones push

### 6. Pulimiento
1. Animaciones
2. Temas personalizados
3. Optimización de rendimiento
4. Testing

---

## 📱 CONSIDERACIONES ESPECIALES

### Seguridad
- Almacenamiento seguro de tokens
- Validación de entrada
- Manejo de errores
- Rate limiting

### UX/UI
- Diseño responsive
- Animaciones fluidas
- Feedback visual
- Accesibilidad

### Rendimiento
- Lazy loading
- Caché de datos
- Optimización de imágenes
- Gestión de memoria

### Testing
- Unit tests
- Widget tests
- Integration tests
- E2E tests

---

**¡Con estas instrucciones tienes todo lo necesario para crear una app Flutter completa y funcional!** 🚀

El backend está 100% listo y documentado. Solo necesitas seguir estas instrucciones paso a paso para crear el frontend.
