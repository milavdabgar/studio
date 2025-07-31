"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState, FormEvent } from "react";

// Placeholder for actual settings, load from/save to a config service or API
interface SystemSettings {
  maintenanceMode: boolean;
  defaultTheme: 'light' | 'dark' | 'system';
  registrationOpen: boolean;
  notificationsEmail: string;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    defaultTheme: 'system',
    registrationOpen: true,
    notificationsEmail: "admin@gppalanpur..ac.in",
  });

  // In a real app, useEffect would fetch current settings
  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     // const currentSettings = await settingsService.getSettings();
  //     // setSettings(currentSettings);
  //   };
  //   fetchSettings();
  // }, []);

  const handleInputChange = (key: keyof SystemSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      // await settingsService.updateSettings(settings); // Replace with actual service call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({ title: "Settings Saved", description: "System settings have been updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save settings." });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure global settings for the GP Palanpur application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="notificationsEmail">Notifications Email</Label>
              <Input
                id="notificationsEmail"
                type="email"
                value={settings.notificationsEmail}
                onChange={(e) => handleInputChange('notificationsEmail', e.target.value)}
                placeholder="e.g., notifications@gppalanpur..ac.in"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Email address used for sending system notifications.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
            </div>
             <p className="text-xs text-muted-foreground -mt-1">When enabled, users (except admins) will see a maintenance page.</p>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrationOpen"
                checked={settings.registrationOpen}
                onCheckedChange={(checked) => handleInputChange('registrationOpen', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="registrationOpen">Allow New User Registrations</Label>
            </div>

            {/* Add more settings as needed, e.g., default theme, API keys, etc. */}
            {/*
            <div>
              <Label htmlFor="defaultTheme">Default System Theme</Label>
              <Select
                value={settings.defaultTheme}
                onValueChange={(value) => handleInputChange('defaultTheme', value as SystemSettings['defaultTheme'])}
                disabled={isLoading}
              >
                <SelectTrigger id="defaultTheme">
                  <SelectValue placeholder="Select default theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}

            <div className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}