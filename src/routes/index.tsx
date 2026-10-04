// src/routes/index.tsx
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Layouts
import AdminLessonDetailPage from "@/features/admin/pages/AdminLessonDetailPage";
import PublicLayout from "@/components/layouts/PublicLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import TeacherLayout from "@/components/layouts/TeacherLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ClassroomDetailPage from "@/features/admin/pages/ClassroomDetailPage";

// Phân hệ Auth
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

// Phân hệ Admin
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";
import UserManagementPage from "@/features/admin/pages/UserManagementPage";
import ClassroomManagementPage from "@/features/admin/pages/ClassroomManagementPage";
import SystemBroadcastPage from "@/features/admin/pages/SystemBroadcastPage";
import AuditLogPage from "@/features/admin/pages/AuditLogPage";
import AiMonitoringPage from "@/features/admin/pages/AiMonitoringPage";
import ResourceLibraryPage from "@/features/admin/pages/ResourceLibraryPage";

// Phân hệ Student
import StudentCoursesPage from "@/features/student/pages/StudentCoursesPage";
import ClassLessonsPage from "@/features/student/pages/ClassLessonsPage";
import LessonDetailPage from "@/features/student/pages/LessonDetailPage";
import AssignmentTakePage from "@/features/student/pages/AssignmentTakePage";
import StudentFlashcardsPage from "@/features/student/pages/StudentFlashcardsPage";
import StudentProfilePage from "@/features/student/pages/StudentProfilePage";
import SpeakingAiEvaluationPage from "@/features/student/pages/SpeakingAiEvaluationPage";
import DailyHomeworkPage from "@/features/student/pages/DailyHomeworkPage";

// Component chuyển hướng tự động sang Daily Plan nếu có ai truy cập URL bài tập lớp cũ
const RedirectToDailyPlan = () => {
  const { classId } = useParams<{ classId: string }>();
  return <Navigate to={`/student/courses/${classId}/daily-plan`} replace />;
};

// Component giữ chỗ cho phân hệ Teacher
const TeacherPendingView = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-300">
    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
    <p className="text-sm text-slate-400 max-w-md">
      Khu vực này thuộc phân hệ Giảng viên / Quản trị viên và đang được phụ
      trách phát triển bởi thành viên khác trong nhóm.
    </p>
  </div>
);

const routes: RouteObject[] = [
  // 1. Phân hệ Public (Đăng nhập, Đăng ký)
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // 2. Phân hệ Student (Chỉ ROLE_STUDENT truy cập)
  {
    path: "/student",
    element: (
      <ProtectedRoute allowedRoles={["ROLE_STUDENT"]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/student/courses" replace /> },
      { path: "courses", element: <StudentCoursesPage /> },
      { path: "courses/:classId/lessons", element: <ClassLessonsPage /> },
      {
        path: "courses/:classId/assignments",
        element: <RedirectToDailyPlan />,
      },
      {
        path: "courses/:classId/daily-plan",
        element: <DailyHomeworkPage />,
      },
      { path: "lessons/:lessonId", element: <LessonDetailPage /> },
      {
        path: "assignments/:assignmentId/take",
        element: <AssignmentTakePage />,
      },
      { path: "submissions", element: <SpeakingAiEvaluationPage /> },
      { path: "submissions/:attemptId", element: <SpeakingAiEvaluationPage /> },
      {
        path: "assignments/:assignmentId/submissions/:attemptId",
        element: <SpeakingAiEvaluationPage />,
      },
      { path: "flashcards", element: <StudentFlashcardsPage /> },
      { path: "profile", element: <StudentProfilePage /> },
      { path: "*", element: <Navigate to="/student/courses" replace /> },
    ],
  },

  // 3. Phân hệ Admin (Chỉ ROLE_ADMIN truy cập)
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "users", element: <UserManagementPage /> },
      { path: "classrooms", element: <ClassroomManagementPage /> },
      { path: "classrooms/:classId", element: <ClassroomDetailPage /> },
      { path: "lessons/:lessonId", element: <AdminLessonDetailPage /> },

      { path: "ai-monitoring", element: <AiMonitoringPage /> },
      { path: "resource-library", element: <ResourceLibraryPage /> },
      { path: "broadcast", element: <SystemBroadcastPage /> },
      { path: "audit-logs", element: <AuditLogPage /> },
      { path: "*", element: <Navigate to="/admin/dashboard" replace /> },
    ],
  },

  // 4. Phân hệ Teacher
  {
    path: "/teacher",
    element: (
      <ProtectedRoute allowedRoles={["ROLE_TEACHER", "ROLE_ADMIN"]}>
        <TeacherLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/teacher/classrooms" replace /> },
      {
        path: "classrooms",
        element: <TeacherPendingView title="Quản Lý Lớp Học" />,
      },
      {
        path: "grading",
        element: <TeacherPendingView title="Chấm Bài & Đánh Giá" />,
      },
      {
        path: "ai-lab",
        element: <TeacherPendingView title="AI Quiz Generator Lab" />,
      },
      { path: "*", element: <Navigate to="/teacher/classrooms" replace /> },
    ],
  },

  // 5. Trang thông báo lỗi và Điều hướng mặc định toàn app
  {
    path: "/unauthorized",
    element: (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-rose-600 mb-2">
            403 - Quyền Truy Cập Bị Từ Chối
          </h2>
          <p className="text-sm text-slate-500">
            Tài khoản hiện tại không có quyền truy cập vào phân hệ này.
          </p>
        </div>
      </div>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
];

export const router = createBrowserRouter(routes);
