export type GameStatKey = "score" | "survive_time" | "enemies_killed" | "bombs_thrown" | "games_played"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Character {
  id: string
  emoji?: string
  image?: string
  name: string
  cost: number
  category: "starter" | "basic" | "professional" | "special" | "legendary"
  unlocked: boolean
  stats: {
    speed: number
    bombPower: number
    health: number
    luck: number
    energy?: number
  }
  abilities: string[]
  description: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface GameStats {
  highScore: number
  bestTime: number
  totalGames: number
  totalCoins: number
  currentStreak: number
  levelProgress: number
}

export interface UserProfile {
  id: string
  coins: number
  selectedCharacter: string
  unlockedCharacters: string[]
  totalPlayTime: number
  achievementsUnlocked: string[]
  preferences: {
    soundEnabled: boolean
    hapticEnabled: boolean
    theme: "light" | "dark"
  }
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "gameplay" | "collection" | "progression" | "special"
  requirement: {
    type: "score" | "games_played" | "characters_unlocked" | "coins_earned" | "streak" | "level_reached"
    value: number
  }
  reward: {
    coins: number
    character?: string
  }
  unlocked: boolean
  progress: number
  dateUnlocked?: string
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  icon: string
  requirement: {
    type:
      | "score"
      | "survive_time"
      | "enemies_killed"
      | "bombs_thrown"
      | "games_played"
      | "characters_unlocked"
      | "coins_earned"
      | "streak"
      | "level_reached"
    value: number
  }
  reward: {
    coins: number
    experience: number
  }
  progress: number
  completed: boolean
  expiresAt: string
}

export interface PlayerStats {
  totalPlayTime: number
  totalScore: number
  totalEnemiesKilled: number
  totalBombsThrown: number
  totalCoinsEarned: number
  averageScore: number
  bestSurvivalTime: number
  gamesWon: number
  gamesLost: number
  winRate: number
  favoriteCharacter: string
  longestStreak: number
}

interface GameStore {
  // User Profile
  user: UserProfile

  // Game Statistics
  gameStats: Record<string, GameStats>

  // Characters
  characters: Character[]

  // UI State
  currentScreen:
  | "dashboard"
  | "game"
  | "shop"
  | "settings"
  | "leaderboard"
  | "achievements"
  isGamePaused: boolean

  // Achievements
  achievements: Achievement[]

  // Daily Challenges
  dailyChallenges: DailyChallenge[]

  // Player Stats
  playerStats: PlayerStats

  // Actions
  updateCoins: (amount: number) => void
  selectCharacter: (characterId: string) => void
  unlockCharacter: (characterId: string) => void
  updateGameStats: (gameId: string, stats: Partial<GameStats>) => void
  setCurrentScreen: (
    screen:
  | "dashboard"
  | "game"
  | "shop"
  | "settings"
  | "leaderboard"
  | "achievements",
  ) => void
  toggleGamePause: () => void
  updatePreferences: (preferences: Partial<UserProfile["preferences"]>) => void
  unlockAchievement: (achievementId: string) => void
  updatePlayerStats: (stats: Partial<PlayerStats>) => void
  completeDailyChallenge: (challengeId: string) => void
  generateDailyChallenges: () => void
}

const defaultCharacters: Character[] = [
  {
    id: "default",
    emoji: undefined,
    image: "/cheerful starter.png",
    name: "Cheerful Starter",
    cost: 0,
    category: "starter",
    unlocked: true,
    stats: { speed: 5, bombPower: 5, health: 5, luck: 5 },
    abilities: ["Basic Movement"],
    description: "A reliable starter character with balanced stats and a cheerful attitude.",
    rarity: "common",
  },
  {
    id: "kid",
    emoji: "🤣",
    name: "Laughing Speedster",
    cost: 0,
    category: "starter",
    unlocked: true,
    stats: { speed: 7, bombPower: 3, health: 4, luck: 6 },
    abilities: ["Quick Dash"],
    description: "Fast and agile with infectious laughter. Great for dodging enemies.",
    rarity: "common",
  },
  {
    id: "person",
    emoji: "😂",
    name: "Joyful Fighter",
    cost: 0,
    category: "starter",
    unlocked: true,
    stats: { speed: 5, bombPower: 6, health: 6, luck: 3 },
    abilities: ["Power Throw"],
    description: "Well-rounded character who fights with joy and good offensive capabilities.",
    rarity: "common",
  },
  {
    id: "man",
    emoji: "🤐",
    name: "Silent Warrior",
    cost: 50,
    category: "basic",
    unlocked: false,
    stats: { speed: 4, bombPower: 7, health: 7, luck: 2 },
    abilities: ["Heavy Bombs", "Tough Skin"],
    description: "Strong and silent fighter with powerful explosives and high durability.",
    rarity: "common",
  },
  {
    id: "woman",
    emoji: "😇",
    name: "Angelic Guardian",
    cost: 75,
    category: "basic",
    unlocked: false,
    stats: { speed: 8, bombPower: 4, health: 5, luck: 8 },
    abilities: ["Lucky Strikes", "Divine Protection"],
    description: "Quick and blessed, often finds bonus coins and avoids damage with divine luck.",
    rarity: "rare",
  },
  {
    id: "elder",
    emoji: "😘",
    name: "Charming Elder",
    cost: 100,
    category: "basic",
    unlocked: false,
    stats: { speed: 3, bombPower: 6, health: 8, luck: 9 },
    abilities: ["Charm Boost", "Experience Multiplier"],
    description: "Slow but charming, gains extra points and has high survivability through experience.",
    rarity: "rare",
  },
  {
    id: "graduate",
    emoji: "☺️",
    name: "Happy Graduate",
    cost: 300,
    category: "professional",
    unlocked: false,
    stats: { speed: 6, bombPower: 8, health: 6, luck: 7 },
    abilities: ["Smart Bombs", "Academic Advantage"],
    description: "Intelligent and happy fighter with advanced bomb technology and tactical skills.",
    rarity: "epic",
  },
  {
    id: "judge",
    emoji: "🤩",
    name: "Star-Struck Judge",
    cost: 400,
    category: "professional",
    unlocked: false,
    stats: { speed: 5, bombPower: 7, health: 8, luck: 6 },
    abilities: ["Justice Strike", "Stellar Power"],
    description: "Brings justice with star power and balanced abilities to the battlefield.",
    rarity: "epic",
  },
  {
    id: "astronaut",
    emoji: "😊",
    name: "Smiling Explorer",
    cost: 600,
    category: "special",
    unlocked: false,
    stats: { speed: 7, bombPower: 9, health: 7, luck: 8 },
    abilities: ["Zero Gravity", "Rocket Boost", "Space Bombs"],
    description: "Happy space explorer with advanced technology and superior combat abilities.",
    rarity: "epic",
  },
  {
    id: "superhero",
    emoji: "🙃",
    name: "Upside-Down Hero",
    cost: 800,
    category: "special",
    unlocked: false,
    stats: { speed: 8, bombPower: 8, health: 9, luck: 7 },
    abilities: ["Reverse Logic", "Flip Power", "Hero Shield"],
    description: "Unique hero who sees the world differently and has incredible reverse powers.",
    rarity: "legendary",
  },
  {
    id: "ninja",
    emoji: "🤭",
    name: "Giggling Ninja",
    cost: 1500,
    category: "legendary",
    unlocked: false,
    stats: { speed: 10, bombPower: 9, health: 8, luck: 9 },
    abilities: ["Silent Giggle", "Stealth Mode", "Ninja Stars", "Perfect Dodge"],
    description: "Master of stealth who can't help but giggle, with unmatched speed and deadly precision.",
    rarity: "legendary",
  },
  {
    id: "master",
    emoji: "🫡",
    name: "Saluting Master",
    cost: 2000,
    category: "legendary",
    unlocked: false,
    stats: { speed: 9, bombPower: 10, health: 10, luck: 8 },
    abilities: ["Military Precision", "Command Aura", "Tactical Bombs", "Leadership"],
    description: "Elite military master with perfect discipline and devastating tactical abilities.",
    rarity: "legendary",
  },
  {
    id: "foodie",
    emoji: "😋",
    name: "Tasty Fighter",
    cost: 1200,
    category: "special",
    unlocked: false,
    stats: { speed: 6, bombPower: 7, health: 9, luck: 9 },
    abilities: ["Food Power", "Taste Explosion", "Hunger Strike"],
    description: "Food-loving fighter who gains power from delicious victories and explosive flavors.",
    rarity: "epic",
  },
  {
    id: "emotional",
    emoji: "🥲",
    name: "Emotional Warrior",
    cost: 900,
    category: "special",
    unlocked: false,
    stats: { speed: 7, bombPower: 6, health: 8, luck: 10 },
    abilities: ["Emotional Burst", "Tear Power", "Empathy Shield"],
    description: "Fights with deep emotions, turning feelings into incredible power and protection.",
    rarity: "epic",
  },
  // New image-based characters (premium)
  {
    id: "charcter",
    image: "/charcter.png",
    name: "Premium Avian",
    cost: 3000,
    category: "legendary",
    unlocked: false,
    stats: { speed: 8, bombPower: 10, health: 10, luck: 6, energy: 150 },
    abilities: ["Aerial Dash", "Energy Burst"],
    description: "A fully featured premium character with high energy and powerful attacks.",
    rarity: "legendary",
  },
  {
    id: "charcter2",
    image: "/charcter2.png",
    name: "Royal Runner",
    cost: 4500,
    category: "legendary",
    unlocked: false,
    stats: { speed: 10, bombPower: 9, health: 12, luck: 5, energy: 180 },
    abilities: ["Sprint", "Mega Blast"],
    description: "An elite runner with extreme speed and massive energy reserves.",
    rarity: "legendary",
  },
]

const defaultAchievements: Achievement[] = [
  {
    id: "first_game",
    title: "First Steps",
    description: "Play your first game of Emoji Blast",
    icon: "🎮",
    category: "gameplay",
    requirement: { type: "games_played", value: 1 },
    reward: { coins: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "score_100",
    title: "Century Club",
    description: "Score 100 points in a single game",
    icon: "💯",
    category: "gameplay",
    requirement: { type: "score", value: 100 },
    reward: { coins: 25 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "score_500",
    title: "High Scorer",
    description: "Score 500 points in a single game",
    icon: "🏆",
    category: "gameplay",
    requirement: { type: "score", value: 500 },
    reward: { coins: 50 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "score_1000",
    title: "Master Blaster",
    description: "Score 1000 points in a single game",
    icon: "🌟",
    category: "gameplay",
    requirement: { type: "score", value: 1000 },
    reward: { coins: 100 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "games_10",
    title: "Dedicated Player",
    description: "Play 10 games",
    icon: "🎯",
    category: "progression",
    requirement: { type: "games_played", value: 10 },
    reward: { coins: 30 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "games_50",
    title: "Veteran",
    description: "Play 50 games",
    icon: "🛡️",
    category: "progression",
    requirement: { type: "games_played", value: 50 },
    reward: { coins: 75 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "characters_5",
    title: "Collector",
    description: "Unlock 5 different characters",
    icon: "👥",
    category: "collection",
    requirement: { type: "characters_unlocked", value: 5 },
    reward: { coins: 40 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "characters_all",
    title: "Master Collector",
    description: "Unlock all characters",
    icon: "👑",
    category: "collection",
    requirement: { type: "characters_unlocked", value: 13 },
    reward: { coins: 200 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "coins_1000",
    title: "Rich Player",
    description: "Earn 1000 total coins",
    icon: "💰",
    category: "progression",
    requirement: { type: "coins_earned", value: 1000 },
    reward: { coins: 100 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "streak_5",
    title: "On Fire",
    description: "Win 5 games in a row",
    icon: "🔥",
    category: "gameplay",
    requirement: { type: "streak", value: 5 },
    reward: { coins: 60 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "streak_10",
    title: "Legendary Streak",
    description: "Win 10 games in a row",
    icon: "🏅",
    category: "gameplay",
    requirement: { type: "streak", value: 10 },
    reward: { coins: 120 },
    unlocked: false,
    progress: 0,
  },
  {
    id: "level_10",
    title: "Survivor",
    description: "Reach level 10 in a single game",
    icon: "⚡",
    category: "gameplay",
    requirement: { type: "level_reached", value: 10 },
    reward: { coins: 80 },
    unlocked: false,
    progress: 0,
  },
]

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      user: {
        id: crypto.randomUUID(),
        coins: 100,
        selectedCharacter: "default",
        unlockedCharacters: ["default", "kid", "person"],
        totalPlayTime: 0,
        achievementsUnlocked: [],
        preferences: {
          soundEnabled: true,
          hapticEnabled: true,
          theme: "light",
        },
      },

      gameStats: {
        "emoji-blast": {
          highScore: 0,
          bestTime: 0,
          totalGames: 0,
          totalCoins: 0,
          currentStreak: 0,
          levelProgress: 1,
        },
      },

      characters: defaultCharacters,
      currentScreen: "dashboard",
      isGamePaused: false,
      achievements: defaultAchievements,
      dailyChallenges: [],
      playerStats: {
        totalPlayTime: 0,
        totalScore: 0,
        totalEnemiesKilled: 0,
        totalBombsThrown: 0,
        totalCoinsEarned: 0,
        averageScore: 0,
        bestSurvivalTime: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
        favoriteCharacter: "default",
        longestStreak: 0,
      },

      updateCoins: (amount) =>
        set((state) => ({
          user: { ...state.user, coins: Math.max(0, state.user.coins + amount) },
        })),

      selectCharacter: (characterId) =>
        set((state) => {
          // Only allow selection if character is unlocked
          if (!state.user.unlockedCharacters.includes(characterId)) {
            return state;
          }
          return {
            user: { ...state.user, selectedCharacter: characterId },
          };
        }),

      unlockCharacter: (characterId) =>
        set((state) => {
          const character = state.characters.find((c) => c.id === characterId)
          if (!character || state.user.coins < character.cost) return state

          return {
            user: {
              ...state.user,
              coins: state.user.coins - character.cost,
              unlockedCharacters: [...state.user.unlockedCharacters, characterId],
            },
            characters: state.characters.map((c) => (c.id === characterId ? { ...c, unlocked: true } : c)),
          }
        }),

      updateGameStats: (gameId, stats) => {
        set((state) => {
          const newGameStats = {
            ...state.gameStats,
            [gameId]: { ...state.gameStats[gameId], ...stats },
          }

          const currentGame = newGameStats[gameId]
          const newPlayerStats = { ...state.playerStats }

          if (stats.highScore !== undefined) {
            newPlayerStats.totalScore = Math.max(newPlayerStats.totalScore, stats.highScore)
            newPlayerStats.averageScore =
              currentGame.totalGames > 0 ? Math.round(currentGame.totalCoins / currentGame.totalGames) : 0
          }

          if (stats.totalGames !== undefined) {
            newPlayerStats.gamesWon =
              currentGame.currentStreak > 0 ? newPlayerStats.gamesWon + 1 : newPlayerStats.gamesWon
            newPlayerStats.gamesLost =
              currentGame.currentStreak === 0 ? newPlayerStats.gamesLost + 1 : newPlayerStats.gamesLost
            newPlayerStats.winRate =
              newPlayerStats.gamesWon + newPlayerStats.gamesLost > 0
                ? Math.round((newPlayerStats.gamesWon / (newPlayerStats.gamesWon + newPlayerStats.gamesLost)) * 100)
                : 0
          }

          if (stats.currentStreak !== undefined) {
            newPlayerStats.longestStreak = Math.max(newPlayerStats.longestStreak, stats.currentStreak)
          }

          if (stats.totalCoins !== undefined) {
            newPlayerStats.totalCoinsEarned = stats.totalCoins
          }

          const updatedAchievements = state.achievements.map((achievement) => {
            if (achievement.unlocked) return achievement

            let progress = 0
            let shouldUnlock = false

            switch (achievement.requirement.type) {
              case "score":
                progress = Math.min(currentGame.highScore, achievement.requirement.value)
                shouldUnlock = currentGame.highScore >= achievement.requirement.value
                break
              case "games_played":
                progress = Math.min(currentGame.totalGames, achievement.requirement.value)
                shouldUnlock = currentGame.totalGames >= achievement.requirement.value
                break
              case "characters_unlocked":
                progress = Math.min(state.user.unlockedCharacters.length, achievement.requirement.value)
                shouldUnlock = state.user.unlockedCharacters.length >= achievement.requirement.value
                break
              case "coins_earned":
                progress = Math.min(newPlayerStats.totalCoinsEarned, achievement.requirement.value)
                shouldUnlock = newPlayerStats.totalCoinsEarned >= achievement.requirement.value
                break
              case "streak":
                progress = Math.min(newPlayerStats.longestStreak, achievement.requirement.value)
                shouldUnlock = newPlayerStats.longestStreak >= achievement.requirement.value
                break
              case "level_reached":
                progress = Math.min(currentGame.levelProgress, achievement.requirement.value)
                shouldUnlock = currentGame.levelProgress >= achievement.requirement.value
                break
            }

            return {
              ...achievement,
              progress,
              unlocked: shouldUnlock,
              dateUnlocked: shouldUnlock ? new Date().toISOString() : achievement.dateUnlocked,
            }
          })

          return {
            gameStats: newGameStats,
            playerStats: newPlayerStats,
            achievements: updatedAchievements,
          }
        })
      },

      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      toggleGamePause: () => set((state) => ({ isGamePaused: !state.isGamePaused })),

      updatePreferences: (preferences) =>
        set((state) => ({
          user: {
            ...state.user,
            preferences: { ...state.user.preferences, ...preferences },
          },
        })),

      unlockAchievement: (achievementId) =>
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true, dateUnlocked: new Date().toISOString() }
              : achievement,
          ),
        })),

      updatePlayerStats: (stats) =>
        set((state) => ({
          playerStats: { ...state.playerStats, ...stats },
        })),

      completeDailyChallenge: (challengeId) =>
        set((state) => {
          const challenge = state.dailyChallenges.find((c) => c.id === challengeId)
          if (!challenge) return state

          return {
            dailyChallenges: state.dailyChallenges.map((c) => (c.id === challengeId ? { ...c, completed: true } : c)),
            user: {
              ...state.user,
              coins: state.user.coins + challenge.reward.coins,
            },
          }
        }),

      generateDailyChallenges: () =>
        set((state) => {
          const today = new Date().toDateString()
          const existingToday = state.dailyChallenges.find((c) => new Date(c.expiresAt).toDateString() === today)

          if (existingToday) return state

          const challenges: DailyChallenge[] = [
            {
              id: `daily_score_${Date.now()}`,
              title: "Daily High Score",
              description: "Score 200 points in a single game",
              icon: "🎯",
              requirement: { type: "score", value: 200 },
              reward: { coins: 25, experience: 50 },
              progress: 0,
              completed: false,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: `daily_games_${Date.now()}`,
              title: "Daily Dedication",
              description: "Play 3 games today",
              icon: "🎮",
              requirement: { type: "games_played", value: 3 },
              reward: { coins: 15, experience: 30 },
              progress: 0,
              completed: false,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          ]

          return {
            dailyChallenges: [...state.dailyChallenges.filter((c) => !c.completed), ...challenges],
          }
        }),
    }),
    {
      name: "emoji-games-storage",
      version: 2,
    },
  ),
)
