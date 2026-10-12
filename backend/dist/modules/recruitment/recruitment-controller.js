"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruitmentController = exports.RecruitmentController = void 0;
const recruitment_service_1 = require("./recruitment-service");
class RecruitmentController {
    async createVacancy(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.createVacancy(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateVacancy(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.updateVacancy(req.params.id, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteVacancy(req, res, next) {
        try {
            await recruitment_service_1.recruitmentService.deleteVacancy(req.params.id, req.user);
            res.status(200).json({ status: "success", message: "Vacancy deleted" });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllVacancies(req, res, next) {
        try {
            const vacancies = await recruitment_service_1.recruitmentService.getAllVacancies(req.user);
            res.status(200).json({ status: "success", data: vacancies });
        }
        catch (error) {
            next(error);
        }
    }
    async getPublicVacancies(req, res, next) {
        try {
            const companyName = req.query.company;
            const search = req.query.search;
            const departmentId = req.query.departmentId;
            const vacancies = await recruitment_service_1.recruitmentService.getPublicVacancies({
                companyName,
                search,
                departmentId,
            });
            res.status(200).json({ status: "success", data: vacancies });
        }
        catch (error) {
            next(error);
        }
    }
    async getPublicVacancy(req, res, next) {
        try {
            const vacancy = await recruitment_service_1.recruitmentService.getPublicVacancy(req.params.id);
            res.status(200).json({ status: "success", data: vacancy });
        }
        catch (error) {
            next(error);
        }
    }
    async parseResume(req, res, next) {
        try {
            const fileBuffer = req.file ? req.file.buffer || req.file.path : undefined;
            const rawText = req.body.rawText || req.body.text;
            const mimeType = req.file ? req.file.mimetype : undefined;
            let bufferToPass = undefined;
            if (req.file) {
                if (req.file.buffer) {
                    bufferToPass = req.file.buffer;
                }
                else if (req.file.path) {
                    const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                    bufferToPass = fs.readFileSync(req.file.path);
                }
            }
            const parsed = await recruitment_service_1.recruitmentService.parseResume({
                fileBuffer: bufferToPass,
                mimeType,
                rawText,
            });
            res.status(200).json({ status: "success", data: parsed });
        }
        catch (error) {
            next(error);
        }
    }
    async applyCandidate(req, res, next) {
        try {
            const resumeUrl = req.file
                ? `/uploads/resumes/${req.file.filename}`
                : req.body.resumeUrl || "";
            const candidate = await recruitment_service_1.recruitmentService.applyCandidate({
                ...req.body,
                resumeUrl,
            });
            res.status(201).json({ status: "success", data: candidate });
        }
        catch (error) {
            next(error);
        }
    }
    async getCandidateDetails(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.getCandidateDetails(req.params.candidateId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStage(req, res, next) {
        try {
            const deadline = req.body.testTaskDeadline
                ? new Date(req.body.testTaskDeadline)
                : req.body.testTaskDeadline === null
                    ? null
                    : undefined;
            const result = await recruitment_service_1.recruitmentService.updateStage(req.params.candidateId, req.body.stage, deadline, {
                notifyCandidate: req.body.notifyCandidate,
                notifyChannel: req.body.notifyChannel,
                customMessage: req.body.customMessage,
            }, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getPublicCandidateTask(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.getPublicCandidateTask(req.params.candidateId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitPublicCandidateTask(req, res, next) {
        try {
            const submissionFile = req.file
                ? `/uploads/tasks/${req.file.filename}`
                : req.body.submissionFile;
            const result = await recruitment_service_1.recruitmentService.submitPublicCandidateTask(req.params.candidateId, {
                submissionUrl: req.body.submissionUrl,
                submissionFile,
                submissionNote: req.body.submissionNote,
            });
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async addFeedback(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await recruitment_service_1.recruitmentService.addFeedback(req.params.candidateId, userId, req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async hireCandidate(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.hireCandidate(req.params.candidateId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async sendEmail(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.sendCandidateEmail(req.params.candidateId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async sendSms(req, res, next) {
        try {
            const result = await recruitment_service_1.recruitmentService.sendCandidateSms(req.params.candidateId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async uploadTaskFile(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ status: "fail", message: "Fayl tanlanmadi" });
            }
            const fileUrl = `/uploads/tasks/${req.file.filename}`;
            res.status(200).json({
                status: "success",
                data: {
                    fileUrl,
                    fileName: req.file.originalname,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async reverseGeocode(req, res, next) {
        try {
            const { lat, lon } = req.query;
            if (!lat || !lon) {
                return res.status(400).json({ status: "fail", message: "lat and lon are required" });
            }
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`, {
                headers: {
                    "User-Agent": "HRPlatform-Recruiting/1.0 (contact@hrplatform.com)",
                    "Accept-Language": "uz,ru,en;q=0.9",
                },
            });
            const data = await response.json();
            const address = data.display_name || "";
            res.status(200).json({ status: "success", data: { address, raw: data } });
        }
        catch (error) {
            next(error);
        }
    }
    async searchLocation(req, res, next) {
        try {
            const query = req.query.q;
            if (!query || query.length < 2) {
                return res.status(200).json({ status: "success", data: [] });
            }
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=uz&limit=5&addressdetails=1`, {
                headers: {
                    "User-Agent": "HRPlatform-Recruiting/1.0 (contact@hrplatform.com)",
                    "Accept-Language": "uz,ru,en;q=0.9",
                },
            });
            const data = await response.json();
            const results = (Array.isArray(data) ? data : []).map((item) => ({
                displayName: item.display_name,
                lat: item.lat,
                lon: item.lon,
            }));
            res.status(200).json({ status: "success", data: results });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecruitmentController = RecruitmentController;
exports.recruitmentController = new RecruitmentController();
