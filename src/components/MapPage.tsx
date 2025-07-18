import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup,  useMapEvents } from 'react-leaflet';
import { Globe, Users, TrendingUp, Maximize2, X, Award, Target, ZoomIn, ZoomOut } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPageProps {
  theme: string;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock user data with hierarchical locations
const topUsers = [
  // Country level (National Champions)
  {
    id: 'country-1',
    name: 'Asrorbek Abdullayev',
    lat: 41.3775,
    lng: 64.5853,
    level: 'country',
    location: {
      country: 'Uzbekistan'
    },
    stats: {
      totalTests: 1250,
      correctAnswers: 1125,
      wrongAnswers: 125,
      accuracy: 90
    },
    profilePic: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-01-15',
    lastActive: '2024-01-20'
  },
  // Region level users
  {
    id: 'region-1',
    name: 'Azizjon Karimov',
    lat: 40.7821,
    lng: 72.3442,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Andijon'
    },
    stats: {
      totalTests: 890,
      correctAnswers: 756,
      wrongAnswers: 134,
      accuracy: 85
    },
    profilePic: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-02-10',
    lastActive: '2024-01-19'
  },
  {
    id: 'region-2',
    name: 'Malika Rashidova',
    lat: 39.7748,
    lng: 64.4286,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Samarqand'
    },
    stats: {
      totalTests: 756,
      correctAnswers: 642,
      wrongAnswers: 114,
      accuracy: 85
    },
    profilePic: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-03-05',
    lastActive: '2024-01-18'
  },
  {
    id: 'region-3',
    name: 'Bobur Yusupov',
    lat: 41.5504,
    lng: 60.6226,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Xorazm'
    },
    stats: {
      totalTests: 634,
      correctAnswers: 507,
      wrongAnswers: 127,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-04-12',
    lastActive: '2024-01-17'
  },
  {
    id: 'region-4',
    name: 'Nigora Tosheva',
    lat: 40.1428,
    lng: 67.8292,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Jizzax'
    },
    stats: {
      totalTests: 567,
      correctAnswers: 454,
      wrongAnswers: 113,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-05-18',
    lastActive: '2024-01-16'
  },
  {
    id: 'region-5',
    name: 'Sardor Nazarov',
    lat: 41.0058,
    lng: 71.6726,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Namangan'
    },
    stats: {
      totalTests: 723,
      correctAnswers: 595,
      wrongAnswers: 128,
      accuracy: 82
    },
    profilePic: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-06-22',
    lastActive: '2024-01-15'
  },
  {
    id: 'region-6',
    name: 'Feruza Alimova',
    lat: 40.3842,
    lng: 71.7843,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Farg\'ona'
    },
    stats: {
      totalTests: 689,
      correctAnswers: 565,
      wrongAnswers: 124,
      accuracy: 82
    },
    profilePic: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-07-30',
    lastActive: '2024-01-14'
  },
  {
    id: 'region-7',
    name: 'Jasur Xolmatov',
    lat: 39.6547,
    lng: 66.9597,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Qashqadaryo'
    },
    stats: {
      totalTests: 612,
      correctAnswers: 489,
      wrongAnswers: 123,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-08-14',
    lastActive: '2024-01-13'
  },
  {
    id: 'region-8',
    name: 'Dilnoza Ismoilova',
    lat: 41.2646,
    lng: 69.2163,
    level: 'region',
    location: {
      country: 'Uzbekistan',
      region: 'Toshkent'
    },
    stats: {
      totalTests: 845,
      correctAnswers: 718,
      wrongAnswers: 127,
      accuracy: 85
    },
    profilePic: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-09-01',
    lastActive: '2024-01-12'
  },
  // District level users
  {
    id: 'district-1',
    name: 'Gulnoza Aminova',
    lat: 41.0167,
    lng: 71.6333,
    level: 'district',
    location: {
      country: 'Uzbekistan',
      region: 'Namangan',
      district: 'Chust'
    },
    stats: {
      totalTests: 456,
      correctAnswers: 365,
      wrongAnswers: 91,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-10-15',
    lastActive: '2024-01-11'
  },
  {
    id: 'district-2',
    name: 'Otabek Salimov',
    lat: 40.8667,
    lng: 72.2,
    level: 'district',
    location: {
      country: 'Uzbekistan',
      region: 'Andijon',
      district: 'Xonobod'
    },
    stats: {
      totalTests: 378,
      correctAnswers: 295,
      wrongAnswers: 83,
      accuracy: 78
    },
    profilePic: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-11-20',
    lastActive: '2024-01-10'
  },
  {
    id: 'district-3',
    name: 'Sevara Qosimova',
    lat: 39.6333,
    lng: 66.8,
    level: 'district',
    location: {
      country: 'Uzbekistan',
      region: 'Qashqadaryo',
      district: 'Shahrisabz'
    },
    stats: {
      totalTests: 423,
      correctAnswers: 339,
      wrongAnswers: 84,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1181562/pexels-photo-1181562.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2023-12-05',
    lastActive: '2024-01-09'
  },
  {
    id: 'district-4',
    name: 'Jamshid Turdiev',
    lat: 40.5167,
    lng: 72.2333,
    level: 'district',
    location: {
      country: 'Uzbekistan',
      region: 'Farg\'ona',
      district: 'Marg\'ilon'
    },
    stats: {
      totalTests: 389,
      correctAnswers: 300,
      wrongAnswers: 89,
      accuracy: 77
    },
    profilePic: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2024-01-10',
    lastActive: '2024-01-08'
  },
  {
    id: 'district-5',
    name: 'Zarina Rahmatova',
    lat: 41.3167,
    lng: 69.25,
    level: 'district',
    location: {
      country: 'Uzbekistan',
      region: 'Toshkent',
      district: 'Chirchiq'
    },
    stats: {
      totalTests: 512,
      correctAnswers: 409,
      wrongAnswers: 103,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2024-01-15',
    lastActive: '2024-01-07'
  },
  // Neighborhood level users
  {
    id: 'neighborhood-1',
    name: 'Bekzod Rahmonov',
    lat: 41.0200,
    lng: 71.6400,
    level: 'neighborhood',
    location: {
      country: 'Uzbekistan',
      region: 'Namangan',
      district: 'Chust',
      neighborhood: 'Markaziy mahalla'
    },
    stats: {
      totalTests: 234,
      correctAnswers: 187,
      wrongAnswers: 47,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2024-01-01',
    lastActive: '2024-01-06'
  },
  {
    id: 'neighborhood-2',
    name: 'Nodira Karimova',
    lat: 41.0150,
    lng: 71.6350,
    level: 'neighborhood',
    location: {
      country: 'Uzbekistan',
      region: 'Namangan',
      district: 'Chust',
      neighborhood: 'Yangi hayot mahalla'
    },
    stats: {
      totalTests: 198,
      correctAnswers: 158,
      wrongAnswers: 40,
      accuracy: 80
    },
    profilePic: 'https://images.pexels.com/photos/1181687/pexels-photo-1181687.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: '2024-01-05',
    lastActive: '2024-01-05'
  }
];

// Custom marker icon component
const createCustomIcon = (profilePic: string, level: string) => {
  const size = level === 'country' ? 60 : level === 'region' ? 50 : level === 'district' ? 40 : 35;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 3px solid #fff; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        overflow: hidden;
        background: #f0f0f0;
        position: relative;
      ">
        <img 
          src="${profilePic}" 
          style="
            width: 100%; 
            height: 100%; 
            object-fit: cover;
          " 
          alt="User"
        />
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: ${level === 'country' ? '#ffd700' : level === 'region' ? '#3b82f6' : level === 'district' ? '#10b981' : '#8b5cf6'};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
        ">
          ${level === 'country' ? '👑' : level === 'region' ? '⭐' : level === 'district' ? '🏆' : '🎯'}
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Map event handler component
const MapEventHandler: React.FC<{
  onZoomChange: (zoom: number) => void;
  onMapClick: () => void;
}> = ({ onZoomChange, onMapClick }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    click: () => {
      onMapClick();
    }
  });

  return null;
};

// Zoom control component
const ZoomControls: React.FC<{ map: L.Map | null }> = ({ map }) => {
  const zoomIn = () => map?.zoomIn();
  const zoomOut = () => map?.zoomOut();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={zoomIn}
        className="w-10 h-10 bg-theme-primary border border-theme-primary rounded-lg shadow-theme-md hover:bg-theme-tertiary transition-theme-normal flex items-center justify-center"
      >
        <ZoomIn size={20} className="text-theme-secondary" />
      </button>
      <button
        onClick={zoomOut}
        className="w-10 h-10 bg-theme-primary border border-theme-primary rounded-lg shadow-theme-md hover:bg-theme-tertiary transition-theme-normal flex items-center justify-center"
      >
        <ZoomOut size={20} className="text-theme-secondary" />
      </button>
    </div>
  );
};

const MapPage: React.FC<MapPageProps> = ({ theme }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [visibleUsers, setVisibleUsers] = useState(topUsers);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    updateVisibleUsers(currentZoom);
  }, [currentZoom]);

  const updateVisibleUsers = (zoomLevel: number) => {
    let filteredUsers = topUsers;
    
    if (zoomLevel < 6) {
      filteredUsers = topUsers.filter(user => user.level === 'country');
    } else if (zoomLevel >= 6 && zoomLevel < 9) {
      filteredUsers = topUsers.filter(user => user.level === 'region');
    } else if (zoomLevel >= 9 && zoomLevel < 12) {
      filteredUsers = topUsers.filter(user => user.level === 'district');
    } else {
      filteredUsers = topUsers.filter(user => user.level === 'neighborhood');
    }
    
    setVisibleUsers(filteredUsers);
  };

  const getLocationText = (user: any) => {
    if (user.level === 'country') {
      return user.location.country;
    } else if (user.level === 'region') {
      return `${user.location.region}, ${user.location.country}`;
    } else if (user.level === 'district') {
      return `${user.location.district}, ${user.location.region}`;
    } else {
      return `${user.location.neighborhood}, ${user.location.district}`;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'country': return 'text-yellow-500 bg-yellow-100';
      case 'region': return 'text-blue-500 bg-blue-100';
      case 'district': return 'text-green-500 bg-green-100';
      case 'neighborhood': return 'text-purple-500 bg-purple-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const sortedLeaderboard = [...visibleUsers].sort((a, b) => {
    if (b.stats.accuracy !== a.stats.accuracy) {
      return b.stats.accuracy - a.stats.accuracy;
    }
    return b.stats.totalTests - a.stats.totalTests;
  });

  return (
    <div className="min-h-screen bg-theme-secondary pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-theme-primary mb-2">Interactive Quiz Map</h1>
          <p className="text-theme-secondary">Explore top performers across Uzbekistan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-theme-primary rounded-2xl p-6 border border-theme-primary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-theme-primary">Interactive Map</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-theme-secondary">
                    Zoom: <span className="font-semibold">{currentZoom}</span>
                  </div>
                  <div className="text-sm text-theme-secondary">
                    Users: <span className="font-semibold">{visibleUsers.length}</span>
                  </div>
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
                  >
                    <Maximize2 size={20} className="text-theme-secondary" />
                  </button>
                </div>
              </div>

              {/* Map Container */}
              <div className="relative h-96 rounded-lg overflow-hidden border border-theme-primary">
                <MapContainer
                  center={[41.3775, 64.5853]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                  whenCreated={setMapInstance}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <MapEventHandler 
                    onZoomChange={setCurrentZoom}
                    onMapClick={() => setSelectedUser(null)}
                  />

                  {visibleUsers.map((user) => (
                    <Marker
                      key={user.id}
                      position={[user.lat, user.lng]}
                      icon={createCustomIcon(user.profilePic, user.level)}
                      eventHandlers={{
                        click: () => setSelectedUser(user),
                      }}
                    >
                      <Popup>
                        <div className="text-center p-2">
                          <img
                            src={user.profilePic}
                            alt={user.name}
                            className="w-12 h-12 rounded-full mx-auto mb-2"
                          />
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-gray-600">{getLocationText(user)}</p>
                          <p className="text-sm font-medium text-blue-600">{user.stats.accuracy}% accuracy</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <ZoomControls map={mapInstance} />
              </div>

              {/* Zoom Level Info */}
              <div className="mt-4 flex justify-center">
                <div className="bg-theme-secondary px-4 py-2 rounded-lg border border-theme-primary">
                  <span className="text-sm text-theme-secondary">
                    Showing: <span className="font-semibold text-theme-primary">
                      {currentZoom < 6 ? 'Country Level' : 
                       currentZoom < 9 ? 'Region Level' : 
                       currentZoom < 12 ? 'District Level' : 'Neighborhood Level'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="lg:col-span-1">
            <div className="bg-theme-primary rounded-2xl p-6 border border-theme-primary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-theme-primary">Top Performers</h3>
                <div className="text-xs text-theme-secondary">
                  {currentZoom < 6 ? 'Country' : 
                   currentZoom < 9 ? 'Region' : 
                   currentZoom < 12 ? 'District' : 'Neighborhood'}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedLeaderboard.slice(0, 10).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 bg-theme-secondary rounded-lg hover:bg-theme-tertiary transition-theme-normal cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="text-lg font-bold text-theme-secondary min-w-[30px]">
                      {getRankIcon(index)}
                    </div>
                    <img
                      src={user.profilePic}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-primary truncate">{user.name}</div>
                      <div className="text-xs text-theme-secondary truncate">
                        {getLocationText(user)}
                      </div>
                      <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(user.level)}`}>
                        {user.level}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent-primary">{user.stats.accuracy}%</div>
                      <div className="text-xs text-theme-secondary">{user.stats.totalTests} tests</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{visibleUsers.length}</div>
                <div className="text-sm text-theme-secondary">Visible Users</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">
                  {Math.round(visibleUsers.reduce((acc, user) => acc + user.stats.accuracy, 0) / visibleUsers.length)}%
                </div>
                <div className="text-sm text-theme-secondary">Avg Accuracy</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">
                  {visibleUsers.reduce((acc, user) => acc + user.stats.totalTests, 0).toLocaleString()}
                </div>
                <div className="text-sm text-theme-secondary">Total Tests</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award size={24} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">
                  {currentZoom}
                </div>
                <div className="text-sm text-theme-secondary">Zoom Level</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">User Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                <X size={20} className="text-theme-secondary" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <img
                  src={selectedUser.profilePic}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg"
                />
                <h4 className="text-xl font-bold text-theme-primary">{selectedUser.name}</h4>
                <p className="text-theme-secondary">{getLocationText(selectedUser)}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getLevelColor(selectedUser.level)}`}>
                  {selectedUser.level} level
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className="text-2xl font-bold text-accent-primary">{selectedUser.stats.totalTests}</div>
                  <div className="text-sm text-theme-secondary">Total Tests</div>
                </div>
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{selectedUser.stats.accuracy}%</div>
                  <div className="text-sm text-theme-secondary">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{selectedUser.stats.correctAnswers}</div>
                  <div className="text-sm text-theme-secondary">Correct</div>
                </div>
                <div className="text-center p-4 bg-theme-secondary rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{selectedUser.stats.wrongAnswers}</div>
                  <div className="text-sm text-theme-secondary">Wrong</div>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Joined:</span>
                  <span className="text-theme-primary">{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Last Active:</span>
                  <span className="text-theme-primary">{new Date(selectedUser.lastActive).toLocaleDateString()}</span>
                </div>
              </div>

              <button className="w-full bg-accent-primary text-white py-3 rounded-lg hover:bg-accent-secondary transition-theme-normal">
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-theme-secondary z-50">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-4 bg-theme-primary border-b border-theme-primary">
              <h3 className="text-xl font-bold text-theme-primary">Interactive Map - Full Screen</h3>
              <button
                onClick={() => setShowFullscreen(false)}
                className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
              >
                <X size={24} className="text-theme-secondary" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <MapContainer
                center={[41.3775, 64.5853]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                whenCreated={setMapInstance}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapEventHandler 
                  onZoomChange={setCurrentZoom}
                  onMapClick={() => setSelectedUser(null)}
                />

                {visibleUsers.map((user) => (
                  <Marker
                    key={user.id}
                    position={[user.lat, user.lng]}
                    icon={createCustomIcon(user.profilePic, user.level)}
                    eventHandlers={{
                      click: () => setSelectedUser(user),
                    }}
                  >
                    <Popup>
                      <div className="text-center p-2">
                        <img
                          src={user.profilePic}
                          alt={user.name}
                          className="w-12 h-12 rounded-full mx-auto mb-2"
                        />
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-gray-600">{getLocationText(user)}</p>
                        <p className="text-sm font-medium text-blue-600">{user.stats.accuracy}% accuracy</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <ZoomControls map={mapInstance} />

              {/* Fullscreen Map Info */}
              <div className="absolute bottom-4 left-4 bg-theme-primary p-4 rounded-lg border border-theme-primary shadow-theme-lg">
                <div className="text-sm text-theme-secondary mb-2">
                  Zoom Level: <span className="font-semibold text-theme-primary">{currentZoom}</span>
                </div>
                <div className="text-sm text-theme-secondary mb-2">
                  Showing: <span className="font-semibold text-theme-primary">
                    {currentZoom < 6 ? 'Country Level' : 
                     currentZoom < 9 ? 'Region Level' : 
                     currentZoom < 12 ? 'District Level' : 'Neighborhood Level'}
                  </span>
                </div>
                <div className="text-sm text-theme-secondary">
                  Users: <span className="font-semibold text-theme-primary">{visibleUsers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;