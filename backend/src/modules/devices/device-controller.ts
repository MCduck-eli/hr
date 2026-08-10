import { Request, Response, NextFunction } from "express";
import { deviceService } from "./device-service";

export class DeviceController {
    async handleWebhook(
        req: Request<{ provider: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await deviceService.processDeviceLog(
                req.params.provider,
                req.body,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const deviceController = new DeviceController();
