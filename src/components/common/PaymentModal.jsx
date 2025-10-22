import { useState } from 'react';
import { X, CreditCard, Shield, Lock } from 'lucide-react';
import Button from './Button';
import { toast } from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, course, onSuccess }) => {
  const [processing, setProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!course) return;

    setProcessing(true);
    
    try {
      // Create order
      const orderResponse = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: course.id })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        if (orderData.message === 'Already enrolled in this course') {
          toast.success('You are already enrolled in this course!');
          onSuccess();
          return;
        }
        throw new Error(orderData.message);
      }

      // Handle free course
      if (orderData.enrollment) {
        toast.success('Enrolled in free course successfully!');
        onSuccess();
        return;
      }

      // Load Razorpay script only for paid courses
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'LearnHub',
        description: `Payment for ${orderData.order.courseTitle}`,
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              toast.success('Payment successful! You are now enrolled.');
              onSuccess();
            } else {
              throw new Error(verifyData.message);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const finalPrice = course?.discountPrice || course?.price || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <h3 className="text-xl font-semibold theme-text-primary">Complete Purchase</h3>
          <button
            onClick={onClose}
            className="theme-text-muted hover:theme-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Course Info */}
          <div className="mb-6">
            <div className="flex items-start space-x-4">
              <img
                src={course?.thumbnail ? (
                  course.thumbnail.startsWith('http') 
                    ? course.thumbnail 
                    : `http://localhost:5000${course.thumbnail}`
                ) : `data:image/svg+xml;base64,${btoa(`<svg width="80" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`}
                alt={course?.title}
                className="w-20 h-15 rounded object-cover"
                onError={(e) => {
                  e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="80" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`;
                }}
              />
              <div className="flex-1">
                <h4 className="font-medium theme-text-primary mb-1">{course?.title}</h4>
                <p className="text-sm theme-text-secondary">
                  by {course?.instructor?.firstName} {course?.instructor?.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 theme-bg-secondary rounded-lg">
            <div className="flex items-center justify-between">
              <span className="theme-text-secondary">Course Price:</span>
              <div className="flex items-center space-x-2">
                {course?.discountPrice && course?.discountPrice < course?.price ? (
                  <>
                    <span className="text-lg font-bold theme-text-primary">₹{finalPrice}</span>
                    <span className="text-sm theme-text-muted line-through">₹{course.price}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold theme-text-primary">
                    {finalPrice === 0 ? 'Free' : `₹${finalPrice}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Secure Payment
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your payment information is encrypted and secure. Powered by Razorpay.
            </p>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2"
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                {finalPrice === 0 ? (
                  <>
                    <span>Enroll for Free</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{finalPrice}</span>
                  </>
                )}
              </>
            )}
          </Button>

          {/* Terms */}
          <p className="text-xs theme-text-muted text-center mt-4">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;