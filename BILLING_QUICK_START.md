# Billing System Quick Reference

## 🎯 For Customers

### View & Manage Subscription

1. Go to **Account** → **Account Management** in sidebar
2. View current plan and features
3. Click **Upgrade to [Plan]** to upgrade
4. Click **Manage Billing** to access payment methods

### Upgrade Steps

1. Click upgrade button for desired plan
2. Complete Stripe Checkout form
3. Subscription updates automatically
4. Check your email for receipt

---

## 👨‍💼 For Admins

### Monitor Customers

1. Go to **Administration** → **Customers** in sidebar
2. View all customers and their subscription tiers
3. Click **Details** to see full subscription info
4. Click Stripe icon to view customer in Stripe Dashboard

### Key Metrics

- **Total Customers** - All registered users
- **Pro Tier** - Premium subscribers
- **Builder Tier** - Mid-tier subscribers
- **Free Tier** - Free plan users

---

## ⚙️ Configuration Checklist

Before going live:

- [ ] Create Stripe products & prices
- [ ] Set environment variables in `.env`
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Add Stripe webhook endpoint
- [ ] Test upgrade flow with test card
- [ ] Deploy hosting: `npm run deploy:prod`

---

## 🔑 Environment Variables

### Frontend (.env)

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_BUILDER=price_...
VITE_STRIPE_PRICE_PRO=price_...
```

**Note:** Stripe.js is loaded from CDN automatically - no npm package installation needed.

### Backend (functions/.env)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📊 Pricing Tiers

| Feature            | Free | Builder   | Pro       |
| ------------------ | ---- | --------- | --------- |
| Monthly Price      | $0   | $29       | $79       |
| Max Dogs           | 10   | Unlimited | Unlimited |
| Max Litters        | 5    | Unlimited | Unlimited |
| Website Builder    | ❌   | ✅        | ✅        |
| Puppy Shop         | ❌   | ✅        | ✅        |
| Advanced Analytics | ❌   | ❌        | ✅        |
| Priority Support   | ❌   | ❌        | ✅        |

---

## 🔗 Related Files

- 📖 **Setup Guide:** `STRIPE_SETUP.md` (Detailed setup instructions)
- 📋 **Implementation:** `BILLING_IMPLEMENTATION.md` (Technical details)
- 💰 **Utilities:** `src/lib/stripe.ts` (Frontend functions)
- 📊 **Components:** `src/components/SubscriptionStatus.tsx` (UI)
- 👥 **Admin Page:** `src/pages/AdminCustomers.tsx` (Admin dashboard)
- 🎫 **Account Page:** `src/pages/AccountManagement.tsx` (Customer account)

---

## 🆘 Troubleshooting

**Q: "Manage Billing" button doesn't work**  
A: Check that Cloud Functions are deployed and `stripeCustomerId` is set in Firestore

**Q: Upgrade button shows spinner forever**  
A: Verify `VITE_STRIPE_PRICE_*` environment variables are set correctly

**Q: Subscription doesn't update after checkout**  
A: Check Stripe webhook is configured and Cloud Functions logs for errors

---

## 📞 Support

See full details in:

- `STRIPE_SETUP.md` - Complete setup guide
- `BILLING_IMPLEMENTATION.md` - Technical implementation details
- [Stripe Documentation](https://stripe.com/docs/billing)
