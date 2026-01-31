import { useState } from "react";
import { useCreditCards } from "../../hooks/useCreditCards";
import AddCreditCardModal from "./AddCreditCardModal";
import type { CreditCard } from "../../services/creditCard.service";

export default function CreditDashboard() {
  const { cards, overview, alerts, loading, addCard, updateCard, deleteCard } = useCreditCards();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  if (loading && !overview) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: "18px" }}>Loading credit card data...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#4CAF50";
      case "caution":
        return "#FFA500";
      case "warning":
        return "#FF9800";
      case "critical":
        return "#f44336";
      default:
        return "#999";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const handleAddCard = async (cardData: Parameters<typeof addCard>[0]) => {
    try {
      await addCard(cardData);
      setShowAddModal(false);
      alert("Credit card added successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateCard = async (cardData: Parameters<typeof addCard>[0]) => {
    if (!editingCard) return;
    try {
      await updateCard(editingCard._id, cardData);
      setEditingCard(null);
      alert("Credit card updated successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    if (!confirm(`Delete ${cardName}? This will not delete past transactions.`)) return;
    try {
      await deleteCard(cardId);
      alert("Credit card deleted successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>💳 Credit Card Intelligence</h1>
          <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>
            Manage your credit cards and track utilization across billing cycles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "12px 24px",
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Add Credit Card
        </button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2c3e50", marginBottom: "12px" }}>
            🔔 Alerts & Insights
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: "16px",
                  background: alert.severity === "critical" ? "#ffebee" : alert.severity === "warning" ? "#fff3e0" : "#e3f2fd",
                  border: `1px solid ${alert.severity === "critical" ? "#f44336" : alert.severity === "warning" ? "#FF9800" : "#2196F3"}`,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{ fontSize: "24px" }}>{getSeverityIcon(alert.severity)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", color: "#2c3e50", fontWeight: "500" }}>{alert.message}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Total Credit Limit</div>
            <div style={{ fontSize: "28px", fontWeight: "600", color: "#2c3e50" }}>
              ₹{(overview.totalCreditLimit / 1000).toFixed(0)}K
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Total Outstanding</div>
            <div style={{ fontSize: "28px", fontWeight: "600", color: "#f44336" }}>
              ₹{(overview.totalOutstanding / 1000).toFixed(1)}K
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Overall Utilization</div>
            <div style={{ fontSize: "28px", fontWeight: "600", color: getStatusColor(overview.overallStatus) }}>
              {overview.overallUtilization.toFixed(1)}%
            </div>
            <div style={{ fontSize: "12px", color: getStatusColor(overview.overallStatus), textTransform: "uppercase", marginTop: "4px", fontWeight: "600" }}>
              {overview.overallStatus}
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Active Cards</div>
            <div style={{ fontSize: "28px", fontWeight: "600", color: "#2c3e50" }}>
              {overview.activeCardCount}/{overview.cardCount}
            </div>
          </div>
        </div>
      )}

      {/* Card List */}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#2c3e50", marginBottom: "16px" }}>
          Your Credit Cards
        </h3>
        {cards.length === 0 ? (
          <div style={{ background: "#fff", padding: "60px", textAlign: "center", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
            <div style={{ fontSize: "18px", color: "#666", marginBottom: "8px" }}>No credit cards added yet</div>
            <div style={{ fontSize: "14px", color: "#999" }}>Add your first credit card to start tracking utilization</div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                background: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              + Add Credit Card
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" }}>
            {overview?.cards.map((card) => (
              <div
                key={card.cardId}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  border: `2px solid ${getStatusColor(card.status)}`
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "600", color: "#2c3e50" }}>{card.cardName}</div>
                    <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                      {card.bankName} •••• {card.last4Digits}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        const cardData = cards.find(c => c._id === card.cardId);
                        if (cardData) setEditingCard(cardData);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#f5f5f5",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.cardId, card.cardName)}
                      style={{
                        padding: "6px 12px",
                        background: "#ffebee",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: "#f44336"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#666" }}>Utilization</span>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: getStatusColor(card.status) }}>
                      {card.utilizationPercent}%
                    </span>
                  </div>
                  <div style={{ background: "#f5f5f5", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        background: getStatusColor(card.status),
                        height: "100%",
                        width: `${Math.min(card.utilizationPercent, 100)}%`,
                        transition: "width 0.3s"
                      }}
                    />
                  </div>
                </div>

                {/* Credit Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>Outstanding</div>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "#f44336" }}>
                      ₹{card.outstanding.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>Credit Limit</div>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "#2c3e50" }}>
                      ₹{card.creditLimit.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div style={{ padding: "12px", background: "#f8f9fa", borderRadius: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#666" }}>Billing Period</span>
                    <span style={{ color: "#2c3e50", fontWeight: "500" }}>
                      {new Date(card.currentBillingPeriod.start).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                      {" - "}
                      {new Date(card.currentBillingPeriod.end).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Due Date</span>
                    <span style={{ color: card.daysUntilDue <= 7 ? "#f44336" : "#2c3e50", fontWeight: "600" }}>
                      {new Date(card.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                      {" "}
                      ({card.daysUntilDue} days)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCreditCardModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCard}
        />
      )}

      {editingCard && (
        <AddCreditCardModal
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
          initialData={editingCard}
        />
      )}
    </div>
  );
}
