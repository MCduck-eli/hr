"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error-middleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
const staticOptions = {
    setHeaders: (res) => {
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
};
app.use("/uploads", express_1.default.static("uploads", staticOptions));
app.use("/v1/uploads", express_1.default.static("uploads", staticOptions));
app.use("/api/uploads", express_1.default.static("uploads", staticOptions));
app.use("/api/v1/uploads", express_1.default.static("uploads", staticOptions));
app.use("/api", routes_1.default);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
    });
});
app.use(error_middleware_1.errorHandler);
exports.default = app;
