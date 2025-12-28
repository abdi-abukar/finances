export const DEFAULT_CATEGORIES = [
  { id: 'subscriptions', name: 'Subscriptions', color: '#8b5cf6', description: 'Monthly services, memberships' },
  { id: 'other', name: 'Other', color: '#6b7280', description: 'Miscellaneous transactions' }
];

export function getCategoryById(id) {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id) || DEFAULT_CATEGORIES.find(cat => cat.id === 'other');
}

export function suggestCategory(description) {
  const desc = description.toLowerCase();
  
  // Dynamic category matching - no hardcoding
  const categoryKeywords = {
    'income': ['payment', 'credit', 'salary', 'deposit', 'refund', 'thank you', 'merci'],
    'food-dining': ['restaurant', 'coffee', 'cafe', 'dining', 'food', 'kitchen', 'grill', 'pizza', 'burger'],
    'groceries': ['grocery', 'supermarket', 'market', 'food store', 'produce'],
    'transportation': ['transit', 'bus', 'train', 'taxi', 'uber', 'lyft', 'parking'],
    'gas-fuel': ['gas', 'fuel', 'petrol', 'station'],
    'shopping': ['store', 'shop', 'retail', 'purchase', 'buy'],
    'entertainment': ['bar', 'pub', 'movie', 'cinema', 'club', 'entertainment'],
    'subscriptions': ['subscription', 'monthly', 'annual fee', 'membership'],
    'fees': ['fee', 'charge', 'service', 'penalty'],
    'utilities': ['utility', 'electric', 'water', 'internet', 'phone', 'cable'],
    'healthcare': ['medical', 'doctor', 'pharmacy', 'hospital', 'clinic'],
    'travel': ['hotel', 'flight', 'airline', 'travel', 'vacation'],
    'education': ['school', 'university', 'education', 'book', 'course'],
    'personal-care': ['salon', 'spa', 'beauty', 'barber', 'personal']
  };

  // Find matching category
  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return categoryId;
    }
  }

  return 'other';
}

export function isRecurringTransaction(description, amount) {
  const desc = description.toLowerCase();
  
  const recurringKeywords = [
    'subscription', 'monthly', 'annual', 'insurance', 'rent', 'mortgage',
    'phone', 'internet', 'gym', 'membership', 'utility', 'electric'
  ];
  
  const isRoundAmount = amount % 1 === 0 || (amount * 100) % 25 === 0;
  const hasRecurringPattern = recurringKeywords.some(keyword => desc.includes(keyword));
  
  return hasRecurringPattern || (isRoundAmount && amount > 10);
}