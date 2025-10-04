import React, { useState, useEffect } from 'react';
import { formatCurrency, getPaymentStatusText, getPaymentStatusColor } from '../../utils/paymentUtils';
import './PaymentHistory.css';

const PaymentHistory = ({ userId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (userId) {
      fetchPaymentHistory();
    }
  }, [userId, currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/user/${userId}?page=${currentPage}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="payment-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-history-error">
        <p>Error: {error}</p>
        <button onClick={fetchPaymentHistory} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="payment-history-empty">
        <div className="empty-icon">💳</div>
        <h3>No Payment History</h3>
        <p>You haven't made any payments yet.</p>
      </div>
    );
  }

  return (
    <div className="payment-history">
      <div className="payment-history-header">
        <h2>Payment History</h2>
        <p>Track all your payment transactions</p>
      </div>

      <div className="payments-list">
        {payments.map((payment) => (
          <div key={payment._id} className="payment-card">
            <div className="payment-header">
              <div className="payment-id">
                <span className="label">Payment ID:</span>
                <span className="value">{payment.razorpayPaymentId}</span>
              </div>
              <div 
                className="payment-status"
                style={{ backgroundColor: getPaymentStatusColor(payment.status) }}
              >
                {getPaymentStatusText(payment.status)}
              </div>
            </div>

            <div className="payment-details">
              <div className="detail-row">
                <span className="label">Order ID:</span>
                <span className="value">{payment.orderId}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value amount">{formatCurrency(payment.amount / 100)}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Payment Method:</span>
                <span className="value">{payment.paymentMethod}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{formatDate(payment.createdAt)}</span>
              </div>
            </div>

            {payment.description && (
              <div className="payment-description">
                <span className="label">Description:</span>
                <span className="value">{payment.description}</span>
              </div>
            )}

            {payment.status === 'refunded' && payment.refundDetails && (
              <div className="refund-details">
                <h4>Refund Information</h4>
                <div className="detail-row">
                  <span className="label">Refund ID:</span>
                  <span className="value">{payment.refundDetails.refundId}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Refund Amount:</span>
                  <span className="value">{formatCurrency(payment.refundDetails.refundAmount / 100)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Refund Reason:</span>
                  <span className="value">{payment.refundDetails.refundReason}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Refunded On:</span>
                  <span className="value">{formatDate(payment.refundDetails.refundedAt)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
