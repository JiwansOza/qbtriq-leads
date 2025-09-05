import {
  users,
  employees,
  leads,
  attendance,
  activityLogs,
  type User,
  type UpsertUser,
  type InsertEmployee,
  type Employee,
  type InsertLead,
  type Lead,
  type InsertAttendance,
  type Attendance,
  type InsertActivityLog,
  type ActivityLog,
  type UserWithEmployee,
  type LeadWithAssignee,
  type AttendanceWithUser,
  type ActivityLogWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithEmployee(id: string): Promise<UserWithEmployee | undefined>;
  
  // Employee operations
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee>;
  getAllEmployees(): Promise<UserWithEmployee[]>;
  
  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadWithAssignee(id: string): Promise<LeadWithAssignee | undefined>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  getAllLeads(userId?: string): Promise<LeadWithAssignee[]>;
  getLeadsByStatus(status: string, userId?: string): Promise<LeadWithAssignee[]>;
  searchLeads(query: string, userId?: string): Promise<LeadWithAssignee[]>;
  
  // Attendance operations
  punchIn(userId: string, location?: {lat: number, lng: number, address?: string}): Promise<Attendance>;
  punchOut(userId: string, location?: {lat: number, lng: number, address?: string}): Promise<Attendance>;
  getAttendanceByDate(userId: string, date: Date): Promise<Attendance | undefined>;
  getAttendanceRecords(userId?: string, startDate?: Date, endDate?: Date): Promise<AttendanceWithUser[]>;
  
  // Activity log operations
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLogWithUser[]>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLogWithUser[]>;
  
  // Statistics
  getLeadStats(userId?: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    followUp: number;
    notInterested: number;
    converted: number;
  }>;
  getAttendanceStats(startDate?: Date, endDate?: Date): Promise<{
    totalEmployees: number;
    presentToday: number;
    attendanceRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithEmployee(id: string): Promise<UserWithEmployee | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(users.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.users,
      employee: result.employees || undefined,
    };
  }

  // Employee operations
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee> {
    const [updated] = await db
      .update(employees)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async getAllEmployees(): Promise<UserWithEmployee[]> {
    const results = await db
      .select()
      .from(users)
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(users.role, "employee"));
    
    return results.map(result => ({
      ...result.users,
      employee: result.employees || undefined,
    }));
  }

  // Lead operations
  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadWithAssignee(id: string): Promise<LeadWithAssignee | undefined> {
    const [result] = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.leads,
      assignedUser: result.users || undefined,
    };
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getAllLeads(userId?: string): Promise<LeadWithAssignee[]> {
    let query = db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .orderBy(desc(leads.createdAt));

    if (userId) {
      query = query.where(eq(leads.assignedTo, userId)) as any;
    }

    const results = await query;
    
    return results.map(result => ({
      ...result.leads,
      assignedUser: result.users || undefined,
    }));
  }

  async getLeadsByStatus(status: string, userId?: string): Promise<LeadWithAssignee[]> {
    let whereCondition = eq(leads.status, status as any);
    
    if (userId) {
      whereCondition = and(whereCondition, eq(leads.assignedTo, userId)) as any;
    }

    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(whereCondition)
      .orderBy(desc(leads.createdAt));
    
    return results.map(result => ({
      ...result.leads,
      assignedUser: result.users || undefined,
    }));
  }

  async searchLeads(query: string, userId?: string): Promise<LeadWithAssignee[]> {
    let whereCondition = or(
      ilike(leads.name, `%${query}%`),
      ilike(leads.email, `%${query}%`),
      ilike(leads.company, `%${query}%`)
    );
    
    if (userId) {
      whereCondition = and(whereCondition, eq(leads.assignedTo, userId)) as any;
    }

    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(whereCondition)
      .orderBy(desc(leads.createdAt));
    
    return results.map(result => ({
      ...result.leads,
      assignedUser: result.users || undefined,
    }));
  }

  // Attendance operations
  async punchIn(userId: string, location?: {lat: number, lng: number, address?: string}): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), gte(attendance.date, today)));
    
    if (existing) {
      const [updated] = await db
        .update(attendance)
        .set({
          punchIn: new Date(),
          punchInLocation: location,
        })
        .where(eq(attendance.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(attendance)
        .values({
          userId,
          date: new Date(),
          punchIn: new Date(),
          punchInLocation: location,
        })
        .returning();
      return created;
    }
  }

  async punchOut(userId: string, location?: {lat: number, lng: number, address?: string}): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), gte(attendance.date, today)));
    
    if (!existing || !existing.punchIn) {
      throw new Error("No punch-in record found for today");
    }

    const punchOutTime = new Date();
    const totalHours = (punchOutTime.getTime() - existing.punchIn.getTime()) / (1000 * 60 * 60);

    const [updated] = await db
      .update(attendance)
      .set({
        punchOut: punchOutTime,
        punchOutLocation: location,
        totalHours: totalHours.toString(),
      })
      .where(eq(attendance.id, existing.id))
      .returning();
    
    return updated;
  }

  async getAttendanceByDate(userId: string, date: Date): Promise<Attendance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
    
    return record;
  }

  async getAttendanceRecords(userId?: string, startDate?: Date, endDate?: Date): Promise<AttendanceWithUser[]> {
    let query = db
      .select()
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .orderBy(desc(attendance.date));

    let conditions = [];
    
    if (userId) {
      conditions.push(eq(attendance.userId, userId));
    }
    
    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    
    return results.map(result => ({
      ...result.attendance,
      user: result.users,
    }));
  }

  // Activity log operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLogs).values(activity).returning();
    return created;
  }

  async getActivityLogs(limit = 50): Promise<ActivityLogWithUser[]> {
    const results = await db
      .select()
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
    
    return results.map(result => ({
      ...result.activity_logs,
      user: result.users,
    }));
  }

  async getUserActivityLogs(userId: string, limit = 50): Promise<ActivityLogWithUser[]> {
    const results = await db
      .select()
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
    
    return results.map(result => ({
      ...result.activity_logs,
      user: result.users,
    }));
  }

  // Statistics
  async getLeadStats(userId?: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    followUp: number;
    notInterested: number;
    converted: number;
  }> {
    let baseQuery = db.select().from(leads);
    
    if (userId) {
      baseQuery = baseQuery.where(eq(leads.assignedTo, userId)) as any;
    }

    const allLeads = await baseQuery;
    
    return {
      total: allLeads.length,
      new: allLeads.filter(l => l.status === "NEW").length,
      contacted: allLeads.filter(l => l.status === "CONTACTED").length,
      followUp: allLeads.filter(l => l.status === "FOLLOW_UP").length,
      notInterested: allLeads.filter(l => l.status === "NOT_INTERESTED").length,
      converted: allLeads.filter(l => l.status === "CONVERTED").length,
    };
  }

  async getAttendanceStats(startDate?: Date, endDate?: Date): Promise<{
    totalEmployees: number;
    presentToday: number;
    attendanceRate: number;
  }> {
    const totalEmployees = await db.select().from(users).where(eq(users.role, "employee"));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const presentToday = await db
      .select()
      .from(attendance)
      .where(
        and(
          gte(attendance.date, today),
          eq(attendance.status, "present")
        )
      );

    const attendanceRate = totalEmployees.length > 0 
      ? (presentToday.length / totalEmployees.length) * 100 
      : 0;

    return {
      totalEmployees: totalEmployees.length,
      presentToday: presentToday.length,
      attendanceRate: Math.round(attendanceRate),
    };
  }
}

export const storage = new DatabaseStorage();
