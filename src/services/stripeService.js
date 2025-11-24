import Stripe from 'stripe';

let stripeClient = null;

const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: process.env.STRIPE_API_VERSION || '2024-06-20',
  });

  return stripeClient;
};

const buildUnavailableResult = (operation) => ({
  success: false,
  error: `Stripe is not configured. Cannot ${operation}.`,
});

export async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  const stripe = getStripeClient();
  if (!stripe) {
    return buildUnavailableResult('create payment intent');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.log('Error creando Payment Intent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function confirmPaymentIntent(paymentIntentId) {
  const stripe = getStripeClient();
  if (!stripe) {
    return buildUnavailableResult('confirm payment intent');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntent,
    };
  } catch (error) {
    console.log('Error confirmando Payment Intent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createCustomer(email, userId) {
  const stripe = getStripeClient();
  if (!stripe) {
    return buildUnavailableResult('create customer');
  }

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        user_id: userId,
      },
    });

    return {
      success: true,
      customerId: customer.id,
    };
  } catch (error) {
    console.log('Error creando Customer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createSetupIntent(customerId) {
  const stripe = getStripeClient();
  if (!stripe) {
    return buildUnavailableResult('create setup intent');
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
    };
  } catch (error) {
    console.log('Error creando Setup Intent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export const isStripeAvailable = () => Boolean(getStripeClient());



