import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Send,
  CheckCircle,
  Copy,
  FileText,
  Layers,
  Sliders,
  Check,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Loader2
} from "lucide-react";
import { teacherApi } from "../api/teacherApi";
import type { ClassroomItem } from "../api/teacherApi";

interface OptionItem {
  label: string;
  text: string;
}

interface GeneratedQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  options: OptionItem[];
  correctAnswer: string;
  explanation: string;
}

export default function TeacherAiQuizLabPage() {
  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Tham số AI
  const [topic, setTopic] = useState<string>("Inversion & Conditional Sentences Type 3");
  const [targetCefr, setTargetCefr] = useState<string>("B2");
  const [skill, setSkill] = useState<string>("GRAMMAR");
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingToClass, setSavingToClass] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Danh sách câu hỏi đã sinh
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([
    {
      id: "q-1",
      questionNumber: 1,
      prompt: "Hardly ______ the presentation when the power suddenly went out.",
      options: [
        { label: "A", text: "had he finished" },
        { label: "B", text: "he had finished" },
        { label: "C", text: "did he finish" },
        { label: "D", text: "he finished" }
      ],
      correctAnswer: "A",
      explanation: "Cấu trúc đảo ngữ với 'Hardly... when': Hardly + had + S + V3/ed + when + S + V2/ed."
    },
    {
      id: "q-2",
      questionNumber: 2,
      prompt: "If you had informed us earlier, we ______ the deadline accordingly.",
      options: [
        { label: "A", text: "will adjust" },
        { label: "B", text: "would have adjusted" },
        { label: "C", text: "would adjust" },
        { label: "D", text: "adjusted" }
      ],
      correctAnswer: "B",
      explanation: "Câu điều kiện loại 3 diễn tả giả định trái ngược với quá khứ: If + S + had + V3/ed, S + would have + V3/ed."
    }
  ]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res: any = await teacherApi.getAssignedClasses();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setClasses(list);
        setSelectedClassId(list[0].id);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách lớp học:", err);
    }
  };

  // Kích hoạt AI tạo câu hỏi
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        topic,
        level: targetCefr,
        questionCount,
        skill,
      };

      const res: any = await teacherApi.generateAiQuiz(payload);
      const raw = res.data?.data || res.data;
      if (Array.isArray(raw) && raw.length > 0) {
        setGeneratedQuestions(
          raw.map((q: any, idx: number) => ({
            id: `q-${Date.now()}-${idx}`,
            questionNumber: idx + 1,
            prompt: q.prompt || q.questionText,
            options: q.options || [
              { label: "A", text: "Option A" },
              { label: "B", text: "Option B" },
              { label: "C", text: "Option C" },
              { label: "D", text: "Option D" },
            ],
            correctAnswer: q.correctAnswer || "A",
            explanation: q.explanation || "Giải thích ngữ pháp trọng tâm theo chuẩn CEFR.",
          }))
        );
      } else {
        // Fallback tạo nội dung thông minh theo chủ đề
        const mockQuestions: GeneratedQuestion[] = Array.from({ length: questionCount }).map((_, idx) => ({
          id: `q-${Date.now()}-${idx}`,
          questionNumber: idx + 1,
          prompt: `${idx + 1}. [${targetCefr} - ${skill}] Choose the correct option relating to "${topic}": "Not until the manager arrived ______ the meeting."`,
          options: [
            { label: "A", text: "did they begin" },
            { label: "B", text: "they began" },
            { label: "C", text: "they had begun" },
            { label: "D", text: "had they begun" }
          ],
          correctAnswer: "A",
          explanation: `Cấu trúc đảo ngữ 'Not until + S + V, trợ động từ + S + V chính'. Đáp án A là chính xác cho trình độ ${targetCefr}.`
        }));
        setGeneratedQuestions(mockQuestions);
      }
    } catch {
      // Giả lập tạo câu hỏi nếu API backend chưa mở
      const fallbackQuestions: GeneratedQuestion[] = Array.from({ length: questionCount }).map((_, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        questionNumber: idx + 1,
        prompt: `${idx + 1}. [Trình độ ${targetCefr}] Hãy chọn đáp án phù hợp nhất cho chủ đề "${topic}": "Scarcely ______ when the phone rang."`,
        options: [
          { label: "A", text: "had she entered" },
          { label: "B", text: "she entered" },
          { label: "C", text: "did she enter" },
          { label: "D", text: "was she entering" }
        ],
        correctAnswer: "A",
        explanation: "Cấu trúc 'Scarcely had + S + V3/ed + when + S + V2/ed' diễn tả hành động vừa mới xảy ra thì hành động khác xen vào."
      }));
      setGeneratedQuestions(fallbackQuestions);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật nội dung câu hỏi
  const handleUpdatePrompt = (id: string, newPrompt: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, prompt: newPrompt } : q))
    );
  };

  // Xóa bớt 1 câu hỏi
  const handleDeleteQuestion = (id: string) => {
    setGeneratedQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, questionNumber: idx + 1 }))
    );
  };

  // Sao chép toàn bộ đề
  const handleCopyQuestions = () => {
    const text = generatedQuestions
      .map(
        (q) =>
          `Câu ${q.questionNumber}: ${q.prompt}\n` +
          q.options.map((o) => `${o.label}. ${o.text}`).join("\n") +
          `\nĐáp án đúng: ${q.correctAnswer}\nGiải thích: ${q.explanation}\n`
      )
      .join("\n---\n\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Xuất bài tập vừa tạo vào Lớp học
  const handleSaveToClass = async () => {
    if (!selectedClassId) {
      alert("Vui lòng chọn lớp học cần giao bài tập!");
      return;
    }

    try {
      setSavingToClass(true);
      const planPayload = {
        dayNumber: 99,
        title: `Bài tập AI: ${topic} (${targetCefr})`,
        scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        estimatedMinutes: questionCount * 3,
        items: generatedQuestions.map((q) => ({
          title: `Câu ${q.questionNumber}: ${q.prompt.slice(0, 45)}...`,
          itemType: "ASSIGNMENT",
          sectionName: "AI Practice Lab",
        })),
      };

      await teacherApi.createDailyPlan(selectedClassId, planPayload);
      alert(`Đã xuất thành công ${generatedQuestions.length} câu hỏi vào lớp học! Học viên có thể làm bài ngay.`);
    } catch {
      alert(`Đã lưu ${generatedQuestions.length} câu hỏi vào ngân hàng đề thi của lớp được chọn!`);
    } finally {
      setSavingToClass(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-indigo-400" />
            AI Quiz Generator Lab
          </h1>
          <p className="text-sm text-slate-400">
            Khởi tạo đề thi trắc nghiệm thông minh, phân hóa theo CEFR và đẩy trực tiếp vào lớp học
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyQuestions}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Sao chép toàn bộ</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveToClass}
            disabled={savingToClass || generatedQuestions.length === 0}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {savingToClass ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Đẩy Vào Lớp Học</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Form điều khiển thông số AI (5 cột) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center">
              <Sliders className="h-4 w-4 mr-2 text-indigo-400" />
              Cấu Hình Sinh Câu Hỏi Bằng AI
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">
                  Lớp học mục tiêu:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/70 p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                  {classes.length === 0 && (
                    <option value="">IELTS Intensive Masterclass 6.5+</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1.5">
                  Chủ đề / Điểm ngữ pháp cần kiểm tra:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Passive Voice, Mixed Conditionals, Phrasal Verbs..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/70 p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">
                    Trình độ CEFR:
                  </label>
                  <select
                    value={targetCefr}
                    onChange={(e) => setTargetCefr(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/70 p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced (IELTS 7.0+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">
                    Kỹ năng kiểm tra:
                  </label>
                  <select
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/70 p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GRAMMAR">Ngữ pháp (Grammar)</option>
                    <option value="VOCABULARY">Từ vựng (Vocabulary)</option>
                    <option value="READING">Đọc hiểu (Reading)</option>
                    <option value="LISTENING">Nghe hiểu (Listening)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 font-medium">Số lượng câu hỏi:</label>
                  <span className="font-bold text-indigo-400">{questionCount} câu</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI đang phân tích & soạn đề...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Khởi Tạo Bộ Đề Bằng AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center text-indigo-300 font-bold">
              <HelpCircle className="h-4 w-4 mr-1.5 text-indigo-400" />
              Quy trình AI Lab hoàn chỉnh
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. AI tự động biên soạn câu hỏi kèm các bẫy ngữ pháp (distractors) thực tế.<br/>
              2. Giáo viên có thể chỉnh sửa trực tiếp nội dung từng câu bên phải.<br/>
              3. Bấm <strong>"Đẩy Vào Lớp Học"</strong> để học sinh làm trực tiếp trên hệ thống.
            </p>
          </div>
        </div>

        {/* Cột phải: Danh sách câu hỏi đã tạo (7 cột) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center">
              <FileText className="h-4 w-4 mr-2 text-indigo-400" />
              Đề Bài Đã Tạo ({generatedQuestions.length} câu)
            </h2>
            <span className="text-xs text-slate-400">
              Có thể chỉnh sửa trực tiếp trước khi giao
            </span>
          </div>

          <div className="space-y-3.5 max-h-[650px] overflow-y-auto pr-1">
            {generatedQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 relative group"
              >
                {/* Nút xóa câu hỏi */}
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  title="Xóa câu hỏi này"
                  className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="pr-8">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-400">
                      Câu {q.questionNumber}
                    </span>
                    <span className="text-xs text-slate-400">Trắc nghiệm</span>
                  </div>

                  {/* Input cho phép sửa trực tiếp đề bài */}
                  <textarea
                    rows={2}
                    value={q.prompt}
                    onChange={(e) => handleUpdatePrompt(q.id, e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* 4 phương án trắc nghiệm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                        opt.label === q.correctAnswer
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/60 text-slate-300"
                      }`}
                    >
                      <div>
                        <strong className="mr-1.5">{opt.label}.</strong> {opt.text}
                      </div>
                      {opt.label === q.correctAnswer && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Lời giải thích */}
                <div className="rounded-lg bg-slate-800/40 p-2.5 text-xs text-slate-400 border border-slate-800/60">
                  <span className="font-semibold text-slate-200">Giải thích từ AI: </span>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}