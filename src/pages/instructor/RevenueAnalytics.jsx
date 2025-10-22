import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Users, Calendar, BarChart3, PieChart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RevenueAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalEnrollments: 0,
    monthlyEnrollments: 0,
    averageOrderValue: 0,
    topCourses: [],
    revenueChart: [],
    enrollmentChart: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/instructor/analytics?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/instructor/dashboard" className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 theme-text-primary" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold theme-text-primary">Revenue Analytics</h1>
              <p className="theme-text-secondary">Track your earnings and course performance</p>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border theme-border rounded-lg theme-card theme-text-primary"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-muted">Total Revenue</p>
                <p className="text-2xl font-bold theme-text-primary">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-muted">Monthly Revenue</p>
                <p className="text-2xl font-bold theme-text-primary">{formatCurrency(analytics.monthlyRevenue)}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-muted">Total Enrollments</p>
                <p className="text-2xl font-bold theme-text-primary">{analytics.totalEnrollments}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-muted">Avg Order Value</p>
                <p className="text-2xl font-bold theme-text-primary">{formatCurrency(analytics.averageOrderValue)}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-5 h-5 theme-text-primary mr-2" />
              <h2 className="text-xl font-semibold theme-text-primary">Revenue Trend</h2>
            </div>
            <div className="h-64 flex items-end space-x-2">
              {analytics.revenueChart.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{
                      height: `${Math.max((item.revenue / Math.max(...analytics.revenueChart.map(i => i.revenue))) * 200, 4)}px`
                    }}
                    title={`${formatDate(item.date)}: ${formatCurrency(item.revenue)}`}
                  ></div>
                  <p className="text-xs theme-text-muted mt-2 transform -rotate-45 origin-left">
                    {formatDate(item.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment Chart */}
          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center mb-6">
              <Users className="w-5 h-5 theme-text-primary mr-2" />
              <h2 className="text-xl font-semibold theme-text-primary">Enrollment Trend</h2>
            </div>
            <div className="h-64 flex items-end space-x-2">
              {analytics.enrollmentChart.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                    style={{
                      height: `${Math.max((item.enrollments / Math.max(...analytics.enrollmentChart.map(i => i.enrollments))) * 200, 4)}px`
                    }}
                    title={`${formatDate(item.date)}: ${item.enrollments} enrollments`}
                  ></div>
                  <p className="text-xs theme-text-muted mt-2 transform -rotate-45 origin-left">
                    {formatDate(item.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Courses */}
        <div className="theme-card p-6 rounded-lg">
          <div className="flex items-center mb-6">
            <PieChart className="w-5 h-5 theme-text-primary mr-2" />
            <h2 className="text-xl font-semibold theme-text-primary">Top Performing Courses</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b theme-border">
                  <th className="text-left py-3 theme-text-secondary font-medium">Course</th>
                  <th className="text-left py-3 theme-text-secondary font-medium">Enrollments</th>
                  <th className="text-left py-3 theme-text-secondary font-medium">Revenue</th>
                  <th className="text-left py-3 theme-text-secondary font-medium">Avg Rating</th>
                  <th className="text-left py-3 theme-text-secondary font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCourses.map((course, index) => (
                  <tr key={course.id} className="border-b theme-border hover:theme-bg-secondary">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium theme-text-primary">{course.title}</p>
                          <p className="text-sm theme-text-muted">{course.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 theme-text-primary font-medium">{course.enrollments}</td>
                    <td className="py-4 theme-text-primary font-medium">{formatCurrency(course.revenue)}</td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <span className="theme-text-primary font-medium">{course.rating.toFixed(1)}</span>
                        <span className="text-yellow-500 ml-1">⭐</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(course.conversionRate * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm theme-text-muted">{(course.conversionRate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {analytics.topCourses.length === 0 && (
            <div className="text-center py-8">
              <PieChart className="w-16 h-16 theme-text-muted mx-auto mb-4" />
              <p className="theme-text-secondary">No course data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;