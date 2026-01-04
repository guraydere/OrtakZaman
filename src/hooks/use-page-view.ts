"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to track page views on mount
 * Sends a POST request to the analytics API
 */
export function usePageView() {
    const tracked = useRef(false);

    useEffect(() => {
        // Only track once per page load
        if (tracked.current) return;
        tracked.current = true;

        // Detect mobile
        const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            navigator.userAgent
        );

        // Fire and forget - don't block rendering
        fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isMobile }),
        }).catch(() => {
            // Silently fail - analytics should not break the app
        });
    }, []);
}
