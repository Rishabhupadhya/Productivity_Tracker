import { useState } from "react";
import type { CreditCard } from "../../services/creditCard.service";

interface AddCreditCardModalProps {
  onClose: () => void;
  onSave: (data: {
    teamId?: string;
    cardName: string;
    bankName: string;
    last4Digits: string;
    creditLimit: number;
    outstandingAmount?: number;
    billingCycleStartDay: number;
    dueDateDay: number;
    interestRate?: number;
  }) => Promise<void>;
  initialData?: CreditCard;
}

export default function AddCreditCardModal({ onClose, onSave, initialData }: AddCreditCardModalProps) {
  const [formData, setFormData] = useState({
    cardName: initialData?.cardName || "",
    bankName: initialData?.bankName || "",
    last4Digits: initialData?.last4Digits || "",
    creditLimit: initialData?.creditLimit?.toString() || "",
    outstandingAmount: initialData?.outstandingAmount?.toString() || "",
    billingCycleStartDay: initialData?.billingCycleStartDay?.toString() || "",
    dueDateDay: initialData?.dueDateDay?.toString() || "",
    interestRate: initialData?.interestRate?.toString() || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardName.trim()) {
      newErrors.cardName = "Card name is required";
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    if (!/^\d{4}$/.test(formData.last4Digits)) {
      newErrors.last4Digits = "Must be exactly 4 digits";
    }

    const limit = Number(formData.creditLimit);
    if (!formData.creditLimit || isNaN(limit) || limit <= 0) {
      newErrors.creditLimit = "Credit limit must be a positive number";
    }

    if (formData.outstandingAmount) {
      const outstanding = Number(formData.outstandingAmount);
      if (isNaN(outstanding) || outstanding < 0) {
        newErrors.outstandingAmount = "Outstanding amount must be a non-negative number";
      }
    }

    const billingDay = Number(formData.billingCycleStartDay);
    if (!formData.billingCycleStartDay || isNaN(billingDay) || billingDay < 1 || billingDay > 31) {
      newErrors.billingCycleStartDay = "Must be between 1 and 31";
    }

    const dueDay = Number(formData.dueDateDay);
    if (!formData.dueDateDay || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      newErrors.dueDateDay = "Must be between 1 and 31";
    }

    if (formData.interestRate) {
      const rate = Number(formData.interestRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interestRate = "Must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave({
        cardName: formData.cardName.trim(),
        bankName: formData.bankName.trim(),
        last4Digits: formData.last4Digits,
        creditLimit: Number(formData.creditLimit),
        outstandingAmount: formData.outstandingAmount ? Number(formData.outstandingAmount) : 0,
        billingCycleStartDay: Number(formData.billingCycleStartDay),
        dueDateDay: Number(formData.dueDateDay),
        interestRate: formData.interestRate ? Number(formData.interestRate) : undefined
      });
    } catch (error) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#2c3e50", marginBottom: "24px" }}>
          {initialData ? "Edit Credit Card" : "Add Credit Card"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Card Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Card Name *
            </label>
            <input
              type="text"
              value={formData.cardName}
              onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
              placeholder="e.g., HDFC Regalia, SBI SimplyCLICK"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.cardName ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.cardName && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.cardName}</div>
            )}
          </div>

          {/* Bank Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Bank Name *
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="e.g., HDFC Bank, State Bank of India"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.bankName ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.bankName && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.bankName}</div>
            )}
          </div>

          {/* Last 4 Digits */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Last 4 Digits *
            </label>
            <input
              type="text"
              value={formData.last4Digits}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setFormData({ ...formData, last4Digits: value });
              }}
              placeholder="1234"
              maxLength={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.last4Digits ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.last4Digits && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.last4Digits}</div>
            )}
          </div>

          {/* Credit Limit */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Credit Limit (₹) *
            </label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              placeholder="100000"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.creditLimit ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.creditLimit && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.creditLimit}</div>
            )}
          </div>

          {/* Outstanding Amount */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Current Outstanding Amount (₹)
            </label>
            <input
              type="number"
              value={formData.outstandingAmount}
              onChange={(e) => setFormData({ ...formData, outstandingAmount: e.target.value })}
              placeholder="0"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.outstandingAmount ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.outstandingAmount && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.outstandingAmount}</div>
            )}
            <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
              Any existing outstanding balance on this card
            </div>
          </div>

          {/* Billing Cycle Start Day */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Billing Cycle Start Day (1-31) *
            </label>
            <input
              type="number"
              value={formData.billingCycleStartDay}
              onChange={(e) => setFormData({ ...formData, billingCycleStartDay: e.target.value })}
              placeholder="1"
              min="1"
              max="31"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.billingCycleStartDay ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.billingCycleStartDay && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.billingCycleStartDay}</div>
            )}
            <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
              Day of month when your billing cycle starts
            </div>
          </div>

          {/* Due Date Day */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Payment Due Date (1-31) *
            </label>
            <input
              type="number"
              value={formData.dueDateDay}
              onChange={(e) => setFormData({ ...formData, dueDateDay: e.target.value })}
              placeholder="20"
              min="1"
              max="31"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.dueDateDay ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.dueDateDay && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.dueDateDay}</div>
            )}
            <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
              Day of month when payment is due
            </div>
          </div>

          {/* Interest Rate (Optional) */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
              Interest Rate (% per annum) - Optional
            </label>
            <input
              type="number"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              placeholder="36"
              step="0.1"
              min="0"
              max="100"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.interestRate ? "1px solid #f44336" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            {errors.interestRate && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}>{errors.interestRate}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "12px 24px",
                background: "#f5f5f5",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: submitting ? "not-allowed" : "pointer",
                color: "#666"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px",
                background: submitting ? "#ccc" : "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? "Saving..." : initialData ? "Update Card" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
