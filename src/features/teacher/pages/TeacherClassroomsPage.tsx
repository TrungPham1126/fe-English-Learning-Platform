import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { teacherApi } from "../api/teacherApi";
import type { ClassroomItem } from "../api/teacherApi";
import { BookOpen } from "lucide-react";

export default function TeacherClassroomsPage() {
  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res: any = await teacherApi.getAssignedClasses();
      setClasses(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách lớp học:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Đang tải danh sách lớp học...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lớp học phụ trách</h1>
          <p className="text-sm text-slate-400">
            Quản lý học sinh, giao bài tập và theo dõi tiến độ học tập
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          Bạn chưa được phân công phụ trách lớp học nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700 hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                    {cls.level}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cls.status === "OPEN"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {cls.status}
                  </span>
                </div>

                {/* Bấm vào tên lớp để vào trang chi tiết bài giảng & video */}
                <Link
                  to={`/teacher/classrooms/${cls.id}`}
                  className="block text-lg font-bold text-white hover:text-indigo-400 transition"
                >
                  {cls.name}
                </Link>

                <p className="line-clamp-2 text-sm text-slate-400">
                  {cls.description || "Chưa có mô tả lớp học."}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-4">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Sĩ số</span>
                  <span className="font-semibold text-white">
                    {cls.currentStudentsCount} / {cls.maxStudents} học viên
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/teacher/classrooms/${cls.id}/students`}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-slate-700"
                    >
                      Học sinh & Điểm
                    </Link>
                    <Link
                      to={`/teacher/classrooms/${cls.id}/plans`}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-indigo-500"
                    >
                      Giao bài tập
                    </Link>
                  </div>

                  <Link
                    to={`/teacher/classrooms/${cls.id}`}
                    className="flex items-center justify-center space-x-1.5 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Bài giảng & Video</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}