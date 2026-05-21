import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import snapRoutes from "./routes/snap.routes";

app.use("/api/snaps", snapRoutes);
const PORT = Number(process.env.PORT || env.port || 5001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MoodSnap backend running on port ${PORT}`);
});