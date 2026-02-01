/**
 * Email Transaction Import Component
 * Allows users to connect Gmail and import credit card transactions
 */

import React, { useState, useEffect } from 'react';
import {
  getGmailAuthUrl,
  checkEmailConnection,
  disconnectEmail,
  processEmails,
  clearEmailHistory
} from '../../services/emailConnection.service';
import type { EmailConnectionStatus, EmailProcessingResult } from '../../services/emailConnection.service';
import { api } from '../../services/api';
import './emailImport.css';

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
  creditCardId?: string;
}

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export const EmailTransactionImport: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<EmailConnectionStatus>({
    connected: false,
    provider: null
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<EmailProcessingResult | null>(null);
  const [daysBack, setDaysBack] = useState(30);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transactions, setTransactions] = useState<GroupedTransactions>({});
  const [showTransactions, setShowTransactions] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Reset function to clear all import state
  const resetImportState = () => {
    setResult(null);
    setError('');
    setProgress('');
    setTransactions({});
    setShowTransactions(false);
    setProcessing(false);
  };

  const handleClearHistory = async () => {
    if (!confirm('This will clear all email import history AND delete all imported transactions. This allows you to reimport the same emails. Continue?')) {
      return;
    }

    try {
      setClearing(true);
      setError('');
      console.log('Calling clearEmailHistory API...');
      const result = await clearEmailHistory();
      console.log('Clear history result:', result);
      resetImportState();
      alert(`Cleared:\n- ${result.emailsCleared} email records\n- ${result.hashesCleared} transaction hashes\n- ${result.transactionsDeleted} transactions\n\nYou can now reimport emails.`);
    } catch (err: any) {
      console.error('Clear history error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to clear history';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Reset state when component mounts
    return () => {
      // Cleanup on unmount
      resetImportState();
    };
  }, []);

  // Reset results when daysBack changes
  useEffect(() => {
    resetImportState();
  }, [daysBack]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const status = await checkEmailConnection();
      setConnectionStatus(status);
    } catch (err) {
      console.error('Failed to check connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setError('');
      const authUrl = await getGmailAuthUrl();
      window.open(authUrl, '_blank', 'width=600,height=700');
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const status = await checkEmailConnection();
        if (status.connected) {
          setConnectionStatus(status);
          clearInterval(pollInterval);
        }
      }, 2000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect Gmail');
    }
  };

  const handleDisconnect = async () => {
    if (!connectionStatus.provider) return;
    
    try {
      await disconnectEmail(connectionStatus.provider);
      setConnectionStatus({ connected: false, provider: null });
      resetImportState();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleImportTransactions = async () => {
    if (!connectionStatus.provider) return;

    try {
      setProcessing(true);
      setError('');
      setResult(null);
      setTransactions({});
      setShowTransactions(false);
      
      setProgress('🔍 Scanning your Gmail for transaction emails...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProgress('📧 Fetching and analyzing emails...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress('🔍 Extracting transaction details...');
      
      // Call backend to process emails
      const importResult = await processEmails(connectionStatus.provider, daysBack);
      
      setProgress('💾 Creating transaction records...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set result immediately
      setResult(importResult);
      setProgress('');
      
      console.log('Import result:', importResult);
      
      // Fetch and display imported transactions if any were created
      if (importResult.success && importResult.transactionsCreated > 0) {
        setProgress('📊 Loading transactions...');
        await fetchTransactions();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to import transactions');
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Calculate a day-boundary-safe date range.
      // - Use start-of-day / end-of-day so the first day isn't partially excluded.
      // - Add a small buffer to avoid timezone edge-cases where parsed dates drift by ~1 day.
      const bufferDays = 2;
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack - bufferDays);
      startDate.setHours(0, 0, 0, 0);

      console.log('Fetching transactions from', startDate.toISOString(), 'to', endDate.toISOString(), `(daysBack=${daysBack}, bufferDays=${bufferDays})`);
      
      // Fetch transactions from API
      const response = await api.get('/finance/transactions', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      console.log('Fetched transactions:', response.data);
      
      // Group transactions by date
      const grouped: GroupedTransactions = {};
      // Backend now returns array directly (not wrapped)
      const txnArray = Array.isArray(response.data) ? response.data : (response.data.transactions || []);
      
      console.log('Transaction array to group:', txnArray, 'Length:', txnArray.length);
      
      txnArray.forEach((txn: Transaction) => {
        const date = new Date(txn.date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(txn);
      });
      
      console.log('Grouped transactions:', grouped);
      
      setTransactions(grouped);
      setShowTransactions(Object.keys(grouped).length > 0);
      setProgress('');
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setProgress('');
    }
  };

  if (loading) {
    return (
      <div className="email-import-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking email connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-import-container">
      <div className="email-import-header">
        <h2>📧 Email Transaction Import</h2>
        <p>Automatically import credit card transactions from bank emails</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
        <div className="status-header">
          <div className="status-indicator">
            {connectionStatus.connected ? (
              <>
                <span className="status-dot connected"></span>
                <span className="status-text">Connected to Gmail</span>
              </>
            ) : (
              <>
                <span className="status-dot disconnected"></span>
                <span className="status-text">Not Connected</span>
              </>
            )}
          </div>
          {connectionStatus.connected && (
            <button className="btn-disconnect" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        {connectionStatus.connected && (
          <div className="connection-details">
            <div className="detail-item">
              <span className="label">Email:</span>
              <span className="value">{connectionStatus.userEmail}</span>
            </div>
            <div className="detail-item">
              <span className="label">Connected:</span>
              <span className="value">
                {connectionStatus.connectedAt 
                  ? new Date(connectionStatus.connectedAt).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
          </div>
        )}

        {!connectionStatus.connected && (
          <div className="connect-section">
            <p className="connect-description">
              Connect your Gmail to automatically import credit card transaction alerts from:
            </p>
            <ul className="supported-banks">
              <li>✓ HDFC Bank</li>
              <li>✓ SBI Card</li>
              <li>✓ ICICI Bank</li>
              <li>✓ Axis Bank</li>
              <li>✓ And more...</li>
            </ul>
            <button className="btn-connect-gmail" onClick={handleConnectGmail}>
              <span className="gmail-icon">📬</span>
              Connect Gmail Account
            </button>
            <p className="privacy-note">
              🔒 Read-only access • Your data stays private
            </p>
          </div>
        )}
      </div>

      {/* Import Section */}
      {connectionStatus.connected && (
        <div className="import-section">
          <h3>Import Transactions</h3>
          
          <div className="import-controls">
            <div className="form-group">
              <label htmlFor="daysBack">Import emails from last:</label>
              <select 
                id="daysBack" 
                value={daysBack} 
                onChange={(e) => setDaysBack(Number(e.target.value))}
                disabled={processing}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (1 month)</option>
                <option value={60}>60 days (2 months)</option>
                <option value={90}>90 days (3 months)</option>
                <option value={180}>180 days (6 months)</option>
              </select>
            </div>

            <button 
              className="btn-import"
              onClick={handleImportTransactions}
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="btn-spinner"></div>
                  Importing...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Import Transactions
                </>
              )}
            </button>

            <button 
              className="btn-clear-history"
              onClick={handleClearHistory}
              disabled={processing || clearing}
              title="Clear import history to reimport same emails"
            >
              {clearing ? 'Clearing...' : '🗑️ Clear History'}
            </button>
          </div>

          <p className="info-text">
            💡 Tip: If you've already imported emails and want to reimport them (e.g., after changing days), click "Clear History" first.
          </p>

          {/* Progress */}
          {processing && progress && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="progress-text">{progress}</p>
            </div>
          )}

          {/* Results */}
          {result && !processing && (
            <div className="results-section">
              <div className="results-header-row">
                <h4 className="results-title">
                  {result.success ? '✅ Import Complete!' : '⚠️ Import Issues'}
                </h4>
                <button 
                  className="btn-close-results"
                  onClick={resetImportState}
                  title="Close results and reset"
                >
                  ✕
                </button>
              </div>
              
              <div className="results-grid">
                <div className="result-card success">
                  <div className="result-number">{result.transactionsCreated || 0}</div>
                  <div className="result-label">Transactions Created</div>
                </div>
                
                <div className="result-card info">
                  <div className="result-number">{result.emailsProcessed || 0}</div>
                  <div className="result-label">Emails Processed</div>
                </div>
                
                <div className="result-card warning">
                  <div className="result-number">{(result.skipped?.total ?? result.duplicatesSkipped) || 0}</div>
                  <div className="result-label">Skipped</div>
                </div>
                
                <div className="result-card error">
                  <div className="result-number">{result.parseFailures || 0}</div>
                  <div className="result-label">Parse Failures</div>
                </div>
              </div>

              {(result.limitBreachAlerts || 0) > 0 && (
                <div className="alert-banner">
                  🚨 {result.limitBreachAlerts} credit card(s) exceeded monthly limit!
                </div>
              )}

              <p className="results-message">{result.message || 'Import completed'}</p>

              {(result.transactionsWithoutCard ?? 0) > 0 && (
                <div className="alert-banner" style={{backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107'}}>
                  ⚠️ {result.transactionsWithoutCard} transaction(s) created without card link. Add your credit cards to enable tracking!
                </div>
              )}

              {(result.skipped?.total ?? 0) > 0 && (
                <div className="info-box">
                  <p><strong>Skipped breakdown</strong></p>
                  <p>
                    Already processed: {result.skipped?.alreadyProcessed ?? 0} | Duplicate alert: {result.skipped?.duplicateContentHash ?? 0} | Already exists: {result.skipped?.existingTransaction ?? 0}
                  </p>
                  <p>
                    Not a debit/spend: {result.skipped?.nonDebit ?? 0} | No matching saved card: {result.skipped?.noMatchingCard ?? 0}
                  </p>
                </div>
              )}

              {result.transactionsCreated > 0 && showTransactions && Object.keys(transactions).length === 0 && (
                <div className="info-box">
                  <p>💡 Transactions imported successfully! Refresh the page to see them in your dashboard.</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Display */}
          {showTransactions && Object.keys(transactions).length > 0 && (
            <div className="transactions-section">
              <div className="transactions-header">
                <h4>📊 Imported Transactions</h4>
                <button 
                  className="btn-close-transactions"
                  onClick={resetImportState}
                  title="Close and reset"
                >
                  ✕
                </button>
              </div>

              <div className="transactions-list">
                {Object.entries(transactions)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([date, txns]) => (
                    <div key={date} className="transaction-date-group">
                      <div className="date-header">
                        <span className="date-label">{date}</span>
                        <span className="date-count">{txns.length} transaction{txns.length > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="transactions-grid">
                        {txns.map((txn) => (
                          <div key={txn._id} className="transaction-item">
                            <div className="transaction-main">
                              <div className="transaction-merchant">{txn.description}</div>
                              <div className="transaction-amount">₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="transaction-time">
                              {new Date(txn.date).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="date-total">
                        Total: ₹{txns.reduce((sum, txn) => sum + txn.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="transactions-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Transactions:</span>
                  <span className="summary-value">
                    {Object.values(transactions).reduce((sum, txns) => sum + txns.length, 0)}
                  </span>
                </div>
                <div className="summary-item highlight">
                  <span className="summary-label">Total Amount:</span>
                  <span className="summary-value">
                    ₹{Object.values(transactions)
                      .flat()
                      .reduce((sum, txn) => sum + txn.amount, 0)
                      .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="info-section">
        <h4>📋 How it works</h4>
        <ol className="info-list">
          <li>Connect your Gmail account with read-only access</li>
          <li>System scans for credit card transaction alert emails</li>
          <li>Extracts transaction details (amount, merchant, date)</li>
          <li>Automatically creates transaction records</li>
          <li>Matches to your registered credit cards</li>
        </ol>
        
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure OAuth 2.0</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI-powered parsing</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🖼️</span>
            <span>OCR for images</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔁</span>
            <span>Duplicate detection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
