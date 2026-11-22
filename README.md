# Midnight Archive

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/guytas39-sudo/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/guytas39-sudo/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game: you are **Wren, the night archivist**. After dark, the
Grand Archive is patrolled by four wardens with lanterns — their cones of light
are the law. Find the **3 lost pages**, then slip out through the green exit
door, **unseen**.

## How to play

- **Move:** WASD or arrow keys — or click a floor tile to walk there.
- **Hide:** walls, bookcases and crates block a guard's sight. Break line of
  sight and the detection meter drains again.
- **Watch the meter:** while any guard sees you it fills; at 100% you are
  caught and lose a life (3 lives). Guards chase once the meter passes a
  third, then search the last place they saw you.
- **Listen:** a guard's footsteps grow louder as he comes near, so you can
  hear a patrol before you see its cone.
- **Win:** collect all 3 pages — the sealed exit opens — and reach it.
- **Keys:** `R` restart, `P` pause, `M` mute, `Enter` start.

## The game

- One hand-built level seen from above: three halls joined by doorways, six
  bookcases and two crates for cover, three glowing lost pages, one sealed exit.
- Four guards (Bram, Odo, Mira, Fen) with patrol routes you can learn, vision
  cones that react as you expect, suspicion (`?`) and chase (`!`) states, and
  a search of the last seen spot when they lose you.
- A timer, a best-escape time kept in your browser, and a "spotted" count.
- All art is drawn on canvas and all sounds are synthesized with WebAudio —
  no assets, no network, no libraries.

## Screenshots

The three screenshots are real renders of the game's own code (`?shot=` scenes):
the title screen with patrols running behind it, mid-game with a guard's cone
closing in, and the end of a run.

## Running it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. The entry program is `main.ts` (Node 22): it copies `game/` and
`screenshots/` to the output directory and writes `dossier.json`.

---

Built for [make.fun](https://make.fun/?ref=g2zdh0s8).
