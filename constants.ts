
import { SubscriptionTier } from './types';

// LIVE Publishable Key provided by the user.
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SeivaRrZfGBUlV6Rro1GmBSvpV4THsENk1jvNKySAKNP6X82MncujzStH2PPVvJgXtGKh8D422l6c6y1Yyx0SNS00JSiSIYiw';

// Use a data URI for the logo to ensure PWA asset stability (no expiration)
export const APP_LOGO_URL = "https://hyigbttxlisjosgmxcef.supabase.co/storage/v1/object/sign/yes/ChatGPT%20Image%2014.%20feb.%202026,%2020_12_26.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDM1MjQyZC04NDhhLTQyOWQtOTMxOC1jNTczZmU1NWI4ZDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ5ZXMvQ2hhdEdQVCBJbWFnZSAxNC4gZmViLiAyMDI2LCAyMF8xMl8yNi5wbmciLCJpYXQiOjE3NzExMDg4NjksImV4cCI6MTg5NzI1Mjg2OX0.vZCoyUt2hDXdVNY1Ee5T9CcWASxTuTWUt9pFcltgmUs";

// User provided Live Price IDs.
export const STRIPE_PRICES = {
    STANDARD: 'price_1T0qS2RrZfGBUlV6ojPbI7Nw',
    PRO: 'price_1T0qSFRrZfGBUlV62kT9uUyP', // User provided ID.
    PRO_MAX: 'price_1T0qSkRrZfGBUlV6cq3sz6kC'
};

export const SUBSCRIPTION_PLANS = [
  {
    tier: SubscriptionTier.Standard,
    price: 50,
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
    price: 100,
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
    price: 150,
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
