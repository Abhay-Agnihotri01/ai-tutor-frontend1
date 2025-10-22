import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import Button from './Button';

const RatingModal = ({ isOpen, onClose, courseTitle, onSubmit, existingRating = null }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReview(existingRating.review || '');
    }
  }, [existingRating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      await onSubmit({ rating, review });
      onClose();
    } catch (error) {
      console.error('Rating submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <h2 className="text-xl font-semibold theme-text-primary">
            {existingRating ? 'Update Rating' : 'Rate Course'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 theme-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <h3 className="font-medium theme-text-primary mb-2">{courseTitle}</h3>
            <p className="text-sm theme-text-secondary mb-4">
              How would you rate this course?
            </p>
          </div>

          <div className="mb-6">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
              showValue={false}
            />
            {rating > 0 && (
              <p className="text-sm theme-text-secondary mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this course..."
              rows={4}
              className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs theme-text-muted mt-1">
              {review.length}/500 characters
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : existingRating ? 'Update' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;