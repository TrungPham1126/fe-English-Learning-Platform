import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  Search,
  Filter,
  Award,
  Send,
  Eye
} from "lucide-react";

interface SubmissionItem {
  id: string;
  studentName: string;
  assignmentTitle: string;
  className: string;
  submittedAt: string;
  durationMinutes: number;
  status: "COMPLETED" | "GRADING" | "SUBMITTED";
  score: number | null;
  maxScore: number;
  studentAnswer: string;
  teacherFeedback: string;
}

export default function TeacherGradingPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    {
      id: "sub-01",
      studentName: "Nguyễn Văn An",
      assignmentTitle: "IELTS Writing Task 2 - Technology & Education",
      className: "IELTS Intensive Masterclass 6.5+",
      submittedAt: "04/10/2026 14:30",
      durationMinutes: 38,
      status: "GRADING",
      score: null,
      maxScore: 10,
      studentAnswer: "Modern advancements in artificial intelligence have brought significant transformations to education...",
      teacherFeedback: ""
    },
    {
      id: "sub-02",
      studentName: "Trần Thị Mai",
      assignmentTitle: "Grammar Exercise - Inversion with Negative Adverbials",
      className: "Tiếng Anh Giao Tiếp & Ngữ Pháp B1",
      submittedAt: "04/10/2026 11:15",
      durationMinutes: 20,
      status: "COMPLETED",
      score: 8.5,
      maxScore: 10,
      studentAnswer: "Seldom have I seen such a breathtaking performance before...",
      teacherFeedback: "Tốt, ngữ pháp chuẩn xác. Chú ý chia động từ ở câu 3."
    }
  ]);

  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(submissions[0]);
  const [inputScore, setInputScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setInputScore(sub.score !== null ? String(sub.score) : "");
    setFeedback(sub.teacherFeedback || "");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    const parsedScore = parseFloat(inputScore);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > selectedSub.maxScore) {
      alert(`Điểm số phải từ 0 đến ${selectedSub.maxScore}`);
      return;
    }

    const updated = submissions.map((item) => {
      if (item.id === selectedSub.id) {
        return {
          ...item,
          score: parsedScore,
          teacherFeedback: feedback,
          status: "COMPLETED" as const,
        };
      }
      return item;
    });

    setSubmissions(updated);
    setSelectedSub({
      ...selectedSub,
      score: parsedScore,
      teacherFeedback: feedback,
      status: "COMPLETED",
    });
    alert("Đã lưu điểm và nhận xét thành công!");
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Chấm Bài & Đánh Giá</h1>
        <p className="text-sm text-slate-400">
          Xem bài làm học sinh, thời gian làm bài, vào điểm và gửi phản hồi
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Danh sách bài nộp bên trái */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm học sinh, bài tập..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredSubmissions.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{sub.studentName}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{sub.assignmentTitle}</p>
                    </div>
                    {sub.status === "COMPLETED" ? (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                        {sub.score}/{sub.maxScore} điểm
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                        Chờ chấm
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Làm trong {sub.durationMinutes} phút
                    </span>
                    <span>{sub.submittedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Khung chấm điểm chi tiết bên phải */}
        <div className="lg:col-span-7">
          {selectedSub ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {selectedSub.className}
                  </span>
                  <span className="flex items-center text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Thời gian làm bài: {selectedSub.durationMinutes} phút
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{selectedSub.assignmentTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Học sinh: <strong className="text-slate-200">{selectedSub.studentName}</strong> • Nộp lúc: {selectedSub.submittedAt}
                </p>
              </div>

              {/* Nội dung bài làm */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center">
                  <Eye className="h-4 w-4 mr-1.5 text-indigo-400" />
                  Nội dung bài làm của học sinh:
                </label>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                  {selectedSub.studentAnswer}
                </div>
              </div>

              {/* Form chấm điểm & phản hồi */}
              <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center mb-1.5">
                    <Award className="h-4 w-4 mr-1.5 text-amber-400" />
                    Chấm điểm (Thang điểm 10):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={selectedSub.maxScore}
                    placeholder="Nhập số điểm (ví dụ: 8.5)..."
                    value={inputScore}
                    onChange={(e) => setInputScore(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Nhận xét & Hướng dẫn sửa lỗi cho học sinh:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lời nhận xét chi tiết, chỉ ra điểm mạnh và điểm cần cải thiện..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Lưu Kết Quả & Gửi Nhận Xét</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Chọn một bài nộp bên trái để xem nội dung và chấm điểm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}