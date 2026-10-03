export type Category =
  | 'Books'
  | 'Calculators'
  | 'Electronics'
  | 'Cycles'
  | 'Sports'
  | 'Lab Equipment'
  | 'Other';

export type Condition = 'New' | 'Like New' | 'Good' | 'Fair';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type Availability = 'available' | 'unavailable';

export interface Item {
  id: string;
  name: string;
  category: Category;
  description: string;
  condition: Condition;
  pricePerDay: number;
  location: string;
  image: string;
  ownerId: string;
  ownerName: string;
  verified: boolean;
  availability: Availability;
  createdAt: string;
}

export interface BorrowRequest {
  id: string;
  listingId: string;
  itemName: string;
  itemImage: string;
  ownerId: string;
  ownerName: string;
  requesterId: string;
  requesterName: string;
  startDate: string;
  endDate: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  college: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  requestId: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  ownerId: string;
  ownerName: string;
  borrowerId: string;
  borrowerName: string;
  messages: ChatMessage[];
}
