"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseWebSocketReturn {
  isConnected: boolean
  sendMessage: (message: any) => void
  lastMessage: string | null
  error: string | null
}

export const useWebSocket = (url: string | null): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const getSecureWebSocketUrl = (wsUrl: string): string => {
    // If we're on HTTPS, convert ws:// to wss://
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      return wsUrl.replace(/^ws:\/\//, "wss://")
    }
    return wsUrl
  }

  const connect = useCallback(() => {
    if (!url) return

    try {
      const secureUrl = getSecureWebSocketUrl(url)
      console.log("[WebSocket] Attempting to connect to:", secureUrl)

      ws.current = new WebSocket(secureUrl)

      ws.current.onopen = () => {
        console.log("[WebSocket] Connected successfully")
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        setLastMessage(event.data)
      }

      ws.current.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.code, event.reason)
        setIsConnected(false)

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && url) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`[WebSocket] Reconnecting in ${timeout}ms (attempt ${reconnectAttempts.current + 1})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, timeout)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError("Failed to reconnect after multiple attempts")
        }
      }

      ws.current.onerror = (event) => {
        console.error("[WebSocket] Connection error:", event)
        setError("WebSocket connection failed")
      }
    } catch (err) {
      console.error("[WebSocket] Connection failed:", err)
      setError("Failed to establish WebSocket connection")
    }
  }, [url])

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message))
        console.log("[WebSocket] Message sent:", message)
      } catch (err) {
        console.error("[WebSocket] Send error:", err)
        setError("Failed to send message")
      }
    } else {
      console.warn("[WebSocket] Cannot send message - connection not open")
      setError("WebSocket not connected")
    }
  }, [])

  useEffect(() => {
    if (url) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws.current) {
        ws.current.close(1000, "Component unmounting")
      }
    }
  }, [url, connect])

  return {
    isConnected,
    sendMessage,
    lastMessage,
    error,
  }
}
