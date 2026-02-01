import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import type { Transaction, MonthlySummary } from "../services/finance.service";
import * as financeService from "../services/finance.service";
import { useCreditCards } from "../hooks/useCreditCards";

export default function Finance() {
  const navigate = useNavigate();
  const { cards } = useCreditCards();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeVisibleCount, setIncomeVisibleCount] = useState(25);
  const [expenseVisibleCount, setExpenseVisibleCount] = useState(25);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    subcategory: "",
    payment: "",
    paymentType: "cash" as "cash" | "debit" | "credit",
    creditCardId: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    isRecurring: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("Loading finance data...");
      const [txns, summaryData] = await Promise.all([
        financeService.getTransactions(),
        financeService.getMonthlySummary()
      ]);
      console.log("Loaded transactions:", txns);
      console.log("Transactions type:", typeof txns, Array.isArray(txns));
      console.log("Transactions length:", txns?.length);
      console.log("First transaction:", txns?.[0]);
      console.log("Loaded summary:", summaryData);
      console.log("Income transactions:", txns.filter(t => t.type === "income"));
      console.log("Expense transactions:", txns.filter(t => t.type === "expense"));
      console.log("Total expense from summary:", summaryData?.expenses);
      console.log("Total income from summary:", summaryData?.income);
      setTransactions(txns);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load finance data. Please make sure you're logged in and the backend is running.");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    console.log("Submitting transaction:", newTransaction);
    try {
      if (editingTransaction) {
        // Update existing transaction
        await financeService.updateTransaction(editingTransaction._id, {
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          date: newTransaction.date,
          description: `${newTransaction.subcategory} - ${newTransaction.payment}${newTransaction.description ? ' - ' + newTransaction.description : ''}`,
          paymentType: newTransaction.paymentType,
          creditCardId: newTransaction.paymentType === "credit" ? newTransaction.creditCardId : undefined,
          isRecurring: newTransaction.isRecurring
        });
        alert("Transaction updated successfully!");
      } else {
        // Create new transaction
        const createdTransaction = await financeService.createTransaction({
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          date: newTransaction.date,
          description: `${newTransaction.subcategory} - ${newTransaction.payment}${newTransaction.description ? ' - ' + newTransaction.description : ''}`,
          paymentType: newTransaction.paymentType,
          creditCardId: newTransaction.paymentType === "credit" ? newTransaction.creditCardId : undefined,
          isRecurring: newTransaction.isRecurring
        });

        // If marked as recurring, create a recurring transaction entry
        if (newTransaction.isRecurring) {
          const transactionDate = new Date(newTransaction.date);
          await financeService.createRecurringTransaction({
            type: newTransaction.type,
            amount: parseFloat(newTransaction.amount),
            category: newTransaction.category,
            description: `${newTransaction.subcategory} - ${newTransaction.payment}${newTransaction.description ? ' - ' + newTransaction.description : ''}`,
            frequency: "monthly", // Default to monthly
            dayOfMonth: transactionDate.getDate(),
            startDate: transactionDate
          });
        }

        alert("Transaction added successfully!" + (newTransaction.isRecurring ? " This will repeat monthly." : ""));
      }
      setNewTransaction({ type: "expense", amount: "", category: "", subcategory: "", payment: "", paymentType: "cash", creditCardId: "", date: new Date().toISOString().split('T')[0], description: "", isRecurring: false });
      setEditingTransaction(null);
      setShowAddIncome(false);
      setShowAddExpense(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      alert("Failed to save transaction. Error: " + (error as any).response?.data?.message || (error as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    const descParts = transaction.description?.split(' - ') || [];
    setNewTransaction({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      subcategory: descParts[0] || '',
      payment: descParts[1] || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: descParts[2] || '',
      isRecurring: transaction.isRecurring || false,
      paymentType: transaction.paymentType || "cash",
      creditCardId: transaction.creditCardId || ""
    });
    setEditingTransaction(transaction);
    if (transaction.type === "income") {
      setShowAddIncome(true);
    } else {
      setShowAddExpense(true);
    }
  };

  const handleDeleteTransaction = async (id: string, type: string) => {
    if (!confirm(`Delete this ${type} transaction?`)) return;
    console.log("Deleting transaction:", id);
    try {
      await financeService.deleteTransaction(id);
      console.log("Transaction deleted successfully");
      await loadData();
      alert("Transaction deleted successfully!");
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("Failed to delete transaction. Error: " + (error as any).response?.data?.message || (error as any).message);
    }
  };

  const incomeTransactions = transactions.filter(t => t.type === "income");
  const expenseTransactions = transactions.filter(t => t.type === "expense");

  const incomeIsShowingAll = incomeVisibleCount >= incomeTransactions.length;
  const expenseIsShowingAll = expenseVisibleCount >= expenseTransactions.length;

  // Calculate totals from transactions
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  // Calculate category spending for donut chart
  const categorySpending = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate category income
  const categoryIncome = incomeTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    Shopping: "#FF6B6B",      // Bright coral red
    Entertainment: "#9B59B6",  // Rich purple
    Rent: "#3498DB",           // Bright blue
    Utilities: "#F39C12",      // Vibrant orange
    Transport: "#1ABC9C",      // Turquoise
    Subscription: "#E74C3C",   // Bright red
    Food: "#FF8C42",           // Peach orange
    Travel: "#FF69B4",         // Hot pink
    Fun: "#FFA500",            // Orange
    EMI: "#E67E22",            // Carrot orange
    Healthcare: "#9C27B0",     // Deep purple
    Education: "#00ACC1",      // Cyan blue
    Groceries: "#FF5252",      // Bright red
    Bills: "#EF5350",          // Red
    Misc: "#78909C",           // Blue grey
    // Income categories - all green shades
    Salary: "#4CAF50",         // Green
    Freelance: "#66BB6A",      // Light green
    Investment: "#81C784",     // Lighter green
    Business: "#A5D6A7",       // Pale green
  };

  // Color palette for automatic assignment if category not found
  const colorPalette = ["#FF6B6B", "#9B59B6", "#3498DB", "#F39C12", "#1ABC9C", "#E74C3C", "#FF69B4", "#FFA500", "#9C27B0", "#00ACC1"];
  
  const getCategoryColor = (category: string, index: number) => {
    return categoryColors[category] || colorPalette[index % colorPalette.length];
  };

  // Calculate analytics from current transactions
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  const highestCategory = Object.entries(categorySpending).length > 0
    ? Object.entries(categorySpending).reduce((max, [category, amount]) => 
        amount > max.amount ? { category, amount } : max, 
        { category: '', amount: 0 }
      )
    : null;

  // Get last month's expenses for comparison
  const currentDate = new Date();
  const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  
  const lastMonthExpenses = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === "expense" && tDate >= lastMonthStart && tDate <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenseChange = lastMonthExpenses > 0 
    ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;

  // Debug logging for month comparison
  console.log("Month comparison debug:", {
    currentMonth: currentDate.getMonth() + 1,
    lastMonthStart: lastMonthStart.toISOString(),
    lastMonthEnd: lastMonthEnd.toISOString(),
    lastMonthExpenses,
    currentMonthExpenses: totalExpenses,
    expenseChange,
    allTransactionDates: transactions.map(t => ({ date: t.date, type: t.type, amount: t.amount }))
  });

  return (
    <AppLayout>
      <div style={{ display: "flex", height: "100%", background: "#f5f5f5" }}>
        {/* Left Sidebar */}
        <div style={{ width: "280px", background: "#fff", padding: "24px", borderRight: "1px solid #e0e0e0", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "32px" }}>💰</div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>Simple Finance Tracker + Analytics</h2>
          </div>

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#666", marginBottom: "12px" }}>Quick Actions</h3>
            <button
              onClick={() => { 
                console.log("New Expense button clicked");
                setNewTransaction({ ...newTransaction, type: "expense" }); 
                setShowAddExpense(true); 
              }}
              style={{ width: "100%", padding: "12px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", textAlign: "left", color: "#666", fontSize: "14px" }}
            >
              + New Expense
            </button>
            <button
              onClick={() => { 
                console.log("New Income button clicked");
                setNewTransaction({ ...newTransaction, type: "income" }); 
                setShowAddIncome(true); 
              }}
              style={{ width: "100%", padding: "12px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "16px", cursor: "pointer", textAlign: "left", color: "#666", fontSize: "14px" }}
            >
              + New Income
            </button>
            <button 
              onClick={() => navigate("/finance/credit-cards")}
              style={{ width: "100%", padding: "12px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "16px", cursor: "pointer", textAlign: "left", color: "#666", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              💳 Credit Cards
            </button>
            <button 
              onClick={() => {
                console.log("Analytics button clicked");
                setShowAnalytics(!showAnalytics);
              }}
              style={{ width: "100%", padding: "12px", background: showAnalytics ? "#e8f5e9" : "#fff", border: showAnalytics ? "2px solid #4CAF50" : "none", borderRadius: "8px", cursor: "pointer", textAlign: "left", color: "#4CAF50", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", fontWeight: showAnalytics ? "600" : "normal" }}
            >
              📊 Analytics {showAnalytics && "✓"}
            </button>
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#999", marginBottom: "12px" }}>Category Income</h3>
            {Object.keys(categoryIncome).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                {Object.entries(categoryIncome)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#e8f5e9", borderRadius: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "12px", height: "12px", background: categoryColors[category] || "#4CAF50", borderRadius: "2px" }}></div>
                        <span style={{ color: "#666", fontSize: "13px" }}>{category}</span>
                      </div>
                      <span style={{ color: "#2c3e50", fontWeight: "600", fontSize: "13px" }}>₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                No income yet
              </div>
            )}
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#999", marginBottom: "12px" }}>Category Spending</h3>
            {Object.keys(categorySpending).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto", background: "#fafafa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                    {Object.entries(categorySpending).length === 1 ? (
                      // Single category - show full circle
                      <>
                        <circle cx="100" cy="100" r="80" fill={getCategoryColor(Object.keys(categorySpending)[0], 0)} />
                        <circle cx="100" cy="100" r="50" fill="#fff" />
                      </>
                    ) : (
                      // Multiple categories - show pie slices
                      <>
                        {Object.entries(categorySpending).map(([category, amount], idx, arr) => {
                          const total = Object.values(categorySpending).reduce((a, b) => a + b, 0);
                          if (total === 0) return null;
                          const percentage = (amount / total) * 100;
                          const startAngle = arr.slice(0, idx).reduce((sum, [, amt]) => sum + ((amt / total) * 360), 0);
                          const angle = (percentage / 100) * 360;
                          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = 100 + 80 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                          const y2 = 100 + 80 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          return (
                            <path
                              key={category}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={getCategoryColor(category, idx)}
                            />
                          );
                        })}
                        <circle cx="100" cy="100" r="50" fill="#fff" />
                      </>
                    )}
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  {Object.entries(categorySpending)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount], idx) => (
                      <div key={category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#f8f9fa", borderRadius: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "12px", height: "12px", background: getCategoryColor(category, idx), borderRadius: "2px" }}></div>
                          <span style={{ color: "#666", fontSize: "13px" }}>{category}</span>
                        </div>
                        <span style={{ color: "#2c3e50", fontWeight: "600", fontSize: "13px" }}>₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                No expenses yet
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "32px", overflow: "auto" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "8px 16px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", marginBottom: "24px", fontSize: "14px", color: "#666" }}
          >
            ← Back
          </button>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Total Transactions</span>
                <span style={{ fontSize: "16px" }}>↕️</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "600", color: "#2c3e50" }}>{transactions.length}</div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Total Income</span>
                <span style={{ fontSize: "16px", color: "#4CAF50" }}>📈</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "600", color: "#4CAF50" }}>₹{(totalIncome / 1000).toFixed(1)}K</div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Total Expense</span>
                <span style={{ fontSize: "16px", color: "#f44336" }}>📉</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "600", color: "#f44336" }}>₹{(totalExpenses / 1000).toFixed(1)}K</div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Net Cash Flow</span>
                <span style={{ fontSize: "16px", color: "#4CAF50" }}>↕️</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "600", color: "#4CAF50" }}>₹{(netCashFlow / 1000).toFixed(1)}K</div>
            </div>
          </div>

          {/* Analytics Section */}
          {showAnalytics && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#2c3e50", marginBottom: "20px" }}>📊 Financial Analytics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Savings Rate</h4>
                  <div style={{ fontSize: "32px", fontWeight: "700", color: "#4CAF50", marginBottom: "8px" }}>{savingsRate.toFixed(1)}%</div>
                  <div style={{ background: "#f5f5f5", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ background: "#4CAF50", height: "100%", width: `${Math.min(savingsRate, 100)}%`, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: "13px", color: "#999", marginTop: "8px" }}>of income saved this month</p>
                </div>
                {highestCategory && highestCategory.amount > 0 && (
                  <div>
                    <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Highest Spending Category</h4>
                    <div style={{ fontSize: "24px", fontWeight: "600", color: "#f44336", marginBottom: "4px" }}>{highestCategory.category}</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#2c3e50" }}>₹{highestCategory.amount.toLocaleString()}</div>
                    <p style={{ fontSize: "13px", color: "#999", marginTop: "8px" }}>biggest expense category</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "24px", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
                <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Month-over-Month Comparison</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: expenseChange > 0 ? "#f44336" : "#4CAF50" }}>
                    {expenseChange > 0 ? "↑" : "↓"} {Math.abs(expenseChange).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    {expenseChange > 0 ? "increase" : "decrease"} vs last month (₹{lastMonthExpenses.toLocaleString()})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Income Table */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2c3e50", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Income
              </h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Showing {Math.min(incomeVisibleCount, incomeTransactions.length)} of {incomeTransactions.length}
                </div>
                {incomeTransactions.length > 25 && (
                  <button
                    onClick={() => setIncomeVisibleCount(incomeIsShowingAll ? 25 : incomeTransactions.length)}
                    style={{ padding: "6px 10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    title={incomeIsShowingAll ? "Show fewer rows" : "Show all rows"}
                  >
                    {incomeIsShowingAll ? "Show less" : "Show all"}
                  </button>
                )}
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>☰</button>
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>⇅</button>
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>🔍</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📋 n</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📅 Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>💰 Amount</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>🏷️ Category</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📊 Subcategory</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>💳 Payment</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#999", fontWeight: "500" }}>🗑️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomeTransactions.slice(0, incomeVisibleCount).map((t, idx) => {
                  const descParts = t.description?.split(' - ') || [];
                  const subcategory = descParts[0] || '-';
                  const payment = descParts[1] || '-';
                  return (
                  <tr key={t._id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>📄 {idx + 1}</td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>{new Date(t.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#2c3e50", fontWeight: "500" }}>₹{t.amount.toLocaleString()}</td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#c8e6c9", color: "#2e7d32", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{t.category}</span></td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#fff9c4", color: "#f57f17", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{subcategory}</span></td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#ffccbc", color: "#d84315", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{payment}</span></td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleEditTransaction(t)}
                        style={{ background: "#e3f2fd", color: "#1976d2", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500", marginRight: "8px" }}
                        title="Edit income"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t._id, "income")}
                        style={{ background: "#ffebee", color: "#c62828", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                        title="Delete income"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expenses Table */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2c3e50", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Expenses
              </h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Showing {Math.min(expenseVisibleCount, expenseTransactions.length)} of {expenseTransactions.length}
                </div>
                {expenseTransactions.length > 25 && (
                  <button
                    onClick={() => setExpenseVisibleCount(expenseIsShowingAll ? 25 : expenseTransactions.length)}
                    style={{ padding: "6px 10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    title={expenseIsShowingAll ? "Show fewer rows" : "Show all rows"}
                  >
                    {expenseIsShowingAll ? "Show less" : "Show all"}
                  </button>
                )}
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>☰</button>
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>⇅</button>
                <button style={{ padding: "4px 8px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>🔍</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📋 n</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📅 Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>💰 Amount</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>🏷️ Category</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>📊 Subcategory</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#999", fontWeight: "500" }}>💳 Payment</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#999", fontWeight: "500" }}>🗑️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseTransactions.slice(0, expenseVisibleCount).map((t, idx) => {
                  const descParts = t.description?.split(' - ') || [];
                  const subcategory = descParts[0] || '-';
                  const payment = descParts[1] || '-';
                  return (
                  <tr key={t._id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>📄 {idx + 1}</td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>{new Date(t.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#2c3e50", fontWeight: "500" }}>₹{t.amount.toLocaleString()}</td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#ffcdd2", color: "#c62828", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{t.category}</span></td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#f8bbd0", color: "#880e4f", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{subcategory}</span></td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#e1bee7", color: "#4a148c", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>{payment}</span></td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleEditTransaction(t)}
                        style={{ background: "#e3f2fd", color: "#1976d2", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500", marginRight: "8px" }}
                        title="Edit expense"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t._id, "expense")}
                        style={{ background: "#ffebee", color: "#c62828", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                        title="Delete expense"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncome && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => { setShowAddIncome(false); setEditingTransaction(null); }}>
          <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "500px", maxWidth: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "24px", fontSize: "20px", color: "#2c3e50" }}>{editingTransaction ? "Edit Income" : "Add Income"}</h2>
            <form onSubmit={handleAddTransaction}>
              <input type="number" placeholder="Amount" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <input type="text" placeholder="Category (Salary, Freelance, etc.)" value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <input type="text" placeholder="Subcategory" value={newTransaction.subcategory} onChange={(e) => setNewTransaction({ ...newTransaction, subcategory: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
              <input type="text" placeholder="Payment Method" value={newTransaction.payment} onChange={(e) => setNewTransaction({ ...newTransaction, payment: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
              <input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <label style={{ display: "flex", alignItems: "center", marginBottom: "16px", fontSize: "14px", cursor: "pointer" }}>
                <input type="checkbox" checked={newTransaction.isRecurring} onChange={(e) => setNewTransaction({ ...newTransaction, isRecurring: e.target.checked })} style={{ marginRight: "8px", width: "18px", height: "18px", cursor: "pointer" }} />
                <span>Recurring Income</span>
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "12px", background: isSubmitting ? "#ccc" : "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px" }}>{isSubmitting ? (editingTransaction ? "Updating..." : "Adding...") : (editingTransaction ? "Update Income" : "Add Income")}</button>
                <button type="button" onClick={() => { setShowAddIncome(false); setEditingTransaction(null); }} style={{ flex: 1, padding: "12px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => { setShowAddExpense(false); setEditingTransaction(null); }}>
          <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "24px", fontSize: "20px", color: "#2c3e50" }}>{editingTransaction ? "Edit Expense" : "Add Expense"}</h2>
            <form onSubmit={handleAddTransaction}>
              <input type="number" placeholder="Amount" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <input type="text" placeholder="Category (Food, Transport, etc.)" value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <input type="text" placeholder="Subcategory" value={newTransaction.subcategory} onChange={(e) => setNewTransaction({ ...newTransaction, subcategory: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
              <input type="text" placeholder="Payment Method" value={newTransaction.payment} onChange={(e) => setNewTransaction({ ...newTransaction, payment: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
              
              {/* Payment Type Selection */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>Payment Type</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ flex: 1, padding: "10px", border: newTransaction.paymentType === "cash" ? "2px solid #4CAF50" : "1px solid #ddd", borderRadius: "8px", textAlign: "center", cursor: "pointer", fontSize: "14px", background: newTransaction.paymentType === "cash" ? "#f1f8f4" : "#fff" }}>
                    <input type="radio" name="paymentType" value="cash" checked={newTransaction.paymentType === "cash"} onChange={() => setNewTransaction({ ...newTransaction, paymentType: "cash", creditCardId: "" })} style={{ display: "none" }} />
                    💵 Cash
                  </label>
                  <label style={{ flex: 1, padding: "10px", border: newTransaction.paymentType === "debit" ? "2px solid #4CAF50" : "1px solid #ddd", borderRadius: "8px", textAlign: "center", cursor: "pointer", fontSize: "14px", background: newTransaction.paymentType === "debit" ? "#f1f8f4" : "#fff" }}>
                    <input type="radio" name="paymentType" value="debit" checked={newTransaction.paymentType === "debit"} onChange={() => setNewTransaction({ ...newTransaction, paymentType: "debit", creditCardId: "" })} style={{ display: "none" }} />
                    💳 Debit
                  </label>
                  <label style={{ flex: 1, padding: "10px", border: newTransaction.paymentType === "credit" ? "2px solid #4CAF50" : "1px solid #ddd", borderRadius: "8px", textAlign: "center", cursor: "pointer", fontSize: "14px", background: newTransaction.paymentType === "credit" ? "#f1f8f4" : "#fff" }}>
                    <input type="radio" name="paymentType" value="credit" checked={newTransaction.paymentType === "credit"} onChange={() => setNewTransaction({ ...newTransaction, paymentType: "credit" })} style={{ display: "none" }} />
                    💳 Credit
                  </label>
                </div>
              </div>

              {/* Credit Card Selection - only show if payment type is credit */}
              {newTransaction.paymentType === "credit" && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>Select Credit Card *</label>
                  <select
                    value={newTransaction.creditCardId}
                    onChange={(e) => setNewTransaction({ ...newTransaction, creditCardId: e.target.value })}
                    style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
                    required
                  >
                    <option value="">-- Select a card --</option>
                    {cards.map(card => (
                      <option key={card._id} value={card._id}>
                        {card.cardName} ({card.bankName} •••• {card.last4Digits})
                      </option>
                    ))}
                  </select>
                  {cards.length === 0 && (
                    <div style={{ fontSize: "12px", color: "#f44336", marginTop: "4px" }}>
                      No credit cards added. <button type="button" onClick={() => navigate("/finance/credit-cards")} style={{ color: "#4CAF50", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Add one now</button>
                    </div>
                  )}
                </div>
              )}

              <input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} required />
              <label style={{ display: "flex", alignItems: "center", marginBottom: "16px", fontSize: "14px", cursor: "pointer" }}>
                <input type="checkbox" checked={newTransaction.isRecurring} onChange={(e) => setNewTransaction({ ...newTransaction, isRecurring: e.target.checked })} style={{ marginRight: "8px", width: "18px", height: "18px", cursor: "pointer" }} />
                <span>Recurring Expense</span>
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "12px", background: isSubmitting ? "#ccc" : "#f44336", color: "#fff", border: "none", borderRadius: "8px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px" }}>{isSubmitting ? (editingTransaction ? "Updating..." : "Adding...") : (editingTransaction ? "Update Expense" : "Add Expense")}</button>
                <button type="button" onClick={() => { setShowAddExpense(false); setEditingTransaction(null); }} style={{ flex: 1, padding: "12px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
