"use client"

import { useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import type { Character } from "@/lib/game-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ShoppingCart, Star, Crown, Briefcase, Rocket, Eye, Zap, Heart, Clover } from "lucide-react"

export function CharacterShop() {
  const { characters, user, setCurrentScreen, unlockCharacter, selectCharacter } = useGameStore()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewCharacter, setPreviewCharacter] = useState<string | null>(null)

  const categoryIcons = {
    starter: Star,
    basic: Star,
    professional: Briefcase,
    special: Rocket,
    legendary: Crown,
  }

  const categoryColors = {
    starter: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200",
    basic: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200",
    professional: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200",
    special: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200",
    legendary: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200",
  }

  const rarityColors = {
    common: "border-gray-300",
    rare: "border-blue-400 shadow-blue-100",
    epic: "border-purple-400 shadow-purple-100",
    legendary: "border-yellow-400 shadow-yellow-100",
  }

  const filteredCharacters = characters.filter(
    (character) => selectedCategory === "all" || character.category === selectedCategory,
  )

  const categories = [
    { id: "all", name: "All Characters", count: characters.length },
    { id: "starter", name: "Starter", count: characters.filter((c) => c.category === "starter").length },
    { id: "basic", name: "Basic", count: characters.filter((c) => c.category === "basic").length },
    { id: "professional", name: "Professional", count: characters.filter((c) => c.category === "professional").length },
    { id: "special", name: "Special", count: characters.filter((c) => c.category === "special").length },
    { id: "legendary", name: "Legendary", count: characters.filter((c) => c.category === "legendary").length },
  ]

  const StatIcon = ({ stat }: { stat: string }) => {
    switch (stat) {
      case "speed":
        return <Zap className="h-3 w-3" />
      case "bombPower":
        return <Rocket className="h-3 w-3" />
      case "health":
        return <Heart className="h-3 w-3" />
      case "luck":
        return <Clover className="h-3 w-3" />
      default:
        return <Star className="h-3 w-3" />
    }
  }

  const CharacterPreview = ({ character }: { character: Character }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          <Eye className="h-3 w-3 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {character.image ? (
              <img
                src={character.image}
                alt={character.name}
                className="w-14 h-14 object-contain rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                style={{ background: 'white' }}
              />
            ) : (
              <span className="text-4xl">{character.emoji}</span>
            )}
            <div>
              <div>{character.name}</div>
              <Badge variant="outline" className={`text-xs ${categoryColors[character.category]}`}>
                {character.category}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>{character.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div>
            <h4 className="font-semibold mb-3">Character Stats</h4>
            <div className="space-y-2">
              {Object.entries(character.stats).map(([stat, value]) => (
                <div key={stat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <StatIcon stat={stat} />
                    <span className="capitalize">{stat}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-24">
                    <Progress value={(Number(value) as number) * 10} className="h-2" />
                    <span className="text-xs font-medium w-6">{Number(value)}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Abilities */}
          <div>
            <h4 className="font-semibold mb-3">Special Abilities</h4>
            <div className="flex flex-wrap gap-2">
              {character.abilities.map((ability: string) => (
                <Badge key={ability} variant="secondary" className="text-xs">
                  {ability}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rarity */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rarity:</span>
            <Badge variant="outline" className={`capitalize ${rarityColors[character.rarity]}`}>
              {character.rarity}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentScreen("dashboard")} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Character Shop</h2>
          <p className="text-muted-foreground">Unlock new characters with unique abilities</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-primary">{user.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {category.count}
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => {
              const isOwned = user.unlockedCharacters.includes(character.id)
              const isSelected = user.selectedCharacter === character.id
              // Defensive numeric comparison in case persisted values are strings
              const canAfford = Number(user.coins) >= Number(character.cost)
              const CategoryIcon = categoryIcons[character.category]

              return (
                <Card
                  key={character.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary shadow-lg" : ""
                  } ${rarityColors[character.rarity]}`}
                >
                  {/* Rarity Glow Effect */}
                  {character.rarity === "legendary" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse pointer-events-none" />
                  )}
                  {character.rarity === "epic" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-transparent to-purple-400/20 animate-pulse pointer-events-none" />
                  )}

                  <CardHeader className="pb-3 relative">
                    <div className="text-center">
                      <div className="mb-3 flex items-center justify-center">
                        {character.image ? (
                          <img
                            src={character.image}
                            alt={character.name}
                            className="w-16 h-16 object-contain rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                            style={{ background: 'white' }}
                          />
                        ) : (
                          <span className="text-5xl transform hover:scale-110 transition-transform duration-200">{character.emoji}</span>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold">{character.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{character.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className={`text-xs ${categoryColors[character.category]}`}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {character.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs capitalize ${rarityColors[character.rarity]}`}>
                        {character.rarity}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Quick Stats Preview */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>Speed: {character.stats.speed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Rocket className="h-3 w-3 text-orange-500" />
                        <span>Power: {character.stats.bombPower}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>Health: {character.stats.health}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clover className="h-3 w-3 text-green-500" />
                        <span>Luck: {character.stats.luck}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isOwned ? (
                      <div className="space-y-2">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() => selectCharacter(character.id)}
                        >
                          {isSelected ? "✓ Selected" : "Select Character"}
                        </Button>
                        <CharacterPreview character={character} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded">
                          <span className="text-lg">🪙</span>
                          <span className="font-bold text-primary">{character.cost.toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={!canAfford}
                          onClick={() => unlockCharacter(character.id)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {canAfford ? "Purchase" : "Insufficient Coins"}
                        </Button>
                        <CharacterPreview character={character} />
                      </div>
                    )}
                  </CardContent>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}

                  {/* New Badge for recently added characters */}
                  {character.category === "legendary" && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">NEW</Badge>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Shop Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{user.unlockedCharacters.length}</div>
              <div className="text-sm text-muted-foreground">Characters Owned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{characters.length}</div>
              <div className="text-sm text-muted-foreground">Total Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.round((user.unlockedCharacters.length / characters.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Collection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">
                {characters.filter((c) => c.category === "legendary" && user.unlockedCharacters.includes(c.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Legendary Owned</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Collection Progress</span>
              <span className="text-sm text-muted-foreground">
                {user.unlockedCharacters.length}/{characters.length}
              </span>
            </div>
            <Progress value={(user.unlockedCharacters.length / characters.length) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
