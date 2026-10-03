import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { Item, BorrowRequest, UserProfile, RequestStatus, Availability, AppNotification, ChatMessage, Favorite, Review, ListingRating, ReturnRecord, DamagePenalty, PaymentRecord, ReturnCondition, PaymentMethod } from './types';
import { PLACEHOLDER_IMAGES } from './data';
import type { Category, Condition, PricingType } from './types';

interface AppContextType {
  user: UserProfile | null;
  authLoading: boolean;
  signup: (name: string, email: string, password: string, studentId: string, college: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendOtp: (email: string) => Promise<{ error: string | null }>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  deleteAccount: () => Promise<{ error: string | null }>;
  items: Item[];
  exploreItems: Item[];
  itemsLoading: boolean;
  addListing: (data: {
    name: string;
    category: Category;
    description: string;
    condition: Condition;
    pricePerDay: number;
    pricingType: 'hour' | 'day';
    location: string;
    imageFile: File | null;
  }) => Promise<{ error: string | null }>;
  deleteListing: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  requests: BorrowRequest[];
  addRequest: (req: {
    listingId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    message: string;
  }) => Promise<{ error: string | null }>;
  updateRequestStatus: (id: string, status: RequestStatus) => Promise<{ error: string | null }>;
  markReturned: (requestId: string) => Promise<{ error: string | null }>;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  profilesMap: Record<string, UserProfile>;
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  messages: ChatMessage[];
  activeChatRequestId: string | null;
  setActiveChatRequestId: (id: string | null) => void;
  fetchMessages: (requestId: string) => Promise<void>;
  sendMessage: (requestId: string, receiverId: string, text: string) => Promise<{ error: string | null }>;
  unreadMessageCount: number;
  unreadByRequest: Record<string, number>;
  fetchUnreadMessages: () => Promise<void>;
  markMessagesRead: (requestId: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<{ error: string | null }>;
  removeAvatar: () => Promise<{ error: string | null }>;
  favorites: Favorite[];
  favoriteIds: Set<string>;
  toggleFavorite: (listingId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  ratingsMap: Record<string, ListingRating>;
  fetchRating: (listingId: string) => Promise<void>;
  reviews: Review[];
  fetchReviews: (listingId: string) => Promise<void>;
  submitReview: (requestId: string, listingId: string, rating: number, feedback: string) => Promise<{ error: string | null }>;
  reviewedRequestIds: Set<string>;
  fetchReviewedRequestIds: () => Promise<void>;
  returns: ReturnRecord[];
  returnsMap: Record<string, ReturnRecord>;
  submitReturn: (requestId: string, listingId: string, photoFile: File, condition: ReturnCondition, note: string) => Promise<{ error: string | null }>;
  fetchReturns: () => Promise<void>;
  getReturnPhotoUrl: (requestId: string) => Promise<string | null>;
  damagePenalties: DamagePenalty[];
  penaltiesMap: Record<string, DamagePenalty>;
  createPenalty: (requestId: string, listingId: string, borrowerId: string, amount: number, reason: string) => Promise<{ error: string | null }>;
  fetchPenalties: () => Promise<void>;
  payments: PaymentRecord[];
  paymentsMap: Record<string, PaymentRecord[]>;
  createPayment: (requestId: string, listingId: string, payeeId: string, amount: number, purpose: 'rental' | 'penalty', method: PaymentMethod, penaltyId?: string | null) => Promise<{ error: string | null; paymentId?: string }>;
  verifyPayment: (paymentId: string, approved: boolean) => Promise<{ error: string | null }>;
  fetchPayments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('err_network') ||
    msg.includes('timeout') ||
    msg.includes('load failed')
  );
}

function parseItem(row: any, ownerName: string, ownerVerified: boolean, ownerStudentId: string): Item {
  return {
    id: row.id,
    name: row.title,
    category: row.category as Category,
    description: row.description,
    condition: row.condition as Condition,
    pricePerDay: row.price_per_day,
    pricingType: (row.pricing_type as 'hour' | 'day') || 'day',
    location: row.location,
    image: row.image_url || PLACEHOLDER_IMAGES[(row.category as Category) || 'Other'],
    ownerId: row.owner_id,
    ownerName,
    ownerStudentId,
    verified: ownerVerified,
    availability: (row.availability as Availability) || 'available',
    createdAt: row.created_at,
  };
}

function parseRequest(row: any, itemName: string, itemImage: string, ownerName: string, requesterName: string): BorrowRequest {
  return {
    id: row.id,
    listingId: row.listing_id,
    itemName,
    itemImage,
    ownerId: row.owner_id,
    ownerName,
    requesterId: row.requester_id,
    requesterName,
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    message: row.message || '',
    status: row.status as RequestStatus,
    createdAt: row.created_at,
  };
}

function parseProfile(p: any): UserProfile {
  return {
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    studentId: p.student_id || '',
    college: p.college || '',
    avatarUrl: p.avatar_url || null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatRequestId, setActiveChatRequestId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, ListingRating>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<string>>(new Set());
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [damagePenalties, setDamagePenalties] = useState<DamagePenalty[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [unreadByRequest, setUnreadByRequest] = useState<Record<string, number>>({});
  const sessionRef = useRef<Session | null>(null);
  const activeChatRef = useRef<string | null>(null);
  const messagesChannelRef = useRef<any>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessageCount = Object.values(unreadByRequest).reduce((sum, n) => sum + n, 0);
  const favoriteIds = new Set(favorites.map((f) => f.listingId));
  const returnsMap: Record<string, ReturnRecord> = {};
  for (const r of returns) returnsMap[r.requestId] = r;
  const penaltiesMap: Record<string, DamagePenalty> = {};
  for (const p of damagePenalties) penaltiesMap[p.requestId] = p;
  const paymentsMap: Record<string, PaymentRecord[]> = {};
  for (const p of payments) {
    if (!paymentsMap[p.requestId]) paymentsMap[p.requestId] = [];
    paymentsMap[p.requestId].push(p);
  }

  // Explore items = all items except the logged-in user's own listings
  const exploreItems = items.filter((i) => i.ownerId !== user?.id);

  const fetchAllRatings = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('listing_id, rating');
    if (error || !data) return;

    const totals: Record<string, { sum: number; count: number }> = {};
    for (const review of data) {
      const current = totals[review.listing_id] || { sum: 0, count: 0 };
      totals[review.listing_id] = { sum: current.sum + review.rating, count: current.count + 1 };
    }

    setRatingsMap(Object.fromEntries(
      Object.entries(totals).map(([listingId, total]) => [listingId, {
        averageRating: total.sum / total.count,
        reviewCount: total.count,
      }]),
    ));
  }, []);

  // Fetch all active listings
  const fetchListings = useCallback(async () => {
    setItemsLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error || !data) {
      setItemsLoading(false);
      return;
    }

    const ownerIds = data.map((r: any) => r.owner_id);
    const missingIds = [...new Set(ownerIds)].filter((id: string) => !profilesMap[id]);
    let currentProfilesMap = profilesMap;
    if (missingIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, college, avatar_url')
        .in('id', missingIds);
      if (pData) {
        currentProfilesMap = { ...profilesMap };
        for (const p of pData) {
          currentProfilesMap[p.id] = parseProfile(p);
        }
        setProfilesMap(currentProfilesMap);
      }
    }

    const parsed = data.map((row: any) => {
      const profile = currentProfilesMap[row.owner_id];
      return parseItem(row, profile?.fullName || 'Unknown', !!profile, profile?.studentId || '');
    });
    setItems(parsed);
    setItemsLoading(false);
    fetchAllRatings();
  }, [profilesMap, fetchAllRatings]);

  // Fetch requests for current user
  const fetchRequests = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('rent_requests')
      .select('*')
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const listingIds = [...new Set(data.map((r: any) => r.listing_id))];
    if (listingIds.length === 0) {
      setRequests([]);
      return;
    }

    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, image_url, owner_id')
      .in('id', listingIds);

    const listingMap: Record<string, any> = {};
    (listings || []).forEach((l: any) => { listingMap[l.id] = l; });

    const allUserIds = new Set<string>();
    data.forEach((r: any) => {
      allUserIds.add(r.owner_id);
      allUserIds.add(r.requester_id);
    });

    const missingProfileIds = [...allUserIds].filter((id) => !profilesMap[id]);
    let currentProfilesMap = profilesMap;
    if (missingProfileIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, college, avatar_url')
        .in('id', missingProfileIds);
      if (pData) {
        currentProfilesMap = { ...profilesMap };
        for (const p of pData) {
          currentProfilesMap[p.id] = parseProfile(p);
        }
        setProfilesMap(currentProfilesMap);
      }
    }

    const parsed = data.map((row: any) => {
      const listing = listingMap[row.listing_id];
      const ownerProfile = currentProfilesMap[row.owner_id];
      const requesterProfile = currentProfilesMap[row.requester_id];
      return parseRequest(
        row,
        listing?.title || 'Unknown Item',
        listing?.image_url || '',
        ownerProfile?.fullName || 'Unknown',
        requesterProfile?.fullName || 'Unknown',
      );
    });
    setRequests(parsed);
  }, [profilesMap]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return;
    setNotifications(data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor_id,
      type: n.type,
      title: n.title,
      body: n.body,
      listingId: n.listing_id,
      requestId: n.request_id,
      read: n.read,
      createdAt: n.created_at,
    })));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (requestId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, request_id, sender_id, receiver_id, body, created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    if (error || !data) {
      setMessages([]);
      return;
    }
    const parsed: ChatMessage[] = data.map((m: any) => {
      const senderProfile = profilesMap[m.sender_id];
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: senderProfile?.fullName || 'User',
        text: m.body,
        timestamp: m.created_at,
      };
    });
    setMessages(parsed);
  }, [profilesMap]);

  const fetchUnreadMessages = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('request_id')
      .eq('receiver_id', userId)
      .is('read_at', null);
    if (error || !data) return;
    const counts: Record<string, number> = {};
    for (const m of data) counts[m.request_id] = (counts[m.request_id] || 0) + 1;
    setUnreadByRequest(counts);
  }, []);

  const markMessagesRead = useCallback(async (requestId: string) => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .eq('receiver_id', userId)
      .is('read_at', null);
    setUnreadByRequest((prev) => ({ ...prev, [requestId]: 0 }));
  }, []);

  // Send a message
  const sendMessage = useCallback(async (requestId: string, receiverId: string, text: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { error } = await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      receiver_id: receiverId,
      body: text,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('[sendMessage] error:', error.message);
      return { error: 'Failed to send message.' };
    }
    return { error: null };
  }, [user]);

  // Avatar upload
  const updateAvatar = useCallback(async (file: File): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    if (uploadError) return { error: 'Failed to upload image.' };
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) return { error: 'Failed to get image URL.' };
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    if (updateError) return { error: 'Failed to update profile.' };
    setUser({ ...user, avatarUrl: publicUrl });
    setProfilesMap((prev) => ({
      ...prev,
      [user.id]: { ...prev[user.id], avatarUrl: publicUrl },
    }));
    return { error: null };
  }, [user]);

  const removeAvatar = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user || !user.avatarUrl) return { error: null };
    try {
      const url = new URL(user.avatarUrl);
      const pathMatch = url.pathname.match(/avatars\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('avatars').remove([pathMatch[1]]);
      }
    } catch {
      // ignore
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);
    if (error) return { error: 'Failed to remove image.' };
    setUser({ ...user, avatarUrl: null });
    setProfilesMap((prev) => ({
      ...prev,
      [user.id]: { ...prev[user.id], avatarUrl: null },
    }));
    return { error: null };
  }, [user]);

  // Favorites
  const fetchFavorites = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('id, listing_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setFavorites(data.map((f: any) => ({
      id: f.id,
      listingId: f.listing_id,
      createdAt: f.created_at,
    })));
  }, []);

  const toggleFavorite = useCallback(async (listingId: string) => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const existing = favorites.find((f) => f.listingId === listingId);
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
    } else {
      const { data, error } = await supabase.from('favorites').insert({
        user_id: userId,
        listing_id: listingId,
      }).select('id, listing_id, created_at').maybeSingle();
      if (!error && data) {
        setFavorites((prev) => [...prev, {
          id: data.id,
          listingId: data.listing_id,
          createdAt: data.created_at,
        }]);
      }
    }
  }, [favorites]);

  // Ratings
  const fetchRating = useCallback(async (listingId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId);
    if (error || !data) return;
    if (data.length === 0) {
      setRatingsMap((prev) => ({ ...prev, [listingId]: { averageRating: 0, reviewCount: 0 } }));
      return;
    }
    const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
    setRatingsMap((prev) => ({ ...prev, [listingId]: { averageRating: avg, reviewCount: data.length } }));
  }, []);

  // Reviews
  const fetchReviews = useCallback(async (listingId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, request_id, listing_id, reviewer_id, rating, feedback, created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (error || !data) {
      setReviews([]);
      return;
    }
    const reviewerIds = [...new Set(data.map((r: any) => r.reviewer_id))];
    const missingIds = reviewerIds.filter((id: string) => !profilesMap[id]);
    let currentProfilesMap = profilesMap;
    if (missingIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, student_id')
        .in('id', missingIds);
      if (pData) {
        currentProfilesMap = { ...profilesMap };
        for (const p of pData) {
          currentProfilesMap[p.id] = { ...currentProfilesMap[p.id], ...parseProfile(p) };
        }
      }
    }
    const parsed: Review[] = data.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      listingId: r.listing_id,
      reviewerId: r.reviewer_id,
      reviewerName: currentProfilesMap[r.reviewer_id]?.fullName || 'Anonymous',
      reviewerStudentId: currentProfilesMap[r.reviewer_id]?.studentId || '',
      rating: r.rating,
      feedback: r.feedback || '',
      createdAt: r.created_at,
    }));
    setReviews(parsed);
  }, [profilesMap]);

  const submitReview = useCallback(async (requestId: string, listingId: string, rating: number, feedback: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { error } = await supabase.from('reviews').insert({
      request_id: requestId,
      listing_id: listingId,
      reviewer_id: user.id,
      rating,
      feedback,
    });
    if (error) {
      if (error.code === '23505') {
        return { error: 'You have already reviewed this rental.' };
      }
      return { error: 'Failed to submit review.' };
    }
    setReviewedRequestIds((prev) => new Set([...prev, requestId]));
    fetchRating(listingId);
    fetchReviews(listingId);
    fetchAllRatings();
    return { error: null };
  }, [user, fetchRating, fetchReviews, fetchAllRatings]);

  const fetchReviewedRequestIds = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('reviews')
      .select('request_id')
      .eq('reviewer_id', userId);
    if (error || !data) return;
    setReviewedRequestIds(new Set(data.map((r: any) => r.request_id)));
  }, []);

  // =========================================================
  // Returns: fetch, submit, get photo URL
  // =========================================================
  const fetchReturns = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('returns')
      .select('id, request_id, listing_id, borrower_id, return_photo_url, return_condition, return_note, status, created_at')
      .or(`borrower_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error || !data) { setReturns([]); return; }
    const ownReqIds = requests.filter(r => r.ownerId === userId).map(r => r.id);
    let allReturns = [...data];
    if (ownReqIds.length > 0) {
      const { data: ownerReturns } = await supabase
        .from('returns')
        .select('id, request_id, listing_id, borrower_id, return_photo_url, return_condition, return_note, status, created_at')
        .in('request_id', ownReqIds);
      if (ownerReturns) allReturns = [...allReturns, ...ownerReturns];
    }
    const uniqueMap: Record<string, any> = {};
    for (const r of allReturns) uniqueMap[r.id] = r;
    const parsed: ReturnRecord[] = Object.values(uniqueMap).map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      listingId: r.listing_id,
      borrowerId: r.borrower_id,
      returnPhotoUrl: r.return_photo_url,
      returnCondition: r.return_condition as ReturnCondition,
      returnNote: r.return_note || '',
      status: r.status as 'submitted' | 'reviewed',
      createdAt: r.created_at,
    }));
    setReturns(parsed);
  }, [requests]);

  const getReturnPhotoUrl = useCallback(async (requestId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('returns')
      .select('return_photo_url')
      .eq('request_id', requestId)
      .maybeSingle();
    if (!data || !data.return_photo_url) return null;
    if (data.return_photo_url.startsWith('http')) return data.return_photo_url;
    const { data: signedUrl } = await supabase.storage
      .from('return-photos')
      .createSignedUrl(data.return_photo_url, 3600);
    return signedUrl?.signedUrl || null;
  }, []);

  const submitReturn = useCallback(async (
    requestId: string,
    listingId: string,
    photoFile: File,
    condition: ReturnCondition,
    note: string,
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    try {
      const fileExt = photoFile.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${requestId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('return-photos')
        .upload(filePath, photoFile);
      if (uploadError) return { error: 'Failed to upload return photo.' };
      const { data: req } = await supabase
        .from('rent_requests')
        .select('owner_id')
        .eq('id', requestId)
        .maybeSingle();
      const ownerId = req?.owner_id;
      const { error: insertError } = await supabase.from('returns').insert({
        request_id: requestId,
        listing_id: listingId,
        borrower_id: user.id,
        return_photo_url: filePath,
        return_condition: condition,
        return_note: note,
        status: 'submitted',
      });
      if (insertError) {
        if (insertError.code === '23505') return { error: 'You have already submitted a return for this rental.' };
        return { error: 'Failed to submit return.' };
      }
      if (ownerId) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          actor_id: user.id,
          type: 'return_submitted',
          title: 'Return submitted',
          body: 'A borrower has submitted a return with photo proof. Please review it.',
          listing_id: listingId,
          request_id: requestId,
        });
      }
      fetchReturns();
      fetchNotifications();
      return { error: null };
    } catch {
      return { error: 'Failed to submit return. Please try again.' };
    }
  }, [user, fetchReturns, fetchNotifications]);

  // =========================================================
  // Damage Penalties: fetch, create
  // =========================================================
  const fetchPenalties = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('damage_penalties')
      .select('id, request_id, listing_id, owner_id, borrower_id, amount, reason, status, created_at')
      .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error || !data) { setDamagePenalties([]); return; }
    const parsed: DamagePenalty[] = data.map((p: any) => ({
      id: p.id,
      requestId: p.request_id,
      listingId: p.listing_id,
      ownerId: p.owner_id,
      borrowerId: p.borrower_id,
      amount: p.amount,
      reason: p.reason || '',
      status: p.status as 'pending' | 'paid',
      createdAt: p.created_at,
    }));
    setDamagePenalties(parsed);
  }, []);

  const createPenalty = useCallback(async (
    requestId: string,
    listingId: string,
    borrowerId: string,
    amount: number,
    reason: string,
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { error } = await supabase.from('damage_penalties').insert({
      request_id: requestId,
      listing_id: listingId,
      owner_id: user.id,
      borrower_id: borrowerId,
      amount,
      reason,
      status: 'pending',
    });
    if (error) {
      if (error.code === '23505') return { error: 'A penalty has already been created for this rental.' };
      return { error: 'Failed to create penalty.' };
    }
    await supabase.from('notifications').insert({
      user_id: borrowerId,
      actor_id: user.id,
      type: 'penalty_created',
      title: 'Damage penalty issued',
      body: `A damage penalty of ₹${amount} has been issued for your rental. ${reason}`,
      listing_id: listingId,
      request_id: requestId,
    });
    fetchPenalties();
    fetchNotifications();
    return { error: null };
  }, [user, fetchPenalties, fetchNotifications]);

  // =========================================================
  // Payments: fetch, create, verify
  // =========================================================
  const fetchPayments = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('payments')
      .select('id, request_id, listing_id, payer_id, payee_id, amount, purpose, penalty_id, method, status, provider_ref, created_at, updated_at')
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error || !data) { setPayments([]); return; }
    const parsed: PaymentRecord[] = data.map((p: any) => ({
      id: p.id,
      requestId: p.request_id,
      listingId: p.listing_id,
      payerId: p.payer_id,
      payeeId: p.payee_id,
      amount: p.amount,
      purpose: p.purpose as 'rental' | 'penalty',
      penaltyId: p.penalty_id || null,
      method: p.method as 'online' | 'offline',
      status: p.status as 'pending' | 'pending_verification' | 'paid' | 'failed' | 'cancelled',
      providerRef: p.provider_ref || null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    setPayments(parsed);
  }, []);

  const createPayment = useCallback(async (
    requestId: string,
    listingId: string,
    payeeId: string,
    amount: number,
    purpose: 'rental' | 'penalty',
    method: PaymentMethod,
    penaltyId?: string | null,
  ): Promise<{ error: string | null; paymentId?: string }> => {
    if (!user) return { error: 'Not logged in.' };
    const status = method === 'offline' ? 'pending_verification' : 'pending';
    const { data, error } = await supabase.from('payments').insert({
      request_id: requestId,
      listing_id: listingId,
      payer_id: user.id,
      payee_id: payeeId,
      amount,
      purpose,
      penalty_id: penaltyId || null,
      method,
      status,
    }).select('id').maybeSingle();
    if (error) return { error: 'Failed to create payment record.' };
    await supabase.from('notifications').insert({
      user_id: payeeId,
      actor_id: user.id,
      type: method === 'offline' ? 'offline_payment_submitted' : 'online_payment_pending',
      title: method === 'offline' ? 'Offline payment submitted' : 'Online payment initiated',
      body: `A ${method} payment of ₹${amount} has been submitted for ${purpose === 'rental' ? 'rental' : 'damage penalty'}.${method === 'offline' ? ' Please verify it.' : ''}`,
      listing_id: listingId,
      request_id: requestId,
    });
    fetchPayments();
    fetchNotifications();
    return { error: null, paymentId: data?.id };
  }, [user, fetchPayments, fetchNotifications]);

  const verifyPayment = useCallback(async (paymentId: string, approved: boolean): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('id, payee_id, status, purpose, penalty_id, payer_id, request_id')
      .eq('id', paymentId)
      .maybeSingle();
    if (fetchErr || !payment) return { error: 'Payment not found.' };
    if (payment.payee_id !== user.id) return { error: 'Only the recipient can verify payments.' };
    const newStatus = approved ? 'paid' : 'failed';
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) return { error: 'Failed to update payment status.' };
    if (approved && payment.purpose === 'penalty' && payment.penalty_id) {
      await supabase.from('damage_penalties').update({ status: 'paid' }).eq('id', payment.penalty_id);
      fetchPenalties();
    }
    await supabase.from('notifications').insert({
      user_id: payment.payer_id,
      actor_id: user.id,
      type: approved ? 'payment_verified' : 'payment_rejected',
      title: approved ? 'Payment verified' : 'Payment rejected',
      body: approved ? 'Your payment has been verified and marked as paid.' : 'Your payment was rejected. Please contact the owner.',
      request_id: payment.request_id,
    });
    fetchPayments();
    fetchNotifications();
    return { error: null };
  }, [user, fetchPayments, fetchPenalties, fetchNotifications]);

  // Auth state + initial data
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      sessionRef.current = session;
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          if (!mounted) return;
          if (profile) {
            setUser(profile);
            fetchRequests(session.user.id);
            fetchFavorites();
            fetchReviewedRequestIds();
            fetchUnreadMessages();
          }
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sessionRef.current = session;
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setItems([]);
        setRequests([]);
        setProfilesMap({});
        setNotifications([]);
        setMessages([]);
        setFavorites([]);
        setReviews([]);
        setReviewedRequestIds(new Set());
        setReturns([]);
        setDamagePenalties([]);
        setPayments([]);
        setUnreadByRequest({});
        setActiveChatRequestId(null);
        activeChatRef.current = null;
        setAuthLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        (async () => {
          let profile = await fetchUserProfile(session.user.id);
          if (!profile) {
            const fallbackName =
              (session.user.user_metadata?.full_name as string) ||
              session.user.email?.split('@')[0] ||
              'User';
            profile = {
              id: session.user.id,
              fullName: fallbackName,
              email: session.user.email || '',
              studentId: (session.user.user_metadata?.student_id as string) || '',
              college: (session.user.user_metadata?.college as string) || '',
              avatarUrl: null,
            };
          }
          if (!mounted) return;
          setUser(profile);
          fetchRequests(session.user.id);
          fetchNotifications();
          fetchFavorites();
          fetchReviewedRequestIds();
          fetchReturns();
          fetchPenalties();
          fetchPayments();
          fetchUnreadMessages();
          supabase.rpc('complete_expired_rentals').then(() => {
            fetchListings();
          });
          setAuthLoading(false);
        })();
      }
    });

    const listingsChannel = supabase
      .channel('listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_requests' }, () => {
        if (sessionRef.current?.user?.id) {
          fetchRequests(sessionRef.current.user.id);
        }
      })
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    const favoritesChannel = supabase
      .channel('favorites-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, () => {
        fetchFavorites();
      })
      .subscribe();

    const reviewsChannel = supabase
      .channel('reviews-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchAllRatings();
        if (selectedItemId) {
          fetchRating(selectedItemId);
          fetchReviews(selectedItemId);
        }
      })
      .subscribe();

    const returnsChannel = supabase
      .channel('returns-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        fetchReturns();
        fetchNotifications();
      })
      .subscribe();

    const penaltiesChannel = supabase
      .channel('penalties-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'damage_penalties' }, () => {
        fetchPenalties();
        fetchNotifications();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
        fetchNotifications();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-unread-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    const expiredInterval = setInterval(() => {
      supabase.rpc('complete_expired_rentals').then(() => {
        fetchListings();
        if (sessionRef.current?.user?.id) {
          fetchRequests(sessionRef.current.user.id);
          fetchNotifications();
        }
      });
    }, 60000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(listingsChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(favoritesChannel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(returnsChannel);
      supabase.removeChannel(penaltiesChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(messagesChannel);
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      clearInterval(expiredInterval);
    };
  }, []);

  // Realtime messages: subscribe to the specific conversation when active chat changes
  useEffect(() => {
    activeChatRef.current = activeChatRequestId;

    // Remove old messages channel
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    if (activeChatRequestId) {
      // Fetch initial messages
      fetchMessages(activeChatRequestId);
      markMessagesRead(activeChatRequestId);

      // Subscribe to new messages for this specific request
      const channel = supabase
        .channel(`messages-${activeChatRequestId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `request_id=eq.${activeChatRequestId}`,
          },
          () => {
            fetchMessages(activeChatRequestId);
            markMessagesRead(activeChatRequestId);
          },
        )
        .subscribe();

      messagesChannelRef.current = channel;
    }

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    };
  }, [activeChatRequestId, fetchMessages, markMessagesRead]);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchNotifications();
    }
  }, [user?.id]);

  async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id, college, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return parseProfile(data);
  }

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    studentId: string,
    college: string,
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: name,
            student_id: studentId,
            college,
          },
        },
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[signup] Supabase error:', error.message);
        if (isNetworkError(error)) {
          return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
        }
        return { error: error.message };
      }

      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ student_id: studentId, college })
          .eq('id', data.user.id);
      }

      return { error: null, needsEmailConfirmation: true };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[signup] unexpected error:', err);
      if (isNetworkError(err)) {
        return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
      }
      return { error: 'An unexpected error occurred during signup. Please try again.' };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'signup',
      });
      if (error) {
        if (isNetworkError(error)) {
          return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
        }
        if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
          return { error: 'Invalid or expired verification code. Please request a new one.' };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      if (isNetworkError(err)) {
        return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
      }
      return { error: 'Failed to verify code. Please try again.' };
    }
  }, []);

  const resendOtp = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resend({
        email: normalizedEmail,
        type: 'signup',
      });
      if (error) {
        if (isNetworkError(error)) {
          return { error: 'Unable to connect to the server.' };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: 'Failed to resend code.' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[login] Supabase error:', error.message);
        if (isNetworkError(error)) {
          return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
        }
        return { error: 'Invalid email or password.' };
      }

      if (data.user) {
        let profile = await fetchUserProfile(data.user.id);
        if (!profile) {
          const fallbackName =
            (data.user.user_metadata?.full_name as string) ||
            data.user.email?.split('@')[0] ||
            'User';
          profile = {
            id: data.user.id,
            fullName: fallbackName,
            email: data.user.email || normalizedEmail,
            studentId: (data.user.user_metadata?.student_id as string) || '',
            college: (data.user.user_metadata?.college as string) || '',
            avatarUrl: null,
          };
        }
        setUser(profile);
        fetchRequests(data.user.id);
        fetchNotifications();
        fetchFavorites();
        fetchReviewedRequestIds();
        fetchReturns();
        fetchPenalties();
        fetchPayments();
        fetchUnreadMessages();
      }

      return { error: null };
    } catch (err: any) {
      if (isNetworkError(err)) {
        return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
      }
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    setUser(null);
    setItems([]);
    setRequests([]);
    setProfilesMap({});
    setSelectedItemId(null);
    setNotifications([]);
    setMessages([]);
    setFavorites([]);
    setReviews([]);
    setReviewedRequestIds(new Set());
    setReturns([]);
    setDamagePenalties([]);
    setPayments([]);
    setActiveChatRequestId(null);
    setUnreadByRequest({});
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const userId = user.id;
    await supabase.from('listings').delete().eq('owner_id', userId);
    await supabase.from('rent_requests').delete().eq('requester_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.signOut();
    setUser(null);
    setItems([]);
    setRequests([]);
    setProfilesMap({});
    setSelectedItemId(null);
    setNotifications([]);
    setMessages([]);
    setFavorites([]);
    setReturns([]);
    setDamagePenalties([]);
    setPayments([]);
    setActiveChatRequestId(null);
    setUnreadByRequest({});
    return { error: null };
  }, [user]);

  const addListing = useCallback(async (data: {
    name: string;
    category: Category;
    description: string;
    condition: Condition;
    pricePerDay: number;
    pricingType: 'hour' | 'day';
    location: string;
    imageFile: File | null;
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    let imageUrl = PLACEHOLDER_IMAGES[data.category];
    if (data.imageFile) {
      const fileExt = data.imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, data.imageFile);
      if (uploadError) return { error: `Image upload failed: ${uploadError.message}` };
      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);
      if (urlData?.publicUrl) imageUrl = urlData.publicUrl;
    }
    const { error: insertError } = await supabase.from('listings').insert({
      owner_id: user.id,
      title: data.name,
      description: data.description,
      category: data.category,
      condition: data.condition,
      price_per_day: data.pricePerDay,
      pricing_type: data.pricingType,
      location: data.location || 'Campus',
      image_url: imageUrl,
      status: 'active',
    });
    if (insertError) return { error: `Failed to create listing: ${insertError.message}` };
    fetchListings();
    return { error: null };
  }, [user, fetchListings]);

  const deleteListing = useCallback(async (itemId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Not logged in.' };
    const { data: activeReqs } = await supabase
      .from('rent_requests')
      .select('id, status')
      .eq('listing_id', itemId)
      .in('status', ['pending', 'accepted']);
    if (activeReqs && activeReqs.length > 0) {
      return { success: false, message: 'This item cannot be deleted while it has an active or pending rental request.' };
    }
    const { data: listing } = await supabase
      .from('listings')
      .select('image_url')
      .eq('id', itemId)
      .maybeSingle();
    const { error } = await supabase.from('listings').delete().eq('id', itemId);
    if (error) return { success: false, message: `Failed to delete: ${error.message}` };
    if (listing?.image_url && listing.image_url.includes('listing-images')) {
      try {
        const url = new URL(listing.image_url);
        const pathMatch = url.pathname.match(/listing-images\/(.+)$/);
        if (pathMatch) await supabase.storage.from('listing-images').remove([pathMatch[1]]);
      } catch { /* ignore */ }
    }
    fetchListings();
    return { success: true };
  }, [user, fetchListings]);

  const addRequest = useCallback(async (req: {
    listingId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    message: string;
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('availability, status')
      .eq('id', req.listingId)
      .maybeSingle();
    if (fetchError || !listing) return { error: 'This item could not be found.' };
    if (listing.availability !== 'available') return { error: 'This item is currently unavailable.' };
    const { error } = await supabase.from('rent_requests').insert({
      listing_id: req.listingId,
      requester_id: user.id,
      owner_id: req.ownerId,
      start_date: req.startDate,
      end_date: req.endDate,
      message: req.message,
      status: 'pending',
    });
    if (error) return { error: `Failed to send request: ${error.message}` };

    const { data: listingInfo } = await supabase
      .from('listings')
      .select('title')
      .eq('id', req.listingId)
      .maybeSingle();
    const listingTitle = listingInfo?.title || 'your item';
    const duration = req.startDate && req.endDate
      ? `${req.startDate} to ${req.endDate}`
      : 'See request details';
    await supabase.from('notifications').insert({
      user_id: req.ownerId,
      actor_id: user.id,
      type: 'new_request',
      title: 'New rental request',
      body: `${user.fullName} requested to borrow "${listingTitle}". Duration: ${duration}.`,
      listing_id: req.listingId,
    });

    fetchRequests(user.id);
    fetchNotifications();
    return { error: null };
  }, [user]);

  const updateRequestStatus = useCallback(async (id: string, status: RequestStatus): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    if (status === 'accepted') {
      const { data, error } = await supabase.rpc('accept_rental', { p_request_id: id });
      if (error) return { error: 'Failed to accept request.' };
      if (data && data.error) return { error: data.error as string };
      fetchRequests(user.id);
      fetchListings();
      fetchNotifications();
      return { error: null };
    }
    if (status === 'rejected') {
      const { data, error: rpcError } = await supabase.rpc('reject_rental', { p_request_id: id });
      if (rpcError) return { error: 'Failed to reject request.' };
      if (data && data.error) return { error: data.error as string };
      fetchRequests(user.id);
      fetchListings();
      fetchNotifications();
      return { error: null };
    }
    const { data: req, error: fetchErr } = await supabase
      .from('rent_requests')
      .select('id, listing_id, status, owner_id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr || !req) return { error: 'Request not found.' };
    if (req.owner_id !== user.id) return { error: 'Only the item owner can reject requests.' };
    const { error } = await supabase
      .from('rent_requests')
      .update({ status })
      .eq('id', id);
    if (error) return { error: `Failed to update request: ${error.message}` };
    fetchRequests(user.id);
    fetchListings();
    fetchNotifications();
    return { error: null };
  }, [user, fetchRequests, fetchListings, fetchNotifications]);

  const markReturned = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const { data: req, error: fetchErr } = await supabase
      .from('rent_requests')
      .select('id, listing_id, status, owner_id, requester_id')
      .eq('id', requestId)
      .maybeSingle();
    if (fetchErr || !req) return { error: 'Request not found.' };
    if (req.owner_id !== user.id) return { error: 'Only the owner can mark an item as returned.' };
    if (req.status !== 'accepted') return { error: 'Only accepted rentals can be marked as returned.' };
    const { error: updateErr } = await supabase
      .from('rent_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
    if (updateErr) return { error: `Failed to update: ${updateErr.message}` };
    await supabase.from('listings').update({ availability: 'available' }).eq('id', req.listing_id);
    await supabase.from('notifications').insert({
      user_id: req.requester_id,
      actor_id: user.id,
      type: 'rental_completed',
      title: 'Rental completed',
      body: 'Your rental has been completed. Please rate the product.',
      listing_id: req.listing_id,
      request_id: requestId,
    });
    fetchRequests(user.id);
    fetchListings();
    fetchNotifications();
    return { error: null };
  }, [user, fetchRequests, fetchListings, fetchNotifications]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        signup,
        verifyOtp,
        resendOtp,
        login,
        logout,
        deleteAccount,
        items,
        exploreItems,
        itemsLoading,
        addListing,
        deleteListing,
        requests,
        addRequest,
        updateRequestStatus,
        markReturned,
        selectedItemId,
        setSelectedItemId,
        profilesMap,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        fetchNotifications,
        messages,
        activeChatRequestId,
        setActiveChatRequestId,
        fetchMessages,
        sendMessage,
        unreadMessageCount,
        unreadByRequest,
        fetchUnreadMessages,
        markMessagesRead,
        updateAvatar,
        removeAvatar,
        favorites,
        favoriteIds,
        toggleFavorite,
        fetchFavorites,
        ratingsMap,
        fetchRating,
        reviews,
        fetchReviews,
        submitReview,
        reviewedRequestIds,
        fetchReviewedRequestIds,
        returns,
        returnsMap,
        submitReturn,
        fetchReturns,
        getReturnPhotoUrl,
        damagePenalties,
        penaltiesMap,
        createPenalty,
        fetchPenalties,
        payments,
        paymentsMap,
        createPayment,
        verifyPayment,
        fetchPayments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
