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
import type { Item, BorrowRequest, UserProfile, RequestStatus, Availability } from './types';
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
}

const AppContext = createContext<AppContextType | null>(null);

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);

  // Fetch profiles for a list of user IDs and merge into profilesMap
  const fetchProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter((id) => id && !profilesMap[id]);
    if (uniqueIds.length === 0) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id, college')
      .in('id', uniqueIds);
    if (error || !data) return;
    const newMap: Record<string, UserProfile> = {};
    for (const p of data) {
      newMap[p.id] = {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        studentId: p.student_id || '',
        college: p.college || '',
      };
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
    // Fetch profiles if we don't have them
    const missingIds = [...new Set(ownerIds)].filter((id: string) => !profilesMap[id]);
    if (missingIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, college')
        .in('id', missingIds);
      if (pData) {
        const newMap: Record<string, UserProfile> = { ...profilesMap };
        for (const p of pData) {
          newMap[p.id] = {
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            studentId: p.student_id || '',
            college: p.college || '',
          };
        }
        setProfilesMap(newMap);
        // Build items with profile data
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

    // Fetch listing details for each request
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

    // Gather all user IDs we need profiles for
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
        .select('id, full_name, email, student_id, college')
        .in('id', missingProfileIds);
      if (pData) {
        const newMap = { ...profilesMap };
        for (const p of pData) {
          newMap[p.id] = {
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            studentId: p.student_id || '',
            college: p.college || '',
          };
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
        setAuthLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        (async () => {
          const profile = await fetchUserProfile(session.user.id);
          if (!mounted) return;
          if (profile) {
            setUser(profile);
            fetchRequests(session.user.id);
          }
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(listingsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  // Fetch listings when user logs in
  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user?.id]);

  async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id, college')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      studentId: data.student_id || '',
      college: data.college || '',
    };
  }

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    studentId: string,
    college: string,
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
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
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return { error: 'Connection error. Please check your internet and try again.' };
        }
        return { error: error.message };
      }

      // If user exists but no session, email confirmation is required
      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      // If we have a session, update profile with student_id and college
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ student_id: studentId, college })
          .eq('id', data.user.id);
      }

      return { error: null };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        return { error: 'Connection error. Please check your internet and try again.' };
      }
      return { error: 'An unexpected error occurred during signup. Please try again.' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Distinguish network errors from invalid credentials
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        ) {
          return { error: 'Connection error. Please check your internet and try again.' };
        }
        return { error: 'Wrong email or password.' };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          setUser(profile);
          fetchRequests(data.user.id);
        }
      }

      return { error: null };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        return { error: 'Connection error. Please check your internet and try again.' };
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
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    const userId = user.id;

    // Delete the user's listings (will cascade to rent_requests)
    await supabase.from('listings').delete().eq('owner_id', userId);

    // Delete requests where user is requester
    await supabase.from('rent_requests').delete().eq('requester_id', userId);

    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId);

    // Sign out
    await supabase.auth.signOut();
    setUser(null);
    setItems([]);
    setRequests([]);
    setProfilesMap({});
    setSelectedItemId(null);

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

    // Upload image to Supabase Storage if provided
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

    // Realtime will handle the update, but also refresh manually
    fetchListings();

    return { error: null };
  }, [user, fetchListings]);

  const deleteListing = useCallback(async (itemId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Not logged in.' };

    // Check for active/pending requests
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

    // Get the listing to find image path for storage cleanup
    const { data: listing } = await supabase
      .from('listings')
      .select('image_url')
      .eq('id', itemId)
      .maybeSingle();

    // Delete from database
    const { error } = await supabase.from('listings').delete().eq('id', itemId);

    if (error) {
      return { success: false, message: `Failed to delete: ${error.message}` };
    }

    // Try to delete image from storage if it's our bucket
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

    // Check item availability before creating the request
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

    // Fetch the request to get listing_id
    const { data: req, error: fetchErr } = await supabase
      .from('rent_requests')
      .select('id, listing_id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !req) {
      return { error: 'Request not found.' };
    }

    // If accepting, check the item is still available (prevent double rental)
    if (status === 'accepted') {
      const { data: listing } = await supabase
        .from('listings')
        .select('availability')
        .eq('id', req.listing_id)
        .maybeSingle();

      if (listing?.availability !== 'available') {
        return { error: 'This item is currently unavailable.' };
      }
    }

    // Update the request status
    const { error } = await supabase
      .from('rent_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      return { error: `Failed to update request: ${error.message}` };
    }

    // Update listing availability based on the new status
    if (status === 'accepted') {
      await supabase
        .from('listings')
        .update({ availability: 'unavailable' })
        .eq('id', req.listing_id);
    } else if (status === 'completed' || status === 'rejected') {
      await supabase
        .from('listings')
        .update({ availability: 'available' })
        .eq('id', req.listing_id);
    }

    fetchRequests(user.id);
    fetchListings();

    return { error: null };
  }, [user, fetchRequests, fetchListings]);

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

    // Set listing back to available
    await supabase
      .from('listings')
      .update({ availability: 'available' })
      .eq('id', req.listing_id);

    fetchRequests(user.id);
    fetchListings();

    return { error: null };
  }, [user, fetchRequests, fetchListings]);

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
