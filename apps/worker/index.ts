import axios from "axios";
import { xAckBulk, xReadGroup } from "redisstream/client";
import { prismaClient } from "store/client";
import { sendEmailAlert } from "./notifier";

const REGION_ID = process.env.REGION_ID!;
const WORKER_ID = process.env.WORKER_ID!;

if (!REGION_ID) {
    throw new Error("Region not provided");
}

if (!WORKER_ID) {
    throw new Error("Worker ID not provided");
}

async function main() {
    while (1) {
        try {
            const response = await xReadGroup(REGION_ID, WORKER_ID);

            if (!response) {
                continue;
            }

            console.log(`Processing ${response.length} website checks.`);
            let promises = response.map(({ message }) => fetchWebsite(message.url, message.id))
            await Promise.all(promises);
            console.log("Done checking batch.");

            xAckBulk(REGION_ID, response.map(({ id }) => id));
        } catch (e: any) {
            console.error("Main loop error:", e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

async function fetchWebsite(url: string, websiteId: string) {
    console.log(`  Checking: ${url}`);
    const startTime = Date.now();
    let newStatus: "Up" | "Down";
    let errorMsg = "";

    try {
        await axios.get(url, { timeout: 10000 });
        newStatus = "Up";
    } catch (err: any) {
        newStatus = "Down";
        errorMsg = err.message;
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`    Result: ${newStatus} (${responseTime}ms) ${errorMsg ? "- " + errorMsg : ""}`);

    try {
        // 1. Get the last status to check for changes
        const lastTick = await prismaClient.website_tick.findFirst({
            where: { website_id: websiteId },
            orderBy: { createdAt: "desc" },
            include: {
                website: {
                    include: { user: true }
                }
            }
        });

        // 2. Determine if we should send an alert
        // We alert if: 
        // - This is the first check and it's Down
        // - The status changed (Up -> Down or Down -> Up)
        const isFirstCheck = !lastTick;
        const statusChanged = lastTick && lastTick.status !== newStatus;

        console.log(`    DEBUG: isFirstCheck=${isFirstCheck}, statusChanged=${statusChanged}, newStatus=${newStatus}, oldStatus=${lastTick?.status}`);

        if ((isFirstCheck && newStatus === "Down") || statusChanged) {
            // Need to fetch user email if it's not in lastTick (e.g. if isFirstCheck is true)
            let email = lastTick?.website.user.username;

            if (!email) {
                const site = await prismaClient.website.findUnique({
                    where: { id: websiteId },
                    include: { user: true }
                });
                email = site?.user.username;
            }

            if (email) {
                console.log(`    State change detected! Sending ${newStatus} notification to ${email}...`);
                await sendEmailAlert(email, url, newStatus);
            }
        }

        // 3. Save the new tick
        await prismaClient.website_tick.create({
            data: {
                response_time_ms: responseTime,
                status: newStatus,
                region_id: REGION_ID,
                website_id: websiteId
            }
        });
        console.log(`    Saved tick for ${url}`);
    } catch (dbErr: any) {
        console.error(`    ERROR in worker logic for ${url}: ${dbErr.message}`);
    }
}

main();