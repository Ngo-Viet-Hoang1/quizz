import { io, Socket } from 'socket.io-client';

export function getSocketBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

export function createRoomSocket(): Socket {
  const baseUrl = getSocketBaseUrl();
  return io(`${baseUrl}/room`, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
