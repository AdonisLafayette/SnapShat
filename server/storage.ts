import { type Friend, type InsertFriend, type Submission, type InsertSubmission, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Friends
  getAllFriends(): Promise<Friend[]>;
  getFriend(id: string): Promise<Friend | undefined>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  deleteFriend(id: string): Promise<void>;
  
  // Submissions
  getSubmissionByFriendId(friendId: string): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Cookies
  saveCookies(cookies: any[]): Promise<void>;
  getCookies(): Promise<any[] | undefined>;
  clearCookies(): Promise<void>;
}

export class MemStorage implements IStorage {
  private friends: Map<string, Friend>;
  private submissions: Map<string, Submission>;
  private settings: Settings | undefined;
  private cookies: any[] | undefined;

  constructor() {
    this.friends = new Map();
    this.submissions = new Map();
  }

  // Friends
  async getAllFriends(): Promise<Friend[]> {
    return Array.from(this.friends.values()).sort((a, b) => 
      b.addedAt.getTime() - a.addedAt.getTime()
    );
  }

  async getFriend(id: string): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const id = randomUUID();
    const friend: Friend = { 
      ...insertFriend, 
      id,
      addedAt: new Date()
    };
    this.friends.set(id, friend);
    return friend;
  }

  async deleteFriend(id: string): Promise<void> {
    this.friends.delete(id);
    // Also delete associated submissions
    for (const [subId, sub] of this.submissions.entries()) {
      if (sub.friendId === id) {
        this.submissions.delete(subId);
      }
    }
  }

  // Submissions
  async getSubmissionByFriendId(friendId: string): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(
      (sub) => sub.friendId === friendId
    );
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = { 
      ...insertSubmission, 
      id,
      startedAt: insertSubmission.startedAt || null,
      completedAt: insertSubmission.completedAt || null,
      errorMessage: insertSubmission.errorMessage || null,
      logEntries: insertSubmission.logEntries || null,
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    
    const updated = { ...submission, ...updates };
    this.submissions.set(id, updated);
    return updated;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    if (this.settings) {
      this.settings = { ...this.settings, ...insertSettings };
    } else {
      this.settings = { ...insertSettings, id: randomUUID() };
    }
    return this.settings;
  }

  // Cookies
  async saveCookies(cookies: any[]): Promise<void> {
    this.cookies = cookies;
  }

  async getCookies(): Promise<any[] | undefined> {
    return this.cookies;
  }

  async clearCookies(): Promise<void> {
    this.cookies = undefined;
  }
}

export const storage = new MemStorage();
