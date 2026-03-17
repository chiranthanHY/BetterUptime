import { prismaClient } from "./packages/store/client";

async function main() {
    const users = await prismaClient.user.findMany({
        where: { username: { contains: "rooki" } },
        include: {
            websites: {
                include: {
                    ticks: { orderBy: { createdAt: "desc" }, take: 2 }
                }
            }
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
