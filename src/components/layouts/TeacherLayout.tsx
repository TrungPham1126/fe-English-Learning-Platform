import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Sparkles,
  LogOut
} from "lucide-react";
import axiosClient from "@/lib/axiosClient";

export default function TeacherLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/v1/auth/logout");
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      logout();
      navigate("/login");
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-lg text-indigo-400">
            ELP Educator Hub
          </div>
          <nav className="p-4 space-y-1">
            <NavLink to="/teacher/dashboard" className={navLinkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/teacher/classrooms" className={navLinkClass}>
              <BookOpen size={18} /> Classrooms
            </NavLink>
            <NavLink to="/teacher/grading" className={navLinkClass}>
              <CheckSquare size={18} /> Submissions
            </NavLink>
            <NavLink to="/teacher/ai-lab" className={navLinkClass}>
              <Sparkles size={18} /> AI Quiz Lab
            </NavLink>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-slate-200">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-400">Teacher Account</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
        <Outlet />
      </main>
    </div>
  );
}