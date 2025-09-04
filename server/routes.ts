import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertEmployeeSchema, insertAttendanceSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithEmployee(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Lead routes
  app.get('/api/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userIdFilter = user?.role === 'admin' ? undefined : userId;
      
      const { status, search } = req.query;
      
      let leads;
      if (search) {
        leads = await storage.searchLeads(search as string, userIdFilter);
      } else if (status) {
        leads = await storage.getLeadsByStatus(status as string, userIdFilter);
      } else {
        leads = await storage.getAllLeads(userIdFilter);
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leadData = insertLeadSchema.parse(req.body);
      
      const lead = await storage.createLead(leadData);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "created_lead",
        entityType: "lead",
        entityId: lead.id,
        details: { leadName: lead.name || "", leadEmail: lead.email || "" }
      });
      
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  app.put('/api/leads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = req.body;
      
      const lead = await storage.updateLead(id, updates);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "updated_lead",
        entityType: "lead",
        entityId: lead.id,
        details: { leadName: lead.name, updates }
      });
      
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const lead = await storage.getLead(id);
      await storage.deleteLead(id);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "deleted_lead",
        entityType: "lead",
        entityId: id,
        details: { leadName: lead?.name }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(400).json({ message: "Failed to delete lead" });
    }
  });

  app.post('/api/leads/import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { leads: leadsData, fieldMapping } = req.body;
      
      const importedLeads = [];
      
      for (const leadData of leadsData) {
        const mappedLead = {};
        
        // Apply field mapping
        for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
          if (targetField !== 'skip' && targetField && leadData[sourceField] !== undefined) {
            (mappedLead as any)[targetField as string] = leadData[sourceField];
          }
        }
        
        // Assign imported leads to the current user if not already assigned
        if (!(mappedLead as any).assignedTo) {
          (mappedLead as any).assignedTo = userId;
        }
        
        const validatedLead = insertLeadSchema.parse(mappedLead);
        const lead = await storage.createLead(validatedLead);
        importedLeads.push(lead);
      }
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "imported_leads",
        entityType: "lead",
        details: { count: importedLeads.length }
      });
      
      res.json({ success: true, count: importedLeads.length, leads: importedLeads });
    } catch (error) {
      console.error("Error importing leads:", error);
      res.status(400).json({ message: "Failed to import leads" });
    }
  });

  // Employee routes
  app.get('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employeeData = insertEmployeeSchema.parse(req.body);
      
      const employee = await storage.createEmployee(employeeData);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "created_employee",
        entityType: "employee",
        entityId: employee.id,
        details: { employeeId: employee.employeeId }
      });
      
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = req.body;
      
      const employee = await storage.updateEmployee(id, updates);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "updated_employee",
        entityType: "employee",
        entityId: employee.id,
        details: { employeeId: employee.employeeId, updates }
      });
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  // File upload for employee documents
  app.post('/api/employees/:id/documents', isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const documents = employee.documents || [];
      documents.push(req.file.filename);
      
      const updatedEmployee = await storage.updateEmployee(id, { documents });
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "uploaded_document",
        entityType: "employee",
        entityId: id,
        details: { fileName: req.file.originalname }
      });
      
      res.json({ success: true, fileName: req.file.filename });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Attendance routes
  app.post('/api/attendance/punch-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { location } = req.body;
      
      const attendance = await storage.punchIn(userId, location);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "punched_in",
        entityType: "attendance",
        entityId: attendance.id,
        details: { location }
      });
      
      res.json(attendance);
    } catch (error) {
      console.error("Error punching in:", error);
      res.status(400).json({ message: "Failed to punch in" });
    }
  });

  app.post('/api/attendance/punch-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { location } = req.body;
      
      const attendance = await storage.punchOut(userId, location);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "punched_out",
        entityType: "attendance",
        entityId: attendance.id,
        details: { location, totalHours: attendance.totalHours }
      });
      
      res.json(attendance);
    } catch (error) {
      console.error("Error punching out:", error);
      res.status(400).json({ message: "Failed to punch out" });
    }
  });

  app.get('/api/attendance/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date();
      
      const attendance = await storage.getAttendanceByDate(userId, today);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { startDate, endDate } = req.query;
      
      const userIdFilter = user?.role === 'admin' ? undefined : userId;
      
      const attendance = await storage.getAttendanceRecords(
        userIdFilter,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Activity logs routes
  app.get('/api/activity-logs', isAuthenticated, async (req: any, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getActivityLogs(limit ? parseInt(limit as string) : 50);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Statistics routes
  app.get('/api/stats/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userIdFilter = user?.role === 'admin' ? undefined : userId;
      
      const stats = await storage.getLeadStats(userIdFilter);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching lead stats:", error);
      res.status(500).json({ message: "Failed to fetch lead stats" });
    }
  });

  app.get('/api/stats/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getAttendanceStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ message: "Failed to fetch attendance stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
