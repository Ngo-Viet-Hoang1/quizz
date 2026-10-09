import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  JoinRoomPayload,
  RoomPinPayload,
  SubmitAnswerPayload,
  JoinedSuccessfullyResponse,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  QuestionStartEvent,
  AnswerResultResponse,
  AnswerSubmittedTickEvent,
  QuestionRevealEvent,
  RoomEndedEvent,
  RoomClosedEvent,
  RoomErrorResponse,
  ROOM_WS_EVENTS,
  RoomPhase,
  PlayerState,
} from '@repo/shared-types';
import { RoomGameplayService } from './services/room-gameplay.service';

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

@WebSocketGateway({
  cors: { origin: isProduction ? allowedOrigins : '*', credentials: true },
  namespace: '/room',
})
export class RoomGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(RoomGateway.name);

  // Map socketId -> PIN for fast disconnect lookup
  private socketRoomMap = new Map<string, string>();

  constructor(private readonly roomGameplayService: RoomGameplayService) {}

  private sendError(client: Socket, message: string): void {
    const errorPayload: RoomErrorResponse = { message };
    client.emit(ROOM_WS_EVENTS.ROOM_ERROR, errorPayload);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const pin = this.socketRoomMap.get(client.id);
    if (pin) {
      this.socketRoomMap.delete(client.id);
      const updated = await this.roomGameplayService.removePlayer(pin, client.id);
      if (updated) {
        const leftPayload: PlayerLeftEvent = {
          socketId: client.id,
          playersCount: Object.keys(updated.players).length,
        };
        this.server.to(pin).emit(ROOM_WS_EVENTS.PLAYER_LEFT, leftPayload);
      }
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ): Promise<void> {
    try {
      const room = await this.roomGameplayService.joinRoom(
        data.pin,
        client.id,
        data.nickname,
        data.userId ?? null,
        data.playerId ?? null,
      );
      client.join(data.pin);
      this.socketRoomMap.set(client.id, data.pin);

      const joinedRes: JoinedSuccessfullyResponse = { room };
      client.emit(ROOM_WS_EVENTS.JOINED_SUCCESSFULLY, joinedRes);

      // Only broadcast player_joined if this is a player (not host join/reconnect)
      if (client.id !== room.hostSocketId && data.nickname) {
        const joinedEvent: PlayerJoinedEvent = {
          nickname: data.nickname.trim(),
          playersCount: Object.keys(room.players).length,
          players: Object.values(room.players).map((p) => ({
            nickname: p.nickname,
            score: p.score,
          })),
        };
        this.server.to(data.pin).emit(ROOM_WS_EVENTS.PLAYER_JOINED, joinedEvent);
      }
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.START_ROOM)
  async handleStartRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RoomPinPayload,
  ): Promise<void> {
    try {
      const { room, question } = await this.roomGameplayService.startRoom(data.pin, client.id);
      const startEvent: QuestionStartEvent = {
        question,
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        startedAt: room.questionStartedAt,
      };
      this.server.to(data.pin).emit(ROOM_WS_EVENTS.QUESTION_START, startEvent);
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.SUBMIT_ANSWER)
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubmitAnswerPayload,
  ): Promise<void> {
    try {
      const result = await this.roomGameplayService.submitAnswer(
        data.pin,
        client.id,
        data.optionId,
      );
      const answerRes: AnswerResultResponse = {
        isCorrect: result.isCorrect,
        scoreGained: result.scoreGained,
        totalScore: result.totalScore,
        streak: result.streak,
      };
      client.emit(ROOM_WS_EVENTS.ANSWER_RESULT, answerRes);

      const tickEvent: AnswerSubmittedTickEvent = {
        socketId: client.id,
        nickname: result.nickname,
        answeredCount: result.answeredCount,
        totalPlayers: result.totalPlayers,
      };
      this.server.to(data.pin).emit(ROOM_WS_EVENTS.ANSWER_SUBMITTED_TICK, tickEvent);
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.REVEAL_ANSWERS)
  async handleRevealAnswers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RoomPinPayload,
  ): Promise<void> {
    try {
      const result = await this.roomGameplayService.revealAnswers(data.pin, client.id);
      const revealEvent: QuestionRevealEvent = result;
      this.server.to(data.pin).emit(ROOM_WS_EVENTS.QUESTION_REVEAL, revealEvent);
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.NEXT_QUESTION)
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RoomPinPayload,
  ): Promise<void> {
    try {
      const result = await this.roomGameplayService.nextQuestion(data.pin, client.id);
      if (result.nextPhase === RoomPhase.PODIUM) {
        const endedEvent: RoomEndedEvent = { podium: result.leaderboard.slice(0, 3) };
        this.server.to(data.pin).emit(ROOM_WS_EVENTS.ROOM_ENDED, endedEvent);
      } else {
        const startEvent: QuestionStartEvent = {
          question: result.question,
          questionIndex: result.questionIndex,
          totalQuestions: result.totalQuestions,
          startedAt: result.startedAt,
          leaderboard: result.leaderboard,
        };
        this.server.to(data.pin).emit(ROOM_WS_EVENTS.QUESTION_START, startEvent);
      }
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  @SubscribeMessage(ROOM_WS_EVENTS.END_ROOM)
  async handleEndRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RoomPinPayload,
  ): Promise<void> {
    try {
      this.logger.log(`Host requested to end room PIN: ${data.pin}`);
      const { leaderboard } = await this.roomGameplayService.endRoom(data.pin, client.id);
      const closedEvent: RoomClosedEvent = { leaderboard };
      this.server.to(data.pin).emit(ROOM_WS_EVENTS.ROOM_CLOSED, closedEvent);
    } catch (err: unknown) {
      this.sendError(client, (err as Error).message);
    }
  }

  broadcastRoomClosed(pin: string, leaderboard: PlayerState[] = []): void {
    if (this.server) {
      this.logger.log(`Broadcasting room closed for PIN: ${pin} via REST`);
      const closedEvent: RoomClosedEvent = { leaderboard };
      this.server.to(pin).emit(ROOM_WS_EVENTS.ROOM_CLOSED, closedEvent);
    }
  }
}
