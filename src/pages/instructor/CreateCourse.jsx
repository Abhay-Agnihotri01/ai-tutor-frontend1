import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    level: 'beginner',
    price: '',
    discountPrice: '',
    language: 'English',
    thumbnail: null
  });


  const categories = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Backend Development', 'Frontend Development', 'UI/UX Design', 'DevOps', 'Cybersecurity'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const courseData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'thumbnail' && formData[key]) {
          courseData.append(key, formData[key]);
        }
      });
      
      // Add thumbnail if selected
      if (formData.thumbnail) {
        courseData.append('thumbnail', formData.thumbnail);
      }
      


      const response = await fetch('http://localhost:5000/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: courseData
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Course created successfully!');
        navigate('/instructor/dashboard');
      } else {
        throw new Error(result.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Course creation error:', error);
      toast.error(error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 theme-text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold theme-text-primary">Create New Course</h1>
            <p className="theme-text-secondary">Share your knowledge with the world</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="theme-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold theme-text-primary mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Course Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete React Development Course"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <Input
                  label="Short Description"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description for course cards"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent theme-card theme-text-primary"
                  placeholder="Detailed description of what students will learn..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 theme-card theme-text-primary"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 theme-card theme-text-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <Input
                label="Price ($)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0 for free course"
                min="0"
                step="0.01"
              />

              <Input
                label="Discount Price ($)"
                name="discountPrice"
                type="number"
                value={formData.discountPrice}
                onChange={handleInputChange}
                placeholder="Optional discount price"
                min="0"
                step="0.01"
              />

              <Input
                label="Language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Course Thumbnail */}
          <div className="theme-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold theme-text-primary mb-6">Course Thumbnail</h2>
            
            <div className="border-2 border-dashed theme-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 theme-text-muted mx-auto mb-4" />
              <p className="theme-text-secondary mb-4">Upload course thumbnail (16:9 aspect ratio recommended)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail"
              />
              <label 
                htmlFor="thumbnail" 
                className="inline-flex items-center px-4 py-2 border theme-border rounded-lg hover:theme-bg-secondary transition-colors cursor-pointer theme-text-primary"
              >
                Choose File
              </label>
              {formData.thumbnail && (
                <p className="mt-2 text-sm theme-text-secondary">
                  Selected: {formData.thumbnail.name}
                </p>
              )}
            </div>
          </div>



          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/instructor/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;