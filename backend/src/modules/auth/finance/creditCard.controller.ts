import { Request, Response } from "express";
import * as creditCardService from "./creditCard.service";
import { logger } from "../../../utils/logger";

export const createCreditCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId, cardName, bankName, last4Digits, creditLimit, outstandingAmount, billingCycleStartDay, dueDateDay, interestRate } = req.body;

    // Validation
    if (!cardName || !bankName || !last4Digits || !creditLimit || !billingCycleStartDay || !dueDateDay) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!/^\d{4}$/.test(last4Digits)) {
      return res.status(400).json({ message: "last4Digits must be exactly 4 digits" });
    }

    if (billingCycleStartDay < 1 || billingCycleStartDay > 31) {
      return res.status(400).json({ message: "billingCycleStartDay must be between 1 and 31" });
    }

    if (dueDateDay < 1 || dueDateDay > 31) {
      return res.status(400).json({ message: "dueDateDay must be between 1 and 31" });
    }

    const card = await creditCardService.createCreditCard(userId, {
      teamId,
      cardName,
      bankName,
      last4Digits,
      creditLimit: Number(creditLimit),
      outstandingAmount: outstandingAmount ? Number(outstandingAmount) : 0,
      billingCycleStartDay: Number(billingCycleStartDay),
      dueDateDay: Number(dueDateDay),
      interestRate: interestRate ? Number(interestRate) : undefined
    });

    logger.info(`Credit card created: ${card._id} by user ${userId}`);
    res.status(201).json(card);
  } catch (error) {
    logger.error("Error creating credit card:", error);
    res.status(500).json({ message: "Failed to create credit card", error });
  }
};

export const getCreditCards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId } = req.query;
    const cards = await creditCardService.getCreditCards(userId, teamId as string);

    res.json(cards);
  } catch (error) {
    logger.error("Error fetching credit cards:", error);
    res.status(500).json({ message: "Failed to fetch credit cards", error });
  }
};

export const getCreditCardById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cardId } = req.params;
    const card = await creditCardService.getCreditCardById(cardId, userId);

    if (!card) {
      return res.status(404).json({ message: "Credit card not found" });
    }

    res.json(card);
  } catch (error) {
    logger.error("Error fetching credit card:", error);
    res.status(500).json({ message: "Failed to fetch credit card", error });
  }
};

export const updateCreditCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cardId } = req.params;
    const updates = req.body;

    // Don't allow updating userId, ownerId, or timestamps
    delete updates.userId;
    delete updates.ownerId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const card = await creditCardService.updateCreditCard(cardId, userId, updates);

    if (!card) {
      return res.status(404).json({ message: "Credit card not found" });
    }

    logger.info(`Credit card updated: ${cardId} by user ${userId}`);
    res.json(card);
  } catch (error) {
    logger.error("Error updating credit card:", error);
    res.status(500).json({ message: "Failed to update credit card", error });
  }
};

export const deleteCreditCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cardId } = req.params;
    await creditCardService.deleteCreditCard(cardId, userId);

    logger.info(`Credit card deleted: ${cardId} by user ${userId}`);
    res.json({ message: "Credit card deleted successfully" });
  } catch (error) {
    logger.error("Error deleting credit card:", error);
    res.status(500).json({ message: "Failed to delete credit card", error });
  }
};

export const getUtilizationOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId } = req.query;
    const overview = await creditCardService.calculateOverallUtilization(userId, teamId as string);

    res.json(overview);
  } catch (error) {
    logger.error("Error calculating utilization:", error);
    res.status(500).json({ message: "Failed to calculate utilization", error });
  }
};

export const getCardUtilization = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cardId } = req.params;
    const card = await creditCardService.getCreditCardById(cardId, userId);

    if (!card) {
      return res.status(404).json({ message: "Credit card not found" });
    }

    const utilization = await creditCardService.calculateCardUtilization(card);
    res.json(utilization);
  } catch (error) {
    logger.error("Error calculating card utilization:", error);
    res.status(500).json({ message: "Failed to calculate card utilization", error });
  }
};

export const getCreditAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId } = req.query;
    const alerts = await creditCardService.generateCreditAlerts(userId, teamId as string);

    res.json(alerts);
  } catch (error) {
    logger.error("Error generating credit alerts:", error);
    res.status(500).json({ message: "Failed to generate alerts", error });
  }
};

export const checkSpendingSpike = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cardId } = req.params;
    const alert = await creditCardService.detectSpendingSpike(cardId, userId);

    res.json(alert);
  } catch (error) {
    logger.error("Error detecting spending spike:", error);
    res.status(500).json({ message: "Failed to detect spending spike", error });
  }
};
