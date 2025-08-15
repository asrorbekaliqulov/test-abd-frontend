"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export const useWebSocket = (url: string | null) => {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const shouldConnect = useRef(true)
  const isConnecting = useRef(false)
  const isMounted = useRef(true)
  const connectionAttempts = useRef(0)
  const maxConnectionAttempts = 5

  const connect = useCallback(() => {
    if (!url || !shouldConnect.current || isConnecting.current || !isMounted.current) {
      console.log("[WebSocket] Skipping connection - conditions not met", {
        url: !!url,
        shouldConnect: shouldConnect.current,
        isConnecting: isConnecting.current,
        isMounted: isMounted.current,
      })
      return
    }

    if (connectionAttempts.current >= maxConnectionAttempts) {
      console.error("[WebSocket] Max connection attempts reached")
      return
    }

    // Clear any existing connection
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      console.log("[WebSocket] Connection already exists, skipping")
      return
    }

    isConnecting.current = true
    connectionAttempts.current++

    try {
      console.log(`[WebSocket] Connecting to: ${url} (attempt ${connectionAttempts.current})`)
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        if (!isMounted.current) return
        console.log("[WebSocket] Connected successfully")
        setIsConnected(true)
        isConnecting.current = false
        connectionAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        console.log("[WebSocket] Message received:", event.data)
        if (!isMounted.current) return
        setLastMessage(event.data)
      }

      ws.current.onclose = (event) => {
        if (!isMounted.current) return
        console.log("[WebSocket] Connection closed:", event.code, event.reason)
        setIsConnected(false)
        isConnecting.current = false

        // Only reconnect if not intentionally closed and should still connect
        if (
          shouldConnect.current &&
          ![1000, 4000, 4001].includes(event.code) &&
          connectionAttempts.current < maxConnectionAttempts
        ) {
          console.log(
            `[WebSocket] Reconnecting in 3s... (attempt ${connectionAttempts.current + 1}/${maxConnectionAttempts})`,
          )
          setTimeout(() => {
            if (shouldConnect.current && isMounted.current) {
              connect()
            }
          }, 3000)
        }
      }

      ws.current.onerror = (error) => {
        if (!isMounted.current) return
        console.error("[WebSocket] Connection error:", error)
        isConnecting.current = false
      }
    } catch (error) {
      console.error("[WebSocket] Failed to create connection:", error)
      isConnecting.current = false
    }
  }, [url])

  const sendMessage = useCallback((message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isMounted.current) {
      console.log("[WebSocket] Sending message:", message)
      ws.current.send(JSON.stringify(message))
      return true
    } else {
      console.warn("[WebSocket] Cannot send message - not connected")
      return false
    }
  }, [])

  useEffect(() => {
    isMounted.current = true

    // Reset connection attempts when URL changes
    connectionAttempts.current = 0

    if (url) {
      shouldConnect.current = true
      // Small delay to prevent React Strict Mode double mounting issues
      const connectTimer = setTimeout(() => {
        if (isMounted.current && shouldConnect.current) {
          connect()
        }
      }, 100)

      return () => {
        clearTimeout(connectTimer)
      }
    }

    return () => {
      isMounted.current = false
      shouldConnect.current = false

      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
          ws.current.close(1000, "Component unmount")
        }
        ws.current = null
      }
    }
  }, [url, connect])

  useEffect(() => {
    return () => {
      console.log("[WebSocket] Component unmounting, cleaning up...")
      isMounted.current = false
      shouldConnect.current = false

      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
          ws.current.close(1000, "Component unmount")
        }
        ws.current = null
      }
    }
  }, [])

  return {
    isConnected,
    sendMessage,
    lastMessage,
  }
}
