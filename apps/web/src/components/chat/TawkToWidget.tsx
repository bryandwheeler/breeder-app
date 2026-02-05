// Tawk.to Live Chat Widget Component
// Injects the Tawk.to script and manages the widget lifecycle
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TawkToConfig, TawkToAPI, isWithinBusinessHours, DEFAULT_TAWKTO_CONFIG } from '@breeder/types';

// Extend Window interface for Tawk.to
declare global {
  interface Window {
    Tawk_API?: TawkToAPI;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToWidget() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const scriptLoaded = useRef(false);
  const [config, setConfig] = useState<TawkToConfig | null>(null);

  // Load config from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'adminSettings', 'liveChat'),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().tawkTo) {
          setConfig({
            ...DEFAULT_TAWKTO_CONFIG,
            ...docSnap.data().tawkTo,
          });
        }
      },
      (error) => {
        console.error('[TawkTo] Error loading config:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load Tawk.to script
  useEffect(() => {
    // Skip if no config or not enabled
    if (!config?.enabled || !config.propertyId || !config.widgetId) {
      return;
    }

    // Skip if script already loaded
    if (scriptLoaded.current) {
      return;
    }

    // Check if current path is excluded
    if (config.excludedPaths?.some((path) => location.pathname.startsWith(path))) {
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create script element
    const script = document.createElement('script');
    script.id = 'tawkto-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${config.propertyId}/${config.widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Set up onLoad callback
    window.Tawk_API.onLoad = () => {
      console.log('[TawkTo] Widget loaded');
      scriptLoaded.current = true;

      // Pass user info if configured
      if (config.passUserInfo && currentUser) {
        window.Tawk_API?.setAttributes?.(
          {
            userId: currentUser.uid,
            email: currentUser.email || undefined,
            name: currentUser.displayName || undefined,
          },
          (error) => {
            if (error) {
              console.error('[TawkTo] Failed to set attributes:', error);
            }
          }
        );
      }

      // Check business hours and show offline message if needed
      if (config.businessHoursEnabled && !isWithinBusinessHours(config)) {
        // Widget will show offline automatically
        console.log('[TawkTo] Outside business hours');
      }
    };

    // Append script to head
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(script);

    // Cleanup
    return () => {
      // Remove script on unmount (if needed)
      const existingScript = document.getElementById('tawkto-script');
      if (existingScript) {
        existingScript.remove();
      }
      // Reset state
      scriptLoaded.current = false;
    };
  }, [config, currentUser]);

  // Handle visibility on route change
  useEffect(() => {
    if (!config?.enabled || !window.Tawk_API) {
      return;
    }

    // Check if current path is excluded
    const isExcluded = config.excludedPaths?.some((path) =>
      location.pathname.startsWith(path)
    );

    if (isExcluded) {
      window.Tawk_API.hideWidget?.();
    } else if (config.showOnAllPages) {
      window.Tawk_API.showWidget?.();
    }
  }, [location.pathname, config]);

  // Update user info when user changes
  useEffect(() => {
    if (!config?.enabled || !config.passUserInfo || !window.Tawk_API) {
      return;
    }

    if (currentUser) {
      window.Tawk_API.setAttributes?.(
        {
          userId: currentUser.uid,
          email: currentUser.email || undefined,
          name: currentUser.displayName || undefined,
        },
        (error) => {
          if (error) {
            console.error('[TawkTo] Failed to update attributes:', error);
          }
        }
      );
    }
  }, [currentUser, config]);

  // This component doesn't render anything visible
  return null;
}

// Hook to control Tawk.to widget programmatically
export function useTawkTo() {
  const maximize = () => {
    window.Tawk_API?.maximize?.();
  };

  const minimize = () => {
    window.Tawk_API?.minimize?.();
  };

  const toggle = () => {
    window.Tawk_API?.toggle?.();
  };

  const show = () => {
    window.Tawk_API?.showWidget?.();
  };

  const hide = () => {
    window.Tawk_API?.hideWidget?.();
  };

  const getStatus = () => {
    return window.Tawk_API?.getStatus?.();
  };

  const isOnline = () => {
    return window.Tawk_API?.getStatus?.() === 'online';
  };

  const addTags = (tags: string[]) => {
    window.Tawk_API?.addTags?.(tags);
  };

  const addEvent = (name: string, data?: Record<string, unknown>) => {
    window.Tawk_API?.addEvent?.(name, data);
  };

  return {
    maximize,
    minimize,
    toggle,
    show,
    hide,
    getStatus,
    isOnline,
    addTags,
    addEvent,
  };
}
