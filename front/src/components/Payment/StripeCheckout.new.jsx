import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiConfig, makeAuthenticatedRequest } from '../../utils/apiConfig';
import { Button, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import './StripeCheckout.css';

function CheckoutForm({ orderId, clientSecret, onCompleted, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const handleChange = async (event) => {
    // Listen for changes in the CardElement
    // and enable the pay button if the Element is complete
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);
    setError('');

    if (!stripe || !elements) {
      setError('Payment system is not ready. Please try again.');
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer', // This should be replaced with actual customer name
          address: {
            line1: 'N/A',
            city: 'N/A',
            country: 'US',
          }
        },
      },
      return_url: window.location.origin + '/order/success',
    });

    if (stripeError) {
      console.error('Stripe error:', stripeError);
      setError(`Payment failed: ${stripeError.message || 'Unknown error occurred'}`);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
      if (onCompleted) {
        onCompleted(paymentIntent.id);
      }
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <Form id="payment-form" onSubmit={handleSubmit}>
      <div className="mb-3">
        <CardElement 
          id="card-element"
          options={cardStyle}
          onChange={handleChange}
        />
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <div className="d-grid gap-2">
        <Button 
          variant="primary" 
          size="lg"
          type="submit"
          disabled={processing || disabled || succeeded}
          className="pay-button"
        >
          {processing ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : null}
          {processing ? 'Processing...' : succeeded ? 'Payment Succeeded!' : 'Pay Now'}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};

// Initialize Stripe outside the component to avoid recreating it on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeCheckout = ({ orderId, amount, clientSecret: clientSecretProp, onCompleted, onCancel }) => {
  const [clientSecret, setClientSecret] = useState(clientSecretProp || '');
  const [loading, setLoading] = useState(!clientSecretProp);
  const [error, setError] = useState('');
  const [show, setShow] = useState(true);

  useEffect(() => {
    // If parent already provided a client secret, use it and skip API call
    if (clientSecretProp) {
      setClientSecret(clientSecretProp);
      setLoading(false);
      return;
    }

    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest(
          `${apiConfig.endpoints.stripe}/create-payment-intent`,
          'POST',
          { orderId }
        );
        
        if (response.clientSecret) {
          setClientSecret(response.clientSecret);
        } else {
          setError('Failed to initialize payment');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      createPaymentIntent();
    }
  }, [orderId, clientSecretProp]);

  const handleClose = () => {
    setShow(false);
    if (onCancel) onCancel();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Complete Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Preparing payment...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            {error}
            <div className="mt-2">
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </Alert>
        ) : (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0d6efd',
                  colorBackground: '#ffffff',
                  colorText: '#32325d',
                  colorDanger: '#df1b41',
                  fontFamily: 'Arial, sans-serif',
                },
              },
            }}
          >
            <CheckoutForm 
              orderId={orderId}
              clientSecret={clientSecret}
              onCompleted={onCompleted}
              onCancel={handleClose}
            />
          </Elements>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default StripeCheckout;
