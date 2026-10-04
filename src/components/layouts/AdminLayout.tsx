// src/components/layouts/AdminLayout.tsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import axiosClient from "@/lib/axiosClient";
import {
  LayoutDashboard,
  Users,
  School,
  Radio,
  Video,
  Activity,
  LogOut,
  ShieldAlert,
  Cpu,
  Database,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/v1/auth/logout");
    } catch {
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#182352] flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
          <ShieldAlert className="text-rose-400" size={24} />
          <span className="font-black text-lg text-white tracking-wider">
            ADMIN PORTAL
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={18} /> Tổng Quan
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Users size={18} /> Quản lý Người Dùng
          </NavLink>

          <NavLink
            to="/admin/classrooms"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <School size={18} /> Quản lý Lớp Học
          </NavLink>

          <NavLink
            to="/admin/video-moderation"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-rose-500/20 text-rose-300 shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Video size={18} /> Duyệt Video Bài Giảng
          </NavLink>

          <NavLink
            to="/admin/resource-library"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Database size={18} /> Kho Học Liệu Chung
          </NavLink>

          <NavLink
            to="/admin/ai-monitoring"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-amber-500/20 text-amber-400 shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-amber-400"
              }`
            }
          >
            <Cpu size={18} /> Giám sát AI & Chi phí
          </NavLink>

          <NavLink
            to="/admin/broadcast"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Radio size={18} /> Phát Thông Báo
          </NavLink>

          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Activity size={18} /> Lịch Sử Hệ Thống
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
          <div className="truncate">
            <p className="font-bold text-sm text-white truncate">
              {user?.lastName} {user?.firstName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
