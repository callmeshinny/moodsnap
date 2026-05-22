import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import friendRoutes from "./routes/friend.routes";
import moodRoutes from "./routes/mood.routes";
import snapRoutes from "./routes/snap.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "MoodSnap backend is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/snaps", snapRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/moods", moodRoutes);

export default app;
