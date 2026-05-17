import { useCallback, useEffect, useRef, useState } from "react";

const EDGE_ZONE = 30;
const MIN_DISTANCE = 50;
const MAX_VERTICAL = 75;

type UseMobileLayoutShellParams = {
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
};

export function useMobileLayoutShell({
  isMobile,
  setSidebarOpen,
  sidebarOpen,
}: UseMobileLayoutShellParams) {
  useMobileSidebarSwipe({ isMobile, setSidebarOpen, sidebarOpen });
  useBodyOverflowMode(isMobile);
  return useMobileBottomNavVisibility(isMobile);
}

function useMobileBottomNavVisibility(isMobile: boolean) {
  const lastMainScrollTop = useRef(0);
  const [mobileNavVisible, setMobileNavVisible] = useState(true);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavVisible(true);
      return;
    }

    lastMainScrollTop.current = 0;
    setMobileNavVisible(true);
  }, [isMobile]);

  const updateMobileNavVisibility = useCallback((currentTop: number) => {
    const delta = currentTop - lastMainScrollTop.current;

    if (currentTop <= 24) {
      setMobileNavVisible(true);
    } else if (delta > 8) {
      setMobileNavVisible(false);
    } else if (delta < -8) {
      setMobileNavVisible(true);
    }

    lastMainScrollTop.current = currentTop;
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavVisible(true);
      lastMainScrollTop.current = 0;
      return;
    }

    const onScroll = () => {
      updateMobileNavVisibility(window.scrollY || document.documentElement.scrollTop || 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMobile, updateMobileNavVisibility]);

  return { mobileNavVisible };
}

function useMobileSidebarSwipe({
  isMobile,
  setSidebarOpen,
  sidebarOpen,
}: UseMobileLayoutShellParams) {
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]!;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]!;
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (dy > MAX_VERTICAL) return;

      if (!sidebarOpen && startX < EDGE_ZONE && dx > MIN_DISTANCE) {
        setSidebarOpen(true);
        return;
      }

      if (sidebarOpen && dx < -MIN_DISTANCE) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, setSidebarOpen, sidebarOpen]);
}

function useBodyOverflowMode(isMobile: boolean) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = isMobile ? "visible" : "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile]);
}
