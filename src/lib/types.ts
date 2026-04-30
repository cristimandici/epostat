export type AdCondition = 'nou' | 'ca-nou' | 'buna-stare' | 'uzura-normala' | 'necesita-reparatii';
export type AdStatus = 'activ' | 'vandut' | 'expirat' | 'draft';
export type OfferStatus = 'asteptare' | 'acceptata' | 'refuzata' | 'contraoferta';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  adsCount: number;
  memberSince: string;
  verified: boolean;
  phone?: string;
  email?: string;
}

export interface Ad {
  id: string;
  title: string;
  price: number;
  negotiable: boolean;
  category: string;
  subcategory?: string;
  condition: AdCondition;
  description: string;
  images: string[];
  location: string;
  city: string;
  postedAt: string;
  views: number;
  favorites: number;
  status: AdStatus;
  seller: User;
  specs?: Record<string, string>;
  urgent?: boolean;
}

export interface OfferEvent {
  id: string;
  type: 'oferta' | 'contraoferta' | 'acceptata' | 'refuzata';
  amount?: number;
  message?: string;
  byUser: 'buyer' | 'seller';
  timestamp: string;
}

export interface Offer {
  id: string;
  adId: string;
  adTitle: string;
  adImage: string;
  buyerId: string;
  sellerId: string;
  currentAmount: number;
  originalPrice: number;
  status: OfferStatus;
  expiresAt?: string;
  history: OfferEvent[];
  createdAt: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  adId: string;
  adTitle: string;
  adImage: string;
  otherUser: User;
  messages: Message[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}
