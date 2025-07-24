import type { UserLeaderboardData } from "./api"
import leaflet from "leaflet"

export interface ProcessedUserData extends UserLeaderboardData {
  id: string
  name: string
  profilePic: string
  stats: {
    totalTests: number
    correctAnswers: number
    wrongAnswers: number
    accuracy: number
  }
  joinDate: string
  lastActive: string
}

export const processLeaderboardData = (data: UserLeaderboardData[]): ProcessedUserData[] => {
  return data.map((user, index) => ({
    ...user,
    id: `user-${index}`,
    name: user.username,
    profilePic: `${user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}`,
    stats: {
      totalTests: user.tests_solved,
      correctAnswers: user.correct,
      wrongAnswers: user.wrong,
      accuracy: user.tests_solved > 0 ? Math.round((user.correct / user.tests_solved) * 100) : 0,
    },
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

export const filterUsersByZoom = (users: ProcessedUserData[], zoomLevel: number): ProcessedUserData[] => {
  if (zoomLevel < 6) {
    return users.filter((user) => user.level_type === "country")
  } else if (zoomLevel >= 6 && zoomLevel < 9) {
    return users.filter((user) => user.level_type === "region")
  } else if (zoomLevel >= 9 && zoomLevel < 12) {
    return users.filter((user) => user.level_type === "district")
  } else {
    return users.filter((user) => user.level_type === "neighborhood")
  }
}

export const createCustomIcon = (profile_image: string, level: string) => {
  const size = level === "country" ? 60 : level === "region" ? 50 : level === "district" ? 40 : 35

  return leaflet.divIcon({
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
          src="${profile_image}" 
          style="
            width: 100%; 
            height: 100%; 
            object-fit: cover;
          " 
          alt="User"
          onerror="this.src='https://backend.testabd.uz/media/defaultuseravatar.png'"
        />
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: ${level === "country" ? "#ffd700" : level === "region" ? "#3b82f6" : level === "district" ? "#10b981" : "#8b5cf6"};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
        ">
          ${level === "country" ? "👑" : level === "region" ? "⭐" : level === "district" ? "🏆" : "🎯"}
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
