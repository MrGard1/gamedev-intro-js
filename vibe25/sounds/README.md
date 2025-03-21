# Game Sound Effects

This directory contains the sound effects for the game. The following sound files are required:

1. `flip.mp3` - A short "flip" sound when turning over a tile
2. `match.mp3` - A satisfying "match" sound when tiles match
3. `seed.mp3` - A light, growing sound for seed matches
4. `carrot.mp3` - A crunchy sound for carrot matches
5. `bread.mp3` - A soft, bread-like sound for bread matches
6. `apple.mp3` - A crisp, apple-like sound for apple matches
7. `gold.mp3` - A rich, coin-like sound for gold matches
8. `troop.mp3` - A recruitment sound when purchasing troops

## Sound Requirements
- All sounds should be short (0.5-2 seconds)
- MP3 format
- Clear and distinct sounds
- Not too loud or jarring
- Mobile-friendly (small file size)

## Adding New Sounds
To add new sounds:
1. Add the sound file to this directory
2. Update the sounds object in game.js
3. Add the sound trigger in the appropriate game action 