// src/features/admin/pages/ClassroomManagementPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/features/admin/api/adminApi";
import type { ClassroomResponse } from "@/features/admin/types";
import {
  Loader2,
  Plus,
  School,
  X,
  ChevronRight,
  Video,
  AlertTriangle,
} from "lucide-react";

export default function ClassroomManagementPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassroomResponse[]>([]);
  const [pendingVideoCount, setPendingVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal Tạo Lớp
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const initialClassForm = {
    name: "",
    level: "B1",
    description: "",
    maxStudents: 30,
  };
  const [classForm, setClassForm] = useState(initialClassForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, videosRes] = await Promise.all([
        adminApi.getClassrooms(0, 100),
        adminApi.getPendingVideos().catch(() => []),
      ]);
      setClasses(classRes.content);
      setPendingVideoCount(videosRes?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.createClassroom(classForm);
      setIsCreateModalOpen(false);
      setClassForm(initialClassForm);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi tạo lớp");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* BANNER CẢNH BÁO CÓ VIDEO CẦN DUYỆT (Chỉ hiện khi đếm được > 0) */}
      {pendingVideoCount > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top">
          <div className="flex items-center gap-4">
            <div className="bg-rose-600 text-white p-3.5 rounded-xl shadow-md animate-pulse">
              <Video size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-600" />
                Cảnh báo: Có {pendingVideoCount} Video đang chờ duyệt!
              </h3>
              <p className="text-sm text-rose-700 font-medium mt-1">
                Giáo viên đã tải video bài giảng lên. Bạn cần phê duyệt để học
                viên có thể xem được.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER QUẢN LÝ LỚP */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Quản lý Lớp Học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bấm vào từng lớp để cấu hình, gán Giảng viên hoặc Ghi danh.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Khởi tạo Lớp Mới
        </button>
      </div>

      {/* GRID LỚP HỌC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => navigate(`/admin/classrooms/${cls.id}`)}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full relative transition cursor-pointer hover:border-indigo-400 hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <School size={24} />
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase border ${getStatusStyle(cls.status)}`}
              >
                {cls.status}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
              {cls.name}
            </h3>
            <p className="text-xs text-slate-500 mb-5 line-clamp-2">
              {cls.description || "Chưa có mô tả"}
            </p>

            <div className="space-y-3 mt-auto border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-semibold">
                  Giảng viên:
                </span>
                <span className="font-bold text-slate-800">
                  {cls.teacherName || "Chưa gán"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-semibold">Sĩ số:</span>
                <span className="font-bold text-slate-800">
                  {cls.currentStudentsCount} / {cls.maxStudents || "∞"}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end text-xs font-bold text-indigo-600">
              Truy cập quản trị <ChevronRight size={14} className="ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* MODAL TẠO LỚP HỌC */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">
                Tạo Lớp Học Mới
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Lớp (Bắt buộc)
                </label>
                <input
                  required
                  type="text"
                  value={classForm.name}
                  onChange={(e) =>
                    setClassForm({ ...classForm, name: e.target.value })
                  }
                  className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-600 text-sm font-bold text-slate-900"
                  placeholder="VD: IELTS Intensive K01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp độ đào tạo
                  </label>
                  <select
                    value={classForm.level}
                    onChange={(e) =>
                      setClassForm({ ...classForm, level: e.target.value })
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-600 text-sm font-bold text-slate-900"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="IELTS_PREP">IELTS PREP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sĩ số tối đa
                  </label>
                  <input
                    type="number"
                    value={classForm.maxStudents}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        maxStudents: Number(e.target.value),
                      })
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-600 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}{" "}
                  Khởi tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
