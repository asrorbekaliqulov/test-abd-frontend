import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  HelpCircle, 
  Tag, 
  Globe, 
  MapPin, 
  Settings, 
  Flag, 
  Activity,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { systemAPI, quizAPI } from '../../utils/api';

interface AdminPanelProps {
  theme: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ theme }) => {
  const { user, isDeveloper, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});

  // Redirect if not admin/developer
  if (!isDeveloper && !isAdmin) {
    return (
      <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-theme-primary mb-2">Access Denied</h1>
          <p className="text-theme-secondary">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'system', label: 'System Config', icon: Settings },
    ...(isDeveloper ? [
      { id: 'flags', label: 'Flags', icon: Flag },
      { id: 'logs', label: 'System Logs', icon: Activity }
    ] : [])
  ];

  const loadData = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'users':
          // Load users data
          break;
        case 'tests':
          const testsResponse = await quizAPI.getTests();
          setData(prev => ({ ...prev, tests: testsResponse.data }));
          break;
        case 'categories':
          const categoriesResponse = await quizAPI.getCategories();
          setData(prev => ({ ...prev, categories: categoriesResponse.data }));
          break;
        case 'flags':
          if (isDeveloper) {
            const flagsResponse = await systemAPI.getFlags();
            setData(prev => ({ ...prev, flags: flagsResponse.data }));
          }
          break;
        case 'logs':
          if (isDeveloper) {
            const logsResponse = await systemAPI.getLogs();
            setData(prev => ({ ...prev, logs: logsResponse.data }));
          }
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-theme-primary">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-theme-secondary text-sm">Total Users</p>
              <p className="text-2xl font-bold text-theme-primary">1,234</p>
            </div>
            <Users size={32} className="text-blue-500" />
          </div>
        </div>
        
        <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-theme-secondary text-sm">Total Tests</p>
              <p className="text-2xl font-bold text-theme-primary">567</p>
            </div>
            <FileText size={32} className="text-green-500" />
          </div>
        </div>
        
        <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-theme-secondary text-sm">Total Questions</p>
              <p className="text-2xl font-bold text-theme-primary">8,901</p>
            </div>
            <HelpCircle size={32} className="text-purple-500" />
          </div>
        </div>
        
        <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-theme-secondary text-sm">Active Users</p>
              <p className="text-2xl font-bold text-theme-primary">892</p>
            </div>
            <Activity size={32} className="text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-theme-primary">Tests Management</h2>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Add Test</span>
        </button>
      </div>
      
      <div className="bg-theme-primary rounded-lg border border-theme-primary overflow-hidden">
        <div className="p-4 border-b border-theme-primary">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary" />
              <input
                type="text"
                placeholder="Search tests..."
                className="w-full pl-10 pr-4 py-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary"
              />
            </div>
            <button className="px-4 py-2 border border-theme-primary rounded-lg hover:bg-theme-tertiary transition-theme-normal flex items-center space-x-2">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-primary">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-theme-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-theme-primary">JavaScript Fundamentals</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-theme-secondary">john_doe</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Programming
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">25</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFlags = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-theme-primary">System Flags</h2>
      
      <div className="bg-theme-primary rounded-lg border border-theme-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Flagged By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-primary">
              {data.flags?.results?.map((flag: any) => (
                <tr key={flag.id} className="hover:bg-theme-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">{flag.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">{flag.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">{flag.test}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">{flag.flagged_by || 'System'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                    {new Date(flag.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-green-600 hover:text-green-900">Resolve</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-theme-primary">System Logs</h2>
      
      <div className="bg-theme-primary rounded-lg border border-theme-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Endpoint</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-primary">
              {data.logs?.results?.map((log: any) => (
                <tr key={log.id} className="hover:bg-theme-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">{log.user || 'Anonymous'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">{log.action_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">{log.endpoint}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.status_code < 300 ? 'bg-green-100 text-green-800' :
                      log.status_code < 400 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'tests':
        return renderTests();
      case 'flags':
        return renderFlags();
      case 'logs':
        return renderLogs();
      default:
        return (
          <div className="text-center py-12">
            <p className="text-theme-secondary">Content for {activeTab} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-theme-secondary pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-theme-primary rounded-lg border border-theme-primary p-6 mr-6 h-fit">
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Admin Panel</h3>
            <nav className="space-y-2">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-theme-normal text-left ${
                      activeTab === tab.id
                        ? 'bg-accent-primary text-white'
                        : 'text-theme-secondary hover:bg-theme-tertiary'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;