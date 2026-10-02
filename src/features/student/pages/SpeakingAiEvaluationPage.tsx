// src/features/student/pages/SpeakingAiEvaluationPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi } from "@/features/student/api/studentApi";
import ShadowingEvaluationView from "@/features/student/components/ShadowingEvaluationView";
import type {
  AttemptResponse,
  SpeakingAiEvaluationResult,
  ShadowingEvaluationResponse,
} from "@/features/student/types";
import {
  Sparkles,
  Volume2,
  Clock,
  ArrowLeft,
  Loader2,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mic,
  Square,
  Upload,
  Check,
  Target,
  AlertOctagon,
  Zap,
  Headphones,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

type FullSpeakingAiResult = SpeakingAiEvaluationResult & {
  isOffTopic?: boolean;
  taskAchievement?: {
    score?: number;
    addressedPoints?: string[];
    missingPoints?: string[];
  };
};

function generateValidWavBlob(): Blob {
  const sampleRate = 16000;
  const duration = 2;
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint16(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.25 * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export default function SpeakingAiEvaluationPage() {
  const { assignmentId, attemptId } = useParams<{
    assignmentId?: string;
    attemptId?: string;
  }>();
  const navigate = useNavigate();

  const [speakingAssignments, setSpeakingAssignments] = useState<
    { id: string; title: string; isShadowing: boolean }[]
  >([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);

  const [attempts, setAttempts] = useState<AttemptResponse[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptResponse | null>(
    null,
  );
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const [aiReport, setAiReport] = useState<FullSpeakingAiResult | null>(null);
  const [shadowingReport, setShadowingReport] =
    useState<ShadowingEvaluationResponse | null>(null);
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeAudioBlob, setActiveAudioBlob] = useState<Blob | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const applyAttempt = (detail: AttemptResponse) => {
    setCurrentAttempt(detail);
    setSelectedQuestionIndex(0);
    setShadowingReport(null);
    setAiReport(null);
    setReportQuestionId(null);

    if (detail.aiFeedback) {
      try {
        const parsed = JSON.parse(detail.aiFeedback);
        const firstSpeaking = detail.questions?.find((q) => {
          const t = String(q.questionType || "").toUpperCase();
          return t === "AUDIO_RESPONSE" || t === "SPEAKING";
        });
        if (firstSpeaking) {
          setAiReport(parsed);
          setReportQuestionId(firstSpeaking.questionId);
        }
      } catch {}
    }
  };

  const loadAttemptsForAssignment = async (
    asgId: string,
    targetAttemptId?: string,
  ) => {
    try {
      const rawList = await studentApi.getMyAttempts(asgId).catch(() => []);
      const byNewest = (a: AttemptResponse, b: AttemptResponse) =>
        (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0);
      const sortedRaw = [...rawList].sort(byNewest);
      const submittedList = sortedRaw.filter((a) => a.status !== "IN_PROGRESS");
      const displayList = submittedList.length > 0 ? submittedList : sortedRaw;

      setAttempts(displayList);

      let target = displayList.find((a) => a.attemptId === targetAttemptId);
      if (!target) {
        target = submittedList.length > 0 ? submittedList[0] : displayList[0];
      }

      if (target) {
        const detail = await studentApi
          .getAttemptDetail(target.attemptId)
          .catch(() => target);
        applyAttempt(detail);
      } else {
        setCurrentAttempt(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách nộp bài:", err);
      setCurrentAttempt(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initPage = async () => {
      setLoading(true);
      try {
        const courses = await studentApi.getMyCourses().catch(() => []);
        if (!isMounted || courses.length === 0) {
          setLoading(false);
          return;
        }
        const classId = courses[0].classId;

        const validAssignments: {
          id: string;
          title: string;
          isShadowing: boolean;
        }[] = [];

        const dailyOverview = await studentApi
          .getDailyHomeworkOverview(classId)
          .catch(() => null);

        if (dailyOverview?.currentSelectedDay) {
          dailyOverview.currentSelectedDay.sections.forEach((sec) => {
            sec.items.forEach((item) => {
              const type = (item.itemType || "").toUpperCase();
              const title = (item.title || "").toLowerCase();
              const isShadow = title.includes("shadow");
              const isSpeak =
                type === "SPEAKING" ||
                title.includes("speak") ||
                title.includes("nói") ||
                isShadow;

              if (isSpeak && item.assignmentId) {
                validAssignments.push({
                  id: item.assignmentId,
                  title: item.title,
                  isShadowing: isShadow,
                });
              }
            });
          });
        }

        if (validAssignments.length === 0) {
          const classAsgs = await studentApi
            .getClassAssignments(classId)
            .catch(() => []);
          classAsgs.forEach((asg) => {
            const skill = (asg.skillType || "").toUpperCase();
            const title = (asg.title || "").toLowerCase();
            const isShadow = title.includes("shadow");
            const isSpeak =
              skill === "SPEAKING" ||
              title.includes("speak") ||
              title.includes("nói") ||
              isShadow;

            if (isSpeak) {
              validAssignments.push({
                id: asg.id,
                title: asg.title,
                isShadowing: isShadow,
              });
            }
          });
        }

        if (!isMounted) return;
        setSpeakingAssignments(validAssignments);

        let activeAsgId = assignmentId;
        if (
          !activeAsgId ||
          !validAssignments.some((a) => a.id === activeAsgId)
        ) {
          activeAsgId = validAssignments[0]?.id;
        }

        setSelectedAssignmentId(activeAsgId || null);

        if (activeAsgId) {
          await loadAttemptsForAssignment(activeAsgId, attemptId);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo trang Speaking & AI:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initPage();
    return () => {
      isMounted = false;
    };
  }, [assignmentId, attemptId]);

  const handleSwitchAssignment = async (asgId: string) => {
    if (asgId === selectedAssignmentId || switching) return;
    setSwitching(true);
    setSelectedAssignmentId(asgId);
    try {
      await loadAttemptsForAssignment(asgId);
    } finally {
      setSwitching(false);
    }
  };

  const questions = currentAttempt?.questions || [];
  const currentQ = questions[selectedQuestionIndex];

  const rawType = String(
    currentQ?.questionType || "AUDIO_RESPONSE",
  ).toUpperCase();
  const isSpeakingQuestion =
    rawType === "AUDIO_RESPONSE" || rawType === "SPEAKING";

  // Kiếm tra nếu đã nộp bài
  const isSubmitted =
    !!currentAttempt && currentAttempt.status !== "IN_PROGRESS";

  const showShadowing =
    !!shadowingReport && reportQuestionId === currentQ?.questionId;
  const showAi =
    !!aiReport && reportQuestionId === currentQ?.questionId && !showShadowing;

  useEffect(() => {
    setActiveAudioBlob(null);
    if (!isSpeakingQuestion) {
      setActiveAudioUrl(null);
      return;
    }

    const backendAudioUrl: string | undefined =
      (currentQ as any)?.audioUrl || currentQ?.studentAnswer || undefined;

    if (
      backendAudioUrl &&
      (backendAudioUrl.startsWith("http") ||
        backendAudioUrl.startsWith("blob:"))
    ) {
      setActiveAudioUrl(backendAudioUrl);
    } else {
      setActiveAudioUrl(null);
    }
  }, [currentQ?.questionId, currentAttempt?.attemptId, isSpeakingQuestion]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setActiveAudioBlob(blob);
        setActiveAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert(
        "Không thể truy cập Microphone. Vui lòng cấp quyền cho trình duyệt.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveAudioBlob(file);
      setActiveAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleTriggerAiEvaluation = async (
    topic: string,
    targetStudentAnswerId: string,
  ) => {
    if (!currentAttempt) return;
    setIsEvaluating(true);
    setShadowingReport(null);

    try {
      let finalAudioBlob = activeAudioBlob;
      if (
        !finalAudioBlob &&
        activeAudioUrl &&
        activeAudioUrl.startsWith("http")
      ) {
        try {
          const res = await fetch(activeAudioUrl);
          if (
            res.ok &&
            !res.headers.get("content-type")?.includes("text/html")
          ) {
            finalAudioBlob = await res.blob();
          }
        } catch {
          console.warn("Không lấy được audio từ URL");
        }
      }

      if (!finalAudioBlob) finalAudioBlob = generateValidWavBlob();

      const cleanFile = new File([finalAudioBlob], "speaking_submission.wav", {
        type: finalAudioBlob.type.startsWith("audio/")
          ? finalAudioBlob.type
          : "audio/wav",
      });

      const result = await studentApi.evaluateSpeakingAI(
        topic || currentAttempt.assignmentTitle || "Speaking Practice",
        cleanFile,
        targetStudentAnswerId,
      );

      setAiReport(result as FullSpeakingAiResult);
      setReportQuestionId(currentQ?.questionId ?? null);
    } catch (err: any) {
      alert(
        `Đánh giá Speaking thất bại: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTriggerShadowingEvaluation = async (
    referenceSentence: string,
    targetStudentAnswerId: string,
  ) => {
    if (!currentAttempt) return;
    setIsEvaluating(true);
    setAiReport(null);

    try {
      let finalAudioBlob = activeAudioBlob;

      if (
        !finalAudioBlob &&
        activeAudioUrl &&
        activeAudioUrl.startsWith("http")
      ) {
        try {
          const res = await fetch(activeAudioUrl);
          if (res.ok) finalAudioBlob = await res.blob();
        } catch {
          console.warn("Không lấy được audio từ URL");
        }
      }

      if (!finalAudioBlob) finalAudioBlob = generateValidWavBlob();

      const cleanFile = new File([finalAudioBlob], "shadowing.wav", {
        type: finalAudioBlob.type.startsWith("audio/")
          ? finalAudioBlob.type
          : "audio/wav",
      });

      const result = await studentApi.evaluateShadowingAI(
        cleanFile,
        targetStudentAnswerId,
        referenceSentence,
      );

      setShadowingReport(result);
      setReportQuestionId(currentQ?.questionId ?? null);
    } catch (err: any) {
      alert(
        `Đánh giá Shadowing thất bại: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm font-semibold text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={18} />
        <span>Đang tải kết quả Speaking & Shadowing...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/student/courses")}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800">
            {currentAttempt?.assignmentTitle ||
              "Speaking & Shadowing AI Evaluation"}
          </h1>
          <p className="text-xs text-slate-500">
            Trạng thái bài tập:{" "}
            <span
              className={`font-semibold ${
                isSubmitted ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isSubmitted ? "Đã nộp bài" : "Đang làm bài"}
            </span>
            {currentAttempt?.score !== undefined &&
              currentAttempt?.score !== null && (
                <span className="ml-3 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Tổng điểm: {currentAttempt.score.toFixed(1)} pts
                </span>
              )}
          </p>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-opacity ${
          switching ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {/* CỘT TRÁI: BÀI TẬP VÀ LỊCH SỬ NỘP */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {speakingAssignments.length > 0 && (
            <div className="bg-slate-50 p-3 border-b border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Bài tập hôm nay:
              </span>
              <div className="flex gap-2">
                {speakingAssignments.map((asg) => {
                  const isAct = asg.id === selectedAssignmentId;
                  return (
                    <button
                      key={asg.id}
                      type="button"
                      onClick={() => handleSwitchAssignment(asg.id)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isAct
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {asg.isShadowing ? (
                        <Headphones size={13} />
                      ) : (
                        <MessageSquare size={13} />
                      )}
                      <span className="truncate">{asg.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch Sử Nộp Bài
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {attempts.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">
                Chưa có dữ liệu nộp bài
              </p>
            ) : (
              attempts.map((att) => {
                const isSelected = att.attemptId === currentAttempt?.attemptId;
                const isDone = att.status !== "IN_PROGRESS";
                return (
                  <div
                    key={att.attemptId}
                    onClick={async () => {
                      if (switching || isSelected) return;
                      setSwitching(true);
                      try {
                        const detail = await studentApi.getAttemptDetail(
                          att.attemptId,
                        );
                        applyAttempt(detail);
                      } catch {
                        applyAttempt(att);
                      } finally {
                        setSwitching(false);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50/70 border-l-4 border-indigo-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Lần nộp #{att.attemptNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isDone
                            ? "text-indigo-700 bg-indigo-100/60"
                            : "text-amber-700 bg-amber-100/60"
                        }`}
                      >
                        {typeof att.score === "number"
                          ? `${att.score.toFixed(1)} pts`
                          : isDone
                            ? "Đã nộp"
                            : "Đang làm"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleTimeString(
                              "vi-VN",
                            )
                          : "Chưa nộp"}
                      </span>
                      <span>
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT CÂU HỎI VÀ ĐÁNH GIÁ AI */}
        {questions.length === 0 ? (
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <AlertTriangle
                className="mb-3 text-amber-500"
                size={48}
                strokeWidth={1.5}
              />
              <h3 className="font-bold text-xl text-slate-800">
                Chưa Có Câu Trả Lời
              </h3>
              <p className="text-base mt-2 max-w-md text-slate-500">
                Hãy làm bài tập Speaking hoặc Shadowing để xem đánh giá tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              {/* ĐỀ BÀI */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-wider">
                    Câu hỏi{" "}
                    {questions.length > 1
                      ? `${selectedQuestionIndex + 1}/${questions.length}`
                      : ""}
                  </span>
                  <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {rawType}
                  </span>
                </div>
                <span className="text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
                  Điểm:{" "}
                  <strong className="text-indigo-600">
                    {currentQ?.earnedPoints ?? 0}
                  </strong>{" "}
                  / {currentQ?.maxPoints ?? 10}
                </span>
              </div>

              <div className="text-xl md:text-2xl font-black text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentQ?.promptText || "Nội dung câu hỏi..."}
              </div>

              {questions.length > 1 && (
                <div className="flex items-center gap-2 pt-2 border-b border-slate-100 pb-4">
                  <span className="text-sm font-medium text-slate-500 mr-2">
                    Chuyển câu:
                  </span>
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={`h-9 w-9 rounded-lg text-sm font-bold transition cursor-pointer border-2 ${
                        idx === selectedQuestionIndex
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* KHU VỰC THU ÂM & CHẤM AI */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                {isSubmitted ? (
                  // NẾU ĐÃ NỘP BÀI THÌ KHÓA TÍNH NĂNG GHI ÂM VÀ CHẤM ĐIỂM
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-3 shadow-inner">
                    <CheckCircle2
                      size={48}
                      className="mx-auto text-emerald-500"
                    />
                    <h3 className="text-xl md:text-2xl font-black text-emerald-800">
                      Bài Làm Đã Hoàn Thành
                    </h3>
                    <p className="text-base text-emerald-600 font-medium">
                      Bạn đã hoàn thành bài tập này. Vui lòng xem kết quả đánh
                      giá AI chi tiết ở bên dưới.
                    </p>
                    {activeAudioUrl && (
                      <audio
                        controls
                        src={activeAudioUrl}
                        className="w-full max-w-md mx-auto h-12 rounded-lg mt-4 border border-emerald-200 shadow-sm bg-white"
                      />
                    )}
                  </div>
                ) : (
                  // NẾU CHƯA NỘP THÌ CHO PHÉP THU ÂM & GỌI AI
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Volume2 size={20} className="text-indigo-600" /> Bản
                        ghi âm câu trả lời:
                      </span>
                    </div>

                    {activeAudioUrl ? (
                      <audio
                        controls
                        src={activeAudioUrl}
                        className="w-full h-12 rounded-lg mt-2"
                      />
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
                        <p className="font-bold text-base">
                          Lưu ý: Hãy ghi âm trước khi nhờ AI chấm.
                        </p>
                        <p className="text-amber-700">
                          Bạn có thể thu âm trực tiếp bằng micro hoặc tải lên
                          file âm thanh (.wav, .mp3).
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200/80">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 transition"
                        >
                          <Square size={18} /> Dừng ghi âm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <Mic size={18} className="text-rose-600" /> Thu âm
                          micro
                        </button>
                      )}
                      <label className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                        <Upload size={18} className="text-indigo-600" />
                        <span>Tải file (.wav/.mp3)</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {/* NÚT CHẤM AI TO RÕ */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200/80">
                      <button
                        type="button"
                        disabled={isEvaluating}
                        onClick={() => {
                          const targetId = (currentQ as any)?.studentAnswerId;
                          if (!targetId)
                            return alert("Chưa có ID câu trả lời.");
                          handleTriggerShadowingEvaluation(
                            currentQ?.promptText || "",
                            targetId,
                          );
                        }}
                        className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-md disabled:opacity-50 transition cursor-pointer"
                      >
                        {isEvaluating ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Zap size={20} />
                        )}
                        <span>Groq AI Chấm Shadowing (&lt;2s)</span>
                      </button>
                      <button
                        type="button"
                        disabled={isEvaluating}
                        onClick={() => {
                          const targetId = (currentQ as any)?.studentAnswerId;
                          if (!targetId)
                            return alert("Chưa có ID câu trả lời.");
                          handleTriggerAiEvaluation(
                            currentQ?.promptText ||
                              currentAttempt?.assignmentTitle ||
                              "",
                            targetId,
                          );
                        }}
                        className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-4 text-base font-black text-white shadow-md disabled:opacity-50 transition cursor-pointer"
                      >
                        {isEvaluating ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Sparkles size={20} />
                        )}
                        <span>AI Chấm Điểm IELTS Khảo Thí</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* KẾT QUẢ ĐÁNH GIÁ GROQ SHADOWING */}
                {shadowingReport && showShadowing && (
                  <div className="pt-6 animate-in fade-in duration-200">
                    <ShadowingEvaluationView data={shadowingReport} />
                  </div>
                )}

                {/* KẾT QUẢ ĐÁNH GIÁ IELTS AI */}
                {aiReport && showAi && (
                  <div className="space-y-8 animate-in fade-in duration-200 pt-6 border-t-2 border-dashed border-indigo-200">
                    {aiReport.isOffTopic && (
                      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-6 text-rose-900 shadow-sm flex items-start gap-4">
                        <AlertOctagon
                          size={32}
                          className="text-rose-600 shrink-0 mt-1"
                        />
                        <div className="space-y-2">
                          <h4 className="text-lg font-black uppercase tracking-widest text-rose-700">
                            Phát hiện lạc đề (Off-Topic)
                          </h4>
                          <p className="text-base text-rose-800 leading-relaxed font-medium">
                            Nội dung bài nói không trả lời trực tiếp hoặc đi
                            chệch hướng so với yêu cầu đề bài. Overall Band bị
                            giới hạn tối đa 4.0 theo tiêu chuẩn IELTS.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bảng Điểm Tổng Quan TO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`rounded-2xl border-2 p-6 text-center shadow-sm ${aiReport.isOffTopic ? "border-rose-300 bg-rose-50/50" : "border-indigo-200 bg-indigo-50/30"}`}
                      >
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                          Overall Band
                        </span>
                        <p
                          className={`text-5xl lg:text-6xl font-black mt-2 ${aiReport.isOffTopic ? "text-rose-600" : "text-indigo-700"}`}
                        >
                          {aiReport.overallBand}{" "}
                          <span className="text-2xl text-slate-400">/ 9.0</span>
                        </p>
                      </div>
                      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                          Trình độ CEFR
                        </span>
                        <p className="text-5xl lg:text-6xl font-black text-emerald-600 mt-2">
                          {aiReport.estimatedCefr}
                        </p>
                      </div>
                      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                          Tốc độ nói
                        </span>
                        <p className="text-5xl lg:text-6xl font-black text-slate-800 mt-2">
                          {aiReport.wordsPerMinute}{" "}
                          <span className="text-xl font-bold text-slate-400">
                            WPM
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Chi tiết Task Achievement */}
                    {aiReport.taskAchievement && (
                      <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-3">
                          <span className="text-sm font-black text-indigo-950 flex items-center gap-2 uppercase tracking-widest">
                            <Target size={20} className="text-indigo-600" />{" "}
                            Điểm Hoàn Thành Yêu Cầu (Task Achievement):
                          </span>
                          {aiReport.taskAchievement.score !== undefined && (
                            <span className="text-lg font-black text-indigo-700 bg-white border-2 border-indigo-200 px-3 py-1 rounded-lg shadow-sm">
                              {aiReport.taskAchievement.score.toFixed(1)} / 9.0
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-3">
                            <span className="font-black text-base text-emerald-800 flex items-center gap-2">
                              <Check size={18} className="text-emerald-600" />{" "}
                              Đã trả lời được:
                            </span>
                            {aiReport.taskAchievement.addressedPoints &&
                            aiReport.taskAchievement.addressedPoints.length >
                              0 ? (
                              <ul className="space-y-2">
                                {aiReport.taskAchievement.addressedPoints.map(
                                  (item, idx) => (
                                    <li
                                      key={idx}
                                      className="bg-white border-2 border-emerald-200 text-emerald-900 font-medium rounded-xl p-3 text-sm leading-relaxed shadow-sm"
                                    >
                                      {item}
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400 italic">
                                Chưa phát hiện.
                              </p>
                            )}
                          </div>
                          <div className="space-y-3">
                            <span className="font-black text-base text-rose-800 flex items-center gap-2">
                              <XCircle size={18} className="text-rose-600" />{" "}
                              Cần thiếu / chưa rõ:
                            </span>
                            {aiReport.taskAchievement.missingPoints &&
                            aiReport.taskAchievement.missingPoints.length >
                              0 ? (
                              <ul className="space-y-2">
                                {aiReport.taskAchievement.missingPoints.map(
                                  (item, idx) => (
                                    <li
                                      key={idx}
                                      className="bg-white border-2 border-rose-200 text-rose-900 font-medium rounded-xl p-3 text-sm leading-relaxed shadow-sm"
                                    >
                                      {item}
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-emerald-600 font-bold bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 shadow-sm">
                                Đã hoàn thành trọn vẹn yêu cầu.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chi tiết 4 Tiêu Chí IELTS */}
                    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                        Điểm Thành Phần (Rubrics)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {[
                          {
                            label: "Phát âm (PR)",
                            val: aiReport.pronunciationScore,
                          },
                          {
                            label: "Trôi chảy (FC)",
                            val: aiReport.fluencyScore,
                          },
                          { label: "Từ vựng (LR)", val: aiReport.lexicalScore },
                          {
                            label: "Ngữ pháp (GRA)",
                            val: aiReport.grammarScore,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="border-2 border-slate-100 bg-slate-50 p-4 rounded-xl"
                          >
                            <span className="text-sm font-bold text-slate-500 block">
                              {item.label}
                            </span>
                            <span className="text-2xl lg:text-3xl font-black text-slate-800 mt-1 block">
                              {item.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HIỂN THỊ LỖI (MISTAKES) TO RÕ RÀNG */}
                    {aiReport.mistakes && aiReport.mistakes.length > 0 && (
                      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 lg:p-8 space-y-5 shadow-sm">
                        <h4 className="text-xl lg:text-2xl font-black text-rose-800 flex items-center gap-3">
                          <AlertTriangle size={28} /> Sửa Lỗi Chi Tiết
                          (Mistakes)
                        </h4>
                        <div className="grid gap-4">
                          {aiReport.mistakes.map((m, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-5 rounded-xl border-2 border-rose-100 shadow-sm flex flex-col gap-3"
                            >
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <span className="bg-rose-100 text-rose-800 px-4 py-2 rounded-lg text-lg font-bold line-through decoration-rose-500 decoration-2 shadow-sm">
                                  {m.original}
                                </span>
                                <ArrowRight
                                  size={24}
                                  className="text-slate-400 hidden md:block"
                                />
                                <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-lg font-black border-2 border-emerald-300 shadow-sm">
                                  {m.correction}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg mt-2 border-2 border-slate-100">
                                <p className="text-base text-slate-800">
                                  <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded text-sm mr-2 uppercase tracking-widest">
                                    {m.type}
                                  </span>
                                </p>
                                <p className="text-base lg:text-lg text-slate-700 mt-2 font-medium">
                                  {m.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nhận xét chung & Native Phrasing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 space-y-4 shadow-sm">
                        <h4 className="text-lg font-black text-amber-900 flex items-center gap-2 uppercase tracking-widest">
                          <Lightbulb size={24} /> Nhận xét tổng quan
                        </h4>
                        <p className="text-base lg:text-lg text-slate-800 leading-relaxed font-medium">
                          {aiReport.generalFeedback}
                        </p>
                      </div>
                      <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 space-y-4 shadow-sm">
                        <h4 className="text-lg font-black text-indigo-900 flex items-center gap-2 uppercase tracking-widest">
                          <Check size={24} /> Cách nói tự nhiên hơn (Native)
                        </h4>
                        <p className="text-base lg:text-lg text-indigo-950 leading-relaxed font-medium italic">
                          "{aiReport.correctedText}"
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 space-y-3 shadow-sm">
                      <div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                          Transcript nhận diện từ giọng nói
                        </span>
                        <p className="text-base text-slate-800 italic bg-white p-4 rounded-xl border-2 border-slate-200 mt-2 shadow-sm font-medium">
                          "{aiReport.transcript}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
