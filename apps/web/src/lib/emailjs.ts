// EmailJS configuration
// To set up EmailJS:
// 1. Sign up at https://www.emailjs.com/
// 2. Create an email service (Gmail, Outlook, etc.)
// 3. Create an email template with variables: to_email, to_name, waitlist_url
// 4. Get your Public Key, Service ID, and Template ID
// 5. Add them to your .env file or replace the values below

export const EMAILJS_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
  WAITLIST_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_WAITLIST_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
};

// Email template should include these variables:
// - to_email: recipient email
// - to_name: recipient name
// - waitlist_url: full URL to the waitlist application
// - from_name: breeder name (optional)
