# Pokémon Battle Field

[Play Pokémon Battle Field on GitHub Pages](https://perryong.github.io/pokemon_battle_field/)

Build a party of one to six of the 151 original species and battle an equally sized rival party in a three-dimensional Kanto stadium. The app uses Generation I Red, Blue and Yellow learnsets and the Pokémon Showdown RBY battle simulator.

After running `npm ci` and `npm run build`, open `dist/pokemon-battle-field.html` in a browser with WebGL 2. This edition includes its models, move effects and battle engine and works offline.

**Build a team.** Open **Build team in Pokédex**. Search by name, National number or type. Expand **Battle moves** and equip one to four legal moves. Use **Add to party** to add a member, or select an existing slot and use **Save to slot** to edit that member. Select **Make lead** to send it out first. You can use duplicate species with independent moves. **Start team battle** saves the lineup and generates a rival with the same number of Pokémon. Closing the Pokédex without starting leaves the current battle alone. The browser remembers both parties on this device.

**Save and share teams.** In the Pokédex, open **Saved teams & Showdown import/export**. Give your party a name and choose **Save new team**. Load a saved team to update it, or enter another name to keep a copy. The library stays in this browser. To bring a Smogon team, select **RBY OU**, paste one team’s Showdown text, and choose **Import to party**. Review the lead and moves, then start a solo battle or choose **Save team** from the friend lobby’s editor. **Export party** and **Copy text** give you a portable copy for Showdown or another device. [Smogon RBY OU sample teams](https://www.smogon.com/forums/threads/rby-ou-sample-teams.3689726/)

**Suggested sets and formats.** In the Pokédex, pick a **Suggested set** to read its role and see its moves. **Equip set** updates the selected species’ moves in the builder. Add it to your party or save it to a slot, then start your battle. Sets show the format they were written for. Choose **RBY OU** under **Format** to check your team and battle with Showdown’s OU rules. **Kanto casual** remains the default. In a friend room, the host picks the format and the invite carries it to the guest.

**Battle.** Use **Speed** in the trainer console to play animations at 1×, 1.5× (default), or 2×. You can change speed during an attack. In a friend battle, each trainer controls their own playback. Builder sets default to level 100 with maximum stats and PP Ups. Imported teams can supply their own levels, IVs and EVs. Select a move to attack or a healthy reserve under **Switch Pokémon** to spend your turn switching. If your active Pokémon faints, select a replacement; the rival gets no extra attack. HP, spent PP and persistent status stay with each Pokémon, and the simulator handles move locks and the effects that clear on switching. The match ends when a party has no Pokémon left. **Start rematch** plays the same two lineups again at full health.

**Battle a friend.** Open **Battle a friend**, review your saved team or choose **Edit team**, then **Create invite** and copy the link. Your friend opens the link, chooses their own team and selects **Join with my team**. Both trainers lock in a move or switch each turn. If one trainer needs a replacement, the other waits. Each player sees their own Pokémon on the near side.

The host runs the Gen I simulator. Keep both tabs open for the match. Leaving or refreshing ends the connection, and a new invite starts a new battle. Friend battles use PeerJS Cloud for signaling and WebRTC for the game connection. Network restrictions or signaling service outages can prevent joining. Solo play and Exhibition work offline.

**Tag battles.** Open **Tag battle** and choose one to three Pokémon from your current party or a named saved team. The first checked party slot leads. For **Solo with a computer teammate**, select **Start solo battle**. Your partner and both opponents bring computer-controlled parties the same size as yours. Solo tag runs locally and also works in the offline HTML edition. For **Co-op**, share the teammate link with one friend. Two computer trainers bring matching party sizes. For **2v2**, send the teammate link to your partner and the opponent link to your two rivals. Each trainer controls one active Pokémon, can switch to their own reserves, and chooses a target for single-target moves. A side wins when both opposing trainers run out of Pokémon. Keep every battle tab open until the match ends.

Kanto tag is a custom format. It uses Showdown’s Generation III multi-battle mechanics, RBY-legal species and movesets, imported levels and stats, and no held items or abilities. Spread attacks follow Generation III targeting, so Earthquake can hit your partner. Singles and RBY OU continue to use the Gen I simulator.

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
