# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/nguyenhuong74/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/nguyenhuong74/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Comet Courier — Starlight Routes** is a gravity-slingshot delivery game in the browser: drag from your comet to aim, release to launch, and let the planets bend your flight as you gather star shards and reach the warp gate. Twenty hand-built routes across four regions — Ember Belt, Frost Drift, Storm Reef and Void Crown — each region adding a mechanic: wormholes that fold space, solar wind that pushes your comet, drifting mines, black holes, orbiting worlds and flare gates that only open on a timer. Three hearts per run, 90 shards to find, 60 stars to earn, progress saved between visits.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files, and the game runs from any static HTTP server. Sounds and the music loop are synthesised in the browser with WebAudio.

## Play

| Key / Mouse | Action |
| --- | --- |
| Drag from the comet | Aim (the dotted line previews your flight) |
| Release | Launch |
| Click a route on the star map | Play that route |
| R | Restart the route |
| P | Pause |
| M | Mute |
| Esc | Back to the star map |
| N / Enter | Next route after a clear |

---

<sub>Entered on [make.fun](https://make.fun/?ref=6nfavmbn&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
