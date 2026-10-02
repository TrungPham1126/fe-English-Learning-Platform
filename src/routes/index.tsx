// src/routes/index.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import TeacherLayout from "@/components/layouts/TeacherLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";

// Phân hệ Auth
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

// Phân hệ Student
import StudentCoursesPage from "@/features/student/pages/StudentCoursesPage";
import ClassLessonsPage from "@/features/student/pages/ClassLessonsPage";
import ClassAssignmentsPage from "@/features/student/pages/ClassAssignmentsPage";
import LessonDetailPage from "@/features/student/pages/LessonDetailPage";
import AssignmentTakePage from "@/features/student/pages/AssignmentTakePage";
import StudentFlashcardsPage from "@/features/student/pages/StudentFlashcardsPage";
import StudentProfilePage from "@/features/student/pages/StudentProfilePage";
import SpeakingAiEvaluationPage from "@/features/student/pages/SpeakingAiEvaluationPage";

import DailyHomeworkPage from "@/features/student/pages/DailyHomeworkPage";
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
      // Dùng đường dẫn tuyệt đối /student/courses để chống lặp URL
      { index: true, element: <Navigate to="/student/courses" replace /> },
      { path: "courses", element: <StudentCoursesPage /> },
      { path: "courses/:classId/lessons", element: <ClassLessonsPage /> },
      {
        path: "courses/:classId/assignments",
        element: <ClassAssignmentsPage />,
      },
      { path: "lessons/:lessonId", element: <LessonDetailPage /> },
      {
        path: "assignments/:assignmentId/take",
        element: <AssignmentTakePage />,
      },

      // Hỗ trợ cả 3 dạng URL xem kết quả chấm bài AI
      { path: "submissions", element: <SpeakingAiEvaluationPage /> },
      { path: "submissions/:attemptId", element: <SpeakingAiEvaluationPage /> },
      {
        path: "assignments/:assignmentId/submissions/:attemptId",
        element: <SpeakingAiEvaluationPage />,
      },
      {
        path: "courses/:classId/daily-plan",
        element: <DailyHomeworkPage />,
      },
      { path: "flashcards", element: <StudentFlashcardsPage /> },
      { path: "profile", element: <StudentProfilePage /> },

      // Fallback tuyệt đối nếu gõ sai route bên trong /student
      { path: "*", element: <Navigate to="/student/courses" replace /> },
    ],
  },

  // 3. Phân hệ Teacher & Admin
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

  // 4. Trang thông báo lỗi và Điều hướng mặc định toàn app
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
