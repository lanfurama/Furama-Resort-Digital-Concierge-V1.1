import { Router } from "express";
import { smartMatchLocation, getDefaultSuggestions } from "../_services/locationMatchingService";
import { getLocations } from "../../services/dataService";

const router = Router();

/**
 * POST /api/locations/smart-match
 * Intelligent location matching with fuzzy search and context awareness
 */
router.post("/smart-match", async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput || typeof userInput !== "string") {
            return res.status(400).json({
                error: "userInput is required and must be a string",
            });
        }

        // Get all locations from database
        const allLocations = await getLocations();

        // Perform smart matching
        const matchResult = await smartMatchLocation({
            userInput,
            allLocations,
            context,
        });

        return res.json({
            success: true,
            ...matchResult,
        });
    } catch (error: any) {
        console.error("Smart match error:", error);
        return res.status(500).json({
            error: "Failed to match location",
            message: error.message,
        });
    }
});

/**
 * GET /api/locations/suggestions
 * Get default location suggestions based on context
 */
router.get("/suggestions", async (req, res) => {
    try {
        const { currentStep, previousPickup } = req.query;

        const allLocations = await getLocations();

        const context: any = {};
        if (currentStep) context.currentStep = currentStep;
        if (previousPickup) context.previousPickup = previousPickup;

        const suggestions = getDefaultSuggestions(allLocations, context);

        return res.json({
            success: true,
            suggestions,
        });
    } catch (error: any) {
        console.error("Get suggestions error:", error);
        return res.status(500).json({
            error: "Failed to get suggestions",
            message: error.message,
        });
    }
});

export default router;
