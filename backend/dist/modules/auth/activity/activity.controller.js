"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivity = void 0;
const activity_service_1 = require("./activity.service");
const getActivity = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const activities = await (0, activity_service_1.getTeamActivity)(teamId, limit);
        res.json(activities);
    }
    catch (error) {
        next(error);
    }
};
exports.getActivity = getActivity;
