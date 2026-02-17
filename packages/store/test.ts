
import { PrismaClient } from "./generated/prisma";
const config = require("./generated/prisma/index.js");

console.log("Type of PrismaClient:", typeof PrismaClient);
console.log("Value of PrismaClient:", PrismaClient);
console.log("Constructor status:", PrismaClient ? PrismaClient.name : "null");

console.log("Generated Config Object:", config);

async function main() {
    console.log("Instantiating...");
    try {
        const client = new PrismaClient();
        console.log("Connecting...");
        await client.$connect();
        console.log("Connected!");
    } catch (e: any) {
        console.error("Error:", e);
        if (e.stack) console.error(e.stack);
    }
}

main();
