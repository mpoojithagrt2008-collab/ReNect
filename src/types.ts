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
  ownerStudentId: string;
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
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string | null;
  type: string;
  title: string;
  body: string | null;
  listingId: string | null;
  requestId: string | null;
  read: boolean;
  createdAt: string;
}

export interface Favorite {
  id: string;
  listingId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  requestId: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface ListingRating {
  averageRating: number;
  reviewCount: number;
}

export type ReturnCondition = 'good' | 'minor_damage' | 'damaged';
export type ReturnStatus = 'submitted' | 'reviewed';

export interface ReturnRecord {
  id: string;
  requestId: string;
  listingId: string;
  borrowerId: string;
  returnPhotoUrl: string;
  returnCondition: ReturnCondition;
  returnNote: string;
  status: ReturnStatus;
  createdAt: string;
}

export type PenaltyStatus = 'pending' | 'paid';

export interface DamagePenalty {
  id: string;
  requestId: string;
  listingId: string;
  ownerId: string;
  borrowerId: string;
  amount: number;
  reason: string;
  status: PenaltyStatus;
  createdAt: string;
}

export type PaymentMethod = 'online' | 'offline';
export type PaymentStatus = 'pending' | 'pending_verification' | 'paid' | 'failed' | 'cancelled';
export type PaymentPurpose = 'rental' | 'penalty';

export interface PaymentRecord {
  id: string;
  requestId: string;
  listingId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  purpose: PaymentPurpose;
  penaltyId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef: string | null;
  createdAt: string;
  updatedAt: string;
}
