import { Request, Response, NextFunction } from "express";
import { generateAndUploadBackup, backupService } from "./backup-service";

export class BackupController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await generateAndUploadBackup();
            res.status(200).json({
                success: true,
                message: "Backup muvaffaqiyatli yaratildi va saqlandi",
                data: result,
            });
        } catch (error: any) {
            console.error("BACKUP XATOSI:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Backup yaratishda xatolik yuz berdi",
            });
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await backupService.listBackups();
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("BACKUP XATOSI:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Backuplarni olishda xatolik yuz berdi",
            });
        }
    }

    async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const fileName = String(req.params.fileName);
            const url = await backupService.getDownloadUrl(fileName);
            res.status(200).json({
                success: true,
                data: { url },
            });
        } catch (error: any) {
            console.error("BACKUP XATOSI:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Yuklab olish havolasini olishda xatolik yuz berdi",
            });
        }
    }
}

export const backupController = new BackupController();
