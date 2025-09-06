import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SignInSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();
app.use(express.json());

import bcrypt from "bcrypt";

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  console.log(parsedData);

  if (!parsedData.success) {
    res.status(400).json({
      message: "Incorrect inputs",
    });
    return;
  }

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });
    res.json({
      message: "Signed up successfully",
      userId: user.id,
    });
  } catch (e) {
    console.log("error", e);
    res.status(409).json({
      message: "User already exists",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect inputs",
    });
  }
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: parsedData.data.username,
      },
    });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Signed in successfully",
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "Incoreect Inputs",
    });
  }
  try {
    // @ts-ignore
    const userId = req.userId;

    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });
    res.json({
      roomId: room.id,
    });
  } catch (error) {
    res.status(411).json({
      message:"Room already exist!!"
    })
  }
});

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.listen(3001);
