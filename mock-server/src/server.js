import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`ITSupport mock server dang chay tai http://localhost:${PORT}`);
  console.log(`Xem docs/api-spec.yaml va docs/API_GUIDE.md o thu muc goc repo de biet toan bo endpoint.`);
});
