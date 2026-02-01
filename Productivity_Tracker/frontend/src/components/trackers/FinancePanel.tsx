import { useState, useEffect } from "react";
import type { Transaction, Budget, MonthlySummary } from "../../services/finance.service";
import * as financeService from "../../services/finance.service";

export default function FinancePanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"transactions" | "budgets" | "summary">("summary");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [categories, setCategories] = useState<{ expense: string[]; income: string[] }>({ expense: [], income: [] });
  const [loading, setLoading] = useState(true);

  // Add Transaction Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: ""
  });

  // Add Budget Form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: "",
    monthlyLimit: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txns, bdgts, summ, cats] = await Promise.all([
        financeService.getTransactions(),
        financeService.getBudgets(),
        financeService.getMonthlySummary(),
        financeService.getCategories()
      ]);
      setTransactions(txns);
      setBudgets(bdgts);
      setSummary(summ);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createTransaction({
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description
      });
      setNewTransaction({ type: "expense", amount: "", category: "", description: "" });
      setShowAddForm(false);
      await loadData();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await financeService.deleteTransaction(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createOrUpdateBudget({
        category: newBudget.category,
        monthlyLimit: parseFloat(newBudget.monthlyLimit)
      });
      setNewBudget({ category: "", monthlyLimit: "" });
      setShowBudgetForm(false);
      await loadData();
    } catch (error) {
      console.error("Failed to add budget:", error);
    }
  };

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return { color: "#ff0000", label: "Exceeded", percentage: 100 };
    if (percentage >= 80) return { color: "#ffaa00", label: "Near Limit", percentage };
    return { color: "#00ff00", label: "On Track", percentage };
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#1a1a1a", 
          padding: "24px", 
          borderRadius: "8px", 
          border: "1px solid #00ffff",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#00ffff", margin: 0 }}>💰 Finance Tracker</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#00ffff",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0"
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #333" }}>
          {(["summary", "transactions", "budgets"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                background: activeTab === tab ? "#00ffff" : "transparent",
                color: activeTab === tab ? "#000" : "#00ffff",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #00ffff" : "2px solid transparent",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ffff", padding: "40px" }}>Loading...</div>
        ) : (
          <>
            {/* Summary Tab */}
            {activeTab === "summary" && summary && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #00ff00" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Income</div>
                    <div style={{ fontSize: "24px", color: "#00ff00", fontWeight: "bold" }}>₹{summary.income.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #ff0000" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Expenses</div>
                    <div style={{ fontSize: "24px", color: "#ff0000", fontWeight: "bold" }}>₹{summary.expenses.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #00ffff" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Savings</div>
                    <div style={{ fontSize: "24px", color: "#00ffff", fontWeight: "bold" }}>₹{summary.savings.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #00ffff" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Savings Rate</div>
                    <div style={{ fontSize: "24px", color: "#00ffff", fontWeight: "bold" }}>{summary.savingsRate.toFixed(1)}%</div>
                  </div>
                </div>

                {summary.highestCategory && (
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "8px" }}>Highest Expense Category</div>
                    <div style={{ fontSize: "18px", color: "#fff" }}>
                      {summary.highestCategory.category}: ₹{summary.highestCategory.amount.toLocaleString()}
                    </div>
                  </div>
                )}

                {summary.comparison && (
                  <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px" }}>
                    <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "8px" }}>vs Last Month</div>
                    <div style={{ fontSize: "16px", color: summary.comparison.expenseChange > 0 ? "#ff0000" : "#00ff00" }}>
                      {summary.comparison.expenseChange > 0 ? "↑" : "↓"} {Math.abs(summary.comparison.expenseChange).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{
                    padding: "8px 16px",
                    background: "#00ffff",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "16px",
                    fontWeight: "bold"
                  }}
                >
                  + Add Transaction
                </button>

                {showAddForm && (
                  <form onSubmit={handleAddTransaction} style={{ marginBottom: "20px", padding: "16px", background: "#0a0a0a", borderRadius: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <select
                        value={newTransaction.type}
                        onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
                        style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff" }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff" }}
                        required
                      />
                    </div>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px" }}
                      required
                    >
                      <option value="">Select Category</option>
                      {(newTransaction.type === "expense" ? categories.expense : categories.income).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" style={{ padding: "8px 16px", background: "#00ffff", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                        Add
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {transactions.slice(0, 20).map(txn => (
                    <div key={txn._id} style={{ padding: "12px", background: "#0a0a0a", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "16px", color: "#fff" }}>{txn.category}</span>
                          <span style={{ fontSize: "12px", color: "#666", padding: "2px 8px", background: "#1a1a1a", borderRadius: "4px" }}>
                            {txn.type}
                          </span>
                        </div>
                        {txn.description && <div style={{ fontSize: "12px", color: "#888" }}>{txn.description}</div>}
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                          {new Date(txn.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "18px", color: txn.type === "income" ? "#00ff00" : "#ff0000", fontWeight: "bold" }}>
                          {txn.type === "income" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(txn._id)}
                          style={{ background: "none", border: "none", color: "#ff0000", cursor: "pointer", fontSize: "18px" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budgets Tab */}
            {activeTab === "budgets" && (
              <div>
                <button
                  onClick={() => setShowBudgetForm(!showBudgetForm)}
                  style={{
                    padding: "8px 16px",
                    background: "#00ffff",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "16px",
                    fontWeight: "bold"
                  }}
                >
                  + Set Budget
                </button>

                {showBudgetForm && (
                  <form onSubmit={handleAddBudget} style={{ marginBottom: "20px", padding: "16px", background: "#0a0a0a", borderRadius: "8px" }}>
                    <select
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px" }}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.expense.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Monthly Limit"
                      value={newBudget.monthlyLimit}
                      onChange={(e) => setNewBudget({ ...newBudget, monthlyLimit: e.target.value })}
                      style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px" }}
                      required
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" style={{ padding: "8px 16px", background: "#00ffff", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                        Set Budget
                      </button>
                      <button type="button" onClick={() => setShowBudgetForm(false)} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {budgets.map(budget => {
                    const status = getBudgetStatus(budget.spent, budget.monthlyLimit);
                    return (
                      <div key={budget._id} style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", border: `1px solid ${status.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ fontSize: "16px", color: "#fff" }}>{budget.category}</div>
                          <div style={{ fontSize: "12px", color: status.color }}>{status.label}</div>
                        </div>
                        <div style={{ fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                          ₹{budget.spent.toLocaleString()} / ₹{budget.monthlyLimit.toLocaleString()}
                        </div>
                        <div style={{ background: "#1a1a1a", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ background: status.color, height: "100%", width: `${status.percentage}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    );
                  })}
                  {budgets.length === 0 && (
                    <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                      No budgets set yet. Click "Set Budget" to start tracking your spending.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
