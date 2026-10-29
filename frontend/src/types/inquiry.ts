export type UserType = 'Parent' | 'Student' | 'School';
export type Category = 'Scholarship' | 'Concert' | 'Admission' | 'General Query';
export type InquiryStatus = 'New' | 'In Progress' | 'Resolved';

export interface Inquiry {
  id: string;
  user_type: UserType;
  category: Category;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface InquiryStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InquiryFilters {
  category: string;
  userType: string;
  status: string;
  search: string;
  page: number;
  limit: number;
  sort: string;
  order: string;
}
