"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollController = exports.PayrollController = void 0;
const payroll_service_1 = require("./payroll-service");
class PayrollController {
    async create(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.createPayroll(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyPayrolls(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getMyPayrolls(req.user.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllPayrolls(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getAllPayrolls(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async calculateAuto(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.calculateAutoPayroll(req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async generateBatch(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.generateBatchPayroll(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updateStatus(req.params.id, req.body.status, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePayroll(req, res, next) {
        try {
            await payroll_service_1.payrollService.deletePayroll(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Payroll deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPenaltyRules(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getPenaltyRules(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createPenaltyRule(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.createPenaltyRule(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePenaltyRule(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updatePenaltyRule(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePenaltyRule(req, res, next) {
        try {
            await payroll_service_1.payrollService.deletePenaltyRule(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Penalty rule deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeePenalties(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getEmployeePenalties(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPenaltiesSummary(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getPenaltiesSummary(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createEmployeePenalty(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.createEmployeePenalty(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteEmployeePenalty(req, res, next) {
        try {
            await payroll_service_1.payrollService.deleteEmployeePenalty(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Employee penalty deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateEmployeePenalty(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updateEmployeePenalty(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async waivePenalty(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.waivePenalty(req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async editPenalty(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.editPenalty(req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getSchedule(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getPayrollSchedule(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateSchedule(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updatePayrollSchedule(req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAdvances(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getAdvances(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createAdvance(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.createAdvance(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateAdvanceStatus(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updateAdvanceStatus(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async confirmAdvanceReceipt(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.confirmAdvanceReceipt(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                data: result,
                message: "Advance receipt confirmed",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyAdvances(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getMyAdvances(req.user.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteAdvance(req, res, next) {
        try {
            await payroll_service_1.payrollService.deleteAdvance(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Advance deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async paySalary(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.paySalary(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async confirmSalaryReceipt(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.confirmSalaryReceipt(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                data: result,
                message: "Salary payment receipt confirmed",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPaymentRecords(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getPaymentRecords(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePaymentRecord(req, res, next) {
        try {
            await payroll_service_1.payrollService.deletePaymentRecord(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Payment record deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async clearAllPaymentRecords(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.clearAllPaymentRecords(req.user);
            res.status(200).json({
                status: "success",
                data: result,
                message: "All payment records cleared",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async checkDueReminders(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.checkAndNotifyDuePayments(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCompanyExpensesAnalytics(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getCompanyExpensesAnalytics(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCompanyExpenses(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getCompanyExpenses(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createCompanyExpense(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.createCompanyExpense(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCompanyExpense(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updateCompanyExpense(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCompanyExpense(req, res, next) {
        try {
            await payroll_service_1.payrollService.deleteCompanyExpense(req.params.id, req.query, req.user);
            res.status(200).json({
                status: "success",
                message: "Company expense deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeCompensations(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.getEmployeeCompensations(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateEmployeeCompensation(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.updateEmployeeCompensation(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PayrollController = PayrollController;
exports.payrollController = new PayrollController();
