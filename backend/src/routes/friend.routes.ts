import { Router } from "express";
import {
  acceptRequest,
  blockFriend,
  checkFriendStatus,
  countFriends,
  createFriendRequest,
  getMyFriendLink,
  listFriends,
  listPendingRequests,
  reportFriend,
  rejectRequest,
  unfriend,
} from "../controllers/friend.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/link", getMyFriendLink);
router.get("/count", countFriends);
router.get("/status/:receiverId", checkFriendStatus);
router.get("/", listFriends);
router.get("/requests", listPendingRequests);
router.post("/request", createFriendRequest);
router.post("/accept", acceptRequest);
router.post("/reject", rejectRequest);
router.post("/block", blockFriend);
router.post("/report", reportFriend);
router.delete("/:friendUserId", unfriend);

export default router;
