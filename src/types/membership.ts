export interface MembershipData {
  uniqueId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipName: string;
  endDate: string;
  location: string;
  sessionsLeft: number;
  itemId: string;
  orderDate: string;
  soldBy: string;
  membershipId: string;
  frozen: string;
  paid: string;
  status: 'Active' | 'Expired';
  // User annotation fields
  comments?: string;
  notes?: string;
  tags?: string[];
  noteDate?: string;
  // Enhanced additional fields
  startDate?: string;
  totalSessions?: number;
  phone?: string;
  address?: string;
  // Enhanced persistence and tracking fields
  persistenceKey?: string;
  uniqueIdentifier?: string;
  dataSource?: string;
  lastSync?: string;
}

export interface MemberAnnotation {
  memberId: string;
  email: string;
  comments: string;
  notes: string;
  tags: string;
  noteDate: string;
  lastUpdated: string;
  persistenceKey: string;
}

export interface FilterOptions {
  status: string[];
  locations: string[];
  membershipTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sessionsRange: {
    min: number;
    max: number;
  };
  // Enhanced filtering options
  membershipUsage: string[];
  groupBy: string;
  daysLapsed: {
    min: number;
    max: number;
  };
  paymentStatus: string[];
  joinedDateRange: {
    start: string;
    end: string;
  };
}