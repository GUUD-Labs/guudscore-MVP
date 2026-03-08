// Connection social links
export interface ConnectionSocial {
  platform: string;
  url: string;
  username?: string;
}

// Main connection interface
export interface Connection {
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  photoUrl: string | null;
  social: ConnectionSocial[];
  connectionId: string;
}

// Pagination interface
export interface ConnectionsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Connections data structure
export interface ConnectionsData {
  connections: Connection[];
  pagination: ConnectionsPagination;
}

// API response structure
export interface ConnectionsResponse {
  data: ConnectionsData;
  success: boolean;
  message: string;
  count: number;
}

// Query parameters for connections endpoint
export interface ConnectionsParams {
  page?: number;
  limit?: number;
}

// Connection request body
export interface ConnectionRequestBody {
  receiverId: string;
}

// Sent connection request interface
export interface SentConnectionRequest {
  id: string;
  name: string;
  email: string;
  slug: string | null;
  photoUrl: string | null;
  connectionId: string;
}

// Sent requests data structure
export interface SentRequestsData {
  sentRequests: SentConnectionRequest[];
  pagination: ConnectionsPagination;
}

// Sent requests API response
export interface SentRequestsResponse {
  data: SentRequestsData;
  success: boolean;
  message: string;
  count: number;
}

// Incoming connection request interface
export interface IncomingConnectionRequest {
  id: string;
  name: string;
  email: string;
  slug: string | null;
  photoUrl: string | null;
  connectionId: string;
  social: ConnectionSocial[];
}

// Incoming requests data structure
export interface IncomingRequestsData {
  incomingRequests: IncomingConnectionRequest[];
  pagination: ConnectionsPagination;
  count?: number;
}

// Incoming requests API response
export interface IncomingRequestsResponse {
  data: IncomingRequestsData;
  success: boolean;
  message: string;
  count: number;
}

// Simple API response for create/delete operations
export interface ConnectionApiResponse {
  success: boolean;
  message: string;
  count: number;
}
