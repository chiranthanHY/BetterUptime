
const { PrismaClient } = require("./generated/prisma");

console.log("Type of PrismaClient:", typeof PrismaClient);
console.log("Value of PrismaClient:", PrismaClient);

async function main() {
    console.log("Instantiating...");
    try {
        const client = new PrismaClient();
        console.log("Connecting...");
        await client.$connect();
        console.log("Connected!");
    } catch (e) {
        console.error("Error:", e);
        if (e.stack) console.error(e.stack);
    }
}

main();
