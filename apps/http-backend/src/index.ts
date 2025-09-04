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
app.use(express.json())

app.post("/signup", async (req, res) => {
  // DB call
  const parsedData = CreateUserSchema.safeParse(req.body);
  console.log(parsedData)
  if (!parsedData.success) {
     res.status(400).json({
      message: "Incorrect inputs",
      errors: parsedData.error.format()
    })
    return;
  }
  try {
     console.log("hello1")
    const user = await prismaClient.user.create({
      data: {
        email:parsedData.data?.username,
        password: parsedData.data.password,
        name: parsedData.data.name,
      },
    });
    console.log("hello")
    res.json({
      message: "Signed up successfully",
      // userId: user.id,
    });
  } catch(e) {
      console.log("error",e);
      
      res.status(409).json({
        message: "User already exists"
      })
    } 
    
  
});
app.post("/signin", (req, res) => {
  const data = SignInSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: "Incoreect Inputs",
    });
  }
  const userId = 1;
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );
  res.json({
    token,
  });
});
app.post("/room", middleware, (req, res) => {
  // db call

  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: "Incoreect Inputs",
    });
  }
  res.json({
    roomId: 123,
  });
});

app.listen(3001);
