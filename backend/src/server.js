import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`BananaControl API running on http://localhost:${env.port}`);
  console.log(`BananaControl API available to local network frontends on port ${env.port}`);
});
