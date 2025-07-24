"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import { Globe, Users, TrendingUp, Maximize2, X, Award, Target, ZoomIn, ZoomOut, Filter } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { leaderboardApi, type LeaderboardFilters } from "../utils/api"
import { processLeaderboardData, filterUsersByZoom, createCustomIcon, type ProcessedUserData } from "../utils/maputils"

interface MapPageProps {
  theme: string
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Map event handler component
const MapEventHandler: React.FC<{
  onZoomChange: (zoom: number) => void
  onMapClick: () => void
}> = ({ onZoomChange, onMapClick }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom())
    },
    click: () => {
      onMapClick()
    },
  })

  return null
}

// Zoom control component
const ZoomControls: React.FC<{ map: L.Map | null }> = ({ map }) => {
  const zoomIn = () => map?.zoomIn()
  const zoomOut = () => map?.zoomOut()

  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2">
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
  )
}

// Filter component
const FilterPanel: React.FC<{
  filters: LeaderboardFilters
  onFiltersChange: (filters: LeaderboardFilters) => void
  isOpen: boolean
  onToggle: () => void
}> = ({ filters, onFiltersChange, isOpen, onToggle }) => {
  const handleFilterChange = (key: keyof LeaderboardFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-4 py-2 bg-theme-primary border border-theme-primary rounded-lg hover:bg-theme-tertiary transition-theme-normal"
      >
        <Filter size={16} className="text-theme-secondary" />
        <span className="text-theme-primary">Filters</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-theme-primary border border-theme-primary rounded-lg shadow-theme-xl p-4 z-[500]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">Level Type</label>
              <select
                value={filters.level_type || ""}
                onChange={(e) => handleFilterChange("level_type", e.target.value)}
                className="w-full px-3 py-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="">All Levels</option>
                <option value="country">Country</option>
                <option value="region">Region</option>
                <option value="district">District</option>
                <option value="neighborhood">Neighborhood</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">Level</label>
              <input
                type="text"
                value={filters.level || ""}
                onChange={(e) => handleFilterChange("level", e.target.value)}
                placeholder="Enter level..."
                className="w-full px-3 py-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">Location</label>
              <input
                type="text"
                value={filters.location || ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                placeholder="Enter location..."
                className="w-full px-3 py-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">Date</label>
              <input
                type="date"
                value={filters.date || ""}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onFiltersChange({})}
                className="flex-1 px-3 py-2 border border-theme-primary rounded-lg text-theme-secondary hover:bg-theme-tertiary transition-theme-normal"
              >
                Clear
              </button>
              <button
                onClick={onToggle}
                className="flex-1 px-3 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-theme-normal"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MapPage: React.FC<MapPageProps> = ({ theme }) => {
  const [selectedUser, setSelectedUser] = useState<ProcessedUserData | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(6)
  const [allUsers, setAllUsers] = useState<ProcessedUserData[]>([])
  const [visibleUsers, setVisibleUsers] = useState<ProcessedUserData[]>([])
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<LeaderboardFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgAccuracy: 0,
    totalTests: 0,
  })

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [userData] = await Promise.all([
        leaderboardApi.getLeaderboardData(filters),
      ])
      console.log("Processing user data:", userData) // <-- nuqta-vergul yoki hech narsa

      const processedData = processLeaderboardData(userData)
      setAllUsers(processedData)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      console.error("Error fetching leaderboard data:", err)
    } finally {
      setLoading(false)
    }
  }, [filters])
  

  // Update visible users based on zoom level
  useEffect(() => {
    const filtered = filterUsersByZoom(allUsers, currentZoom)
    setVisibleUsers(filtered)
  }, [allUsers, currentZoom])

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  const getLocationText = (user: ProcessedUserData) => {
    return user.location || "Unknown Location"
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "country":
        return "text-yellow-500 bg-yellow-100"
      case "region":
        return "text-blue-500 bg-blue-100"
      case "district":
        return "text-green-500 bg-green-100"
      case "neighborhood":
        return "text-purple-500 bg-purple-100"
      default:
        return "text-gray-500 bg-gray-100"
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `${index + 1}`
  }

  const sortedLeaderboard = [...visibleUsers].sort((a, b) => {
    if (b.stats.accuracy !== a.stats.accuracy) {
      return b.stats.accuracy - a.stats.accuracy
    }
    return b.stats.totalTests - a.stats.totalTests
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-secondary pt-20 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-theme-primary">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-secondary pt-20 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboardData}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-theme-normal"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme-secondary pt-20 pb-20 relative z-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-theme-primary mb-2">Interactive Quiz Map</h1>
          <p className="text-theme-secondary">Explore top performers across Uzbekistan</p>
        </div>

        {/* Filters */}
        <div className="flex justify-end mb-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
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

              {/* Map Container - Fixed z-index */}
              <div className="relative h-96 rounded-lg overflow-hidden border border-theme-primary z-0">
                <MapContainer
                  center={[41.3775, 64.5853]}
                  zoom={6}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  whenCreated={setMapInstance}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  <MapEventHandler onZoomChange={setCurrentZoom} onMapClick={() => setSelectedUser(null)} />

                  {visibleUsers.map((user) => (
                    <Marker
                      key={user.id}
                      position={[user.lat, user.lng]}
                      icon={createCustomIcon(user.profilePic, user.level_type)}
                      eventHandlers={{
                        click: () => setSelectedUser(user),
                      }}
                    >
                      <Popup>
                        <div className="text-center p-2">
                          <img
                            src={user.profilePic || "/defaultprofileavatar.jpg"}
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
                    Showing:{" "}
                    <span className="font-semibold text-theme-primary">
                      {currentZoom < 6
                        ? "Country Level"
                        : currentZoom < 9
                          ? "Region Level"
                          : currentZoom < 12
                            ? "District Level"
                            : "Neighborhood Level"}
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
                  {currentZoom < 6
                    ? "Country"
                    : currentZoom < 9
                      ? "Region"
                      : currentZoom < 12
                        ? "District"
                        : "Neighborhood"}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedLeaderboard.slice(0, 10).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 bg-theme-secondary rounded-lg hover:bg-theme-tertiary transition-theme-normal cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="text-lg font-bold text-theme-secondary min-w-[30px]">{getRankIcon(index)}</div>
                    <img
                      src={user.profilePic || "/defaultprofileavatar.jpg"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-primary truncate">{user.name}</div>
                      <div className="text-xs text-theme-secondary truncate">{getLocationText(user)}</div>
                      <div
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(user.level_type)}`}
                      >
                        {user.level_type}
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
                <div className="text-2xl font-bold text-theme-primary">{stats.totalUsers}</div>
                <div className="text-sm text-theme-secondary">Total Users</div>
              </div>
            </div>
          </div>

          <div className="bg-theme-primary p-6 rounded-lg border border-theme-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-primary">{stats.avgAccuracy}%</div>
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
                <div className="text-2xl font-bold text-theme-primary">{stats.totalTests.toLocaleString()}</div>
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
                <div className="text-2xl font-bold text-theme-primary">{visibleUsers.length}</div>
                <div className="text-sm text-theme-secondary">Visible Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal - Fixed z-index */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-3">
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
                  src={selectedUser.profilePic || "/defaultprofileavatar.jpg"}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg"
                />
                <h4 className="text-xl font-bold text-theme-primary">{selectedUser.name}</h4>
                <p className="text-theme-secondary">{getLocationText(selectedUser)}</p>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getLevelColor(selectedUser.level_type)}`}
                >
                  {selectedUser.level_type} level
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
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


              <a href={`/profile/${selectedUser.username}`}><button className="w-full bg-accent-primary text-white py-3 rounded-lg hover:bg-accent-secondary transition-theme-normal">
                View Full Profile
              </button></a>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal - Fixed z-index */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-theme-secondary z-[9998]">
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
                zoom={currentZoom}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                whenCreated={setMapInstance}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MapEventHandler onZoomChange={setCurrentZoom} onMapClick={() => setSelectedUser(null)} />

                {visibleUsers.map((user) => (
                  <Marker
                    key={user.id}
                    position={[user.lat, user.lng]}
                    icon={createCustomIcon(user.profilePic, user.level_type)}
                    eventHandlers={{
                      click: () => setSelectedUser(user),
                    }}
                  >
                    <Popup>
                      <div className="text-center p-2">
                        <img
                          src={user.profilePic || "/media/defaultprofileavatar.jpg"}
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
              <div className="absolute bottom-4 left-4 bg-theme-primary p-4 rounded-lg border border-theme-primary shadow-theme-lg z-[400]">
                <div className="text-sm text-theme-secondary mb-2">
                  Zoom Level: <span className="font-semibold text-theme-primary">{currentZoom}</span>
                </div>
                <div className="text-sm text-theme-secondary mb-2">
                  Showing:{" "}
                  <span className="font-semibold text-theme-primary">
                    {currentZoom < 6
                      ? "Country Level"
                      : currentZoom < 9
                        ? "Region Level"
                        : currentZoom < 12
                          ? "District Level"
                          : "Neighborhood Level"}
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
  )
}

export default MapPage
