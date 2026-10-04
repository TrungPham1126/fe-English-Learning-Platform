// src/features/admin/pages/AiMonitoringPage.tsx
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/api/adminApi";
import {
  Cpu,
  DollarSign,
  Activity,
  ShieldAlert,
  Loader2,
  Ban,
  CheckCircle2,
} from "lucide-react";

export default function AiMonitoringPage() {
  const [stats, setStats] = useState<any>(null);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, quotasRes] = await Promise.all([
        adminApi.getAiUsageStats(),
        adminApi.getAiUserQuotas(),
      ]);
      setStats(statsRes);
      setQuotas(quotasRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateQuota = async (
    studentId: string,
    currentLimit: number,
    currentBlocked: boolean,
  ) => {
    const newLimit = window.prompt(
      "Nhập giới hạn số lần gọi AI / ngày cho học viên này:",
      currentLimit.toString(),
    );
    if (newLimit === null) return;

    setIsProcessing(true);
    try {
      await adminApi.updateUserAiQuota(
        studentId,
        Number(newLimit),
        currentBlocked,
      );
      alert("Cập nhật giới hạn thành công!");
      fetchData();
    } catch (err) {
      alert("Lỗi cập nhật API");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBlock = async (
    studentId: string,
    currentLimit: number,
    currentBlocked: boolean,
  ) => {
    if (
      !window.confirm(
        `Bạn muốn ${currentBlocked ? "MỞ KHÓA" : "CHẶN"} quyền dùng AI của học viên này?`,
      )
    )
      return;
    setIsProcessing(true);
    try {
      await adminApi.updateUserAiQuota(
        studentId,
        currentLimit,
        !currentBlocked,
      );
      fetchData();
    } catch (err) {
      alert("Lỗi cập nhật API");
    } finally {
      setIsProcessing(false);
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
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Cpu size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Giám Sát Chi Phí & Hiệu Suất AI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý ngân sách API (OpenAI, Groq) và chống lạm dụng hệ thống từ
            học viên.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase mb-2">
            <DollarSign size={16} /> Ước tính chi phí (Tháng)
          </div>
          <div className="text-3xl font-black text-rose-600">
            ${stats?.estimatedCostUsd?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase mb-2">
            <Activity size={16} /> Tổng Token Tiêu thụ
          </div>
          <div className="text-3xl font-black text-indigo-600">
            {(stats?.totalTokens || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase mb-2">
            <Cpu size={16} /> User đang dùng AI
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {stats?.activeUsers || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase mb-2">
            <ShieldAlert size={16} /> User Bị Chặn (Spam)
          </div>
          <div className="text-3xl font-black text-amber-500">
            {stats?.blockedUsers || 0}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-black uppercase text-slate-800">
            Kiểm soát lạm dụng AI (Rate Limit / Ngày)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs uppercase tracking-wider text-slate-500 font-black border-b border-slate-200">
                <th className="p-4">Tài khoản (Email)</th>
                <th className="p-4 text-center">Đã dùng hôm nay</th>
                <th className="p-4 text-center">Giới hạn / Ngày</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {quotas.map((q) => {
                const isWarning = q.dailyUsed >= q.dailyLimit;
                return (
                  <tr
                    key={q.studentId}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="p-4 font-bold text-indigo-700">{q.email}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`font-black ${isWarning ? "text-rose-600" : "text-slate-700"}`}
                      >
                        {q.dailyUsed} lần
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500">
                      {q.dailyLimit} lần
                    </td>
                    <td className="p-4 text-center">
                      {q.isBlocked ? (
                        <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase bg-rose-100 text-rose-700 border border-rose-200">
                          ĐANG BỊ CHẶN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                          BÌNH THƯỜNG
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        disabled={isProcessing}
                        onClick={() =>
                          handleUpdateQuota(
                            q.studentId,
                            q.dailyLimit,
                            q.isBlocked,
                          )
                        }
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg cursor-pointer transition"
                      >
                        Đổi Limit
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() =>
                          handleToggleBlock(
                            q.studentId,
                            q.dailyLimit,
                            q.isBlocked,
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${q.isBlocked ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}
                      >
                        {q.isBlocked ? (
                          <CheckCircle2 size={14} className="inline mr-1" />
                        ) : (
                          <Ban size={14} className="inline mr-1" />
                        )}
                        {q.isBlocked ? "Mở Khóa" : "Chặn AI"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
