"use client"

import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import { cn } from "../lib/utils"

interface StoryRingProps {
    username: string
    avatar?: string
    hasNewStory?: boolean
    isLive?: boolean
    className?: string
}

export function StoryRing({ username, avatar, hasNewStory = false, isLive = false, className }: StoryRingProps) {
    return (
        <div className={cn("flex flex-col items-center space-y-2 min-w-16", className)}>
            <div className="relative">
                <div
                    className={cn(
                        "p-1 rounded-full transition-all",
                        hasNewStory ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500" : "bg-muted",
                    )}
                >
                    <Avatar className="w-14 h-14 border-2 border-background">
                        <AvatarImage src={avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-sm font-bold bg-purple-100 text-purple-600">
                            {(username ?? "").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                {isLive && (
                    <Badge className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0 h-5">
                        LIVE
                    </Badge>
                )}
            </div>
            <span className="text-xs font-medium text-center truncate w-16">{username}</span>
        </div>
    )
}
