import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center space-y-8 px-4">
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
              PLAY GAME
            </Button>
          </a>
        </div>
        
        <div className="mt-12 text-gray-400 space-y-2">
          <h3 className="text-xl font-semibold text-gray-300">Features:</h3>
          <ul className="text-lg space-y-1">
            <li>✅ 3 Difficulty Levels (Easy, Medium, Hard)</li>
            <li>✅ Boss Fights Every 10 Levels</li>
            <li>✅ 7 Unique Powerups</li>
            <li>✅ Game Modifiers (Advantages & Disadvantages)</li>
            <li>✅ Progressive Difficulty</li>
          </ul>
        </div>
        
        <div className="mt-12 text-gray-500 text-sm">
          <p>← → or A D to Move | SPACE to Throw | P to Pause</p>
        </div>
      </div>
    </div>
  );
}
