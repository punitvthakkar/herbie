# Herbie Runner

An endless **reaction-runner** about one tiny constraint (Herbie) and one big truth:

**“You can’t win by going fast. You win by clearing the path so everyone can move together.”**

## Story

In an impossible landscape of floating steps and soft horizons, a caravan tries to cross the world before it folds back into itself.

The problem isn’t the distance.
It’s **Herbie**.

Herbie is the slowest hiker. When Herbie slows, everyone slows. When Herbie stops… the whole system stops. The terrain doesn’t care. Obstacles keep arriving. The only way forward is to make fast choices under pressure and keep the caravan flowing.

## Main Aim

- **Survive as long as you can** by keeping Herbie’s lane clear.
- **Clear as many obstacles as possible** (track your run with the **Cleared** counter).
- **Keep the caravan tight** to build **Flow** and turn chaos into harmony.

## How to Play (New Gameplay)

This version is intentionally click-heavy: obstacles are frequent and you’ll often see **multiple threats on screen at once**.

1. **Open the game** in a modern browser (see “Run locally” below).
2. **Tap/click obstacles** before Herbie reaches them.
3. **Prioritize**: if you hesitate, Herbie hits something and the run ends.

### Obstacles you can clear

- **Walls**: tap to crumble them.
- **Gaps**: tap to “bridge” them.
- **Platforms**: tap to lower them.
- **Barriers**: tall, striped blocks that are easy to spot but easy to miss.

## Controls

- **Tap/Click**: clear obstacles
- **⏸ Pause**: pause the run (top-right)
- **◐ High contrast**: toggle readability (top-right)
- **Palette dots**: switch palettes (title screen)

## What ends a run

- **Herbie hits** a wall/platform/barrier
- **Herbie falls** (gap not handled in time)
- **The caravan stretches** too far apart

## Scoring + HUD

- **Distance**: how far the caravan makes it.
- **Flow**: how “together” the system is (higher = smoother run).
- **Cleared**: how many obstacles you removed this run (your reaction-performance metric).

## Run locally

Because the game uses ES modules, run it from a local web server.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

If port 8000 is taken:

```bash
python3 -m http.server 8001
# open http://localhost:8001
```

## Tech + vibe

- **HTML5 Canvas** visuals (procedural, no external assets)
- **Vanilla JavaScript (ES modules)** game loop + systems
- **CSS overlays** for UI screens/HUD
- **Web Audio API** ambient tones

Monument Valley-inspired direction:
- soft gradients, impossible geometry, clean silhouettes
- gentle audio… until your clicks start sounding like survival

## The tiny lesson hiding inside

This is a playable Theory of Constraints metaphor:
you don’t optimize the fastest hiker—you protect the slowest one.
When you clear Herbie’s path, **everyone** wins.

---

*Clear the path. Move together.* 
