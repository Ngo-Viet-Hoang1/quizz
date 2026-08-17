'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  User,
  UserRole,
  Quiz,
  Room,
  Exam,
  ExamResult,
  INITIAL_USERS,
  INITIAL_QUIZZES,
  INITIAL_ROOMS,
  INITIAL_EXAMS,
  INITIAL_RESULTS,
} from './mock-store';

interface QuizContextType {
  // Auth state & Role switcher
  currentUser: User;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  users: User[];

  // Modals state
  authModal:
    | 'login'
    | 'register'
    | 'change-password'
    | 'pin-join'
    | 'ai-generate'
    | 'import-export'
    | 'share-quiz'
    | 'create-room'
    | 'create-exam'
    | null;
  setAuthModal: (modal: QuizContextType['authModal']) => void;
  selectedQuizForAction: Quiz | null;
  setSelectedQuizForAction: (quiz: Quiz | null) => void;
  selectedRoomForAction: Room | null;
  setSelectedRoomForAction: (room: Room | null) => void;

  // Data lists & Actions
  quizzes: Quiz[];
  rooms: Room[];
  exams: Exam[];
  examResults: ExamResult[];

  // UC Actions
  lockUser: (userId: string) => void;
  unlockUser: (userId: string) => void;
  addQuiz: (quiz: Quiz) => void;
  deleteQuiz: (quizId: string) => void;
  reportQuiz: (quizId: string, reason: string) => void;
  resolveReportedQuiz: (quizId: string) => void;
  createRoom: (roomData: Omit<Room, 'id' | 'code' | 'participantsCount' | 'participants'>) => Room;
  joinRoomByCode: (code: string) => Room | null;
  leaveRoom: (roomId: string) => void;
  createExam: (examData: Omit<Exam, 'id'>) => Exam;
  saveExamResult: (result: Omit<ExamResult, 'id' | 'completedAt'>) => ExamResult;

  // Active playing exam state
  activeExam: Exam | null;
  activeExamQuiz: Quiz | null;
  setActiveExam: (exam: Exam | null, quiz: Quiz | null) => void;
}

const defaultFallbackContext: QuizContextType = {
  currentUser: INITIAL_USERS[0],
  activeRole: 'Participant',
  setActiveRole: () => {},
  users: INITIAL_USERS,
  authModal: null,
  setAuthModal: () => {},
  selectedQuizForAction: null,
  setSelectedQuizForAction: () => {},
  selectedRoomForAction: null,
  setSelectedRoomForAction: () => {},
  quizzes: INITIAL_QUIZZES,
  rooms: INITIAL_ROOMS,
  exams: INITIAL_EXAMS,
  examResults: INITIAL_RESULTS,
  lockUser: () => {},
  unlockUser: () => {},
  addQuiz: () => {},
  deleteQuiz: () => {},
  reportQuiz: () => {},
  resolveReportedQuiz: () => {},
  createRoom: () => INITIAL_ROOMS[0],
  joinRoomByCode: () => null,
  leaveRoom: () => {},
  createExam: () => INITIAL_EXAMS[0],
  saveExamResult: () => INITIAL_RESULTS[0],
  activeExam: null,
  activeExamQuiz: null,
  setActiveExam: () => {},
};

const QuizContext = createContext<QuizContextType>(defaultFallbackContext);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [activeRole, setActiveRoleState] = useState<UserRole>('Participant');

  const [authModal, setAuthModal] = useState<QuizContextType['authModal']>(null);
  const [selectedQuizForAction, setSelectedQuizForAction] = useState<Quiz | null>(null);
  const [selectedRoomForAction, setSelectedRoomForAction] = useState<Room | null>(null);

  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [examResults, setExamResults] = useState<ExamResult[]>(INITIAL_RESULTS);

  const [activeExam, setActiveExamState] = useState<Exam | null>(null);
  const [activeExamQuiz, setActiveExamQuizState] = useState<Quiz | null>(null);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    const foundUser = users.find((u) => u.role === role);
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      setCurrentUser({
        id: `usr-${Date.now()}`,
        name: `Người dùng ${role}`,
        email: `${role.toLowerCase()}@quiz.com`,
        role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      });
    }
  };

  const lockUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isLocked: true } : u)));
  };

  const unlockUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isLocked: false } : u)));
  };

  const addQuiz = (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
  };

  const deleteQuiz = (quizId: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const reportQuiz = (quizId: string, reason: string) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, isReported: true, reportReason: reason } : q)),
    );
  };

  const resolveReportedQuiz = (quizId: string) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, isReported: false, reportReason: undefined } : q)),
    );
  };

  const createRoom = (data: Omit<Room, 'id' | 'code' | 'participantsCount' | 'participants'>) => {
    const newRoom: Room = {
      ...data,
      id: `rm-${Date.now()}`,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      participantsCount: 1,
      participants: [{ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }],
    };
    setRooms((prev) => [newRoom, ...prev]);
    return newRoom;
  };

  const joinRoomByCode = (code: string) => {
    const found = rooms.find((r) => r.code === code);
    if (found) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === found.id) {
            const alreadyJoined = r.participants.some((p) => p.id === currentUser.id);
            if (alreadyJoined) return r;
            return {
              ...r,
              participantsCount: r.participantsCount + 1,
              participants: [
                ...r.participants,
                { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
              ],
            };
          }
          return r;
        }),
      );
      return found;
    }
    return null;
  };

  const leaveRoom = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updatedParticipants = r.participants.filter((p) => p.id !== currentUser.id);
          return {
            ...r,
            participantsCount: updatedParticipants.length,
            participants: updatedParticipants,
          };
        }
        return r;
      }),
    );
  };

  const createExam = (data: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...data,
      id: `ex-${Date.now()}`,
    };
    setExams((prev) => [newExam, ...prev]);
    return newExam;
  };

  const saveExamResult = (resultData: Omit<ExamResult, 'id' | 'completedAt'>) => {
    const newRes: ExamResult = {
      ...resultData,
      id: `res-${Date.now()}`,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setExamResults((prev) => [newRes, ...prev]);
    return newRes;
  };

  const setActiveExam = (exam: Exam | null, quiz: Quiz | null) => {
    setActiveExamState(exam);
    setActiveExamQuizState(quiz);
  };

  return (
    <QuizContext.Provider
      value={{
        currentUser,
        activeRole,
        setActiveRole,
        users,
        authModal,
        setAuthModal,
        selectedQuizForAction,
        setSelectedQuizForAction,
        selectedRoomForAction,
        setSelectedRoomForAction,
        quizzes,
        rooms,
        exams,
        examResults,
        lockUser,
        unlockUser,
        addQuiz,
        deleteQuiz,
        reportQuiz,
        resolveReportedQuiz,
        createRoom,
        joinRoomByCode,
        leaveRoom,
        createExam,
        saveExamResult,
        activeExam,
        activeExamQuiz,
        setActiveExam,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  return useContext(QuizContext);
}
