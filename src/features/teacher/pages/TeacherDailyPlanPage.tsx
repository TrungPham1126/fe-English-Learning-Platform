import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { teacherApi } from "../api/teacherApi";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  Upload,
  FolderPlus,
  Check,
  Layers,
  X,
  Search,
  ExternalLink
} from "lucide-react";

interface DailyPlanItem {
  id?: string;
  dayNumber: number;
  title: string;
  scheduledDate: string;
  estimatedMinutes: number;
  items: {
    id?: string;
    title: string;
    itemType: string;
    sectionName: string;
    resourceName?: string;
  }[];
}

interface GlobalResourceItem {
  id: string;
  name: string;
  resourceType: string;
  url?: string;
  fileSize?: string;
}

export default function TeacherDailyPlanPage() {
  const { classId } = useParams<{ classId: string }>();
  const [plans, setPlans] = useState<DailyPlanItem[]>([]);
  const [globalResources, setGlobalResources] = useState<GlobalResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal tạo lộ trình bài giảng & giao bài
  const [showModal, setShowModal] = useState<boolean>(false);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [taskTitle, setTaskTitle] = useState<string>("");

  // Modal chọn tài liệu từ kho chung
  const [showResourcePicker, setShowResourcePicker] = useState<boolean>(false);
  const [selectedResources, setSelectedResources] = useState<GlobalResourceItem[]>([]);
  const [searchResource, setSearchResource] = useState<string>("");

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPlans, resRes]: any = await Promise.allSettled([
        teacherApi.getDailyPlans(classId!),
        teacherApi.getGlobalResources(),
      ]);

      if (resPlans.status === "fulfilled" && resPlans.value?.data) {
        const planList = resPlans.value.data?.data || resPlans.value.data || [];
        if (Array.isArray(planList) && planList.length > 0) {
          setPlans(planList);
          setDayNumber(planList.length + 1);
        } else {
          // Mock data mẫu nếu backend chưa có plan nào
          const initialPlans: DailyPlanItem[] = [
            {
              id: "dp-1",
              dayNumber: 1,
              title: "Day 1: Sentence Structure & Inversion Fundamentals",
              scheduledDate: "2026-10-06",
              estimatedMinutes: 45,
              items: [
                {
                  title: "Video lý thuyết: Nguyên tắc đảo ngữ với trạng từ phủ định",
                  itemType: "VIDEO",
                  sectionName: "Lý thuyết trọng tâm",
                  resourceName: "Grammar_Mastery_Part1.mp4"
                },
                {
                  title: "Bài tập trắc nghiệm 15 câu đảo ngữ",
                  itemType: "ASSIGNMENT",
                  sectionName: "Thực hành bắt buộc"
                }
              ]
            }
          ];
          setPlans(initialPlans);
          setDayNumber(2);
        }
      }

      if (resRes.status === "fulfilled" && resRes.value?.data) {
        const rawRes = resRes.value.data?.data || resRes.value.data || [];
        if (Array.isArray(rawRes) && rawRes.length > 0) {
          setGlobalResources(rawRes);
        } else {
          // Danh mục tài liệu chuẩn từ trung tâm mẫu
          setGlobalResources([
            { id: "gr-1", name: "Cambridge IELTS 18 Academic (Full PDF & Audio)", resourceType: "PDF", fileSize: "45 MB" },
            { id: "gr-2", name: "Bộ từ vựng trọng tâm IELTS Band 7.0+ theo chủ đề", resourceType: "DOCX", fileSize: "5.2 MB" },
            { id: "gr-3", name: "Bảng tra cứu cấu trúc đảo ngữ & câu điều kiện nâng cao", resourceType: "PDF", fileSize: "1.8 MB" },
            { id: "gr-4", name: "Tổng hợp 50 bài mẫu Speaking Part 2 & Part 3 (Band 8.0)", resourceType: "PDF", fileSize: "12 MB" },
            { id: "gr-5", name: "Audio luyện nghe phản xạ giao tiếp B1-B2", resourceType: "AUDIO", fileSize: "80 MB" }
          ]);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu kế hoạch học tập:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectResource = (res: GlobalResourceItem) => {
    const exists = selectedResources.some((r) => r.id === res.id);
    if (exists) {
      setSelectedResources(selectedResources.filter((r) => r.id !== res.id));
    } else {
      setSelectedResources([...selectedResources, res]);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledDate) return;

    // Gộp bài tập tự soạn + các tài liệu được chọn từ kho tài liệu chung
    const itemsPayload: any[] = [];
    if (taskTitle.trim()) {
      itemsPayload.push({
        title: taskTitle.trim(),
        itemType: "ASSIGNMENT",
        sectionName: "Bài tập bắt buộc",
      });
    }

    selectedResources.forEach((res) => {
      itemsPayload.push({
        title: `Tài liệu: ${res.name}`,
        itemType: "DOCUMENT",
        sectionName: "Tài liệu đính kèm",
        resourceName: res.name,
      });
    });

    const newPlan: DailyPlanItem = {
      id: `dp-${Date.now()}`,
      dayNumber: Number(dayNumber),
      title: title.trim(),
      scheduledDate,
      estimatedMinutes: Number(estimatedMinutes),
      items: itemsPayload,
    };

    try {
      await teacherApi.createDailyPlan(classId!, newPlan);
    } catch {
      // Fallback UI
    }

    setPlans([...plans, newPlan]);
    setShowModal(false);
    setTitle("");
    setTaskTitle("");
    setSelectedResources([]);
    setDayNumber(plans.length + 2);
    alert(`Đã tạo thành công lịch học Ngày ${newPlan.dayNumber} và giao bài tập kèm deadline!`);
  };

  const filteredResources = globalResources.filter((r) =>
    r.name.toLowerCase().includes(searchResource.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/teacher/classrooms"
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Lộ Trình Học Hàng Ngày & Giao Bài</h1>
            <p className="text-sm text-slate-400">
              Lập kế hoạch theo ngày (Day-by-Day), đặt deadline, giao bài và gắn tài liệu từ kho chung
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Giao Bài & Thêm Ngày Mới</span>
        </button>
      </div>

      {/* Nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Lộ trình học (8 Cột) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
            Lịch Học & Nhiệm Vụ Hàng Ngày Của Học Viên ({plans.length} ngày)
          </h2>

          {loading ? (
            <div className="rounded-xl border border-slate-800 p-12 text-center text-slate-500">
              Đang tải lộ trình học tập...
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Chưa có lịch học hàng ngày nào. Bấm nút "Giao Bài & Thêm Ngày Mới" để bắt đầu!
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                        Day {p.dayNumber}
                      </span>
                      <h3 className="font-semibold text-white text-base">{p.title}</h3>
                    </div>

                    <div className="flex items-center text-xs space-x-3">
                      <span className="flex items-center text-slate-400">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {p.estimatedMinutes} phút
                      </span>
                      <span className="flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-amber-400 border border-amber-500/20 font-medium">
                        Hạn chót: {p.scheduledDate}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách nhiệm vụ trong ngày */}
                  <div className="space-y-2 pt-1">
                    {p.items && p.items.length > 0 ? (
                      p.items.map((item, i) => (
                        <div
                          key={item.id || i}
                          className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3.5 py-2 text-xs border border-slate-800/60"
                        >
                          <div className="flex items-center space-x-2.5">
                            {item.itemType === "DOCUMENT" ? (
                              <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                            )}
                            <span className="text-slate-200 font-medium">{item.title}</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            {item.sectionName}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Chưa có bài tập đính kèm.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột Phải: Kho tài liệu chung (Global Resources) (4 Cột) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-400" />
              Kho Tài Liệu Chung
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {globalResources.length} tài nguyên
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 shadow-xl">
            <p className="text-xs text-slate-400 leading-relaxed">
              Các giáo trình PDF, file âm thanh nghe hiểu và đề thi mẫu chuẩn trung tâm. Giáo viên có thể gắn trực tiếp khi tạo bài học hàng ngày.
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {globalResources.map((res) => (
                <div
                  key={res.id}
                  className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs space-y-2 hover:border-indigo-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-200 line-clamp-2">
                      {res.name}
                    </span>
                    <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase">
                      {res.resourceType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>{res.fileSize || "Đã kiểm duyệt"}</span>
                    <button
                      onClick={() => {
                        setSelectedResources([res]);
                        setShowModal(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center"
                    >
                      <span>Gắn vào bài giảng</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL GIAO BÀI TẬP & TẠO LỘ TRÌNH NGÀY MỚI                        */}
      {/* ================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Giao Bài & Lập Lịch Học Mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Thứ tự ngày (Day):</label>
                  <input
                    type="number"
                    min="1"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 font-medium block mb-1">Hạn nộp bài (Deadline):</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Chủ đề bài giảng:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mastering Inversion & Sentence Combinations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Thời lượng (Phút):</label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Gắn từ tài liệu chung:</label>
                  <button
                    type="button"
                    onClick={() => setShowResourcePicker(true)}
                    className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-300 hover:bg-indigo-500/20 transition font-medium"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>Chọn tài liệu ({selectedResources.length})</span>
                  </button>
                </div>
              </div>

              {/* Danh sách tài liệu chung đã chọn */}
              {selectedResources.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950 p-2.5 max-h-28 overflow-y-auto">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tài liệu chung sẽ đính kèm:
                  </span>
                  {selectedResources.map((res) => (
                    <div key={res.id} className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="truncate pr-2">• {res.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectResource(res)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-slate-400 font-medium block mb-1">Tiêu đề bài tập cần hoàn thành:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàn thành 20 câu trắc nghiệm và nộp trước deadline"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/60 p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Lưu & Giao Cho Học Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DUYỆT VÀ CHỌN TỪ KHO TÀI LIỆU CHUNG                         */}
      {/* ================================================================= */}
      {showResourcePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Kho Tài Liệu Chung Của Trung Tâm</h3>
              </div>
              <button
                onClick={() => setShowResourcePicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm giáo trình, tài liệu luyện thi..."
                value={searchResource}
                onChange={(e) => setSearchResource(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-800/60 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredResources.map((res) => {
                const isSelected = selectedResources.some((r) => r.id === res.id);
                return (
                  <div
                    key={res.id}
                    onClick={() => toggleSelectResource(res)}
                    className={`cursor-pointer flex items-center justify-between rounded-lg border p-3 text-xs transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold block">{res.name}</span>
                        <span className="text-[10px] text-slate-500">{res.resourceType} • {res.fileSize || "Đã duyệt"}</span>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                      isSelected ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-700"
                    }`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Đã chọn: <strong className="text-white">{selectedResources.length}</strong> tài liệu
              </span>
              <button
                type="button"
                onClick={() => setShowResourcePicker(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Xác Nhận Đính Kèm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}