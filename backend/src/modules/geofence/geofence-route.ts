import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { geofenceController } from "./geofence-controller";
import { validate } from "../../middlewares/validate-middleware";
import { createGeofenceSchema } from "./geofence-validation";

const geofenceRouter = Router();

geofenceRouter.use(authenticate);

geofenceRouter.get("/", geofenceController.getAll);

geofenceRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createGeofenceSchema),
    geofenceController.create,
);

geofenceRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    geofenceController.delete,
);

export default geofenceRouter;
