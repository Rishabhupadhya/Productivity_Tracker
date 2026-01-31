import { useState, useEffect } from 'react';
import intelligenceService from '../../services/intelligence.service';
import type {
  CreditScoreImprovementPlan,
  PaymentPriorityPlan,
  CashFlowAnalysis,
  RecoveryPlan
} from '../../services/intelligence.service';
import './creditScore.css';

export default function CreditScoreManager() {
  const [improvementPlan, setImprovementPlan] = useState<CreditScoreImprovementPlan | null>(null);
  const [paymentPriority, setPaymentPriority] = useState<PaymentPriorityPlan | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowAnalysis | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cash flow input state
  const [monthlyIncome, setMonthlyIncome] = useState<number>(80000);
  const [fixedExpenses, setFixedExpenses] = useState<number>(30000);
  const [variableExpenses, setVariableExpenses] = useState<number>(15000);
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plan, priority] = await Promise.all([
        intelligenceService.getCreditScoreImprovementPlan(),
        intelligenceService.getPaymentPriority()
      ]);
      setImprovementPlan(plan);
      setPaymentPriority(priority);
    } catch (err: any) {
      console.error('Error fetching credit score data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCashFlow = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analysis, recovery] = await Promise.all([
        intelligenceService.analyzeCashFlow(monthlyIncome, fixedExpenses, variableExpenses),
        intelligenceService.getRecoveryPlan(monthlyIncome, fixedExpenses, variableExpenses)
      ]);
      setCashFlow(analysis);
      setRecoveryPlan(recovery);
      setShowCashFlowForm(false);
    } catch (err: any) {
      console.error('Error analyzing cash flow:', err);
      setError(err.response?.data?.error || 'Failed to analyze cash flow');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return '';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getScoreImpactColor = (impact: string) => {
    switch (impact) {
      case 'protected': return 'score-protected';
      case 'minor_impact': return 'score-minor';
      case 'major_impact': return 'score-major';
      default: return '';
    }
  };

  if (loading && !improvementPlan) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading credit score insights...</p>
      </div>
    );
  }

  if (error) {
    const isNoCardsError = error.includes('No active credit cards') || error.includes('Failed to load data');
    
    return (
      <div className="error-state" style={{ 
        textAlign: 'center', 
        padding: '60px 40px', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <span className="icon" style={{ fontSize: '64px', marginBottom: '24px', display: 'block' }}>
          {isNoCardsError ? '💳' : '⚠️'}
        </span>
        <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748', marginBottom: '16px' }}>
          {isNoCardsError ? 'No Credit Cards Found' : 'Error Loading Data'}
        </h3>
        <p style={{ fontSize: '16px', color: '#718096', marginBottom: '32px', lineHeight: '1.7' }}>
          {isNoCardsError 
            ? 'To use the Credit Score Manager, you need to add at least one credit card first. Go to the "💳 Credit Cards" tab to add your first card.'
            : error
          }
        </p>
        <button className="retry-button analyze-button" onClick={fetchData}>
          {isNoCardsError ? '🔄 Refresh' : '🔄 Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="credit-score-manager">
      <div className="credit-score-header">
        <h2 style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-block',
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>💳 Credit Score & Payment Planner</h2>
        <p style={{ color: '#718096', fontSize: '15px' }}>
          Personalized actions to improve credit score and optimize payments
        </p>
      </div>

      <div className="credit-score-content">
        
        {/* Credit Score Improvement Plan */}
        {improvementPlan && improvementPlan.actions.length > 0 && (
          <div className="cs-card">
            <h3>🎯 Credit Score Improvement Plan</h3>
            
            {improvementPlan.topHurtingFactors.length > 0 && (
              <div className="hurt-factors">
                <strong>Top factors hurting your score:</strong>
                <ul>
                  {improvementPlan.topHurtingFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="actions-list">
              {improvementPlan.actions.map((action, idx) => (
                <div key={idx} className="action-item">
                  <div className="action-header">
                    <span className="priority-badge">Priority {action.priority}</span>
                    <span className={`impact-badge ${getImpactColor(action.estimatedImpact)}`}>
                      {action.estimatedImpact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <div className="action-body">
                    <div className="action-reason">{action.reason}</div>
                    <div className="action-todo">
                      <strong>Action:</strong> {action.action}
                    </div>
                    {action.amount && (
                      <div className="action-amount">
                        <strong>Amount:</strong> {formatCurrency(action.amount)}
                      </div>
                    )}
                    <div className="action-deadline">
                      <strong>Deadline:</strong> {formatDate(action.deadline)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overall-recommendation">
              <strong>Overall Recommendation:</strong>
              <p>{improvementPlan.overallRecommendation}</p>
            </div>
          </div>
        )}

        {/* Payment Priority */}
        {paymentPriority && paymentPriority.paymentOrder.length > 0 && (
          <div className="cs-card">
            <h3>📊 Payment Priority Order</h3>
            
            <div className="payment-summary">
              <div className="summary-item">
                <span className="label">Total Minimum Due:</span>
                <span className="value">{formatCurrency(paymentPriority.totalMinimumDueAcrossCards)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Outstanding:</span>
                <span className="value">{formatCurrency(paymentPriority.totalOutstandingAcrossCards)}</span>
              </div>
            </div>

            <div className="priority-list">
              {paymentPriority.paymentOrder.map((item, idx) => (
                <div key={idx} className="priority-item">
                  <div className="priority-rank">
                    <div className="rank-number">{item.priority}</div>
                    <div className="rank-label">Pay {item.priority === 1 ? 'First' : item.priority === 2 ? 'Second' : item.priority === 3 ? 'Third' : `${item.priority}th`}</div>
                  </div>
                  
                  <div className="priority-content">
                    <div className="priority-header">
                      <h4>{item.cardName}</h4>
                      <div className="priority-amounts">
                        <span className="min-due">Min Due: {formatCurrency(item.minimumDue)}</span>
                        <span className="total">Total: {formatCurrency(item.totalOutstanding)}</span>
                      </div>
                    </div>

                    <div className="priority-details">
                      <div className="detail-item">
                        <span className="label">Due Date:</span>
                        <span className="value">{formatDate(item.dueDate)} ({item.daysUntilDue} days)</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Utilization:</span>
                        <span className="value">{item.utilizationPercent.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="risk-factors">
                      {item.riskFactors.map((risk, rIdx) => (
                        <span key={rIdx} className={`risk-badge risk-${risk.severity}`}>
                          {getSeverityIcon(risk.severity)} {risk.factor}
                        </span>
                      ))}
                    </div>

                    <div className="priority-explanation">
                      {item.explanation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Flow Analysis */}
        <div className="cs-card">
          <h3>💰 Cash Flow Analysis</h3>
          
          {!cashFlow && (
            <div className="cash-flow-prompt">
              <p>Analyze if your income can cover upcoming credit card payments</p>
              <button 
                className="analyze-button"
                onClick={() => setShowCashFlowForm(!showCashFlowForm)}
              >
                {showCashFlowForm ? 'Cancel' : 'Analyze Cash Flow'}
              </button>
            </div>
          )}

          {showCashFlowForm && (
            <div className="cash-flow-form">
              <div className="form-group">
                <label>Monthly Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Fixed Expenses (₹)</label>
                <input
                  type="number"
                  value={fixedExpenses}
                  onChange={(e) => setFixedExpenses(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Variable Expenses (₹)</label>
                <input
                  type="number"
                  value={variableExpenses}
                  onChange={(e) => setVariableExpenses(Number(e.target.value))}
                  min="0"
                />
              </div>
              <button className="submit-button" onClick={analyzeCashFlow}>
                Analyze
              </button>
            </div>
          )}

          {cashFlow && (
            <div className="cash-flow-results">
              <div className="cash-flow-summary">
                <div className={`summary-status ${cashFlow.isFeasible ? 'feasible' : 'shortfall'}`}>
                  {cashFlow.isFeasible ? '✅' : '⚠️'} {cashFlow.summary}
                </div>
              </div>

              <div className="cash-flow-breakdown">
                <div className="breakdown-item">
                  <span className="label">Monthly Income:</span>
                  <span className="value income">{formatCurrency(cashFlow.monthlyIncome)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Fixed Expenses:</span>
                  <span className="value expense">-{formatCurrency(cashFlow.fixedExpenses)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Variable Expenses:</span>
                  <span className="value expense">-{formatCurrency(cashFlow.variableExpenses)}</span>
                </div>
                <div className="breakdown-item total">
                  <span className="label">Available Cash:</span>
                  <span className="value">{formatCurrency(cashFlow.availableCash)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Required Payments:</span>
                  <span className="value required">-{formatCurrency(cashFlow.totalRequiredPayments)}</span>
                </div>
                {!cashFlow.isFeasible && (
                  <div className="breakdown-item shortfall-item">
                    <span className="label">Shortfall:</span>
                    <span className="value shortfall">{formatCurrency(cashFlow.shortfallAmount)}</span>
                  </div>
                )}
              </div>

              <button 
                className="reanalyze-button"
                onClick={() => setShowCashFlowForm(true)}
              >
                Adjust Numbers
              </button>
            </div>
          )}
        </div>

        {/* Recovery Plan */}
        {recoveryPlan && recoveryPlan.shortfallAmount > 0 && (
          <div className="cs-card recovery-card">
            <h3>🆘 Recovery Plan</h3>
            
            <div className="shortfall-alert">
              <span className="alert-icon">⚠️</span>
              <span>Shortfall detected: {formatCurrency(recoveryPlan.shortfallAmount)}</span>
            </div>

            <div className="suggestions-list">
              <h4>Suggested Actions (Priority Order):</h4>
              {recoveryPlan.suggestions.map((suggestion, idx) => (
                <div key={idx} className="suggestion-item">
                  <div className="suggestion-header">
                    <span className="suggestion-priority">#{suggestion.priority}</span>
                    <span className="suggestion-type">{suggestion.type.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="suggestion-description">{suggestion.description}</div>
                  <div className="suggestion-impact">
                    <strong>Impact:</strong> {suggestion.impact}
                  </div>
                  {suggestion.amountInvolved && (
                    <div className="suggestion-amount">
                      <strong>Amount:</strong> {formatCurrency(suggestion.amountInvolved)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="scenarios-comparison">
              <h4>Scenario Comparison:</h4>
              <div className="scenarios-grid">
                {recoveryPlan.scenarios.map((scenario, idx) => (
                  <div key={idx} className={`scenario-card ${getScoreImpactColor(scenario.creditScoreImpact)}`}>
                    <h5>{scenario.name}</h5>
                    <div className="scenario-details">
                      <div className="scenario-item">
                        <span className="label">Payment:</span>
                        <span className="value">{formatCurrency(scenario.totalPayment)}</span>
                      </div>
                      <div className="scenario-item">
                        <span className="label">Score Impact:</span>
                        <span className={`value impact-${scenario.creditScoreImpact}`}>
                          {scenario.creditScoreImpact.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="scenario-explanation">{scenario.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
