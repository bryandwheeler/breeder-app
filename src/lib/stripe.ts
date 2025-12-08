import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Stripe type definitions
declare global {
  interface Window {
    Stripe?: (key: string) => {
      redirectToCheckout(options: {
        sessionId: string;
      }): Promise<{ error?: Error }>;
    };
  }
}

// Load Stripe from CDN
const loadStripe = async () => {
  return new Promise<Window['Stripe']>((resolve, reject) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      if (window.Stripe) {
        resolve(window.Stripe);
      } else {
        reject(new Error('Stripe failed to load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Stripe script'));
    };
    document.head.appendChild(script);
  });
};

interface CheckoutResponse {
  sessionId: string;
}

interface PortalResponse {
  url: string;
}

// Create a Stripe Checkout session
export const createCheckoutSession = httpsCallable<
  { priceId: string; successUrl: string; cancelUrl: string },
  CheckoutResponse
>(functions, 'createCheckoutSession');

// Create a Stripe Customer Portal session
export const createPortalSession = httpsCallable<
  { returnUrl: string },
  PortalResponse
>(functions, 'createPortalSession');

// Redirect to Stripe Checkout
export const redirectToCheckout = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  try {
    const { data } = await createCheckoutSession({
      priceId,
      successUrl,
      cancelUrl,
    });
    const stripeFunc = await loadStripe();
    if (!stripeFunc) throw new Error('Failed to load Stripe');

    const stripe = stripeFunc(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });
    if (result.error) throw result.error;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
};

// Redirect to Stripe Customer Portal
export const redirectToPortal = async (returnUrl: string) => {
  try {
    const { data } = await createPortalSession({ returnUrl });
    window.location.href = data.url;
  } catch (error) {
    console.error('Portal error:', error);
    throw error;
  }
};
