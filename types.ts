export enum Category {
  Produce = 'Produce',
  Dairy = 'Dairy',
  Meat = 'Meat',
  Pantry = 'Pantry',
  Frozen = 'Frozen',
  Beverages = 'Beverages',
  Other = 'Other'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: string;
  addedDate: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: 'active' | 'consumed' | 'wasted';
}

export interface ShoppingItem {
  id: string;
  name: string;
  isChecked: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  matchScore: number; // 0-100 based on inventory
  timeEstimate: string;
  calories?: number;
}

export enum SubscriptionTier {
  Free = 'Free',
  Standard = 'Standard',
  Pro = 'Pro',
  ProMax = 'Pro Max'
}

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  preferences: {
    dietaryRestrictions: string[];
    householdSize: number;
  };
}