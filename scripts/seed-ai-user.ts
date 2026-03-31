import "dotenv/config";

import { ensureShipAssistUser } from "@/lib/ai/ship-assist";

async function main() {
  const user = await ensureShipAssistUser();
  console.log(`Seeded ${user.name} <${user.email}> (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
