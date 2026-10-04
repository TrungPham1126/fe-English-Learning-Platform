// src/features/admin/api/adminApi.ts
import { axiosClient } from "@/lib/axiosClient";
import type { ApiResponse, PageResponse, UserSummaryDto } from "@/types/api";
import type {
  UserCreateByAdminRequest,
  UserUpdateRequest,
  ClassroomResponse,
  CreateClassroomRequest,
  NotificationBroadcastRequest,
  AdminDashboardStats,
  AuditLogDto,
} from "../types";

export const adminApi = {
  // --- USERS ---
  getUsers: async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<UserSummaryDto>> => {
    const res = await axiosClient.get<
      ApiResponse<PageResponse<UserSummaryDto>>
    >(`/api/v1/admin/users?page=${page}&size=${size}`);
    return res.data.data;
  },
  createUser: async (
    data: UserCreateByAdminRequest,
  ): Promise<UserSummaryDto> => {
    const res = await axiosClient.post<ApiResponse<UserSummaryDto>>(
      "/api/v1/admin/users",
      data,
    );
    return res.data.data;
  },
  updateUser: async (
    id: string,
    data: UserUpdateRequest,
  ): Promise<UserSummaryDto> => {
    const res = await axiosClient.put<ApiResponse<UserSummaryDto>>(
      `/api/v1/admin/users/${id}`,
      data,
    );
    return res.data.data;
  },
  toggleUserStatus: async (id: string, active: boolean): Promise<void> => {
    await axiosClient.patch(
      `/api/v1/admin/users/${id}/status?active=${active}`,
    );
  },
  deleteUser: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/v1/admin/users/${id}`);
  },

  // --- CLASSROOMS ---
  getClassrooms: async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<ClassroomResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<PageResponse<ClassroomResponse>>
    >(`/api/admin/classrooms?page=${page}&size=${size}`);
    return res.data.data;
  },
  createClassroom: async (
    data: CreateClassroomRequest,
  ): Promise<ClassroomResponse> => {
    const res = await axiosClient.post<ApiResponse<ClassroomResponse>>(
      "/api/admin/classrooms",
      data,
    );
    return res.data.data;
  },
  updateClassStatus: async (
    id: string,
    status: string,
  ): Promise<ClassroomResponse> => {
    const res = await axiosClient.put<ApiResponse<ClassroomResponse>>(
      `/api/admin/classrooms/${id}/status`,
      { status },
    );
    return res.data.data;
  },
  assignTeacher: async (
    id: string,
    teacherId: string,
  ): Promise<ClassroomResponse> => {
    const res = await axiosClient.put<ApiResponse<ClassroomResponse>>(
      `/api/admin/classrooms/${id}/assign-teacher`,
      { teacherId },
    );
    return res.data.data;
  },
  enrollStudent: async (
    id: string,
    studentIdentifier: string,
  ): Promise<void> => {
    await axiosClient.post(`/api/admin/classrooms/${id}/enroll`, {
      studentIdentifier,
    });
  },

  // --- NOTIFICATIONS ---
  broadcastNotification: async (
    data: NotificationBroadcastRequest,
  ): Promise<void> => {
    await axiosClient.post("/api/v1/notifications/broadcast", data);
  },

  // --- VIDEO MODERATION ---
  getPendingVideos: async (): Promise<any[]> => {
    const res = await axiosClient.get(`/api/v1/videos?status=PENDING_REVIEW`);
    return res.data.data;
  },
  reviewVideo: async (
    id: string,
    approved: boolean,
    reason?: string,
  ): Promise<void> => {
    await axiosClient.patch(
      `/api/v1/videos/${id}/review?approved=${approved}&reason=${reason || ""}`,
    );
  },

  // --- DASHBOARD ---
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const res = await axiosClient.get<ApiResponse<AdminDashboardStats>>(
      "/api/v1/admin/dashboard/stats",
    );
    return res.data.data;
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (
    page = 0,
    size = 50,
  ): Promise<PageResponse<AuditLogDto>> => {
    const res = await axiosClient.get<ApiResponse<PageResponse<AuditLogDto>>>(
      `/api/v1/admin/audit-logs?page=${page}&size=${size}`,
    );
    return res.data.data;
  },

  // --- CURRICULUM (LESSON MANAGEMENT) ---
  getLessonsByClass: async (classId: string): Promise<any[]> => {
    const res = await axiosClient.get(
      `/api/curriculum/classes/${classId}/lessons`,
    );
    return res.data.data || [];
  },
  createLesson: async (data: {
    classId: string;
    title: string;
    objectives: string;
    content: string;
    orderIndex: number;
  }): Promise<any> => {
    const res = await axiosClient.post("/api/curriculum/lessons", data);
    return res.data.data;
  },
  deleteLesson: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/curriculum/lessons/${id}`);
  },
  getLessonDetail: async (lessonId: string): Promise<any> => {
    const res = await axiosClient.get(`/api/curriculum/lessons/${lessonId}`);
    return res.data.data;
  },
  getVideoByLesson: async (lessonId: string): Promise<any> => {
    const res = await axiosClient.get(`/api/v1/videos/lesson/${lessonId}`);
    return res.data.data;
  },

  // ==========================================
  // --- AI COST & TOKEN MONITORING ---
  // ==========================================
  getAiUsageStats: async (): Promise<any> => {
    const res = await axiosClient.get("/api/v1/admin/ai-monitoring/stats");
    return res.data.data;
  },
  getAiUserQuotas: async (): Promise<any[]> => {
    const res = await axiosClient.get("/api/v1/admin/ai-monitoring/quotas");
    return res.data.data;
  },
  updateUserAiQuota: async (
    studentId: string,
    dailyLimit: number,
    isBlocked: boolean,
  ): Promise<void> => {
    await axiosClient.put(`/api/v1/admin/ai-monitoring/quotas/${studentId}`, {
      dailyLimit,
      isBlocked,
    });
  },

  // ==========================================
  // --- GLOBAL RESOURCE LIBRARY ---
  // ==========================================
  getGlobalResources: async (type: string): Promise<any[]> => {
    const res = await axiosClient.get(`/api/v1/admin/resources?type=${type}`);
    return res.data.data;
  },
  uploadGlobalResource: async (formData: FormData): Promise<void> => {
    await axiosClient.post("/api/v1/admin/resources/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteGlobalResource: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/v1/admin/resources/${id}`);
  },
};
