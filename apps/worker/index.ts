import axios from "axios";
import { xAckBulk, xReadGroup, createGroup } from "redisstream/client";
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
    // Ensure the consumer group exists
    try {
        await createGroup(REGION_ID);
        console.log(`Consumer group ${REGION_ID} verified/created.`);
    } catch (e) {
        // Log but continue (may already exist)
    }

    while (1) {
        try {
            const response = await xReadGroup(REGION_ID, WORKER_ID);

            if (!response || response.length === 0) {
                // Short sleep before next poll if no tasks
                await new Promise(r => setTimeout(r, 2000));
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
        });

        // 2. Determine if we should send an alert
        // We alert if:
        // - This is the first check and it's Down
        // - The status changed (Up -> Down or Down -> Up)
        const isFirstCheck = !lastTick;
        const statusChanged = lastTick && lastTick.status !== newStatus;

        if ((isFirstCheck && newStatus === "Down") || statusChanged) {
            // Fetch the website owner + all alert contacts in one query
            const site = await prismaClient.website.findUnique({
                where: { id: websiteId },
                include: {
                    user: true,
                    alerts: true,   // all added alert contacts
                }
            });

            if (site) {
                // Build a unique set of recipient emails:
                // owner (username field is their email) + all alert contacts
                const recipients = new Set<string>();
                recipients.add(site.user.username);           // owner
                site.alerts.forEach(a => recipients.add(a.email)); // extra contacts

                console.log(`State change detected! Notifying ${recipients.size} recipient(s): ${Array.from(recipients).join(", ")}`);

                // Send email to every recipient
                await Promise.all(
                    Array.from(recipients).map(email => sendEmailAlert(email, url, newStatus))
                );
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