"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useCallback } from "react";
import type { SocketMessage } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useSocket(
    meetingId: string | null,
    onMessage: (message: SocketMessage) => void
) {
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (!meetingId || socketRef.current?.connected) return;

        socketRef.current = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on("connect", () => {
            console.log("🔌 Socket connected");
            socketRef.current?.emit("join_meeting", meetingId);
        });

        socketRef.current.on("update", (data: SocketMessage) => {
            onMessage(data);
        });

        socketRef.current.on("disconnect", () => {
            console.log("❌ Socket disconnected");
        });

        socketRef.current.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });
    }, [meetingId, onMessage]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            if (meetingId) {
                socketRef.current.emit("leave_meeting", meetingId);
            }
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, [meetingId]);

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected: socketRef.current?.connected ?? false,
        reconnect: connect,
    };
}
