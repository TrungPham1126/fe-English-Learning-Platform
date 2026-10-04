import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Award,
  Clock,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

export default function TeacherDashboardPage() {
  // Dữ liệu thống kê tổng quan
  const stats = [
    {
      label: "Lớp học phụ trách",
      value: "2",
      subText: "Đang hoạt động",
      icon: BookOpen,
      color: "from-blue-500/20 to-indigo-500/20",
      textColor: "text-blue-400",
      border: "border-blue-500/30",
    },
    {
      label: "Tổng học viên",
      value: "45",
      subText: "+4 học viên mới tuần này",
      icon: Users,
      color: "from-emerald-500/20 to-teal-500/20",
      textColor: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    {
      label: "Bài chờ chấm",
      value: "7",
      subText: "3 bài sắp quá hạn 24h",
      icon: FileCheck,
      color: "from-amber-500/20 to-orange-500/20",
      textColor: "text-amber-400",
      border: "border-amber-500/30",
      actionLink: "/teacher/grading",
    },
    {
      label: "Tỷ lệ hoàn thành TB",
      value: "78.4%",
      subText: "Tăng 5.2% so với tuần trước",
      icon: TrendingUp,
      color: "from-purple-500/20 to-pink-500/20",
      textColor: "text-purple-400",
      border: "border-purple-500/30",
    },
  ];

  // Thống kê sức học & điểm yếu theo kỹ năng toàn bộ học viên
  const skillAnalysis = [
    { skill: "Listening (Nghe)", score: 7.2, status: "Tốt", barColor: "bg-emerald-500" },
    { skill: "Reading (Đọc)", score: 6.8, status: "Khá", barColor: "bg-blue-500" },
    { skill: "Writing (Viết)", score: 5.6, status: "Cần cải thiện (Task 2 Coherence)", barColor: "bg-amber-500" },
    { skill: "Speaking (Nói)", score: 5.4, status: "Điểm yếu lớn (Pronunciation & Fluency)", barColor: "bg-rose-500" },
  ];

  // Danh sách các hoạt động cần xử lý ngay
  const pendingTasks = [
    {
      id: "pt-1",
      title: "Chấm bài Writing Task 2 của Nguyễn Văn An",
      className: "IELTS Intensive Masterclass 6.5+",
      due: "2 giờ nữa",
      type: "GRADING",
    },
    {
      id: "pt-2",
      title: "Duyệt bộ đề AI Generated: Inversion Grammar",
      className: "Tiếng Anh Giao Tiếp B1",
      due: "Hôm nay",
      type: "AI_REVIEW",
    },
    {
      id: "pt-3",
      title: "Đặt lịch học Day 12 & Giao bài củng cố",
      className: "IELTS Intensive Masterclass 6.5+",
      due: "Ngày mai",
      type: "SCHEDULE",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ELP Educator Portal • Fall 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Chào mừng trở lại, Giảng viên!
          </h1>
          <p className="max-w-2xl text-xs md:text-sm text-slate-400">
            Tổng hợp dữ liệu học tập, tiến độ làm bài và đề xuất phân tích điểm yếu học viên từ trợ lý AI.
          </p>
        </div>
      </div>

      {/* Grid thống kê 4 ô */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl border bg-slate-900/60 p-5 backdrop-blur-sm transition hover:border-slate-700 ${item.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{item.label}</span>
                <div className={`rounded-lg p-2.5 bg-gradient-to-br ${item.color}`}>
                  <Icon className={`h-5 w-5 ${item.textColor}`} />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-2xl font-black text-white">{item.value}</span>
                <p className="mt-1 text-xs text-slate-500">{item.subText}</p>
              </div>

              {item.actionLink && (
                <Link
                  to={item.actionLink}
                  className="mt-3 flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Chấm bài ngay</span>
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Biểu đồ phân tích kỹ năng & Việc cần làm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Phân tích kỹ năng & Điểm yếu của học viên */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <Award className="h-5 w-5 mr-2 text-indigo-400" />
                Thống Kê Điểm Năng Lực & Điểm Yếu Học Viên
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Điểm trung bình theo 4 kỹ năng được phân tích tự động
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {skillAnalysis.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{s.skill}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-[11px]">{s.status}</span>
                    <span className="font-bold text-indigo-400 bg-slate-800 px-2 py-0.5 rounded">
                      {s.score} / 10
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-2">
                  <div
                    className={`${s.barColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${(s.score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-slate-300 flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-300 block mb-0.5">
                Khuyến nghị từ trợ lý AI cho giáo viên:
              </span>
              Học viên đang gặp trở ngại lớn nhất ở kỹ năng Nói (Speaking Fluency) và Viết (Coherence). Hãy sử dụng công cụ **AI Quiz Lab** để sinh thêm các bài tập nối câu và phát âm bổ trợ.
            </div>
          </div>
        </div>

        {/* Cột Phải: Nhiệm vụ cần xử lý ngay */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-indigo-400" />
              Công Việc Cần Xử Lý
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Nhiệm vụ ưu tiên trong ngày</p>
          </div>

          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-slate-800/80 bg-slate-800/40 p-3.5 space-y-1.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{task.title}</span>
                  <span className="text-amber-400 font-medium text-[11px]">{task.due}</span>
                </div>
                <p className="text-[11px] text-slate-400">{task.className}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/teacher/classrooms"
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              <span>Vào Danh Sách Lớp Học</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}