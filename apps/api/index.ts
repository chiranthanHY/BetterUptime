// require("dotenv").config();
import jwt from "jsonwebtoken";
import express from "express"
import cors from "cors";
const app = express();
import { prismaClient } from "store/client";
import { AuthInput } from "./types";
import { authMiddleware } from "./middleware";

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use(express.json());

app.post("/website", authMiddleware, async (req, res) => {
    if (!req.body.url) {
        res.status(411).json({});
        return
    }
    const website = await prismaClient.website.create({
        data: {
            url: req.body.url,
            time_added: new Date(),
            user_id: req.userId!
        }
    })

    res.json({
        id: website.id
    })
});

app.get("/websites", authMiddleware, async (req, res) => {
    const websites = await prismaClient.website.findMany({
        where: {
            user_id: req.userId!
        },
        include: {
            ticks: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        }
    })

    res.json({
        websites: websites.map(w => ({
            id: w.id,
            url: w.url,
            status: w.ticks[0]?.status || "Unknown",
            responseTime: w.ticks[0]?.response_time_ms || 0,
            lastChecked: w.ticks[0]?.createdAt || w.time_added
        }))
    })
})

app.get("/status/:websiteId", authMiddleware, async (req, res) => {
    const website = await prismaClient.website.findFirst({
        where: {
            user_id: req.userId!,
            id: req.params.websiteId as string,
        },
        include: {
            ticks: {
                orderBy: [{
                    createdAt: 'desc',
                }],
                take: 1
            }
        }
    })

    if (!website) {
        res.status(409).json({
            message: "Not found"
        })
        return;
    }

    res.json({
        url: website.url,
        id: website.id,
        user_id: website.user_id
    })

})

// --- Alert Contacts ---

// GET /website/:websiteId/alerts  → list all alert emails for a website
app.get("/website/:websiteId/alerts", authMiddleware, async (req, res) => {
    const websiteId = req.params.websiteId as string;
    const website = await prismaClient.website.findFirst({
        where: { id: websiteId, user_id: req.userId! },
        include: { alerts: true }
    });
    if (!website) { res.status(404).json({ message: "Not found" }); return; }

    res.json({ alerts: website.alerts.map((a: { id: string; email: string }) => ({ id: a.id, email: a.email })) });
});

// POST /website/:websiteId/alerts  { email: "..." }  → add an alert contact
app.post("/website/:websiteId/alerts", authMiddleware, async (req, res) => {
    const websiteId = req.params.websiteId as string;
    const { email } = req.body;
    if (!email) { res.status(400).json({ message: "email is required" }); return; }

    const website = await prismaClient.website.findFirst({
        where: { id: websiteId, user_id: req.userId! }
    });
    if (!website) { res.status(404).json({ message: "Not found" }); return; }

    try {
        const alert = await prismaClient.website_alert.create({
            data: { email, website_id: websiteId }
        });
        res.json({ id: alert.id, email: alert.email });
    } catch (e: any) {
        res.status(409).json({ message: "This email is already an alert contact." });
    }
});

// DELETE /website/:websiteId/alerts/:alertId  → remove an alert contact
app.delete("/website/:websiteId/alerts/:alertId", authMiddleware, async (req, res) => {
    const websiteId = req.params.websiteId as string;
    const alertId = req.params.alertId as string;

    const website = await prismaClient.website.findFirst({
        where: { id: websiteId, user_id: req.userId! }
    });
    if (!website) { res.status(404).json({ message: "Not found" }); return; }

    await prismaClient.website_alert.delete({ where: { id: alertId } });
    res.json({ message: "Alert contact removed." });
});

app.post("/user/signup", async (req, res) => {
    const data = AuthInput.safeParse(req.body);
    if (!data.success) {
        console.log(data.error.toString());
        res.status(403).send("");
        return;
    }

    try {
        let user = await prismaClient.user.create({
            data: {
                username: data.data.username,
                password: data.data.password
            }
        })
        res.json({
            id: user.id
        })
    } catch (e) {
        console.log(e);
        res.status(403).send("");
    }
})

app.post("/user/signin", async (req, res) => {
    const data = AuthInput.safeParse(req.body);
    if (!data.success) {
        res.status(403).send("");
        return;
    }

    let user = await prismaClient.user.findFirst({
        where: {
            username: data.data.username
        }
    })

    if (user?.password !== data.data.password) {
        res.status(403).send("");
        return;
    }

    let token = jwt.sign({
        sub: user.id
    }, process.env.JWT_SECRET!)


    res.json({
        jwt: token
    })
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});