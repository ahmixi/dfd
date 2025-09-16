"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Volume2, VolumeX, Smartphone, Moon, Sun } from "lucide-react"

export function GameSettings() {
  const { user, setCurrentScreen, updatePreferences } = useGameStore()

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentScreen("dashboard")} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Customize your gaming experience</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Settings
            </CardTitle>
            <CardDescription>Control sound and audio preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.preferences.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <div>
                  <div className="font-medium">Sound Effects</div>
                  <div className="text-sm text-muted-foreground">Game sounds and music</div>
                </div>
              </div>
              <Switch
                checked={user.preferences.soundEnabled}
                onCheckedChange={(checked) => updatePreferences({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4" />
                <div>
                  <div className="font-medium">Haptic Feedback</div>
                  <div className="text-sm text-muted-foreground">Vibration on mobile devices</div>
                </div>
              </div>
              <Switch
                checked={user.preferences.hapticEnabled}
                onCheckedChange={(checked) => updatePreferences({ hapticEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user.preferences.theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.preferences.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Switch between light and dark themes</div>
                </div>
              </div>
              <Switch
                checked={user.preferences.theme === "dark"}
                onCheckedChange={(checked) => updatePreferences({ theme: checked ? "dark" : "light" })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your gaming profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Coins</div>
                <div className="text-2xl font-bold text-primary">{user.coins.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Characters Unlocked</div>
                <div className="text-2xl font-bold text-secondary">{user.unlockedCharacters.length}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Achievements</div>
              <div className="text-2xl font-bold text-accent">{user.achievementsUnlocked.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
