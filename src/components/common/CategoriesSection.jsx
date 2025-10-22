import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const CategoriesSection = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const categories = {
    'Development': {
      icon: '💻',
      subcategories: [
        { name: 'Web Development', subItems: null },
        { name: 'Mobile Development', subItems: null },
        { name: 'Backend Development', subItems: null },
        { name: 'Frontend Development', subItems: null },
        { name: 'Full Stack', subItems: null }
      ]
    },
    'Data Science': {
      icon: '📊',
      subcategories: [
        { name: 'Machine Learning', subItems: null },
        { name: 'Data Analysis', subItems: null },
        { name: 'Artificial Intelligence', subItems: null },
        { name: 'Deep Learning', subItems: null },
        { name: 'Statistics', subItems: null }
      ]
    },
    'Design': {
      icon: '🎨',
      subcategories: [
        { name: 'UI/UX Design', subItems: null },
        { name: 'Graphic Design', subItems: null },
        { name: 'Web Design', subItems: null },
        { name: 'Product Design', subItems: null },
        { name: 'Figma', subItems: null }
      ]
    },
    'Business': {
      icon: '💼',
      subcategories: [
        { name: 'Marketing', subItems: null },
        { name: 'Management', subItems: null },
        { name: 'Finance', subItems: null },
        { name: 'Entrepreneurship', subItems: null },
        { name: 'Sales', subItems: null }
      ]
    },
    'Technology': {
      icon: '⚡',
      subcategories: [
        { name: 'DevOps', subItems: null },
        { name: 'Cloud Computing', subItems: null },
        { name: 'Cybersecurity', subItems: null },
        { name: 'Blockchain', subItems: null },
        { name: 'IoT', subItems: null }
      ]
    },
    'Personal Growth': {
      icon: '🚀',
      subcategories: [
        { name: 'Leadership', subItems: null },
        { name: 'Communication', subItems: null },
        { name: 'Productivity', subItems: null },
        { name: 'Career Development', subItems: null },
        { name: 'Public Speaking', subItems: null }
      ]
    }
  };

  return (
    <section className="py-16 theme-bg-secondary animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold theme-text-primary mb-4">
            Explore Categories
          </h2>
          <p className="text-lg theme-text-secondary max-w-2xl mx-auto">
            Discover courses across various fields and advance your skills
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(categories).map(([category, data], index) => (
            <div
              key={category}
              className="relative group animate-scale-in"
              style={{animationDelay: `${index * 0.1}s`}}
              onMouseEnter={() => setHoveredCategory(category)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                to={`/courses?category=${encodeURIComponent(category)}`}
                className="block theme-card p-6 rounded-lg text-center hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-3">{data.icon}</div>
                <h3 className="font-semibold theme-text-primary text-sm md:text-base">
                  {category}
                </h3>
                <p className="text-xs theme-text-muted mt-1">
                  {data.subcategories.length} specializations
                </p>
              </Link>

              {/* Hover Dropdown */}
              {hoveredCategory === category && (
                <div className="absolute top-full left-0 mt-2 w-64 theme-card rounded-lg shadow-xl border theme-border z-50 animate-scale-in">
                  <div className="p-4">
                    <h4 className="font-semibold theme-text-primary mb-3 flex items-center">
                      <span className="mr-2">{data.icon}</span>
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {data.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.name}
                          to={`/courses?category=${encodeURIComponent(subcategory.name)}`}
                          className={`p-2 rounded hover:theme-bg-secondary transition-colors group/item ${
                            subcategory.subItems ? 'flex items-center justify-between' : 'block'
                          }`}
                        >
                          <span className="text-sm theme-text-secondary group-hover/item:theme-text-primary">
                            {subcategory.name}
                          </span>
                          {subcategory.subItems && (
                            <ChevronRight className="w-4 h-4 theme-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/courses">
            <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg">
              Browse All Courses
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;