import { prismaClient } from "store/client";
import { xAddBulk } from "redisstream/client";

async function main() {
    try {
        let websites = await prismaClient.website.findMany({
            select: {
                url: true,
                id: true
            }
        })

        console.log(`Pusher: Found ${websites.length} websites to check.`);
        websites.forEach(w => console.log(`  - ${w.url}`));

        if (websites.length > 0) {
            await xAddBulk(websites.map(w => ({
                url: w.url,
                id: w.id
            })));
            console.log("Pusher: Pushed websites to Redis stream.");
        }
    } catch (e) {
        console.error("Pusher error:", e);
    }
}

setInterval(() => {
    main()
}, 30 * 1000)

main()