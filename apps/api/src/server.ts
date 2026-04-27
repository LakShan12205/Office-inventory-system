import { env } from "./config/env.js";
import app from "./app.js";

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${env.PORT}`);
});
