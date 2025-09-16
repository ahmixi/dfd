"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Trophy, Star, ShoppingBag, TrendingUp, Clock, Target, Zap } from "lucide-react"

export function Dashboard() {
  const { setCurrentScreen, gameStats, user } = useGameStore()
  const emojiBlastStats = gameStats["emoji-blast"]

  const games = [
    {
      id: "emoji-blast",
      title: "Emoji Blast",
      description: "Survive waves of enemies by throwing bombs!",
      thumbnail: "/emoji-blast-game-thumbnail.jpg",
      highScore: emojiBlastStats.highScore,
      isAvailable: true,
      difficulty: "Medium",
      category: "Action",
    },
    {
      id: "emoji-runner",
      title: "Emoji Runner",
      description: "Run and jump through emoji obstacles!",
      thumbnail: "/emoji-runner-game-thumbnail.jpg",
      highScore: 0,
      isAvailable: false, // removed — coming soon
      difficulty: "Easy",
      category: "Arcade",
    },
    {
      id: "emoji-puzzle",
      title: "Emoji Puzzle",
      description: "Match emojis to solve challenging puzzles!",
      thumbnail: "/emoji-puzzle-game-thumbnail.jpg",
      highScore: 0,
      isAvailable: false, // removed — coming soon
      difficulty: "Hard",
      category: "Puzzle",
    },
  ]

  const achievements = [
    {
      id: "first-game",
      title: "First Steps",
      description: "Play your first game",
      completed: emojiBlastStats.totalGames > 0,
    },
    { id: "coin-collector", title: "Coin Collector", description: "Collect 100 coins", completed: user.coins >= 100 },
    {
      id: "character-unlocked",
      title: "New Friend",
      description: "Unlock a new character",
      completed: user.unlockedCharacters.length > 3,
    },
  ]

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Welcome Section with Character */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-6 md:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl md:text-6xl transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              {(() => {
                const selected = useGameStore.getState().characters.find(
                  (c) => c.id === user.selectedCharacter && user.unlockedCharacters.includes(c.id)
                );
                if (selected) {
                  return selected.image ? (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className="w-16 h-16 object-contain rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      style={{ background: 'white' }}
                    />
                  ) : (
                    <span>{selected.emoji || "🧍‍♂️"}</span>
                  );
                }
                // fallback to default character
                const def = useGameStore.getState().characters.find((c) => c.id === "default");
                return def?.image ? (
                  <img
                    src={def.image}
                    alt={def.name}
                    className="w-16 h-16 object-contain rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    style={{ background: 'white' }}
                  />
                ) : (
                  <span>{def?.emoji || "🧍‍♂️"}</span>
                );
              })()}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">Welcome Back!</h2>
              <p className="text-muted-foreground">Ready for another adventure?</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors"
            >
              Level {emojiBlastStats.levelProgress}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 transition-colors"
            >
              {user.unlockedCharacters.length} Characters
            </Badge>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full translate-y-12 -translate-x-12 animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "🪙", value: user.coins.toLocaleString(), label: "Total Coins", color: "primary" },
          { icon: Trophy, value: emojiBlastStats.highScore, label: "Best Score", color: "secondary" },
          { icon: Target, value: emojiBlastStats.totalGames, label: "Games Played", color: "accent" },
          { icon: Zap, value: emojiBlastStats.currentStreak, label: "Win Streak", color: "chart-3" },
        ].map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-md transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4 text-center">
              <div
                className={`flex items-center justify-center w-12 h-12 bg-${stat.color}/10 rounded-full mx-auto mb-3 transition-colors hover:bg-${stat.color}/20`}
              >
                {typeof stat.icon === "string" ? (
                  <span className="text-xl">{stat.icon}</span>
                ) : (
                  <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                )}
              </div>
              <div className={`text-2xl font-bold text-${stat.color} transition-colors`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Game */}
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-4 delay-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary animate-pulse" />
              Featured Game
            </CardTitle>
            <Badge className="bg-gradient-to-r from-primary to-secondary text-white animate-pulse">Popular</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-xl font-bold mb-2 text-balance">Emoji Blast</h3>
              <p className="text-muted-foreground mb-4 text-pretty">
                The ultimate survival game! Control your emoji character and survive waves of enemies by strategically
                throwing bombs. Can you beat your high score?
              </p>
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="hover:bg-primary/10 transition-colors">
                  Action
                </Badge>
                <Badge variant="outline" className="hover:bg-secondary/10 transition-colors">
                  Medium
                </Badge>
              </div>
              <Button
                size="lg"
                onClick={() => setCurrentScreen("game")}
                className="w-full md:w-auto group hover:scale-105 transition-all duration-300"
              >
                <Play className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                Play Now
              </Button>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden group">
              <img
                src="/emoji-blast-game-thumbnail.jpg"
                alt="Emoji Blast"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Games Grid */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 delay-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">All Games</h3>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-all duration-300 bg-transparent">
            <TrendingUp className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <Card
              key={game.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 group hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={game.thumbnail || "/placeholder.svg"}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!game.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Clock className="h-8 w-8 text-white mx-auto mb-2 animate-pulse" />
                      <span className="text-white font-bold">Coming Soon</span>
                    </div>
                  </div>
                )}
                {game.highScore > 0 && (
                  <div className="absolute top-3 right-3 bg-secondary/90 text-secondary-foreground px-2 py-1 rounded-full text-sm font-bold animate-in slide-in-from-top-2">
                    <Trophy className="h-3 w-3 inline mr-1" />
                    {game.highScore}
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{game.title}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                      {game.category}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm text-pretty">{game.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  className="w-full group hover:scale-105 transition-all duration-300"
                  disabled={!game.isAvailable}
                  onClick={() => {
                    if (game.isAvailable) {
                      // Only emoji-blast is available
                      setCurrentScreen("game")
                    }
                  }}
                  variant={game.isAvailable ? "default" : "secondary"}
                >
                  <Play className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  {game.isAvailable ? "Play Now" : "Coming Soon"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions & Achievements */}
      <div className="grid md:grid-cols-2 gap-6 animate-in fade-in-0 slide-in-from-bottom-4 delay-700">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors animate-in fade-in-0 slide-in-from-left-4"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    achievement.completed ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
                  }`}
                >
                  {achievement.completed ? "✓" : "○"}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: ShoppingBag, label: "Visit Character Shop", action: () => setCurrentScreen("shop") },
              { icon: Trophy, label: "View Leaderboard", action: () => setCurrentScreen("leaderboard") },
              { icon: Star, label: "Daily Challenges", action: () => setCurrentScreen("achievements") },
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={action.action}
                className="w-full justify-start gap-3 hover:scale-105 transition-all duration-300 bg-transparent animate-in fade-in-0 slide-in-from-right-4"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
