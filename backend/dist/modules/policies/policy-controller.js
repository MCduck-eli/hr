"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyController = exports.PolicyController = void 0;
const policy_service_1 = require("./policy-service");
class PolicyController {
    async create(req, res, next) {
        try {
            let documentUrl = req.body.documentUrl;
            if (req.file) {
                documentUrl = `/uploads/${req.file.filename}`;
            }
            const isRequired = req.body.isRequired !== undefined
                ? req.body.isRequired === "true" || req.body.isRequired === true
                : true;
            const loggedInUserId = req.user?.id;
            const result = await policy_service_1.policyService.createPolicy({
                title: req.body.title,
                description: req.body.description,
                content: req.body.content,
                documentUrl,
                isRequired,
                parentId: req.body.parentId,
            }, loggedInUserId);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const { policyId } = req.params;
            const loggedInUserId = req.user?.id;
            let documentUrl = req.body.documentUrl;
            if (req.file) {
                documentUrl = `/uploads/${req.file.filename}`;
            }
            const payload = {};
            if (req.body.title !== undefined)
                payload.title = req.body.title;
            if (req.body.description !== undefined)
                payload.description = req.body.description;
            if (req.body.content !== undefined)
                payload.content = req.body.content;
            if (documentUrl !== undefined)
                payload.documentUrl = documentUrl;
            if (req.body.isRequired !== undefined) {
                payload.isRequired =
                    req.body.isRequired === "true" || req.body.isRequired === true;
            }
            const result = await policy_service_1.policyService.updatePolicy(policyId, payload, loggedInUserId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const { policyId } = req.params;
            await policy_service_1.policyService.deletePolicy(policyId);
            res.status(200).json({
                status: "success",
                message: "Nizom muvaffaqiyatli o'chirildi",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const loggedInUserId = req.user?.id;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const { policyId } = req.params;
            const result = await policy_service_1.policyService.getPolicyById(policyId, targetUserId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const role = req.user.role;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const search = req.query.search ? String(req.query.search) : undefined;
            const result = await policy_service_1.policyService.getAllPolicies(targetUserId, role, search);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async sign(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const targetUserId = req.body.userId ? String(req.body.userId) : loggedInUserId;
            const result = await policy_service_1.policyService.signPolicy(targetUserId, req.params.policyId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PolicyController = PolicyController;
exports.policyController = new PolicyController();
