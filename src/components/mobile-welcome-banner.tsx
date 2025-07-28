"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Smartphone, Wifi, Download, Hand, Zap } from "lucide-react";

interface MobileWelcomeBannerProps {
  className?: string;
}

export default function MobileWelcomeBanner({ className }: MobileWelcomeBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      return isMobileDevice || isSmallScreen;
    };

    const mobile = checkMobile();
    setIsMobile(mobile);

    // Only show on mobile devices and if not previously dismissed
    if (mobile && !localStorage.getItem('mobile-welcome-dismissed')) {
      // Show after a short delay to avoid being intrusive
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('mobile-welcome-dismissed', 'true');
  };

  if (!showBanner || !isMobile) {
    return null;
  }

  const features = [
    {
      icon: <Hand className="h-4 w-4" />,
      title: "Touch Optimized",
      description: "Designed for finger navigation"
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      title: "Works Offline", 
      description: "Access your data without internet"
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Lightning Fast",
      description: "Cached for instant loading"
    }
  ];

  return (
    <Card className={`fixed top-4 left-4 right-4 z-50 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg animate-in slide-in-from-top duration-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Welcome to Mobile GP Palanpur!
              </h3>
              <Badge variant="secondary" className="text-xs mt-1">
                Mobile Optimized
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
          This app is now optimized for your mobile device with enhanced features:
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-1">
                <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                  {feature.icon}
                </div>
              </div>
              <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100">
                {feature.title}
              </h4>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleDismiss}
            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-3 w-3 mr-1" />
            Got it!
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDismiss}
            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Dismiss
          </Button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-[10px] text-blue-600 dark:text-blue-400">
            💡 Tip: Add to home screen for the best experience
          </p>
        </div>
      </CardContent>
    </Card>
  );
}