// src/features/admin/pages/AdminDashboardPage.tsx
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/api/adminApi";
import type { AdminDashboardStats } from "@/features/admin/types";
import {
  Loader2,
  Users,
  School,
  BookOpen,
  Video,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Lỗi lấy thống kê", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  if (!stats)
    return (
      <div className="p-10 text-center text-rose-500 font-bold">
        Không thể tải dữ liệu thống kê (API có thể chưa sẵn sàng).
      </div>
    );

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Giáo viên",
      value: stats.totalTeachers,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Học viên",
      value: stats.totalStudents,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Lớp học",
      value: stats.totalClasses,
      icon: School,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Bài giảng",
      value: stats.totalLessons,
      icon: BookOpen,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Tổng Video",
      value: stats.totalVideos,
      icon: Video,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Video chờ duyệt",
      value: stats.pendingVideos,
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Bài tập",
      value: stats.totalAssignments,
      icon: FileText,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800">
          Tổng Quan Hệ Thống (Dashboard)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thống kê nhanh số liệu toàn hệ thống.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4"
            >
              <div className={`p-4 rounded-xl ${s.bg} ${s.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {s.label}
                </p>
                <p className="text-3xl font-black text-slate-800 mt-1">
                  {s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
