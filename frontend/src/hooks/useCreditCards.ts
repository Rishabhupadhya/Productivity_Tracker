import { useState, useEffect, useCallback } from "react";
import * as creditCardService from "../services/creditCard.service";
import type { CreditCard, UtilizationOverview, CreditAlert } from "../services/creditCard.service";

export const useCreditCards = (teamId?: string) => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [overview, setOverview] = useState<UtilizationOverview | null>(null);
  const [alerts, setAlerts] = useState<CreditAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsData, overviewData, alertsData] = await Promise.all([
        creditCardService.getCreditCards(teamId),
        creditCardService.getUtilizationOverview(teamId),
        creditCardService.getCreditAlerts(teamId)
      ]);
      setCards(cardsData);
      setOverview(overviewData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load credit cards");
      console.error("Error loading credit cards:", err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const addCard = async (cardData: Parameters<typeof creditCardService.createCreditCard>[0]) => {
    try {
      await creditCardService.createCreditCard(cardData);
      await loadCards();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to create credit card");
    }
  };

  const updateCard = async (cardId: string, updates: Partial<CreditCard>) => {
    try {
      await creditCardService.updateCreditCard(cardId, updates);
      await loadCards();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to update credit card");
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await creditCardService.deleteCreditCard(cardId);
      await loadCards();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to delete credit card");
    }
  };

  return {
    cards,
    overview,
    alerts,
    loading,
    error,
    refresh: loadCards,
    addCard,
    updateCard,
    deleteCard
  };
};
