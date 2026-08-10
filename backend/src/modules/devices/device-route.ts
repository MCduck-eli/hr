import { Router } from "express";
import { deviceController } from "./device-controller";

const deviceRouter = Router();

deviceRouter.post("/webhook/:provider", deviceController.handleWebhook);

export default deviceRouter;
