// src/features/admin/types.ts

// --- USER MANAGEMENT ---
export interface UserCreateByAdminRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[]; // VD: ["ROLE_STUDENT", "ROLE_TEACHER"]
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  isActive?: boolean;
  roles: string[];
}

// --- CLASSROOM MANAGEMENT ---
export interface ClassroomResponse {
  id: string;
  name: string;
  description?: string;
  level: string;
  status: string;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  currentStudentsCount: number;
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
}

export interface CreateClassroomRequest {
  name: string;
  description?: string;
  level: string;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  teacherId?: string;
}

// --- NOTIFICATION ---
export interface NotificationBroadcastRequest {
  title: string;
  message: string;
  notificationType: string;
  redirectUrl?: string;
}
// src/features/admin/types.ts
// ... (Giữ nguyên các DTO cũ)

// --- DASHBOARD STATS ---
export interface AdminDashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalLessons: number;
  totalVideos: number;
  pendingVideos: number;
  totalAssignments: number;
}

// --- AUDIT LOGS ---
export interface AuditLogDto {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityName: string;
  entityId: string;
  ipAddress: string;
  metadataJson: string;
  createdAt: string;
}
