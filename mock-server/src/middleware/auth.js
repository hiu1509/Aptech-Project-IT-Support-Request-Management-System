import jwt from "jsonwebtoken";
import { findUser, getUserRoleCodes } from "../data/repo.js";

// Chi dung cho mock, KHONG dai dien secret/cau hinh cua backend that.
export const JWT_SECRET = "mock-server-not-for-production-secret";

export function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.Id),
      name: user.FullName,
      email: user.Email,
      roles: getUserRoleCodes(user.Id),
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thieu hoac sai dinh dang Authorization header (Bearer token)." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = Number(payload.sub);
    const user = findUser(userId);
    if (!user || !user.IsActive) {
      return res.status(401).json({ message: "Tai khoan khong ton tai hoac da bi khoa." });
    }
    req.user = { id: userId, roleCodes: payload.roles || [], raw: user };
    next();
  } catch {
    return res.status(401).json({ message: "Token khong hop le hoac da het han." });
  }
}

/** Cho phep neu actor co it nhat 1 trong cac role duoc liet ke. */
export function requireRole(...roleCodes) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Chua dang nhap." });
    const ok = roleCodes.some((r) => req.user.roleCodes.includes(r));
    if (!ok) {
      return res.status(403).json({ message: `Yeu cau vai tro: ${roleCodes.join(", ")}.` });
    }
    next();
  };
}
