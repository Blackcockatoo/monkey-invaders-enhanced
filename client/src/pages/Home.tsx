import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function Home() {
  const [newsItems, setNewsItems] = useState([
    {
      id: 1,
      title: "🐵 Monkey Invaders Enhanced Released!",
      description: "The ultimate banana-throwing adventure is here with 13 unique bosses, strategic progression, and hidden easter eggs.",
      date: "Jan 11, 2026"
    },
    {
      id: 2,
      title: "⚡ New Boss System Introduced",
      description: "Every 10 levels, face a randomly selected boss from our roster of 13 unique alien invaders. Each boss has unique abilities and colors!",
      date: "Jan 10, 2026"
    },
    {
      id: 3,
      title: "🎮 Collectible Items Now Available",
      description: "Defeat aliens to unlock 20 funny and ridiculous collectible items. Find them all and unlock special achievements!",
      date: "Jan 9, 2026"
    },
    {
      id: 4,
      title: "🍌 Banana Limit Implemented",
      description: "Maximum 64 bananas on screen to prevent glitching. Strategic throwing is now key to victory!",
      date: "Jan 8, 2026"
    },
    {
      id: 5,
      title: "🎯 Difficulty Settings Enhanced",
      description: "Choose from Easy, Medium, or Hard difficulty. Add starting advantages or disadvantages for a custom challenge!",
      date: "Jan 7, 2026"
    }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="text-center space-y-8 px-4 pt-16 pb-12">
        <div className="text-8xl animate-bounce">🐵🍌👽</div>
        
        <h1 className="text-6xl font-bold text-yellow-400 drop-shadow-lg">
          MONKEY INVADERS
        </h1>
        
        <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
          Defend Earth with the power of bananas! Defeat waves of aliens, unlock powerful powerups, and face epic bosses every 10 levels.
        </p>
        
        <div className="space-y-4 pt-8">
          <a href="/game.html" target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg"
              className="text-2xl px-12 py-8 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold rounded-full shadow-2xl"
            >
              🎮 PLAY GAME
            </Button>
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">⚡ 13 Unique Bosses</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Face random boss encounters every 10 levels. Zorg, Krell, Vex, Nexus, and 9 more legendary aliens await!
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">🍌 64 Banana Limit</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Strategic banana throwing prevents glitching. Master your aim and timing to maximize damage!
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">🎯 3 Difficulty Levels</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Easy, Medium, or Hard. Add starting advantages or disadvantages for ultimate customization!
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">💥 7 Powerups</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Double Banana, Triple Banana, Rapid Fire, Long Range, Double Monkey, Gun, and Bazooka!
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">📈 Progressive Difficulty</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Each level brings more aliens, faster speeds, and strategic challenges. Never gets boring!
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">🎪 Collectible Items</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Unlock 20 funny and ridiculous items. Golden Banana, Rubber Chicken, Rocket Boots, and more!
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BNN News Feed Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-yellow-400 mb-2">📰 BNN - Banana News Network</h2>
          <p className="text-gray-400">Latest updates from the Monkey Invaders universe</p>
        </div>

        <div className="space-y-4">
          {newsItems.map((item) => (
            <Card key={item.id} className="bg-slate-800 border-yellow-500/30 hover:border-yellow-500/60 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-yellow-400 text-lg">{item.title}</CardTitle>
                  <span className="text-gray-500 text-sm">{item.date}</span>
                </div>
              </CardHeader>
              <CardContent className="text-gray-300">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-slate-800 border border-orange-500/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">🎮 Game Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="font-semibold text-orange-400">← → or A D</p>
              <p>Move Left / Right</p>
            </div>
            <div>
              <p className="font-semibold text-orange-400">SPACE</p>
              <p>Throw Banana</p>
            </div>
            <div>
              <p className="font-semibold text-orange-400">P</p>
              <p>Pause Game</p>
            </div>
            <div>
              <p className="font-semibold text-orange-400">Type "curd"</p>
              <p>Unlock Kong Mode (Easter Egg!)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm border-t border-slate-700">
        <p>Made with 🍌 by Murphy and Clark Curd | Monkey Invaders Enhanced © 2026</p>
      </div>
    </div>
  );
}
