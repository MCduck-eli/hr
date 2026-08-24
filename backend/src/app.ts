import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import mainRouter from "./routes";
import { errorHandler } from "./middlewares/error-middleware";

const app: Application = express();

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const staticOptions = {
    setHeaders: (res: Response) => {
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
};

app.use("/uploads", express.static("uploads", staticOptions));
app.use("/v1/uploads", express.static("uploads", staticOptions));
app.use("/api/uploads", express.static("uploads", staticOptions));
app.use("/api/v1/uploads", express.static("uploads", staticOptions));

app.use("/api", mainRouter);

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
    });
});

app.use(errorHandler);

export default app;
