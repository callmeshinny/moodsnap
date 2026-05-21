import app from "./app";
import { env } from "./config/env";

app.listen(Number(env.port), "0.0.0.0", () => {
  console.log(`MoodSnap backend running on port ${env.port}`);
});