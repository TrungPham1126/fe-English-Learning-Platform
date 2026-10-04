import axiosClient from "@/lib/axiosClient";

export interface ClassroomItem {
  id: string;
  name: string;
  description: string;
  level: string;
  status: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  currentStudentsCount: number;
}

export interface StudentProgressItem {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  enrolledAt: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  averageScore: number;
  weaknesses?: string[];
}

export interface LessonItem {
  id: string;
  orderIndex: number;
  title: string;
  objectives?: string;
  videoUrl?: string;
  hasVideo?: boolean;
  documentsCount?: number;
}

export const teacherApi = {
  // =================================================================
  // 1. Quản lý lớp học & Dashboard
  // =================================================================
  getAssignedClasses: () =>
    axiosClient.get<{ data: ClassroomItem[] }>("/api/teacher/classrooms"),

  getClassDetail: (classId: string) =>
    axiosClient.get(`/api/admin/classrooms/${classId}`),

  getTeacherDashboardStats: () =>
    axiosClient.get("/api/teacher/dashboard/stats"),

  // =================================================================
  // 2. Danh sách học sinh, Tiến độ & Điểm yếu
  // =================================================================
  getClassStudents: (classId: string) =>
    axiosClient.get<{ data: any[] }>(`/api/admin/classrooms/${classId}/students`),

  getStudentProgressDetail: (classId: string, studentId: string) =>
    axiosClient.get(`/api/teacher/classrooms/${classId}/students/${studentId}/progress`),

  // =================================================================
  // 3. Quản lý bài giảng (Lessons), Upload Video & Upload Tài liệu
  // =================================================================
  getClassLessons: (classId: string) =>
    axiosClient.get<{ data: LessonItem[] }>(`/api/admin/classrooms/${classId}/lessons`),

  createLesson: (classId: string, data: { title: string; objectives: string; orderIndex?: number }) =>
    axiosClient.post(`/api/admin/classrooms/${classId}/lessons`, data),

  uploadLessonDocument: (lessonId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post(`/api/curriculum/lessons/${lessonId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadLessonVideo: (lessonId: string, videoFile: File) => {
    const formData = new FormData();
    formData.append("video", videoFile);
    return axiosClient.post(`/api/curriculum/lessons/${lessonId}/video`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // =================================================================
  // 4. Lộ trình học hàng ngày & Kho tài liệu chung (Global Resources)
  // =================================================================
  createDailyPlan: (classId: string, data: any) =>
    axiosClient.post(`/api/curriculum/daily-plans/class/${classId}`, data),

  getDailyPlans: (classId: string) =>
    axiosClient.get(`/api/curriculum/daily-plans/class/${classId}`),

  getGlobalResources: () =>
    axiosClient.get<{ data: any[] }>("/api/curriculum/resources/global"),

  uploadDocument: (formData: FormData) =>
    axiosClient.post("/api/curriculum/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // =================================================================
  // 5. Chấm bài, Xem bài nộp, Điểm số & Thời gian làm bài
  // =================================================================
  getSubmissionsForGrading: () =>
    axiosClient.get<{ data: any[] }>("/api/teacher/grading/submissions"),

  getSubmissionDetail: (submissionId: string) =>
    axiosClient.get(`/api/teacher/grading/submissions/${submissionId}`),

  gradeSubmission: (submissionId: string, data: { score: number; feedback: string }) =>
    axiosClient.post(`/api/teacher/grading/submissions/${submissionId}`, data),

  // =================================================================
  // 6. AI Lab & Đề xuất bài tập thông minh
  // =================================================================
  generateAiQuiz: (data: { topic: string; level: string; questionCount: number; skill?: string }) =>
    axiosClient.post("/api/ai/lab/generate-quiz", data),

  getAiSkillRecommendations: (classId: string) =>
    axiosClient.get(`/api/ai/recommendations/class/${classId}`),

  // =================================================================
  // 7. Thông báo lớp học (Announcements)
  // =================================================================
  createClassAnnouncement: (classId: string, data: { title: string; content: string }) =>
    axiosClient.post(`/api/teacher/classrooms/${classId}/announcements`, data),

  getClassAnnouncements: (classId: string) =>
    axiosClient.get(`/api/teacher/classrooms/${classId}/announcements`),

  sendNotification: (data: { classId: string; title: string; content: string }) =>
    axiosClient.post("/api/notifications/broadcast", data),
};