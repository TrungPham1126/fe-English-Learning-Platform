// src/features/student/api/studentApi.ts
import { axiosClient } from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  MyCourseResponse,
  LessonSummary,
  LessonDetailResponse,
  VideoResponse,
  VideoWatchHistory,
  StudentAssignmentSummaryResponse,
  AttemptResponse,
  StudentSkillProfile,
  VocabularyResponse,
  SpeakingAiEvaluationResult,
  ShadowingEvaluationResponse,
  WritingAiEvaluationResult,
  DailyHomeworkOverviewResponse,
} from "../types";

export const studentApi = {
  // ================= 1. LỚP HỌC (CLASSROOMS) =================
  getMyCourses: async (): Promise<MyCourseResponse[]> => {
    const res = await axiosClient.get<ApiResponse<MyCourseResponse[]>>(
      "/api/student/classrooms/my-courses",
    );
    return res.data.data || [];
  },

  leaveCourse: async (classId: string): Promise<void> => {
    await axiosClient.post(`/api/student/classrooms/${classId}/leave`);
  },

  // ================= 2. GIÁO TRÌNH & BÀI HỌC (CURRICULUM) =================
  getClassLessons: async (classId: string): Promise<LessonSummary[]> => {
    const res = await axiosClient.get<ApiResponse<LessonSummary[]>>(
      `/api/curriculum/classes/${classId}/lessons`,
    );
    return res.data.data || [];
  },

  getLessonDetail: async (lessonId: string): Promise<LessonDetailResponse> => {
    const res = await axiosClient.get<ApiResponse<LessonDetailResponse>>(
      `/api/curriculum/lessons/${lessonId}`,
    );
    return res.data.data;
  },

  getVideoByLesson: async (lessonId: string): Promise<VideoResponse> => {
    const res = await axiosClient.get<ApiResponse<VideoResponse>>(
      `/api/v1/videos/lesson/${lessonId}`,
    );
    return res.data.data;
  },

  getVideoProgress: async (videoId: string): Promise<VideoWatchHistory> => {
    const res = await axiosClient.get<ApiResponse<VideoWatchHistory>>(
      `/api/v1/videos/${videoId}/progress`,
    );
    return res.data.data;
  },

  updateVideoProgress: async (
    videoId: string,
    watchedSeconds: number,
    completed: boolean = false,
  ): Promise<void> => {
    await axiosClient.post(`/api/v1/videos/${videoId}/progress`, {
      watchedSeconds,
      completed,
    });
  },

  // ================= 3. BÀI TẬP & NỘP BÀI (ASSIGNMENTS & ATTEMPTS) =================
  getClassAssignments: async (
    classId: string,
  ): Promise<StudentAssignmentSummaryResponse[]> => {
    const res = await axiosClient.get<
      ApiResponse<StudentAssignmentSummaryResponse[]>
    >(`/api/v1/student/classrooms/${classId}/assignments`);
    return res.data.data || [];
  },

  startAssignment: async (assignmentId: string): Promise<AttemptResponse> => {
    const res = await axiosClient.post<ApiResponse<AttemptResponse>>(
      `/api/v1/student/assignments/${assignmentId}/start`,
    );
    return res.data.data;
  },

  getMyAttempts: async (assignmentId: string): Promise<AttemptResponse[]> => {
    const res = await axiosClient.get<ApiResponse<AttemptResponse[]>>(
      `/api/v1/student/assignments/${assignmentId}/attempts`,
    );
    return res.data.data || [];
  },

  getAttemptDetail: async (attemptId: string): Promise<AttemptResponse> => {
    const res = await axiosClient.get<ApiResponse<AttemptResponse>>(
      `/api/v1/student/assignments/attempts/${attemptId}`,
    );
    return res.data.data;
  },

  submitAssignment: async (
    assignmentId: string,
    attemptId: string,
    answers: Array<{
      questionId: string;
      selectedOptionId?: string;
      textAnswer?: string;
    }>,
  ): Promise<AttemptResponse> => {
    const res = await axiosClient.post<ApiResponse<AttemptResponse>>(
      `/api/v1/student/assignments/${assignmentId}/attempts/${attemptId}/submit`,
      { assignmentId, answers },
    );
    return res.data.data;
  },

  uploadSpeakingAudio: async (
    attemptId: string,
    questionId: string,
    audioBlob: Blob,
  ): Promise<AttemptResponse> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    const res = await axiosClient.post<ApiResponse<AttemptResponse>>(
      `/api/v1/student/assignments/attempts/${attemptId}/questions/${questionId}/audio`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  // ================= 4. CÁC ENGINE CHẤM AI (SPEAKING, SHADOWING, WRITING) =================

  // 4.1. Chấm IELTS Speaking tự do (LLaMA / Gemini)
  evaluateSpeakingAI: async (
    topic: string,
    audioBlob: Blob,
    studentAnswerId: string,
  ): Promise<SpeakingAiEvaluationResult> => {
    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("audio", audioBlob, "speaking.wav");
    formData.append("studentAnswerId", studentAnswerId);

    const res = await axiosClient.post<ApiResponse<SpeakingAiEvaluationResult>>(
      "/api/v1/ai/speaking/evaluate",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  // 4.2. Chấm đọc theo câu Shadowing (Groq Whisper-large-v3 + LLaMA 3.3 70B <2s)
  evaluateShadowingAI: async (
    audioBlob: Blob,
    studentAnswerId: string,
    referenceSentence?: string,
  ): Promise<ShadowingEvaluationResponse> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "shadowing.wav");
    formData.append("studentAnswerId", studentAnswerId);
    if (referenceSentence) {
      formData.append("referenceSentence", referenceSentence);
    }

    const res = await axiosClient.post<
      ApiResponse<ShadowingEvaluationResponse>
    >("/api/v1/ai/speaking/shadowing-evaluate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  // 4.3. Chấm bài viết tự luận Writing (Task Achievement, Grammar, Cohesion)
  evaluateWritingAI: async (
    topic: string,
    essayText: string,
    studentAnswerId: string,
  ): Promise<WritingAiEvaluationResult> => {
    const res = await axiosClient.post<ApiResponse<WritingAiEvaluationResult>>(
      `/api/v1/ai/writing/evaluate?topic=${encodeURIComponent(topic)}&studentAnswerId=${studentAnswerId}`,
      essayText,
      { headers: { "Content-Type": "text/plain" } },
    );
    return res.data.data;
  },

  // ================= 5. TỪ VỰNG FLASHCARDS (SPACED REPETITION) =================
  getDueFlashcards: async (
    limit: number = 20,
  ): Promise<PageResponse<VocabularyResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<PageResponse<VocabularyResponse>>
    >(`/api/v1/student/vocabularies/due?limit=${limit}`);
    return res.data.data;
  },

  reviewFlashcard: async (
    vocabularyId: string,
    grade: 0 | 1 | 2 | 3,
  ): Promise<void> => {
    await axiosClient.post(
      `/api/v1/student/vocabularies/${vocabularyId}/review`,
      { grade },
    );
  },

  // ================= 6. HỒ SƠ NĂNG LỰC (ANALYTICS) =================
  getSkillProfile: async (): Promise<StudentSkillProfile> => {
    const res = await axiosClient.get<ApiResponse<StudentSkillProfile>>(
      "/api/v1/analytics/my-profile",
    );
    return res.data.data;
  },
  // ================= 7. BÀI TẬP HÀNG NGÀY (DAILY HOMEWORK) =================
  getDailyHomeworkOverview: async (
    classroomId: string,
    selectedDayId?: string,
  ): Promise<DailyHomeworkOverviewResponse> => {
    const url = selectedDayId
      ? `/api/v1/curriculum/daily-plans/classrooms/${classroomId}/student-overview?selectedDayId=${selectedDayId}`
      : `/api/v1/curriculum/daily-plans/classrooms/${classroomId}/student-overview`;
    const res =
      await axiosClient.get<ApiResponse<DailyHomeworkOverviewResponse>>(url);
    return res.data.data;
  },

  markDailyPlanComplete: async (planId: string): Promise<void> => {
    await axiosClient.post(`/api/v1/curriculum/daily-plans/${planId}/complete`);
  },
};
