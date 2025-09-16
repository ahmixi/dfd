"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, Star, Gift, Calendar } from "lucide-react"

export function StatisticsPage() {
  const {
    setCurrentScreen,
    gameStats,
    playerStats,
    achievements,
    dailyChallenges,
    user,
    completeDailyChallenge,
    generateDailyChallenges,
  } = useGameStore()

  const emojiBlastStats = gameStats["emoji-blast"]

  // Generate daily challenges if none exist
  if (dailyChallenges.length === 0) {
    generateDailyChallenges()
  }

  const achievementCategories = {
    gameplay: achievements.filter((a) => a.category === "gameplay"),
    collection: achievements.filter((a) => a.category === "collection"),
    progression: achievements.filter((a) => a.category === "progression"),
    special: achievements.filter((a) => a.category === "special"),
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked)
  const totalAchievements = achievements.length

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentScreen("dashboard")} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Statistics & Progress</h2>
          <p className="text-muted-foreground">Track your gaming journey and achievements</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Daily</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{emojiBlastStats.highScore}</div>
                <div className="text-sm text-muted-foreground">High Score</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-full mx-auto mb-3">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold text-secondary">{emojiBlastStats.totalGames}</div>
                <div className="text-sm text-muted-foreground">Games Played</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mx-auto mb-3">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
          <div className="text-2xl font-bold text-accent">{playerStats.longestStreak}</div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
            <div className="text-xs text-muted-foreground mt-2">Current: {gameStats["emoji-blast"]?.currentStreak ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-chart-3/10 rounded-full mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-chart-3" />
                </div>
                <div className="text-2xl font-bold text-chart-3">{playerStats.winRate}%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Game Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Score</span>
                  <span className="font-bold">{playerStats.totalScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Score</span>
                  <span className="font-bold">{playerStats.averageScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Games Won</span>
                  <span className="font-bold text-green-600">{playerStats.gamesWon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Games Lost</span>
                  <span className="font-bold text-red-600">{playerStats.gamesLost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Level</span>
                  <span className="font-bold">{emojiBlastStats.levelProgress}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Collection Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Characters Owned</span>
                  <span className="font-bold">{user.unlockedCharacters.length}/11</span>
                </div>
                <Progress value={(user.unlockedCharacters.length / 11) * 100} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Achievements Unlocked</span>
                  <span className="font-bold">
                    {unlockedAchievements.length}/{totalAchievements}
                  </span>
                </div>
                <Progress value={(unlockedAchievements.length / totalAchievements) * 100} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Coins Earned</span>
                  <span className="font-bold text-primary">{playerStats.totalCoinsEarned.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {unlockedAchievements.slice(-4).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{achievement.title}</div>
                      <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      {achievement.dateUnlocked && (
                        <div className="text-xs text-primary">
                          Unlocked {new Date(achievement.dateUnlocked).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">+{achievement.reward.coins} coins</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(achievementCategories).map(([category, categoryAchievements]) => (
              <Card key={category}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {categoryAchievements.filter((a) => a.unlocked).length}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {category} ({categoryAchievements.length})
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {Object.entries(achievementCategories).map(([category, categoryAchievements]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border ${
                          achievement.unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-muted"
                        }`}
                      >
                        <div className={`text-3xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{achievement.title}</span>
                            {achievement.unlocked && <Badge variant="secondary">✓</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{achievement.description}</div>

                          {!achievement.unlocked && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>
                                  {achievement.progress}/{achievement.requirement.value}
                                </span>
                              </div>
                              <Progress
                                value={(achievement.progress / achievement.requirement.value) * 100}
                                className="h-1"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-primary">+{achievement.reward.coins} coins</span>
                            {achievement.dateUnlocked && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(achievement.dateUnlocked).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Challenges
              </CardTitle>
              <CardDescription>Complete daily challenges to earn extra coins and experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      challenge.completed
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="text-3xl">{challenge.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{challenge.title}</span>
                        {challenge.completed && <Badge className="bg-green-600">Completed</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{challenge.description}</div>

                      {!challenge.completed && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>
                              {challenge.progress}/{challenge.requirement.value}
                            </span>
                          </div>
                          <Progress value={(challenge.progress / challenge.requirement.value) * 100} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-primary">+{challenge.reward.coins} coins</span>
                        <span className="text-secondary">+{challenge.reward.experience} XP</span>
                        <span className="text-muted-foreground">
                          Expires: {new Date(challenge.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {challenge.completed && (
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Claimed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Global Leaderboard
              </CardTitle>
              <CardDescription>See how you rank against other players worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold mb-2">Leaderboard Coming Soon!</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with other players and compete for the top spot on our global leaderboard.
                </p>
                <div className="space-y-2">
                  <div className="text-sm">Your Current Stats:</div>
                  <div className="flex justify-center gap-6 text-sm">
                    <div>
                      High Score: <span className="font-bold text-primary">{emojiBlastStats.highScore}</span>
                    </div>
                    <div>
                      Win Rate: <span className="font-bold text-secondary">{playerStats.winRate}%</span>
                    </div>
                    <div>
                      Level: <span className="font-bold text-accent">{emojiBlastStats.levelProgress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
