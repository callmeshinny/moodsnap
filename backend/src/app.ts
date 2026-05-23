import express from "express";
import appRoutes from "./routes/app.routes";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import friendRoutes from "./routes/friend.routes";
import friendsOverviewRoutes from "./routes/friendsOverview.routes";
import moodRoutes from "./routes/mood.routes";
import ratingRoutes from "./routes/rating.routes";
import notificationPreferencesRoutes from "./routes/notificationPreferences.routes";
import snapRoutes from "./routes/snap.routes";
import userRoutes from "./routes/user.routes";
import userSearchRoutes from "./routes/userSearch.routes";
import notificationRoutes from "./routes/notification.routes";
import jobRoutes from "./routes/job.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/notifications/preferences", notificationPreferencesRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "MoodSnap backend is running"
  });
});


app.get("/friend/:username", (req, res) => {
  const username = encodeURIComponent(String(req.params.username || ""));
  const appLink = `moodsnap://friend/${username}`;

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Add friend on MoodSnap</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            background: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            width: 100%;
            max-width: 420px;
            background: #151515;
            border: 1px solid #252525;
            border-radius: 28px;
            padding: 26px;
            text-align: center;
          }
          h1 {
            color: #F65078;
            font-size: 32px;
            margin: 0 0 10px;
          }
          p {
            color: #cfcfcf;
            line-height: 1.5;
            margin-bottom: 22px;
          }
          a {
            display: block;
            background: #F65078;
            color: #fff;
            text-decoration: none;
            font-weight: 900;
            padding: 15px 18px;
            border-radius: 18px;
          }
          .small {
            font-size: 13px;
            color: #888;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>MoodSnap</h1>
          <p>Open MoodSnap to send this friend request.</p>
          <a href="${appLink}">Open MoodSnap</a>
          <div class="small">If the app does not open automatically, tap the button above.</div>
        </div>

        <script>
          setTimeout(function () {
            window.location.href = "${appLink}";
          }, 400);
        </script>
      </body>
    </html>
  `);
});

app.use("/api/app", appRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users/search", userSearchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/snaps", snapRoutes);
app.use("/api/friends/overview", friendsOverviewRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/notifications/preferences", notificationPreferencesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/jobs", jobRoutes);

export default app;
