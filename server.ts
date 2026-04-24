import dns from "node:dns";

// Force IPv4 preference to resolve ECONNREFUSED issues with IPv6-only hosts in some environments
// This MUST be called before other modules are imported
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Use Google's DNS servers as a fallback if the default ones are failing
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.warn("⚠️ Failed to set custom DNS servers:", e);
}

// Monkeypatch dns.lookup to strictly force IPv4 and add retries for EAI_AGAIN
const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
  let lookupOptions: any = options;
  if (typeof options === "function") {
    callback = options;
    lookupOptions = { family: 4 };
  } else if (typeof options === "object") {
    lookupOptions = { ...options, family: 4 };
  } else {
    lookupOptions = { family: 4 };
  }

  let attempts = 0;
  const maxAttempts = 3;

  const performLookup = () => {
    attempts++;
    originalLookup(hostname, lookupOptions, (err, address, family) => {
      if (err && err.code === "EAI_AGAIN" && attempts < maxAttempts) {
        console.warn(`⚠️ DNS lookup EAI_AGAIN for ${hostname}. Retry ${attempts}/${maxAttempts}...`);
        return setTimeout(performLookup, attempts * 100);
      }
      
      // If original lookup fails, try dns.resolve4 as a last resort (uses custom servers)
      if (err && (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND")) {
        console.warn(`⚠️ dns.lookup failed for ${hostname} (${err.code}). Trying dns.resolve4 fallback...`);
        return dns.resolve4(hostname, (resolveErr, addresses) => {
          if (!resolveErr && addresses && addresses.length > 0) {
            console.log(`✅ dns.resolve4 fallback succeeded for ${hostname}: ${addresses[0]}`);
            // @ts-ignore
            return callback(null, addresses[0], 4);
          }
          // If fallback also fails, return original error
          // @ts-ignore
          callback(err, address, family);
        });
      }

      // @ts-ignore
      callback(err, address, family);
    });
  };

  return performLookup();
};

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import dotenv from "dotenv";
import Stripe from "stripe";
import crypto from "node:crypto";
import net from "node:net";

dotenv.config();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

app.use(express.json());
app.use(cors());

// Database connection
const poolConfig: any = {
  connectionString: process.env.DATABASE_URL,
  // For the sake of the preview, we'll handle missing DB gracefully
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false }
};
const pool = new pg.Pool(poolConfig);

const JWT_SECRET = process.env.JWT_SECRET || "erp-secret-key";

// --- Email Service ---
const sendEmail = async (to: string, subject: string, body: string) => {
  // In a real app, integrate with SendGrid/Postmark/etc.
  console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}`);
  return { success: true };
};

// --- Helper to create notification ---
const createNotification = async (tenantId: string, userId: string, title: string, message: string, type: string = "info") => {
  const result = await pool.query(
    "INSERT INTO notifications (tenant_id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [tenantId, userId, title, message, type]
  );
  return result.rows[0];
};

// --- Helper to create activity log ---
const createActivityLog = async (tenantId: string, userId: string, action: string, target: string) => {
  const result = await pool.query(
    "INSERT INTO activity_logs (tenant_id, user_id, action, target) VALUES ($1, $2, $3, $4) RETURNING *",
    [tenantId, userId, action, target]
  );
  return result.rows[0];
};

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL: DATABASE_URL is missing.");
    return;
  }
  
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully to PostgreSQL.");
    
    // Run migrations
    try {
      await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Direct'");
      console.log("✅ Migration: 'source' column ensured in 'leads' table.");
    } catch (migErr) {
      console.error("⚠️ Migration failed:", migErr);
    }

    client.release();
  } catch (err: any) {
    console.error("❌ CRITICAL: Database connection failed:", err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.error("💡 HINT: Connection refused. This often happens when the database host is IPv6-only or the network prefers IPv6.");
      console.error("👉 SOLUTION: Try using the Supabase IPv4 connection pooler (port 6543) or ensure your DATABASE_URL uses an IPv4 address.");
      console.error("👉 CURRENT HOST:", process.env.DATABASE_URL?.split("@")[1]?.split(":")[0]);
    } else if (err.message.includes("EAI_AGAIN")) {
      console.error("💡 HINT: DNS lookup failed (EAI_AGAIN). This is a temporary failure in name resolution.");
      console.error("👉 SOLUTION: Check your internet connection or if the database host is correct. Using the Supabase pooler (port 6543) often helps.");
    }
  }
}

// Middleware to verify JWT and get tenantId
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    let user;
    try {
      const result = await pool.query("SELECT id, tenant_id, full_name, email, role, department FROM users WHERE id = $1", [decoded.userId]);
      user = result.rows[0];
    } catch (dbError: any) {
      console.error("Database query error in authenticate:", dbError.message);
      return res.status(500).json({ error: "Database connection error" });
    }

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// RBAC Middleware
const checkRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: Insufficient role" });
    }
    next();
  };
};

const checkDepartment = (allowedDepartments: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // Admins bypass department checks
    if (req.user.role === "Admin") return next();

    if (!allowedDepartments.includes(req.user.department)) {
      return res.status(403).json({ error: "Access denied: Incorrect department" });
    }
    next();
  };
};

// --- Stripe Routes ---

app.post("/api/billing/create-checkout-session", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { priceId } = req.body;

  try {
    const result = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantId]);
    const tenant = result.rows[0];

    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.APP_URL}/erp/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/erp/billing?canceled=true`,
      metadata: { tenantId }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI Function Calling Endpoints (Natural Language Actions) ---

app.post("/api/ai/execute-action", authenticate, async (req: any, res) => {
  const { tenantId, id: userId } = req.user;
  const { action, params } = req.body;

  try {
    let result;
    switch (action) {
      case "create_lead":
        const leadRes = await pool.query(
          "INSERT INTO leads (tenant_id, name, email, company, status, value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [tenantId, params.name, params.email, params.company, params.status || "new", params.value || 0]
        );
        result = leadRes.rows[0];
        await createNotification(tenantId, userId, "New Lead Created", `A new lead for ${params.name} has been added via AI.`, "success");
        await createActivityLog(tenantId, userId, "created a lead for", params.name);
        break;
      case "create_invoice":
        const invRes = await pool.query(
          "INSERT INTO invoices (tenant_id, customer_name, amount, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [tenantId, params.customer_name, params.amount, params.status || "draft", params.due_date]
        );
        result = invRes.rows[0];
        await createNotification(tenantId, userId, "New Invoice Created", `An invoice for ${params.customer_name} of $${params.amount} has been created.`, "info");
        await createActivityLog(tenantId, userId, "created an invoice for", params.customer_name);
        break;
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
app.get("/api/notifications", authenticate, async (req: any, res) => {
  const { id: userId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications/:id/read", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Activity Logs
app.get("/api/activity-logs", authenticate, async (req: any, res: any) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query(
      `SELECT l.*, u.full_name as user_name 
       FROM activity_logs l 
       JOIN users u ON l.user_id = u.id 
       WHERE l.tenant_id = $1 
       ORDER BY l.created_at DESC LIMIT 50`, 
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// Messaging
app.get("/api/messages", authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  try {
    const result = await pool.query(
      `SELECT m.*, s.full_name as sender_name, r.full_name as receiver_name 
       FROM messages m 
       JOIN users s ON m.sender_id = s.id 
       JOIN users r ON m.receiver_id = r.id 
       WHERE m.tenant_id = $1 AND (m.sender_id = $2 OR m.receiver_id = $2) 
       ORDER BY m.created_at ASC`, 
      [tenantId, userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/messages", authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { receiverId, content } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO messages (tenant_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *",
      [tenantId, userId, receiverId, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Accounting: Payments
app.get("/api/accounting/payments", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query(`
      SELECT p.*, i.customer_name 
      FROM payments p 
      LEFT JOIN invoices i ON p.invoice_id = i.id 
      WHERE p.tenant_id = $1 
      ORDER BY p.payment_date DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

app.post("/api/accounting/payments", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { invoiceId, amount, paymentMethod, paymentDate, notes } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO payments (tenant_id, invoice_id, amount, payment_method, payment_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [tenantId, invoiceId, amount, paymentMethod, paymentDate || new Date(), notes]
    );
    
    // Update invoice status if fully paid
    if (invoiceId) {
      const invRes = await pool.query("SELECT amount FROM invoices WHERE id = $1", [invoiceId]);
      const payRes = await pool.query("SELECT SUM(amount) FROM payments WHERE invoice_id = $1", [invoiceId]);
      const totalPaid = parseFloat(payRes.rows[0].sum || 0);
      const invoiceAmount = parseFloat(invRes.rows[0].amount);
      
      if (totalPaid >= invoiceAmount) {
        await pool.query("UPDATE invoices SET status = 'paid' WHERE id = $1", [invoiceId]);
      }
    }

    await createActivityLog(tenantId, req.user.id, "recorded a payment", `Amount: $${amount}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// Billing
app.get("/api/billing/info", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch billing info" });
  }
});

app.get("/api/billing/transactions", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    // For now, use invoices as transactions
    const result = await pool.query("SELECT id, customer_name as description, amount, status, created_at as date FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// --- API Routes ---

// CRM: Leads
app.get("/api/crm/leads", authenticate, checkDepartment(["Sales"]), async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query(
      `SELECT l.*, u.full_name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.tenant_id = $1 
       ORDER BY l.created_at DESC`, 
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.post("/api/crm/leads", authenticate, checkDepartment(["Sales"]), async (req: any, res) => {
  const { tenantId, id: userId } = req.user;
  const { name, email, company, status, value, assignedTo } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO leads (tenant_id, name, email, company, status, value, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [tenantId, name, email, company, status || "new", value || 0, assignedTo || userId]
    );
    await createActivityLog(tenantId, userId, "created a lead for", name);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create lead" });
  }
});

app.put("/api/crm/leads/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, email, company, status, value, assignedTo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE leads SET name = $1, email = $2, company = $3, status = $4, value = $5, assigned_to = $6 WHERE id = $7 AND tenant_id = $8 RETURNING *",
      [name, email, company, status, value, assignedTo, id, tenantId]
    );
    if (result.rows.length > 0) {
      await createActivityLog(tenantId, req.user.id, "updated lead", name);
      return res.json(result.rows[0]);
    }
    res.status(404).json({ error: "Lead not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

app.delete("/api/crm/leads/:id", authenticate, checkDepartment(["Sales"]), async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM leads WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Lead not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

app.post("/api/crm/leads/bulk", authenticate, checkDepartment(["Sales"]), async (req: any, res) => {
  const { tenantId, id: userId } = req.user;
  const leads = req.body; // Array of lead objects

  if (!Array.isArray(leads)) return res.status(400).json({ error: "Invalid data format" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const lead of leads) {
      if (!lead.name) continue; // Skip rows without name
      await client.query(
        "INSERT INTO leads (tenant_id, name, email, company, status, value, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [tenantId, lead.name, lead.email, lead.company, lead.status || "new", lead.value || 0, lead.assignedTo || userId]
      );
    }
    await client.query("COMMIT");
    await createActivityLog(tenantId, userId, "bulk imported leads", `${leads.length} records`);
    res.json({ success: true, count: leads.length });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Bulk lead import error:", error);
    res.status(500).json({ error: "Bulk import failed: " + error.message });
  } finally {
    client.release();
  }
});

app.put("/api/crm/leads/bulk-status", authenticate, checkDepartment(["Sales"]), async (req: any, res) => {
  const { tenantId, id: userId } = req.user;
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: "Invalid data format. Expected {ids: string[], status: string}" });
  }

  try {
    const result = await pool.query(
      "UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2) AND tenant_id = $3 RETURNING *",
      [status, ids, tenantId]
    );
    await createActivityLog(tenantId, userId, "updated status in bulk for", `${result.rowCount} leads`);
    res.json({ success: true, count: result.rowCount });
  } catch (error) {
    console.error("Bulk status update error:", error);
    res.status(500).json({ error: "Bulk status update failed" });
  }
});

// User Management (Admin Only)
app.get("/api/users", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT id, full_name, email, role, department, created_at FROM users WHERE tenant_id = $1", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", authenticate, checkRole(["Admin"]), async (req: any, res) => {
  const { tenantId } = req.user;
  const { fullName, email, password, role, department } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (tenant_id, full_name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, role, department",
      [tenantId, fullName, email, hashedPassword, role || "Employee", department || "None"]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/api/users/:id", authenticate, checkRole(["Admin"]), async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { fullName, email, role, department } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET full_name = $1, email = $2, role = $3, department = $4 WHERE id = $5 AND tenant_id = $6 RETURNING id, full_name, email, role, department",
      [fullName, email, role, department, id, tenantId]
    );
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", authenticate, checkRole(["Admin"]), async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    // Prevent self-deletion
    if (id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    
    const result = await pool.query("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.put("/api/users/me", authenticate, async (req: any, res) => {
  const { id: userId } = req.user;
  const { fullName, password } = req.body;
  try {
    let updateQuery = "UPDATE users SET full_name = $1";
    let params = [fullName, userId];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password_hash = $3";
      params.push(hashedPassword);
    }
    
    updateQuery += " WHERE id = $2 RETURNING id, full_name, email, role, department";
    
    const result = await pool.query(updateQuery, params);
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Inventory: Products
app.get("/api/inventory/products", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM products WHERE tenant_id = $1 ORDER BY name ASC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/inventory/products", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { name, sku, category, price, stock_quantity, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (tenant_id, name, sku, category, price, stock_quantity, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [tenantId, name, sku, category, price, stock_quantity || 0, min_stock_level || 5]
    );
    await createActivityLog(tenantId, req.user.id, "added a new product", name);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/inventory/products/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, sku, category, price, stock_quantity, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET name = $1, sku = $2, category = $3, price = $4, stock_quantity = $5, min_stock_level = $6 WHERE id = $7 AND tenant_id = $8 RETURNING *",
      [name, sku, category, price, stock_quantity, min_stock_level, id, tenantId]
    );
    if (result.rows.length > 0) {
      await createActivityLog(tenantId, req.user.id, "updated product", name);
      return res.json(result.rows[0]);
    }
    res.status(404).json({ error: "Product not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/inventory/products/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Product not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.post("/api/inventory/products/bulk", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const products = req.body;

  if (!Array.isArray(products)) return res.status(400).json({ error: "Invalid data format" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const product of products) {
      if (!product.name || !product.sku || product.price === undefined) continue;
      await client.query(
        "INSERT INTO products (tenant_id, name, sku, category, price, stock_quantity, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [tenantId, product.name, product.sku, product.category, product.price || 0, product.stockQuantity || 0, product.minStockLevel || 10]
      );
    }
    await client.query("COMMIT");
    await createActivityLog(tenantId, req.user.id, "bulk imported products", `${products.length} records`);
    res.json({ success: true, count: products.length });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Bulk import failed" });
  } finally {
    client.release();
  }
});

// HR: Employees
app.get("/api/hr/employees", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      WHERE e.tenant_id = $1 
      ORDER BY e.full_name ASC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

async function getOrCreateDepartment(tenantId: string, deptName: string) {
  if (!deptName) return null;
  
  // Try to find existing department
  const findRes = await pool.query(
    "SELECT id FROM departments WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)",
    [tenantId, deptName]
  );
  
  if (findRes.rows.length > 0) {
    return findRes.rows[0].id;
  }
  
  // Create new department if not found
  const createRes = await pool.query(
    "INSERT INTO departments (tenant_id, name) VALUES ($1, $2) RETURNING id",
    [tenantId, deptName]
  );
  
  return createRes.rows[0].id;
}

app.post("/api/hr/employees", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { fullName, email, jobTitle, departmentId, salary, hireDate } = req.body;
  try {
    const actualDeptId = await getOrCreateDepartment(tenantId, departmentId);

    const result = await pool.query(
      "INSERT INTO employees (tenant_id, full_name, email, job_title, department_id, salary, hire_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [tenantId, fullName, email, jobTitle, actualDeptId, salary, hireDate || new Date()]
    );
    
    const fullRecord = await pool.query(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      WHERE e.id = $1
    `, [result.rows[0].id]);

    await createActivityLog(tenantId, req.user.id, "onboarded new employee", fullName);
    res.json(fullRecord.rows[0]);
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

app.put("/api/hr/employees/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { fullName, email, jobTitle, departmentId, salary, status } = req.body;
  try {
    const actualDeptId = await getOrCreateDepartment(tenantId, departmentId);

    const result = await pool.query(
      "UPDATE employees SET full_name = $1, email = $2, job_title = $3, department_id = $4, salary = $5, status = $6 WHERE id = $7 AND tenant_id = $8 RETURNING *",
      [fullName, email, jobTitle, actualDeptId, salary, status, id, tenantId]
    );
    
    if (result.rows.length > 0) {
      const fullRecord = await pool.query(`
        SELECT e.*, d.name as department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
        WHERE e.id = $1
      `, [result.rows[0].id]);

      await createActivityLog(tenantId, req.user.id, "updated employee info", fullName);
      return res.json(fullRecord.rows[0]);
    }
    res.status(404).json({ error: "Employee not found" });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

app.delete("/api/hr/employees/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM employees WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Employee not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

app.post("/api/hr/employees/bulk", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const employees = req.body;

  if (!Array.isArray(employees)) return res.status(400).json({ error: "Invalid data format" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const emp of employees) {
      if (!emp.fullName || !emp.email) continue;
      // Reusing department logic if needed, but for bulk we'll do it inside loop
      // Optimizing: find or create dept
      let deptId = null;
      if (emp.department) {
        const dRes = await client.query("SELECT id FROM departments WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)", [tenantId, emp.department]);
        if (dRes.rows.length > 0) {
          deptId = dRes.rows[0].id;
        } else {
          const createD = await client.query("INSERT INTO departments (tenant_id, name) VALUES ($1, $2) RETURNING id", [tenantId, emp.department]);
          deptId = createD.rows[0].id;
        }
      }

      await client.query(
        "INSERT INTO employees (tenant_id, full_name, email, job_title, department_id, salary, hire_date) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [tenantId, emp.fullName, emp.email, emp.jobTitle, deptId, emp.salary || 0, emp.hireDate || new Date()]
      );
    }
    await client.query("COMMIT");
    await createActivityLog(tenantId, req.user.id, "bulk imported employees", `${employees.length} records`);
    res.json({ success: true, count: employees.length });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Bulk import failed" });
  } finally {
    client.release();
  }
});

// Accounting: Invoices
app.get("/api/accounting/invoices", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

app.post("/api/accounting/invoices", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { customerName, amount, status, dueDate } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO invoices (tenant_id, customer_name, amount, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [tenantId, customerName, amount, status || "draft", dueDate]
    );
    await createActivityLog(tenantId, req.user.id, "created an invoice for", customerName);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

app.put("/api/accounting/invoices/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { customerName, amount, dueDate, status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE invoices SET customer_name = $1, amount = $2, due_date = $3, status = $4 WHERE id = $5 AND tenant_id = $6 RETURNING *",
      [customerName, amount, dueDate, status, id, tenantId]
    );
    if (result.rows.length > 0) {
      await createActivityLog(tenantId, req.user.id, "updated invoice for", customerName);
      return res.json(result.rows[0]);
    }
    res.status(404).json({ error: "Invoice not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

app.delete("/api/accounting/invoices/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM invoices WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Invoice not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

app.post("/api/accounting/invoices/bulk", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const invoices = req.body;

  if (!Array.isArray(invoices)) return res.status(400).json({ error: "Invalid data format" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const inv of invoices) {
      if (!inv.customerName || inv.amount === undefined) continue;
      await client.query(
        "INSERT INTO invoices (tenant_id, customer_name, amount, status, due_date) VALUES ($1, $2, $3, $4, $5)",
        [tenantId, inv.customerName, inv.amount || 0, inv.status || 'draft', inv.dueDate || new Date()]
      );
    }
    await client.query("COMMIT");
    await createActivityLog(tenantId, req.user.id, "bulk imported invoices", `${invoices.length} records`);
    res.json({ success: true, count: invoices.length });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Bulk import failed" });
  } finally {
    client.release();
  }
});

// Accounting: Expenses
app.get("/api/accounting/expenses", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM expenses WHERE tenant_id = $1 ORDER BY date DESC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/accounting/expenses", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { description, amount, category, date } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO expenses (tenant_id, description, amount, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [tenantId, description, amount, category, date || new Date()]
    );
    await createActivityLog(tenantId, req.user.id, "recorded an expense", description);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

app.delete("/api/accounting/expenses/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM expenses WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Expense not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Projects: Projects
app.get("/api/projects", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post("/api/projects", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { name, description, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO projects (tenant_id, name, description, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [tenantId, name, description, status || "active"]
    );
    await createActivityLog(tenantId, req.user.id, "started a new project", name);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

app.put("/api/projects/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, description, status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE projects SET name = $1, description = $2, status = $3 WHERE id = $4 AND tenant_id = $5 RETURNING *",
      [name, description, status, id, tenantId]
    );
    if (result.rows.length > 0) {
      await createActivityLog(tenantId, req.user.id, "updated project", name);
      return res.json(result.rows[0]);
    }
    res.status(404).json({ error: "Project not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

app.delete("/api/projects/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM projects WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Project not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Projects: Tasks
app.get("/api/projects/tasks", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name as assigned_to_name 
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      WHERE t.tenant_id = $1 
      ORDER BY t.created_at DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/projects/tasks", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { projectId, title, description, status, priority, dueDate, due_date, assignedTo, assigned_to } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (tenant_id, project_id, title, description, status, priority, due_date, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [tenantId, projectId, title, description, status || "todo", priority || "medium", dueDate || due_date, assignedTo || assigned_to]
    );
    
    // Get the name for the response
    if (result.rows[0].assigned_to) {
      const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1", [result.rows[0].assigned_to]);
      result.rows[0].assigned_to_name = userRes.rows[0]?.full_name;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/api/projects/tasks/:id", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { title, description, status, priority, dueDate, due_date, assignedTo, assigned_to } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to = $6 WHERE id = $7 AND tenant_id = $8 RETURNING *",
      [title, description, status, priority, dueDate || due_date, assignedTo || assigned_to, id, tenantId]
    );
    
    if (result.rows.length > 0) {
      if (result.rows[0].assigned_to) {
        const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1", [result.rows[0].assigned_to]);
        result.rows[0].assigned_to_name = userRes.rows[0]?.full_name;
      }
      return res.json(result.rows[0]);
    }
    res.status(404).json({ error: "Task not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/projects/tasks/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Task not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Dashboard Stats
app.get("/api/dashboard/recommendations", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const [leadsRes, productsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM leads WHERE tenant_id = $1 AND status = 'qualified'", [tenantId]),
      pool.query("SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND stock_level < 10", [tenantId])
    ]);

    const recommendations = [];
    if (parseInt(leadsRes.rows[0].count) > 0) {
      recommendations.push({ 
        title: "High-Value Leads Detected", 
        desc: `You have ${leadsRes.rows[0].count} qualified leads waiting for follow-up.`, 
        type: "CRM", 
        priority: "Critical" 
      });
    }
    if (parseInt(productsRes.rows[0].count) > 0) {
      recommendations.push({ 
        title: "Low Stock Alert", 
        desc: `${productsRes.rows[0].count} products are running low on stock. Restock soon.`, 
        type: "Inventory", 
        priority: "High" 
      });
    }
    
    // Default if nothing else
    if (recommendations.length === 0) {
      recommendations.push({ 
        title: "Business Health Check", 
        desc: "Your business metrics are looking stable. Consider launching a new campaign to boost leads.", 
        type: "General", 
        priority: "Medium" 
      });
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.get("/api/dashboard/stats", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const [leadsRes, productsRes, revenueRes, conversionRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM leads WHERE tenant_id = $1", [tenantId]),
      pool.query("SELECT COUNT(*) FROM products WHERE tenant_id = $1", [tenantId]),
      pool.query("SELECT SUM(amount) FROM invoices WHERE tenant_id = $1 AND status = 'paid'", [tenantId]),
      pool.query(`
        SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0 
            ELSE (COUNT(*) FILTER (WHERE status = 'qualified')::float / COUNT(*)) * 100 
          END as rate 
        FROM leads WHERE tenant_id = $1
      `, [tenantId])
    ]);

    res.json({
      revenue: parseFloat(revenueRes.rows[0].sum || 0),
      leads: parseInt(leadsRes.rows[0].count),
      products: parseInt(productsRes.rows[0].count),
      conversionRate: parseFloat(parseFloat(conversionRes.rows[0].rate).toFixed(1))
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Analytics Data
app.get("/api/analytics/insights", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const [revenueRes, leadsRes] = await Promise.all([
      pool.query("SELECT SUM(amount) as total FROM invoices WHERE tenant_id = $1 AND status = 'paid'", [tenantId]),
      pool.query("SELECT COUNT(*) as total FROM leads WHERE tenant_id = $1", [tenantId])
    ]);

    const revenue = parseFloat(revenueRes.rows[0].total || 0);
    const leads = parseInt(leadsRes.rows[0].total || 0);

    let insight = "Based on your current data, your business is showing steady performance. Keep focusing on lead conversion to drive growth.";
    let growth = "+5.2%";

    if (revenue > 10000) {
      insight = "Strong revenue performance detected! Your current sales velocity suggests a potential 15% growth in the next quarter.";
      growth = "+15.4%";
    } else if (leads > 50) {
      insight = "High lead volume detected. Focus on qualifying these leads to maximize your conversion rate and revenue.";
      growth = "+12.1%";
    }

    res.json({ insight, growth });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

app.get("/api/analytics/data", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const [revenueRes, sourceRes] = await Promise.all([
      pool.query(`
        SELECT 
          TO_CHAR(created_at, 'Mon') as name, 
          SUM(amount) as revenue,
          SUM(amount) * 0.65 as expenses
        FROM invoices 
        WHERE tenant_id = $1 AND status = 'paid'
        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 6
      `, [tenantId]),
      pool.query(`
        SELECT source as name, COUNT(*) as value 
        FROM leads 
        WHERE tenant_id = $1 
        GROUP BY source
      `, [tenantId])
    ]);

    res.json({
      revenueData: revenueRes.rows.map(r => ({
        name: r.name,
        revenue: parseFloat(r.revenue),
        expenses: parseFloat(r.expenses)
      })),
      leadSourceData: sourceRes.rows.map(r => ({
        name: r.name,
        value: parseInt(r.value)
      }))
    });
  } catch (error) {
    console.error("Analytics data error:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// Accounting: Bank Accounts
app.get("/api/accounting/stats", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const [expensesRes, receivablesRes, revenueRes] = await Promise.all([
      pool.query("SELECT SUM(amount) FROM expenses WHERE tenant_id = $1 AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)", [tenantId]),
      pool.query("SELECT SUM(amount) FROM invoices WHERE tenant_id = $1 AND status != 'paid'", [tenantId]),
      pool.query("SELECT SUM(amount) FROM invoices WHERE tenant_id = $1 AND status = 'paid'", [tenantId])
    ]);

    const expenses = parseFloat(expensesRes.rows[0].sum || 0);
    const receivables = parseFloat(receivablesRes.rows[0].sum || 0);
    const revenue = parseFloat(revenueRes.rows[0].sum || 0);

    res.json({
      totalReceivables: receivables,
      monthlyExpenses: expenses,
      netProfit: revenue - expenses
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch accounting stats" });
  }
});

app.get("/api/accounting/banks", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  try {
    const result = await pool.query("SELECT * FROM bank_accounts WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bank accounts" });
  }
});

app.post("/api/accounting/banks", authenticate, async (req: any, res) => {
  const { tenantId } = req.user;
  const { bankName, accountName, accountNumber, balance } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bank_accounts (tenant_id, bank_name, account_name, account_number, balance) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [tenantId, bankName, accountName, accountNumber, balance || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bank account" });
  }
});

app.put("/api/accounting/banks/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { bankName, accountName, accountNumber, balance } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bank_accounts SET bank_name = $1, account_name = $2, account_number = $3, balance = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND tenant_id = $6 RETURNING *",
      [bankName, accountName, accountNumber, balance, id, tenantId]
    );
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ error: "Bank account not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update bank account" });
  }
});

app.delete("/api/accounting/banks/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await pool.query("DELETE FROM bank_accounts WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    if (result.rowCount > 0) return res.json({ success: true });
    res.status(404).json({ error: "Bank account not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bank account" });
  }
});

// Tenant Settings
app.put("/api/tenant/settings", authenticate, checkRole(["Admin"]), async (req: any, res) => {
  const { tenantId } = req.user;
  const { name, subdomain } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tenants SET name = $1, subdomain = $2 WHERE id = $3 RETURNING *",
      [name, subdomain, tenantId]
    );
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ error: "Tenant not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update tenant settings" });
  }
});

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { fullName, email, password, companyName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 90);

    let newUser;
    let newTenant;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const tenantRes = await client.query(
        "INSERT INTO tenants (name, subdomain, trial_ends_at) VALUES ($1, $2, $3) RETURNING *",
        [companyName, companyName.toLowerCase().replace(/\s+/g, "-"), trialEndsAt]
      );
      newTenant = tenantRes.rows[0];

      const userRes = await client.query(
        "INSERT INTO users (tenant_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [newTenant.id, fullName, email, hashedPassword, "Admin"]
      );
      newUser = userRes.rows[0];

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const token = jwt.sign({ userId: newUser.id, tenantId: newTenant.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: newUser.id, fullName: newUser.full_name, email: newUser.email }, tenant: newTenant });
  } catch (error: any) {
    console.error("Signup error:", error);
    let errorMessage = error.message || "Signup failed";
    
    if (errorMessage.includes("ECONNREFUSED")) {
      const host = process.env.DATABASE_URL?.split("@")[1]?.split(":")[0];
      errorMessage += `. HINT: This often happens with IPv6. Try using an IPv4 connection string or Supabase pooler (port 6543). CURRENT HOST: ${host}`;
    } else if (errorMessage.includes("EAI_AGAIN")) {
      errorMessage = "DNS lookup failed (EAI_AGAIN). This is a temporary failure in name resolution. Please check your DATABASE_URL and ensure the hostname is correct. If you are using Supabase, try using the connection pooler (port 6543).";
    } else if (errorMessage.includes("password authentication failed")) {
      errorMessage = "Database authentication failed. Please check your DATABASE_URL in the Settings menu and ensure the password is correct. If your password contains special characters, make sure it is URL-encoded.";
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const tenantRes = await pool.query("SELECT * FROM tenants WHERE id = $1", [user.tenant_id]);
    const tenant = tenantRes.rows[0];

    const token = jwt.sign({ userId: user.id, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, department: user.department }, tenant });
  } catch (error: any) {
    console.error("Login error:", error);
    let errorMessage = "Login failed";
    if (error.message && error.message.includes("password authentication failed")) {
      errorMessage = "Database authentication failed. Please check your DATABASE_URL in the Settings menu and ensure the password is correct. If your password contains special characters, make sure it is URL-encoded.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Get Current User (Protected)
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userRes = await pool.query("SELECT id, full_name, email, tenant_id, role, department FROM users WHERE id = $1", [decoded.userId]);
    const user = userRes.rows[0];
    const tenantRes = await pool.query("SELECT * FROM tenants WHERE id = $1", [decoded.tenantId]);
    const tenant = tenantRes.rows[0];

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user, tenant });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// --- Vite Middleware ---
async function startServer() {
  // Test DB connection before starting
  await testConnection();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
