'use client';

import React, { useState } from 'react';
import { useQuiz } from '@/shared/lib/quiz-context';
import {
  Users,
  PlusCircle,
  KeyRound,
  Search,
  UserPlus,
  LogOut,
  FileText,
  Play,
} from 'lucide-react';

export default function RoomsPage() {
  const {
    rooms,
    createRoom,
    leaveRoom,
    quizzes,
    currentUser,
    setAuthModal,
    joinRoomByCode,
    activeRole,
  } = useQuiz();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id || '');

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.includes(searchTerm) ||
      r.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    const quiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
    const created = createRoom({
      name: roomName,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      quizId: quiz.id,
      quizTitle: quiz.title,
      status: 'Waiting',
    });

    setRoomName('');
    setShowCreateRoomForm(false);
    alert(`Đã tạo phòng thi "${created.name}" thành công! Mã PIN: ${created.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Phòng Thi Trực Tuyến Live (UC_14 - UC_23)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Tạo phòng, quản lý thí sinh tham gia, thêm/xóa bài thi vào phòng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuthModal('pin-join')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <KeyRound className="w-4 h-4" />
            Nhập Mã PIN (UC_23)
          </button>

          {(activeRole === 'Creator' || activeRole === 'Admin') && (
            <button
              onClick={() => setShowCreateRoomForm(!showCreateRoomForm)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo Phòng Thi (UC_14)
            </button>
          )}
        </div>
      </div>

      {/* Room Search Bar (UC_18) */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm phòng thi theo Tên phòng, Mã PIN, hoặc Tên Quiz... (UC_18)"
          className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Create Room Form Modal (UC_14) */}
      {showCreateRoomForm && (
        <form
          onSubmit={handleCreateRoomSubmit}
          className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn"
        >
          <h3 className="text-base font-black text-indigo-900 dark:text-indigo-200">
            Tạo Phòng Thi Mới (UC_14)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tên phòng thi
              </label>
              <input
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="VD: Kiểm Tra Thu Hoạch Lập Trình K65"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Thêm bài kiểm tra vào phòng (UC_19)
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questionCount} câu)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateRoomForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Tạo & Khởi Chạy Phòng
            </button>
          </div>
        </form>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs">
                  PIN: {room.code}
                </span>
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 mt-2">
                  {room.name}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Chủ phòng: {room.creatorName}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  room.status === 'Waiting'
                    ? 'bg-amber-100 text-amber-700'
                    : room.status === 'In Progress'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {room.status}
              </span>
            </div>

            {/* Attached Quiz Info (UC_19) */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                <FileText className="w-4 h-4 text-indigo-500" />
                Bài kiểm tra: <span className="text-indigo-600">{room.quizTitle}</span>
              </div>
            </div>

            {/* Participant Lobby Avatars (UC_17) */}
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Thí sinh đã vào phòng ({room.participantsCount})</span>
                <button
                  onClick={() =>
                    alert(`Đã gửi lời mời tham gia phòng thi PIN ${room.code} (UC_21)!`)
                  }
                  className="text-indigo-600 hover:underline flex items-center gap-1 text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Mời thêm (UC_21)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {room.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Footer Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <button
                onClick={() => leaveRoom(room.id)}
                className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Rời phòng (UC_22)
              </button>

              <button
                onClick={() => {
                  joinRoomByCode(room.code);
                  alert(`Bạn đã vào phòng thi ${room.name}! Đang chờ bắt đầu...`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Tham gia ngay (UC_23)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
