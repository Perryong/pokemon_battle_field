# Pokémon Battle Field

[Play Pokémon Battle Field on GitHub Pages](https://perryong.github.io/pokemon_battle_field/)

Build a party of one to six of the 151 original species and battle an equally sized rival party in a three-dimensional Kanto stadium. The app uses Generation I Red, Blue and Yellow learnsets and the Pokémon Showdown RBY battle simulator.

After running `npm ci` and `npm run build`, open `dist/pokemon-battle-field.html` in a browser with WebGL 2. This edition includes its models, move effects and battle engine and works offline.

**Build a team.** Open **Build team in Pokédex**. Search by name, National number or type. Expand **Battle moves** and equip one to four legal moves. Use **Add to party** to add a member, or select an existing slot and use **Save to slot** to edit that member. Select **Make lead** to send it out first. You can use duplicate species with independent moves. **Start team battle** saves the lineup and generates a rival with the same number of Pokémon. Closing the Pokédex without starting leaves the current battle alone. The browser remembers both parties on this device.

**Battle.** Both parties fight at level 100 with maximum DVs, stat experience and PP Ups. Select a move to attack or a healthy reserve under **Switch Pokémon** to spend your turn switching. If your active Pokémon faints, select a replacement; the rival gets no extra attack. HP, spent PP and persistent status stay with each Pokémon, and the simulator handles move locks and the effects that clear on switching. The match ends when a party has no Pokémon left. **Start rematch** plays the same two lineups again at full health.

**Battle a friend.** Open **Battle a friend**, review your saved team or choose **Edit team**, then **Create invite** and copy the link. Your friend opens the link, chooses their own team and selects **Join with my team**. Both trainers lock in a move or switch each turn. If one trainer needs a replacement, the other waits. Each player sees their own Pokémon on the near side.

The host runs the Gen I simulator. Keep both tabs open for the match. Leaving or refreshing ends the connection, and a new invite starts a new battle. Friend battles use PeerJS Cloud for signaling and WebRTC for the game connection. Network restrictions or signaling service outages can prevent joining. Solo play and Exhibition work offline.

**Inspect a move.** Pick a technique from a species' learnset and press **Preview move**. The Pokédex shows base PP; battle buttons show the current and maximum PP with PP Ups. Each orbitable model shares the arena's metre scale with the 1.7 m comparison trainer.

**Watch.** Exhibition uses a separate seeded match with the same two teams. The 45-second timeline plays at 1.5× by default and displays up to five turns or a party defeat; you can pause, scrub, or choose 1× or 2× speed. Open `?mode=exhibition`, `?t=12` or a Pokédex entry such as `?dex=106`.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run build` produces a static site and a self-contained HTML file. Browser checks under `qa/` run against a local production server with `BASE_URL` and a Chromium executable set via `CHROME_PATH`. The UI tests exercise learnset selection, preview playback, equipping and fighting in desktop and offline phone-sized views. Sources and licenses are listed in CREDITS.md and refs/SOURCES.md.

Pushes to `main` run the tests, build the game, and deploy it to GitHub Pages through the Pages workflow.
