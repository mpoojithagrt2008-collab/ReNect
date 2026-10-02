import type { Category, Condition } from './types';

export const CATEGORIES: Category[] = [
  'Books',
  'Calculators',
  'Electronics',
  'Cycles',
  'Sports',
  'Lab Equipment',
  'Other',
];

export const CONDITIONS: Condition[] = [
  'New',
  'Like New',
  'Good',
  'Fair',
];

export const PLACEHOLDER_IMAGES: Record<Category, string> = {
  Books: 'https://images.pexels.com/photos/240163/pexels-photo-240163.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Calculators: 'https://images.pexels.com/photos/5776/calculator-scientific.jpg?auto=compress&cs=tinysrgb&h=650&w=940',
  Electronics: 'https://images.pexels.com/photos/4792712/pexels-photo-4792712.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Cycles: 'https://images.pexels.com/photos/7483081/pexels-photo-7483081.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Sports: 'https://images.pexels.com/photos/13509805/pexels-photo-13509805.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'Lab Equipment': 'https://images.pexels.com/photos/5477780/pexels-photo-5477780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Other: 'https://images.pexels.com/photos/4792712/pexels-photo-4792712.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};
