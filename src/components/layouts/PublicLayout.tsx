import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const isStaff = user.roles.some(
      (r) => r === "ROLE_TEACHER" || r === "ROLE_ADMIN",
    );
    return (
      <Navigate
        to={isStaff ? "/teacher/classrooms" : "/student/courses"}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
