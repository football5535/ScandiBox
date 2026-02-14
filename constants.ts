import { SubscriptionTier } from './types';

// Use the key provided by the user. 
export const STRIPE_PUBLISHABLE_KEY = 'mk_1T0ojlRp1tnPh0Z83HoIEl9g';

export const APP_LOGO_URL = "https://hyigbttxlisjosgmxcef.supabase.co/storage/v1/object/sign/yes/ChatGPT%20Image%2014.%20feb.%202026,%2020_12_26.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDM1MjQyZC04NDhhLTQyOWQtOTMxOC1jNTczZmU1NWI4ZDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ5ZXMvQ2hhdEdQVCBJbWFnZSAxNC4gZmViLiAyMDI2LCAyMF8xMl8yNi5wbmciLCJpYXQiOjE3NzExMDAzMjYsImV4cCI6MTg2NTcwODMyNn0.LCzRwkxTtOPR1579u7DtRXDseqfZS_vxshK6JqUyEDA";

// User provided Price IDs.
export const STRIPE_PRICES = {
    STANDARD: 'price_1T0oxARp1tnPh0Z8QmmvGbeC',
    PRO: 'price_1T0oxKRp1tnPh0Z8Tf9EJWJA',
    PRO_MAX: 'price_1T0oxYRp1tnPh0Z8JvuWAbW9'
};

export const SUBSCRIPTION_PLANS = [
  {
    tier: SubscriptionTier.Standard,
    price: 5,
    name: "Standard",
    priceId: STRIPE_PRICES.STANDARD,
    description: "For the users",
    features: [
      'Unlimited Inventory',
      'Basic Expiry Alerts',
      'Manual Meal Planning',
      '1 User Account'
    ]
  },
  {
    tier: SubscriptionTier.Pro,
    price: 10,
    name: "Pro",
    priceId: STRIPE_PRICES.PRO,
    description: "For pro users",
    features: [
      'All the Standard features',
      'AI Receipt Scanning',
      'Weekly Meal Plans',
      'Smart Replenish (AI)'
    ]
  },
  {
    tier: SubscriptionTier.ProMax,
    price: 20,
    name: "Pro Max",
    priceId: STRIPE_PRICES.PRO_MAX,
    description: "For the big guys",
    features: [
      'All the Pro features',
      'Weekly Meal Plans',
      'Advanced AI Nutrition Analysis',
      'Priority Support'
    ]
  }
];

export const MOCK_INVENTORY_ITEMS = [
  { id: '1', name: 'Almond Milk', category: 'Dairy', quantity: '1L', addedDate: '2023-10-25', daysUntilExpiry: 5, status: 'active' },
  { id: '2', name: 'Spinach', category: 'Produce', quantity: '200g', addedDate: '2023-10-26', daysUntilExpiry: 2, status: 'active' },
  { id: '3', name: 'Wagyu Beef', category: 'Meat', quantity: '500g', addedDate: '2023-10-27', daysUntilExpiry: 1, status: 'active' },
  { id: '4', name: 'Arborio Rice', category: 'Pantry', quantity: '1kg', addedDate: '2023-10-01', daysUntilExpiry: 365, status: 'active' },
] as const;

export const GEMINI_SYSTEM_INSTRUCTION = `
You are an AI assistant for a kitchen management app called "ScandiBox". 
Your goal is to identify food items from images, estimate their shelf life, and suggest recipes.
Always return responses in pure JSON format without Markdown code blocks when asked for data.
`;