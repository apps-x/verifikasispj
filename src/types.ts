export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface SPJDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  uploadedBy: string;
  uploaderName: string;
  status: DocumentStatus;
  feedback?: string;
  verifiedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}
