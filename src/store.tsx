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
import type { Item, BorrowRequest, UserProfile, RequestStatus, Availability, AppNotification, ChatMessage } from './types';
import { PLACEHOLDER_IMAGES } from './data';
import type { Category, Condition } from './types';

interface AppContextType {
  user: UserProfile | null;
  authLoading: boolean;
  signup: (name: string, email: string, password: string, studentId: string, college: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  deleteAccount: () => Promise<{ error: string | null }>;
  items: Item[];
  itemsLoading: boolean;
  addListing: (data: {
    name: string;
    category: Category;
    description: string;
    condition: Condition;
    pricePerDay: number;
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
  updateAvatar: (file: File) => Promise<{ error: string | null }>;
  removeAvatar: () => Promise<{ error: string | null }>;
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

function parseItem(row: any, ownerName: string, ownerVerified: boolean): Item {
  return {
    id: row.id,
    name: row.title,
    category: row.category as Category,
    description: row.description,
    condition: row.condition as Condition,
    pricePerDay: row.price_per_day,
    location: row.location,
    image: row.image_url || PLACEHOLDER_IMAGES[(row.category as Category) || 'Other'],
    ownerId: row.owner_id,
    ownerName,
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
  const sessionRef = useRef<Session | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch profiles for a list of user IDs and merge into profilesMap
  const fetchProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter((id) => id && !profilesMap[id]);
    if (uniqueIds.length === 0) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id, college, avatar_url')
      .in('id', uniqueIds);
    if (error || !data) return;
    const newMap: Record<string, UserProfile> = {};
    for (const p of data) {
      newMap[p.id] = parseProfile(p);
    }
    setProfilesMap((prev) => ({ ...prev, ...newMap }));
  }, [profilesMap]);

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
    if (missingIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, college, avatar_url')
        .in('id', missingIds);
      if (pData) {
        const newMap: Record<string, UserProfile> = { ...profilesMap };
        for (const p of pData) {
          newMap[p.id] = parseProfile(p);
        }
        setProfilesMap(newMap);
        const parsed = data.map((row: any) => {
          const profile = newMap[row.owner_id];
          return parseItem(row, profile?.fullName || 'Unknown', !!profile);
        });
        setItems(parsed);
      } else {
        const parsed = data.map((row: any) => parseItem(row, 'Unknown', false));
        setItems(parsed);
      }
    } else {
      const parsed = data.map((row: any) => {
        const profile = profilesMap[row.owner_id];
        return parseItem(row, profile?.fullName || 'Unknown', !!profile);
      });
      setItems(parsed);
    }
    setItemsLoading(false);
  }, [profilesMap]);

  // Fetch requests for current user (as requester or owner)
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
        const newMap = { ...profilesMap };
        for (const p of pData) {
          newMap[p.id] = parseProfile(p);
        }
        currentProfilesMap = newMap;
        setProfilesMap(newMap);
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

  // Fetch notifications for current user
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

  // Mark a single notification as read
  const markNotificationRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  // Mark all notifications as read
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

  // Fetch messages for a request
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

  // Upload avatar
  const updateAvatar = useCallback(async (file: File): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    if (uploadError) {
      if (import.meta.env.DEV) console.error('[updateAvatar] upload error:', uploadError.message);
      return { error: 'Failed to upload image.' };
    }
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) return { error: 'Failed to get image URL.' };
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    if (updateError) {
      return { error: 'Failed to update profile.' };
    }
    setUser({ ...user, avatarUrl: publicUrl });
    setProfilesMap((prev) => ({
      ...prev,
      [user.id]: { ...prev[user.id], avatarUrl: publicUrl },
    }));
    return { error: null };
  }, [user]);

  // Remove avatar
  const removeAvatar = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user || !user.avatarUrl) return { error: null };
    try {
      const url = new URL(user.avatarUrl);
      const pathMatch = url.pathname.match(/avatars\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('avatars').remove([pathMatch[1]]);
      }
    } catch {
      // ignore storage cleanup errors
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

  // Auth state + initial data loading
  useEffect(() => {
    let mounted = true;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      sessionRef.current = session;
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          if (!mounted) return;
          if (profile) {
            setUser(profile);
            fetchRequests(session.user.id);
          }
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sessionRef.current = session;
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setItems([]);
        setRequests([]);
        setProfilesMap({});
        setNotifications([]);
        setMessages([]);
        setActiveChatRequestId(null);
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
          // Complete expired rentals on login
          supabase.rpc('complete_expired_rentals').then(() => {
            fetchListings();
          });
          setAuthLoading(false);
        })();
      }
    });

    // Subscribe to realtime listings changes
    const listingsChannel = supabase
      .channel('listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings();
      })
      .subscribe();

    // Subscribe to realtime rent_requests changes
    const requestsChannel = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_requests' }, () => {
        if (sessionRef.current?.user?.id) {
          fetchRequests(sessionRef.current.user.id);
        }
      })
      .subscribe();

    // Subscribe to realtime notifications changes
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Subscribe to realtime messages changes
    const messagesChannel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (activeChatRequestId) {
          fetchMessages(activeChatRequestId);
        }
      })
      .subscribe();

    // Periodically check for expired rentals (every 60 seconds)
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
      supabase.removeChannel(messagesChannel);
      clearInterval(expiredInterval);
    };
  }, []);

  // Fetch listings when user logs in
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

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[signup] unexpected error:', err);
      if (isNetworkError(err)) {
        return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
      }
      return { error: 'An unexpected error occurred during signup. Please try again.' };
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
        if (import.meta.env.DEV) console.error('[login] Supabase error:', error.message, '(code:', error.status, ')');
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
      }

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[login] unexpected error:', err);
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
    setActiveChatRequestId(null);
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
    setActiveChatRequestId(null);

    return { error: null };
  }, [user]);

  const addListing = useCallback(async (data: {
    name: string;
    category: Category;
    description: string;
    condition: Condition;
    pricePerDay: number;
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

      if (uploadError) {
        return { error: `Image upload failed: ${uploadError.message}` };
      }

      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        imageUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('listings').insert({
      owner_id: user.id,
      title: data.name,
      description: data.description,
      category: data.category,
      condition: data.condition,
      price_per_day: data.pricePerDay,
      location: data.location || 'Campus',
      image_url: imageUrl,
      status: 'active',
    });

    if (insertError) {
      return { error: `Failed to create listing: ${insertError.message}` };
    }

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
      return {
        success: false,
        message: 'This item cannot be deleted while it has an active or pending rental request.',
      };
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('image_url')
      .eq('id', itemId)
      .maybeSingle();

    const { error } = await supabase.from('listings').delete().eq('id', itemId);

    if (error) {
      return { success: false, message: `Failed to delete: ${error.message}` };
    }

    if (listing?.image_url && listing.image_url.includes('listing-images')) {
      try {
        const url = new URL(listing.image_url);
        const pathMatch = url.pathname.match(/listing-images\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('listing-images').remove([pathMatch[1]]);
        }
      } catch {
        // ignore storage cleanup errors
      }
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

    if (fetchError || !listing) {
      return { error: 'This item could not be found.' };
    }

    if (listing.availability !== 'available') {
      return { error: 'This item is currently unavailable.' };
    }

    const { error } = await supabase.from('rent_requests').insert({
      listing_id: req.listingId,
      requester_id: user.id,
      owner_id: req.ownerId,
      start_date: req.startDate,
      end_date: req.endDate,
      message: req.message,
      status: 'pending',
    });

    if (error) {
      return { error: `Failed to send request: ${error.message}` };
    }

    fetchRequests(user.id);

    return { error: null };
  }, [user]);

  const updateRequestStatus = useCallback(async (id: string, status: RequestStatus): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };

    // For accept, use the atomic RPC to prevent race conditions
    if (status === 'accepted') {
      const { data, error } = await supabase.rpc('accept_rental', { p_request_id: id });
      if (error) {
        if (import.meta.env.DEV) console.error('[accept_rental] error:', error.message);
        return { error: 'Failed to accept request.' };
      }
      if (data && data.error) {
        return { error: data.error as string };
      }
      fetchRequests(user.id);
      fetchListings();
      fetchNotifications();
      return { error: null };
    }

    // For reject, verify ownership and update
    const { data: req, error: fetchErr } = await supabase
      .from('rent_requests')
      .select('id, listing_id, status, owner_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !req) {
      return { error: 'Request not found.' };
    }

    if (req.owner_id !== user.id) {
      return { error: 'Only the item owner can reject requests.' };
    }

    const { error } = await supabase
      .from('rent_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      return { error: `Failed to update request: ${error.message}` };
    }

    // For reject, set listing back to available (in case it was held)
    if (status === 'rejected') {
      await supabase
        .from('listings')
        .update({ availability: 'available' })
        .eq('id', req.listing_id);
    }

    fetchRequests(user.id);
    fetchListings();
    fetchNotifications();

    return { error: null };
  }, [user, fetchRequests, fetchListings, fetchNotifications]);

  const markReturned = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };

    const { data: req, error: fetchErr } = await supabase
      .from('rent_requests')
      .select('id, listing_id, status, owner_id')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !req) {
      return { error: 'Request not found.' };
    }

    if (req.owner_id !== user.id) {
      return { error: 'Only the owner can mark an item as returned.' };
    }

    if (req.status !== 'accepted') {
      return { error: 'Only accepted rentals can be marked as returned.' };
    }

    const { error: updateErr } = await supabase
      .from('rent_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    if (updateErr) {
      return { error: `Failed to update: ${updateErr.message}` };
    }

    await supabase
      .from('listings')
      .update({ availability: 'available' })
      .eq('id', req.listing_id);

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
        login,
        logout,
        deleteAccount,
        items,
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
        updateAvatar,
        removeAvatar,
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
