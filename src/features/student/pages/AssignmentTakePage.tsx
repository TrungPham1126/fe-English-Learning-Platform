// src/features/student/pages/AssignmentTakePage.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi } from "@/features/student/api/studentApi";
import AudioRecorder from "@/features/student/components/AudioRecorder";
import type { AttemptResponse } from "@/features/student/types";
import {
  Clock,
  Send,
  ArrowLeft,
  Loader2,
  PlayCircle,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Check,
  CheckCircle2,
  BookOpen,
  Highlighter,
  Eraser,
  Type,
  Headphones,
  Sparkles,
} from "lucide-react";

type PagePhase = "CHECKING" | "INTRO" | "TESTING" | "EXHAUSTED";

export default function AssignmentTakePage() {
  const params = useParams();
  const navigate = useNavigate();
  const assignmentId = params.assignmentId || params.id;

  const [phase, setPhase] = useState<PagePhase>("CHECKING");
  const [previousAttempts, setPreviousAttempts] = useState<AttemptResponse[]>(
    [],
  );
  const [attempt, setAttempt] = useState<AttemptResponse | null>(null);

  // Lưu trữ toàn bộ câu trả lời của học viên: { [questionId]: { selectedOptionId, textAnswer, audioUrl } }
  const [answers, setAnswers] = useState<
    Record<
      string,
      { selectedOptionId?: string; textAnswer?: string; audioUrl?: string }
    >
  >({});

  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // Audio Player State (Dành cho bài thi Listening)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // IELTS Reading State & Highlighters
  const passageContainerRef = useRef<HTMLDivElement | null>(null);
  const [fontSizeLevel, setFontSizeLevel] = useState<
    "normal" | "large" | "xlarge"
  >("normal");

  useEffect(() => {
    if (!assignmentId) return;
    let isMounted = true;

    const checkAttemptStatus = async () => {
      try {
        const history = await studentApi
          .getMyAttempts(assignmentId)
          .catch(() => []);
        if (!isMounted) return;

        setPreviousAttempts(history);
        const inProgressAtt = history.find(
          (att) => att.status === "IN_PROGRESS",
        );

        if (inProgressAtt) {
          const detail = await studentApi
            .getAttemptDetail(inProgressAtt.attemptId)
            .catch(() => null);
          if (!isMounted) return;

          if (detail) {
            setAttempt(detail);
            const restored: any = {};
            detail.questions?.forEach((q) => {
              restored[q.questionId] = {
                selectedOptionId:
                  q.selectedOptionId ||
                  (q.studentAnswer?.length === 36
                    ? q.studentAnswer
                    : undefined),
                textAnswer: q.studentAnswer,
                audioUrl: q.audioUrl,
              };
            });
            setAnswers(restored);

            const totalDuration = 45 * 60;
            if (detail.startedAt) {
              const elapsed = Math.floor(
                (Date.now() - new Date(detail.startedAt).getTime()) / 1000,
              );
              setTimeLeft(Math.max(0, totalDuration - elapsed));
            } else {
              setTimeLeft(totalDuration);
            }
            setPhase("TESTING");
            return;
          }
        }
        setPhase("INTRO");
      } catch (err) {
        if (isMounted) setPhase("INTRO");
      }
    };

    checkAttemptStatus();
    return () => {
      isMounted = false;
    };
  }, [assignmentId]);

  // Bộ đếm ngược thời gian làm bài
  useEffect(() => {
    if (phase !== "TESTING") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting) handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, isSubmitting]);

  const questions = attempt?.questions || [];

  // Xác định thể loại đề thi
  const isListeningTest = useMemo(() => {
    const title = (attempt?.assignmentTitle || "").toLowerCase();
    return (
      title.includes("listening") ||
      title.includes("nghe") ||
      questions.some((q) => (q as any).mediaUrl)
    );
  }, [attempt, questions]);

  const isReadingTest = useMemo(() => {
    const title = (attempt?.assignmentTitle || "").toLowerCase();
    return title.includes("reading") || title.includes("đọc");
  }, [attempt]);

  // Tìm URL Audio chính của bài nghe
  const mainAudioUrl = useMemo(() => {
    for (const q of questions) {
      const url = (q as any).mediaUrl;
      if (url && (url.startsWith("http") || url.startsWith("/"))) {
        return url;
      }
    }
    return "https://dict.youdao.com/dictvoice?audio=Welcome+to+the+IELTS+Listening+examination+practice+test&type=2";
  }, [questions]);

  // Tìm văn bản bài đọc nếu là bài Reading
  const readingPassageText = useMemo(() => {
    for (const q of questions) {
      if (
        q.promptText &&
        q.promptText.toUpperCase().includes("READING PASSAGE")
      ) {
        const parts = q.promptText.split(/READING PASSAGE:?/i);
        if (parts.length > 1) {
          const passageAndQuestion = parts[1];
          const lines = passageAndQuestion.split(/\n\s*\n/);
          return lines
            .slice(0, Math.max(1, lines.length - 2))
            .join("\n\n")
            .trim();
        }
      }
    }
    return "";
  }, [questions]);

  // Cập nhật câu trả lời cho từng câu hỏi
  const updateAnswer = (
    questionId: string,
    partial: {
      selectedOptionId?: string;
      textAnswer?: string;
      audioUrl?: string;
    },
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...partial,
      },
    }));
  };

  // Cuộn mượt đến câu hỏi tương ứng khi bấm số trên bảng điều khiển
  const scrollToQuestion = (questionId: string) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Xử lý Audio Player
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {});
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // Phát đọc mẫu kịch bản bài nghe bằng Web Speech API
  const playAiVoiceTranscript = () => {
    window.speechSynthesis.cancel();
    const scripts = questions
      .map((q) => (q as any).transcript || q.promptText)
      .filter(Boolean)
      .join(". ");

    const utter = new SpeechSynthesisUtterance(
      scripts ||
        "This is the listening audio track for your IELTS examination.",
    );
    utter.lang = "en-US";
    utter.rate = playbackRate;
    window.speechSynthesis.speak(utter);
  };

  // Công cụ Highlight bài đọc
  const applyHighlight = (color: "yellow" | "green") => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageContainerRef.current)
      return;
    if (!passageContainerRef.current.contains(selection.anchorNode)) {
      alert("Vui lòng bôi đen văn bản bên trong bài đọc để highlight.");
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const mark = document.createElement("mark");
      mark.className =
        color === "yellow"
          ? "bg-amber-200 text-slate-900 rounded px-1 py-0.5 cursor-pointer hover:bg-amber-300 transition"
          : "bg-emerald-200 text-slate-900 rounded px-1 py-0.5 cursor-pointer hover:bg-emerald-300 transition";
      mark.title = "Click chuột vào đây để xóa bôi màu";
      mark.onclick = (e) => {
        e.stopPropagation();
        const parent = mark.parentNode;
        if (parent) {
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          parent.removeChild(mark);
        }
      };

      mark.appendChild(range.extractContents());
      range.insertNode(mark);
      selection.removeAllRanges();
    } catch (e) {
      console.warn("Không thể highlight:", e);
    }
  };

  const removeAllHighlights = () => {
    if (!passageContainerRef.current) return;
    const marks = passageContainerRef.current.querySelectorAll("mark");
    marks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      }
    });
  };

  const handleStartNewAttempt = async () => {
    if (!assignmentId) return;
    setIsStarting(true);
    try {
      const started = await studentApi.startAssignment(assignmentId);
      const detail = await studentApi.getAttemptDetail(started.attemptId);
      setAttempt(detail);
      setTimeLeft(45 * 60);
      setPhase("TESTING");
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("hết hạn") || msg.includes("maxAttempts")) {
        setPhase("EXHAUSTED");
      } else {
        alert("Không thể bắt đầu: " + msg);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!attempt || !assignmentId) return;
    const answeredCount = questions.filter((q) => {
      const a = answers[q.questionId];
      return Boolean(
        a?.selectedOptionId ||
        (a?.textAnswer && a.textAnswer.trim().length > 0) ||
        a?.audioUrl,
      );
    }).length;

    const unAnswered = questions.length - answeredCount;
    const confirmMsg =
      unAnswered > 0
        ? `Bạn vẫn còn ${unAnswered} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`
        : "Bạn đã hoàn tất tất cả câu hỏi. Nộp bài ngay bây giờ?";

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptionId: ans.selectedOptionId,
        textAnswer: ans.textAnswer,
      }));
      const res = await studentApi.submitAssignment(
        assignmentId,
        attempt.attemptId,
        payload,
      );
      navigate(
        `/student/assignments/${assignmentId}/submissions/${res.attemptId || attempt.attemptId}`,
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi nộp bài");
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || !assignmentId) return;
    setIsSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptionId: ans.selectedOptionId,
        textAnswer: ans.textAnswer,
      }));
      const res = await studentApi.submitAssignment(
        assignmentId,
        attempt.attemptId,
        payload,
      );
      alert("Hết thời gian làm bài! Hệ thống đã tự động lưu và gửi bài thi.");
      navigate(
        `/student/assignments/${assignmentId}/submissions/${res.attemptId || attempt.attemptId}`,
      );
    } catch {
      navigate(`/student/assignments/${assignmentId}/submissions/latest`);
    }
  };

  const handleUploadSpeaking = async (questionId: string, blob: Blob) => {
    if (!attempt) return;
    setIsUploadingAudio(true);
    try {
      await studentApi.uploadSpeakingAudio(attempt.attemptId, questionId, blob);
      const audioUrl = URL.createObjectURL(blob);
      updateAnswer(questionId, { audioUrl });
    } catch (err: any) {
      alert(
        "Không thể tải lên file ghi âm: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const formatTimer = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (!assignmentId) return null;

  if (phase === "CHECKING") {
    return (
      <div className="p-20 text-center text-xs font-semibold text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
        <span>Đang nạp dữ liệu bài thi...</span>
      </div>
    );
  }

  if (phase === "EXHAUSTED" || phase === "INTRO") {
    const completedList = previousAttempts.filter(
      (a) => a.status !== "IN_PROGRESS",
    );
    const isExhausted = phase === "EXHAUSTED";

    return (
      <div className="max-w-3xl mx-auto my-12 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            {isExhausted ? (
              <ShieldAlert size={36} className="text-amber-500" />
            ) : (
              <BookOpen size={36} />
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              {isExhausted
                ? "Hết Lượt Làm Bài"
                : previousAttempts[0]?.assignmentTitle ||
                  "Bắt Đầu Bài Thi IELTS"}
            </h1>
            <p className="text-slate-500 mt-3 text-base leading-relaxed max-w-xl mx-auto">
              {isExhausted
                ? "Bạn đã dùng hết số lượt làm bài cho phép đối với đề thi này."
                : "Hệ thống hỗ trợ làm bài thi toàn diện: có Audio phát nghe liên tục, toàn bộ câu hỏi hiển thị trên 1 trang và tự động lưu đáp án."}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {completedList.length > 0 && (
              <button
                onClick={() =>
                  navigate(
                    `/student/assignments/${assignmentId}/submissions/latest`,
                  )
                }
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition cursor-pointer"
              >
                Xem Lịch Sử Bài Nộp
              </button>
            )}
            {!isExhausted && (
              <button
                disabled={isStarting}
                onClick={handleStartNewAttempt}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <PlayCircle size={20} />
                )}
                <span>Bắt Đầu Làm Bài Ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const answeredQuestionsCount = questions.filter((q) => {
    const a = answers[q.questionId];
    return Boolean(
      a?.selectedOptionId ||
      (a?.textAnswer && a.textAnswer.trim().length > 0) ||
      a?.audioUrl,
    );
  }).length;

  return (
    <div className="max-w-[1550px] mx-auto space-y-4 pb-16">
      {/* 1. TOPBAR CỐ ĐỊNH CHUẨN IELTS CBT */}
      <header className="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-2 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              window.confirm("Bạn có muốn tạm dừng làm bài?") && navigate(-1)
            }
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 cursor-pointer transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-black text-base md:text-lg text-slate-900 leading-tight">
              {attempt?.assignmentTitle}
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              IELTS Standard Computer-Delivered Examination • Hiển thị 1 trang
              duy nhất
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Công cụ Highlight văn bản nếu có bài đọc */}
          {Boolean(readingPassageText) && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <button
                type="button"
                onClick={() => applyHighlight("yellow")}
                className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Bôi đen chữ rồi bấm nút này để Highlight Vàng"
              >
                <Highlighter size={13} className="text-amber-600" />
                <span>Bôi vàng</span>
              </button>
              <button
                type="button"
                onClick={() => applyHighlight("green")}
                className="flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Bôi đen chữ rồi bấm nút này để Highlight Xanh"
              >
                <Highlighter size={13} className="text-emerald-600" />
                <span>Bôi xanh</span>
              </button>
              <button
                type="button"
                onClick={removeAllHighlights}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Xóa tất cả Highlight"
              >
                <Eraser size={15} />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                type="button"
                onClick={() =>
                  setFontSizeLevel((prev) =>
                    prev === "normal"
                      ? "large"
                      : prev === "large"
                        ? "xlarge"
                        : "normal",
                  )
                }
                className="flex items-center gap-1 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Đổi cỡ chữ bài đọc"
              >
                <Type size={13} />
                <span>
                  {fontSizeLevel === "normal"
                    ? "1x"
                    : fontSizeLevel === "large"
                      ? "1.2x"
                      : "1.4x"}
                </span>
              </button>
            </div>
          )}

          {/* Bộ đếm thời gian */}
          <div
            className={`flex items-center gap-2 border-2 px-4 py-2 rounded-xl font-mono text-base font-black transition-colors ${
              timeLeft < 300
                ? "border-rose-200 bg-rose-50 text-rose-600 animate-pulse"
                : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <Clock size={18} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting || isUploadingAudio}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-100 transition"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>Nộp Bài</span>
          </button>
        </div>
      </header>

      {/* 2. AUDIO PLAYER BAR CỐ ĐỊNH CHO BÀI THI LISTENING */}
      {isListeningTest && (
        <div className="border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-lg sticky top-20 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <audio
            ref={audioRef}
            src={mainAudioUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => setIsPlayingAudio(false)}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="h-12 w-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-black transition-transform active:scale-95 shadow-md cursor-pointer shrink-0"
              title={isPlayingAudio ? "Tạm dừng" : "Phát Audio"}
            >
              {isPlayingAudio ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="ml-0.5" />
              )}
            </button>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Headphones size={14} /> Official Listening Audio Track
              </span>
              <p className="text-sm font-black text-white leading-tight mt-0.5">
                {isPlayingAudio
                  ? "Đang phát âm thanh bài nghe..."
                  : "Bấm nút Play để bắt đầu nghe bài"}
              </p>
            </div>
          </div>

          {/* Thanh cuộn tua thời gian */}
          <div className="flex-1 flex items-center gap-3 max-w-xl mx-2">
            <span className="text-xs font-mono text-indigo-200 w-10 text-right">
              {formatTimer(Math.floor(audioCurrentTime))}
            </span>
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              value={audioCurrentTime}
              onChange={handleSeekAudio}
              className="flex-1 h-2 bg-indigo-700/60 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-xs font-mono text-indigo-300 w-10">
              {formatTimer(Math.floor(audioDuration))}
            </span>
          </div>

          {/* Các nút tùy chỉnh: Tốc độ, Âm lượng, và Voice AI Fallback */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/10">
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-black transition ${
                    playbackRate === rate
                      ? "bg-amber-400 text-slate-950"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isMuted ? "Bật âm" : "Tắt âm"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              type="button"
              onClick={playAiVoiceTranscript}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm cursor-pointer border border-indigo-400"
              title="Phát giọng đọc AI nếu file âm thanh chưa sẵn sàng"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Voice AI</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. THÂN TRANG THI: CỘT BÀI ĐỌC (NẾU CÓ) + TOÀN BỘ CÂU HỎI + SIDEBAR ĐIỀU HƯỚNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI: BÀI ĐỌC READING PASSAGE (NẾU ĐỀ CÓ BÀI ĐỌC DÀI)                 */}
        {/* ========================================================================= */}
        {Boolean(readingPassageText) && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-20">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" /> READING
                PASSAGE
              </span>
              <span className="text-[11px] font-semibold text-slate-400 italic">
                Bôi đen văn bản để highlight
              </span>
            </div>
            <div
              ref={passageContainerRef}
              className={`p-6 md:p-8 overflow-y-auto leading-loose text-slate-800 font-serif select-text ${
                fontSizeLevel === "normal"
                  ? "text-base"
                  : fontSizeLevel === "large"
                    ? "text-lg"
                    : "text-xl"
              }`}
            >
              {readingPassageText.split(/\n\s*\n/).map((para, pIdx) => (
                <p key={pIdx} className="mb-5 text-justify">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CỘT CHÍNH: HIỂN THỊ TOÀN BỘ CÁC CÂU HỎI CUỘN LIÊN TỤC TRÊN 1 TRANG        */}
        {/* ========================================================================= */}
        <div
          className={`${
            readingPassageText ? "lg:col-span-5" : "lg:col-span-9"
          } space-y-6`}
        >
          {questions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Đề thi chưa có câu hỏi nào.
            </div>
          ) : (
            questions.map((q, idx) => {
              const rawType = String(q.questionType || "").toUpperCase();
              const isSpeaking =
                rawType === "AUDIO_RESPONSE" || rawType === "SPEAKING";
              const isMultipleChoice = rawType === "MULTIPLE_CHOICE";
              const isTrueFalse = rawType === "TRUE_FALSE";
              const isFillBlank = rawType === "FILL_IN_BLANK";
              const isEssay =
                (rawType === "ESSAY" || rawType === "WRITING") && !isFillBlank;

              // Rút gọn phần prompt nếu có lặp lại tiêu đề Reading Passage
              let displayPrompt = q.promptText;
              if (displayPrompt.includes("READING PASSAGE")) {
                const parts = displayPrompt.split(/\n\s*\n/);
                displayPrompt = parts[parts.length - 1];
              }

              // Lấy danh sách options (hỗ trợ cả options từ backend lẫn fallback)
              const options =
                (q as any).options && (q as any).options.length > 0
                  ? (q as any).options
                  : isMultipleChoice
                    ? [
                        { id: "A", optionLabel: "A", text: "Option A" },
                        { id: "B", optionLabel: "B", text: "Option B" },
                        { id: "C", optionLabel: "C", text: "Option C" },
                        { id: "D", optionLabel: "D", text: "Option D" },
                      ]
                    : [];

              return (
                <div
                  key={q.questionId}
                  id={`question-${q.questionId}`}
                  className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-5 transition hover:border-slate-300 scroll-mt-24"
                >
                  {/* Header của từng câu hỏi */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        CÂU HỎI {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ({rawType})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                      {q.maxPoints} pts
                    </span>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-base md:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {displayPrompt}
                  </div>

                  {/* 1. DẠNG BÀI ĐIỀN TỪ VÀO CHỖ TRỐNG (FILL IN THE BLANK) */}
                  {isFillBlank && (
                    <div className="pt-2">
                      <div className="p-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30">
                        <label className="block text-xs font-black uppercase tracking-wider text-indigo-900 mb-2">
                          Nhập đáp án của bạn:
                        </label>
                        <input
                          type="text"
                          placeholder="Gõ từ cần điền vào đây..."
                          value={answers[q.questionId]?.textAnswer || ""}
                          onChange={(e) =>
                            updateAnswer(q.questionId, {
                              textAnswer: e.target.value,
                            })
                          }
                          className="w-full border-b-2 border-indigo-600 pb-2 text-xl font-black text-slate-900 outline-none bg-transparent placeholder:font-medium placeholder:text-sm placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. DẠNG BÀI TRẮC NGHIỆM (MULTIPLE CHOICE) */}
                  {isMultipleChoice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {options.map((opt: any) => {
                        const optId = opt.id || opt.optionLabel || opt.text;
                        const isChecked =
                          answers[q.questionId]?.selectedOptionId === optId;

                        return (
                          <div
                            key={optId}
                            onClick={() =>
                              updateAnswer(q.questionId, {
                                selectedOptionId: optId,
                              })
                            }
                            className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              isChecked
                                ? "border-indigo-600 bg-indigo-50/70 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`h-7 w-7 rounded-full flex items-center justify-center font-black text-xs border-2 shrink-0 ${
                                isChecked
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 bg-white text-slate-600"
                              }`}
                            >
                              {opt.optionLabel || "•"}
                            </span>
                            <span
                              className={`text-sm md:text-base font-bold ${
                                isChecked ? "text-indigo-950" : "text-slate-800"
                              }`}
                            >
                              {opt.optionText || opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. DẠNG BÀI TRUE / FALSE / NOT GIVEN */}
                  {isTrueFalse && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {["TRUE", "FALSE", "NOT GIVEN"].map((val) => {
                        const currentSelected =
                          answers[q.questionId]?.selectedOptionId;
                        const isSelected =
                          currentSelected === val ||
                          (val === "TRUE" && currentSelected === "true") ||
                          (val === "FALSE" && currentSelected === "false");

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              updateAnswer(q.questionId, {
                                selectedOptionId: val,
                                textAnswer: val,
                              })
                            }
                            className={`py-3.5 px-3 rounded-xl border-2 font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              isSelected
                                ? val === "TRUE"
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-500/20"
                                  : val === "FALSE"
                                    ? "border-rose-600 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-500/20"
                                    : "border-slate-700 bg-slate-100 text-slate-900 shadow-md ring-2 ring-slate-500/20"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <span>{val}</span>
                            <span className="text-[10px] font-bold opacity-75 uppercase">
                              {val === "TRUE"
                                ? "Đúng"
                                : val === "FALSE"
                                  ? "Sai"
                                  : "Không có trong bài"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. DẠNG BÀI SPEAKING (GHI ÂM TỪNG CÂU HỎI NÓI) */}
                  {isSpeaking && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                          <Volume2 size={16} className="text-indigo-600" />{" "}
                          Microphone Audio Recorder
                        </span>
                        {isUploadingAudio && (
                          <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                            <Loader2 size={14} className="animate-spin" /> Đang
                            tải lên...
                          </span>
                        )}
                      </div>
                      {answers[q.questionId]?.audioUrl && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Đã lưu bản ghi âm
                          </span>
                          <audio
                            controls
                            src={answers[q.questionId].audioUrl}
                            className="w-full h-8"
                          />
                        </div>
                      )}
                      <AudioRecorder
                        onRecordingComplete={(blob) =>
                          handleUploadSpeaking(q.questionId, blob)
                        }
                      />
                    </div>
                  )}

                  {/* 5. DẠNG BÀI TỰ LUẬN (ESSAY) */}
                  {isEssay && (
                    <div className="pt-2">
                      <textarea
                        rows={8}
                        placeholder="Nhập nội dung bài viết tự luận của bạn..."
                        value={answers[q.questionId]?.textAnswer || ""}
                        onChange={(e) =>
                          updateAnswer(q.questionId, {
                            textAnswer: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm font-medium leading-relaxed outline-none focus:border-indigo-600 bg-slate-50/50 resize-y"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI: BẢNG ĐIỀU HƯỚNG CÂU HỎI (QUESTION PALETTE) CỐ ĐỊNH               */}
        {/* ========================================================================= */}
        <div
          className={`${
            readingPassageText ? "lg:col-span-2" : "lg:col-span-3"
          } bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 sticky top-20`}
        >
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Bảng Câu Hỏi
            </h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {answeredQuestionsCount}/{questions.length} câu
            </span>
          </div>

          {/* Lưới các nút câu hỏi */}
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const ans = answers[q.questionId];
              const isDone = Boolean(
                ans?.selectedOptionId ||
                (ans?.textAnswer && ans.textAnswer.trim().length > 0) ||
                ans?.audioUrl,
              );

              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => scrollToQuestion(q.questionId)}
                  className={`h-10 rounded-xl text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                    isDone
                      ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-100"
                  }`}
                  title={`Bấm để cuộn đến câu hỏi ${idx + 1}`}
                >
                  {isDone ? (
                    <span className="flex items-center gap-0.5">
                      {idx + 1}
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    idx + 1
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-emerald-500 inline-block shadow-xs" />
              <span>Đã trả lời xong</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-slate-100 border border-slate-200 inline-block" />
              <span>Chưa hoàn thành</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitTest}
            disabled={isSubmitting || isUploadingAudio}
            className="w-full mt-4 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>Nộp Toàn Bộ Bài Thi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
