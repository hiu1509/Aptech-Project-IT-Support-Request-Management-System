import { Router } from "express";
import { db, nextId } from "../data/store.js";
import { findUser, findUserByEmail } from "../data/repo.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { serializeUser } from "../utils/serialize.js";

export const authRouter = Router();

// UC01 - Dang nhap
authRouter.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Thieu email hoac password." });
  }

  const user = findUserByEmail(email);
  if (!user || user._mockPassword !== password) {
    return res.status(401).json({ message: "Email hoac mat khau khong dung." });
  }
  if (!user.IsActive) {
    return res.status(401).json({ message: "Tai khoan da bi khoa." });
  }

  user.LastLoginAt = new Date().toISOString();
  const token = signToken(user);
  const full = serializeUser(user);

  return res.json({
    message: "Dang nhap thanh cong.",
    token,
    user: {
      id: full.id,
      fullName: full.fullName,
      email: full.email,
      roles: full.roles.map((r) => r.name),
      department: full.department ? full.department.name : null,
    },
  });
});

// UC02 - Buoc 1: yeu cau dat lai mat khau
authRouter.post("/forgot-password", (req, res) => {
  const { email } = req.body || {};
  const user = email ? findUserByEmail(email) : null;
  if (user) {
    const tokenId = nextId("passwordResetTokens");
    const token = `mock-reset-${tokenId}`;
    db.passwordResetTokens.push({
      Id: tokenId,
      UserId: user.Id,
      TokenHash: token, // mock: luu thang, khong hash
      ExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      UsedAt: null,
      CreatedAt: new Date().toISOString(),
    });
    db.emailNotifications.push({
      Id: nextId("emailNotifications"),
      RequestId: null,
      RecipientUserId: user.Id,
      RecipientEmail: user.Email,
      EventCode: "FORGOT_PASSWORD",
      Subject: "Yeu cau dat lai mat khau",
      SendStatus: "SENT",
      SentAt: new Date().toISOString(),
      ErrorMessage: null,
      CreatedAt: new Date().toISOString(),
    });
    // Mock: tra token thang trong response de tien test (that se khong lam vay, gui qua email).
    return res.json({ message: "Neu email ton tai, huong dan da duoc gui.", _mockToken: token });
  }
  return res.json({ message: "Neu email ton tai, huong dan da duoc gui." });
});

// UC02 - Buoc 2: xac nhan token, dat mat khau moi
authRouter.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
  const entry = db.passwordResetTokens.find((t) => t.TokenHash === token);
  if (!entry || entry.UsedAt || new Date(entry.ExpiresAt) < new Date()) {
    return res.status(400).json({ message: "Token khong hop le hoac da het han." });
  }
  const user = findUser(entry.UserId);
  user._mockPassword = newPassword;
  entry.UsedAt = new Date().toISOString();
  return res.json({ message: "Dat lai mat khau thanh cong." });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const user = findUser(req.user.id);
  return res.json({
    id: user.Id,
    email: user.Email,
    roles: req.user.roleCodes,
  });
});
