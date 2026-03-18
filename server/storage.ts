import { type User, type InsertUser, type CallSession, type InsertCallSession, type Translation, type InsertTranslation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCallSession(id: string): Promise<CallSession | undefined>;
  createCallSession(session: InsertCallSession): Promise<CallSession>;
  updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | undefined>;
  
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslationsBySession(sessionId: string): Promise<Translation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private callSessions: Map<string, CallSession>;
  private translations: Map<string, Translation>;

  constructor() {
    this.users = new Map();
    this.callSessions = new Map();
    this.translations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCallSession(id: string): Promise<CallSession | undefined> {
    return this.callSessions.get(id);
  }

  async createCallSession(insertSession: InsertCallSession): Promise<CallSession> {
    const id = randomUUID();
    const session: CallSession = {
      ...insertSession,
      id,
      status: "waiting",
      createdAt: new Date(),
      endedAt: null,
      guestUserId: insertSession.guestUserId ?? null,
    };
    this.callSessions.set(id, session);
    return session;
  }

  async updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | undefined> {
    const session = this.callSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.callSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = randomUUID();
    const translation: Translation = {
      ...insertTranslation,
      id,
      timestamp: new Date(),
    };
    this.translations.set(id, translation);
    return translation;
  }

  async getTranslationsBySession(sessionId: string): Promise<Translation[]> {
    return Array.from(this.translations.values()).filter(
      (translation) => translation.sessionId === sessionId
    );
  }
}

export const storage = new MemStorage();
