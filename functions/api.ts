import { createClient } from "npm:@blinkdotnew/sdk";
import { hash, compare } from "npm:bcryptjs";
import { create, verify } from "npm:djwt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBlinkClient() {
  const projectId = Deno.env.get("BLINK_PROJECT_ID");
  const secretKey = Deno.env.get("BLINK_SECRET_KEY");
  if (!projectId || !secretKey) throw new Error("Missing Blink config");
  return createClient({ projectId, secretKey });
}

function getJwtSecret(): string {
  return Deno.env.get("JWT_SECRET") || "satriad_jwt_secret_fallback_2026";
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getJwtSecret();
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Simple encrypt/decrypt using XOR + base64 (portable, no Node crypto needed)
function getEncryptionKey(): string {
  return Deno.env.get("ENCRYPTION_KEY") || "satriastudio12_secret_key_32chars_";
}

function encrypt(text: string): string {
  if (!text) return text;
  const key = getEncryptionKey();
  const encoded = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}

function decrypt(text: string): string {
  if (!text) return text;
  try {
    const key = getEncryptionKey();
    const decoded = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return text; // Return as-is if decryption fails
  }
}

async function verifyAuth(req: Request): Promise<{ valid: boolean; admin?: { id: string; username: string } }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }
  try {
    const token = authHeader.split(" ")[1];
    const key = await getCryptoKey();
    const payload = await verify(token, key);
    return { valid: true, admin: payload as unknown as { id: string; username: string } };
  } catch {
    return { valid: false };
  }
}

// ===== ROUTE HANDLERS =====

async function handleSeed(): Promise<Response> {
  const blink = getBlinkClient();

  // Admin 1
  const hash1 = await hash("Satria@12", 10);
  await blink.db.admins.upsert({ id: "admin_1", username: "satriaD", password: hash1 });

  // Admin 2
  const hash2 = await hash("satria09", 10);
  await blink.db.admins.upsert({ id: "admin_2", username: "satria12", password: hash2 });

  return json({ success: true, message: "Admin users seeded" });
}

async function handleLogin(req: Request): Promise<Response> {
  const { username, password } = await req.json();
  if (!username || !password) {
    return json({ message: "Username and password required" }, 400);
  }

  const blink = getBlinkClient();

  // Find admin by username
  const admins = await blink.db.admins.list({ where: { username } });
  const admin = admins?.[0];

  if (!admin) {
    return json({ message: "Invalid credentials" }, 401);
  }

  const isMatch = await compare(password, admin.password);
  if (!isMatch) {
    return json({ message: "Invalid credentials" }, 401);
  }

  const key = await getCryptoKey();
  const token = await create(
    { alg: "HS256", typ: "JWT" },
    { id: admin.id, username: admin.username, exp: Math.floor(Date.now() / 1000) + 86400 },
    key
  );

  return json({ success: true, token });
}

async function handleGetProjects(): Promise<Response> {
  const blink = getBlinkClient();
  const projects = await blink.db.projects.list({ orderBy: { createdAt: "desc" } });
  return json(projects);
}

async function handleCreateProject(req: Request): Promise<Response> {
  const auth = await verifyAuth(req);
  if (!auth.valid) return json({ message: "Unauthorized" }, 401);

  const blink = getBlinkClient();

  // Parse multipart form data
  const formData = await req.formData();
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File;

  if (!title || !imageFile) {
    return json({ message: "Title and image required" }, 400);
  }

  // Upload image to Blink storage
  const ext = imageFile.name.split(".").pop() || "webp";
  const { publicUrl } = await blink.storage.upload(
    imageFile,
    `projects/${Date.now()}.${ext}`
  );

  const project = await blink.db.projects.create({
    title,
    category: category || "Other",
    description: description || "",
    imageUrl: publicUrl,
  });

  return json({ success: true, data: project }, 201);
}

async function handleDeleteProject(id: string, req: Request): Promise<Response> {
  const auth = await verifyAuth(req);
  if (!auth.valid) return json({ message: "Unauthorized" }, 401);

  const blink = getBlinkClient();
  const project = await blink.db.projects.get(id);
  if (!project) return json({ message: "Project not found" }, 404);

  // Try to remove from storage (ignore errors)
  try {
    if (project.imageUrl) {
      const storagePath = new URL(project.imageUrl).pathname.split("/").slice(-2).join("/");
      await blink.storage.remove(storagePath);
    }
  } catch { /* ignore */ }

  await blink.db.projects.delete(id);
  return json({ success: true, message: "Project deleted" });
}

async function handleCreateOrder(req: Request): Promise<Response> {
  const { name, whatsapp, service, deadline, detail } = await req.json();
  if (!name || !whatsapp || !detail) {
    return json({ message: "Name, whatsapp, and detail are required" }, 400);
  }

  const blink = getBlinkClient();
  const order = await blink.db.orders.create({
    name: encrypt(name),
    whatsapp: encrypt(whatsapp),
    service: service || "",
    deadline: deadline || "",
    detail: encrypt(detail),
  });

  return json({ success: true, data: order }, 201);
}

async function handleGetOrders(req: Request): Promise<Response> {
  const auth = await verifyAuth(req);
  if (!auth.valid) return json({ message: "Unauthorized" }, 401);

  const blink = getBlinkClient();
  const orders = await blink.db.orders.list({ orderBy: { createdAt: "desc" } });

  const decrypted = orders.map((order: Record<string, unknown>) => ({
    ...order,
    name: decrypt(order.name as string),
    whatsapp: decrypt(order.whatsapp as string),
    detail: decrypt(order.detail as string),
  }));

  return json(decrypted);
}

// ===== MAIN HANDLER =====

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // POST /seed - Seed admin users
    if (path === "/seed" && req.method === "POST") {
      return await handleSeed();
    }

    // POST /admin/login
    if (path === "/admin/login" && req.method === "POST") {
      return await handleLogin(req);
    }

    // GET /projects
    if (path === "/projects" && req.method === "GET") {
      return await handleGetProjects();
    }

    // POST /projects
    if (path === "/projects" && req.method === "POST") {
      return await handleCreateProject(req);
    }

    // DELETE /projects/:id
    const deleteMatch = path.match(/^\/projects\/(.+)$/);
    if (deleteMatch && req.method === "DELETE") {
      return await handleDeleteProject(deleteMatch[1], req);
    }

    // POST /orders
    if (path === "/orders" && req.method === "POST") {
      return await handleCreateOrder(req);
    }

    // GET /orders
    if (path === "/orders" && req.method === "GET") {
      return await handleGetOrders(req);
    }

    return json({ message: "Not found" }, 404);
  } catch (error) {
    console.error("API Error:", error);
    return json({ message: "Internal server error", error: String(error) }, 500);
  }
}

Deno.serve(handler);
