import "dotenv/config";
import app from "./app";
import { env } from "./config/env";

const PORT = Number(process.env.PORT || env.port || 5001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MoodSnap backend running on port ${PORT}`);
});
