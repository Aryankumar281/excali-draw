import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}
const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    // console.log("Decoded token:", decoded);
    if (!decoded || typeof decoded === "string" || !decoded.userId) return null;
    return decoded.userId;
  } catch (error) {
    // console.error("JWT verification failed:", error);
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    // console.log("Connection rejected: no URL");
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    // console.log("Invalid user, closing connection");
    ws.close();
    return;
  }

  // console.log(`✅ User connected: ${userId}`);

  users.push({ userId, rooms: [], ws });
  // console.log("Current users:", users.map((u) => u.userId));

  ws.on("message", async (data) => {
    // console.log("📩 Raw message received:", data.toString());

    let parsedData: any;
    try {
      parsedData = JSON.parse(data.toString());
    } catch (err) {
      // console.error("❌ Invalid JSON:", err);
      return;
    }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      if (user && !user.rooms.includes(parsedData.roomId)) {
        user.rooms.push(parsedData.roomId);
        // console.log(`👥 User ${user.userId} joined room ${parsedData.roomId}`);
      }
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (user) {
        user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
        // console.log(`🚪 User ${user.userId} left room ${parsedData.roomId}`);
      }
    }

    if (parsedData.type === "chat") {
      const { roomId, message } = parsedData;
      // console.log(`💬 Chat from ${userId} in ${roomId}: ${message}`);

      try {
        await prismaClient.chat.create({
          data: { roomId, message, userId },
        });
        // console.log("✅ Chat saved to DB");
      } catch (err) {
        // console.error("❌ Failed to save chat:", err);
      }

      users.forEach((user) => {
        // console.log("🔎 Checking user:", user.userId, "rooms:", user.rooms);
        if (user.rooms.includes(roomId)) {
          // console.log(`📤 Sending chat to ${user.userId}`);
          user.ws.send(JSON.stringify({ type: "chat", message, roomId }));
        }
      });
    }
  });

  // ws.on("close", () => {
  //   console.log(`❌ Connection closed for user ${userId}`);
  //   // Remove user from users list
  //   const idx = users.findIndex((u) => u.ws === ws);
  //   if (idx !== -1) users.splice(idx, 1);
  //   console.log("Remaining users:", users.map((u) => u.userId));
  // });
});
