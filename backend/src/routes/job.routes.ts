import { Router } from "express";
import { sendSnapRemindersJob } from "../controllers/job.controller";

const router = Router();

router.post("/send-snap-reminders", sendSnapRemindersJob);

export default router;
