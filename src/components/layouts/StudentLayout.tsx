// src/components/layouts/StudentLayout.tsx
import { useState, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosClient } from "@/lib/axiosClient";
import {
  BookOpen,
  Headphones,
  PieChart,
  Bell,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Award,
  UserCheck,
  LogOut,
  ShieldCheck,
  Check,
  Video,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}

// 1. Component Dropdown Hồ sơ học viên
function StudentProfileMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<string>("0.0");
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      axiosClient
        .get("/api/student/classrooms/my-courses")
        .then((res: any) => {
          const list = res.data?.data || res.data || [];
          setCourseCount(Array.isArray(list) ? list.length : 0);
        })
        .catch(() => {});

      axiosClient
        .get("/api/v1/analytics/my-profile")
        .then((res: any) => {
          const p = res.data?.data || res.data;
          if (p) {
            const sum =
              (p.listeningScore || 0) +
              (p.speakingScore || 0) +
              (p.readingScore || 0) +
              (p.writingScore || 0) +
              (p.grammarScore || 0) +
              (p.vocabularyScore || 0);
            setTotalScore(sum.toFixed(1));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/v1/auth/logout");
    } catch {
      // Ignore
    } finally {
      logout();
      navigate("/login");
    }
  };

  const displayName = user ? `${user.lastName} ${user.firstName}` : "Học viên";
  const avatarFallback = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-white transition hover:bg-white/10 focus:outline-none cursor-pointer"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-indigo-600 font-bold text-xs shadow-inner">
          {user?.avatarUrl && !imgError ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            avatarFallback
          )}
        </div>
        <span className="text-xs font-semibold text-white/90 max-w-[130px] truncate">
          {displayName}
        </span>
        {isOpen ? (
          <ChevronUp size={14} className="text-white/70" />
        ) : (
          <ChevronDown size={14} className="text-white/70" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 border border-indigo-200 text-lg font-black text-indigo-700">
              {user?.avatarUrl && !imgError ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                avatarFallback
              )}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-slate-800 truncate">
                {displayName}
              </h4>
              <p className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <Mail size={12} /> {user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  <ShieldCheck size={11} />{" "}
                  {user?.roles?.[0]?.replace("ROLE_", "") || "STUDENT"}
                </span>
              </div>
            </div>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" />
                Khóa học tham gia:
              </span>
              <span className="font-bold text-slate-800">
                {courseCount} lớp
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" />
                Tổng điểm tích lũy:
              </span>
              <span className="font-bold text-amber-600">{totalScore} pts</span>
            </div>

            {user?.phone && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  Số điện thoại:
                </span>
                <span className="font-medium text-slate-700">{user.phone}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/student/profile");
              }}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <UserCheck size={13} /> Trang cá nhân
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Component Chuông Thông báo
function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axiosClient
      .get("/api/v1/notifications?page=0&size=10")
      .then((res: any) => {
        const list = res.data?.data?.content || res.data?.content || [];
        if (Array.isArray(list)) {
          setNotifications(list);
          setUnreadCount(
            list.filter((n: NotificationItem) => !n.isRead).length,
          );
        }
      })
      .catch(() => {});

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async (e: ReactMouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.patch("/api/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white transition focus:outline-none cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-[#182352]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <h4 className="font-bold text-slate-800 text-xs">Thông Báo Mới</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline cursor-pointer"
              >
                <Check size={12} /> Đã đọc hết
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">
                Không có thông báo nào.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg p-2 text-xs transition ${
                    n.isRead
                      ? "bg-transparent text-slate-500"
                      : "bg-indigo-50/70 font-semibold text-slate-800"
                  }`}
                >
                  <p className="font-bold text-slate-900">{n.title}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Layout Chính Của Học Viên
export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-[#182352] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 select-none cursor-pointer">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-black text-lg text-white shadow-inner">
              E
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider leading-none text-white">
                ENGLISH
              </span>
              <span className="text-[9px] tracking-widest text-indigo-300 font-semibold">
                PLATFORM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 h-16">
            <NavLink
              to="/student/courses"
              className={({ isActive }) =>
                `flex items-center gap-2 h-full px-4 text-xs font-bold transition-all border-b-4 ${
                  isActive
                    ? "text-white border-amber-400 bg-white/5"
                    : "text-slate-300 border-transparent hover:text-white hover:bg-white/5"
                }`
              }
            >
              <BookOpen size={16} className="text-amber-400" />
              <span>Khóa Học Của Tôi</span>
            </NavLink>

            <NavLink
              to="/student/flashcards"
              className={({ isActive }) =>
                `flex items-center gap-2 h-full px-4 text-xs font-bold transition-all border-b-4 ${
                  isActive
                    ? "text-white border-amber-400 bg-white/5"
                    : "text-slate-300 border-transparent hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Headphones size={16} className="text-sky-400" />
              <span>Ôn Tập Flashcards</span>
            </NavLink>

            <NavLink
              to="/student/submissions"
              className={({ isActive }) =>
                `flex items-center gap-2 h-full px-4 text-xs font-bold transition-all border-b-4 ${
                  isActive
                    ? "text-white border-amber-400 bg-white/5"
                    : "text-slate-300 border-transparent hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Video size={16} className="text-rose-400" />
              <span>Submission &amp; AI</span>
            </NavLink>

            <NavLink
              to="/student/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 h-full px-4 text-xs font-bold transition-all border-b-4 ${
                  isActive
                    ? "text-white border-amber-400 bg-white/5"
                    : "text-slate-300 border-transparent hover:text-white hover:bg-white/5"
                }`
              }
            >
              <PieChart size={16} className="text-emerald-400" />
              <span>Hồ Sơ Năng Lực</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="h-5 w-px bg-white/20" />
          <StudentProfileMenu />
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
