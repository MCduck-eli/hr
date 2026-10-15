import cron from "node-cron";
import app from "./app";
import { generateAndUploadBackup } from "./modules/backup/backup-service";

const PORT = Number(process.env.PORT) || 5001;

cron.schedule("0 0 * * *", async () => {
    try {
        const result = await generateAndUploadBackup();
        console.log("Avtomatik zaxira olindi: " + result.fileName);
    } catch (error) {
        console.error("Avtomatik zaxira xatosi:", error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
