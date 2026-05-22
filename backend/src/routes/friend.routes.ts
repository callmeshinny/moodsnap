import { Router } from "express";
import {
  acceptRequest,
  countFriends,
  createFriendRequest,
  getMyFriendLink,
  listFriends,
  listPendingRequests,
  rejectRequest,
} from "../controllers/friend.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/link", getMyFriendLink);
router.get("/count", countFriends);
router.get("/", listFriends);
router.get("/requests", listPendingRequests);
router.post("/request", createFriendRequest);
router.post("/accept", acceptRequest);
router.post("/reject", rejectRequest);

export default router;
