import { useState, useEffect } from 'react';
import intelligenceService from '../services/intelligence.service';
import type {
  IntelligenceInsights,
  IntelligenceDashboard as DashboardData
} from '../services/intelligence.service';
import { api } from '../services/api';
import '../components/intelligence/intelligence.css';

interface CreditCard {
  _id: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
}

export default function IntelligenceDashboard() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [insights, setInsights] = useState<IntelligenceInsights | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (selectedCard) {
      fetchInsights(selectedCard);
    }
  }, [selectedCard]);

  const fetchCards = async () => {
    try {
      const response = await api.get('/finance/credit-cards');
      const data = response.data;
      console.log('Fetched cards:', data);
      setCards(data);
      if (data.length > 0 && !selectedCard) {
        setSelectedCard(data[0]._id);
      } else if (data.length === 0) {
        setLoading(false);
        setError('No credit cards found. Please add a credit card first.');
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      setLoading(false);
      setError('Failed to load credit cards');
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await intelligenceService.getDashboard();
      console.log('Fetched dashboard:', data);
      setDashboard(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const fetchInsights = async (cardId: string) => {
    console.log('Fetching insights for card:', cardId);
    setLoading(true);
    setError(null);
    try {
      const data = await intelligenceService.getCardInsights(cardId);
      console.log('Fetched insights:', data);
      setInsights(data);
    } catch (err: any) {
      console.error('Error fetching insights:', err);
      setError(err.response?.data?.error || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  if (loading && !insights) {
    return (
      <div className="intelligence-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading intelligence insights...</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            {cards.length > 0 ? `Selected: ${selectedCard}` : 'No cards available'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-dashboard">
        <div className="error-state">
          <div className="icon">⚠️</div>
          <h3>{error}</h3>
          <p>Make sure the card has a monthly limit set and has some transactions.</p>
          <button 
            onClick={() => selectedCard && fetchInsights(selectedCard)}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-dashboard">
      <div className="intelligence-header">
        <h1 style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-block'
        }}>🧠 Credit Card Intelligence</h1>
        <p>ML-driven insights to optimize your credit card usage</p>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="summary-grid">
          <div className="summary-card health-score">
            <h3>Average Health Score</h3>
            <div className={`value ${getHealthScoreColor(dashboard.averageHealthScore)}`}>
              {dashboard.averageHealthScore}
            </div>
            <div className="subtitle">Across {dashboard.totalCards} cards</div>
          </div>

          <div className="summary-card">
            <h3>Active Alerts</h3>
            <div className="value">{dashboard.totalAlerts}</div>
            <div className="subtitle">{dashboard.criticalAlerts} critical</div>
          </div>

          <div className="summary-card">
            <h3>Cards at Risk</h3>
            <div className="value">{dashboard.cardsAtRisk}</div>
            <div className="subtitle">High utilization</div>
          </div>

          <div className="summary-card">
            <h3>Overall Utilization</h3>
            <div className="value">{formatPercentage(dashboard.overallUtilization)}</div>
            <div className="subtitle">{dashboard.totalAnomalies} anomalies detected</div>
          </div>
        </div>
      )}

      {/* Card Selector */}
      <div className="card-selector">
        <label>Select Card</label>
        <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)}>
          {cards.map(card => (
            <option key={card._id} value={card._id}>
              {card.cardName} - {card.bankName} ****{card.last4Digits}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="error-state">
          <div className="icon">⚠️</div>
          <h3>{error}</h3>
          <p>Make sure the card has a monthly limit set and has some transactions.</p>
        </div>
      )}

      {insights && (
        <>
          {/* Active Alerts */}
          {insights.activeAlerts.length > 0 && (
            <div className="alerts-section">
              <div className="intelligence-card">
                <h2>
                  <span className="icon">🚨</span>
                  Active Alerts
                </h2>
                <div className="alerts-list">
                  {insights.activeAlerts.map((alert, index) => (
                    <div key={index} className={`alert-item ${alert.severity}`}>
                      <div className="alert-icon">
                        {alert.severity === 'critical' && '🔴'}
                        {alert.severity === 'high' && '⚠️'}
                        {alert.severity === 'medium' && '⚡'}
                      </div>
                      <div className="alert-content">
                        <div className="alert-type">{alert.type.replace(/_/g, ' ')}</div>
                        <div className="alert-message">{alert.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {insights.activeAlerts.length === 0 && (
            <div className="intelligence-card alerts-section">
              <div className="no-alerts">
                <div className="icon">✅</div>
                <p>No alerts! Your spending is on track.</p>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="intelligence-grid">
            {/* Overspending Prediction */}
            {insights.prediction && (
              <div className="intelligence-card">
                <h2>
                  <span className="icon">🔮</span>
                  Overspending Prediction
                </h2>
                <div className="prediction-content">
                  <div className="risk-indicator">
                    <span className={`risk-badge ${insights.prediction.riskLevel}`}>
                      {insights.prediction.riskLevel} risk
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Breach Probability
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>
                        {formatPercentage(insights.prediction.probabilityOfBreach * 100)}
                      </div>
                    </div>
                  </div>

                  <div className="prediction-stats">
                    <div className="stat-item">
                      <div className="label">Current Spend</div>
                      <div className="value">{formatCurrency(insights.prediction.currentSpend)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="label">Expected Month End</div>
                      <div className="value">{formatCurrency(insights.prediction.expectedMonthEndSpend)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="label">Monthly Limit</div>
                      <div className="value">{formatCurrency(insights.prediction.monthlyLimit)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="label">Days Remaining</div>
                      <div className="value">{insights.prediction.daysRemaining}</div>
                    </div>
                  </div>

                  <div className="prediction-explanation">
                    {insights.prediction.explanation}
                  </div>

                  {insights.prediction.factors.length > 0 && (
                    <div className="prediction-factors">
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                        Contributing Factors
                      </div>
                      {insights.prediction.factors.map((factor, index) => (
                        <div key={index} className={`factor-item ${factor.impact}`}>
                          <div className="icon">{factor.impact === 'negative' ? '⬇️' : '⬆️'}</div>
                          <div className="text">
                            <div className="label">{factor.factor}</div>
                            <div className="description">{factor.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Credit Utilization */}
            {insights.utilization && (
              <div className="intelligence-card">
                <h2>
                  <span className="icon">📊</span>
                  Credit Utilization
                </h2>
                <div className="utilization-content">
                  <div className="utilization-gauge">
                    <div className="gauge-background">
                      <div 
                        className={`gauge-fill ${insights.utilization.riskCategory}`}
                        style={{ '--percentage': insights.utilization.utilizationPercent } as any}
                      ></div>
                      <div className="gauge-center">
                        <div className="gauge-percentage">
                          {formatPercentage(insights.utilization.utilizationPercent)}
                        </div>
                        <div className="gauge-label">Utilization</div>
                      </div>
                    </div>
                  </div>

                  <div className="prediction-stats">
                    <div className="stat-item">
                      <div className="label">Current Balance</div>
                      <div className="value">{formatCurrency(insights.utilization.currentBalance)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="label">Credit Limit</div>
                      <div className="value">{formatCurrency(insights.utilization.creditLimit)}</div>
                    </div>
                  </div>

                  <div className="utilization-trend">
                    <div className={`trend-icon ${insights.utilization.trend}`}>
                      {insights.utilization.trend === 'improving' && '📈'}
                      {insights.utilization.trend === 'worsening' && '📉'}
                      {insights.utilization.trend === 'stable' && '➡️'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                        Trend: {insights.utilization.trend}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Avg: {formatPercentage(insights.utilization.averageUtilization)} | 
                        Peak: {formatPercentage(insights.utilization.peakUtilization)}
                      </div>
                    </div>
                  </div>

                  <div className={`utilization-recommendation ${insights.utilization.actionRequired ? 'action-required' : ''}`}>
                    {insights.utilization.recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spending Profile & Anomalies */}
          <div className="intelligence-grid">
            {/* Spending Profile */}
            <div className="intelligence-card">
              <h2>
                <span className="icon">📈</span>
                Spending Profile
              </h2>
              <div className="prediction-stats" style={{ marginBottom: '16px' }}>
                <div className="stat-item">
                  <div className="label">Avg Monthly</div>
                  <div className="value">{formatCurrency(insights.spendingProfile.averageMonthlySpend)}</div>
                </div>
                <div className="stat-item">
                  <div className="label">Avg Daily</div>
                  <div className="value">{formatCurrency(insights.spendingProfile.averageDailySpend)}</div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                <strong>Peak Spending:</strong> {getDayName(insights.spendingProfile.peakSpendingDayOfWeek)}s, 
                Days {insights.spendingProfile.peakSpendingDays.join(', ')} of month
              </div>

              <div className="profile-categories">
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Category Breakdown
                </div>
                {Object.entries(insights.spendingProfile.categoryBreakdown)
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .map(([category, data]) => (
                    <div key={category} className="category-item">
                      <div className="category-header">
                        <span className="category-name">{category}</span>
                        <span className="category-amount">
                          {formatCurrency(data.amount)} ({formatPercentage(data.percentage)})
                        </span>
                      </div>
                      <div className="category-bar">
                        <div 
                          className="category-fill" 
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Anomalies */}
            <div className="intelligence-card">
              <h2>
                <span className="icon">🔍</span>
                Anomalies Detected
              </h2>
              {insights.anomalies && insights.anomalies.length > 0 ? (
                <div className="anomalies-list">
                  {insights.anomalies.map((anomaly, index) => (
                    <div key={index} className={`anomaly-item ${anomaly.severity}`}>
                      <div className="anomaly-header">
                        <div>
                          <div className="anomaly-merchant">
                            {anomaly.transaction.merchantName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(anomaly.transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="anomaly-amount">
                          {formatCurrency(anomaly.transaction.amount)}
                        </div>
                      </div>
                      <div className="anomaly-explanation">
                        {anomaly.explanation}
                      </div>
                      <div className="anomaly-badges">
                        {anomaly.anomalyType.map(type => (
                          <span key={type} className="anomaly-badge">
                            {type}
                          </span>
                        ))}
                        <span className="anomaly-badge">
                          Z-score: {anomaly.deviationFromMean.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-alerts">
                  <div className="icon">✨</div>
                  <p>No anomalies detected. All transactions look normal!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
