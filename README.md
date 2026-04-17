# Nostalgia

Nostalgia is a simple AI-powered web editor for cinematic photo and video grading.

Upload once, get the result, download or share.

## Product Focus
- **One-step flow:** upload -> process -> result.
- **Minimal interface:** Inspired by remove.bg simplicity.
- **Nostalgia visual identity:** Clean light theme with warm brown accents (`#8a5a3b`).
- **Free mode enabled by default:** No paywalls or limits.

## Tech Stack
- **Frontend:** Expo (web) using React Native components.
- **Backend:** Node.js + Express.
- **Processing:** Unified FFmpeg pipeline (applies to both photos and videos).
- **Core Mechanism:** Local 3D LUT (`.cube`) generation via algorithmic RGB manipulation.

## Current Photo Analysis 

What you have: A **raw, candid lifestyle shot** — hand, rings, Apple Watch, bag in car. Natural overexposed daylight. Great bones. 

What it needs: **Dark Cinematic Editorial** treatment — same energy as the storm shot. 

--- 

## Editing Settings (Lightroom / Lightroom Mobile) 

**Light** 
| Setting | Value | 
|---|---| 
| Exposure | -0.8 to -1.2 | 
| Contrast | +25 | 
| Highlights | -70 | 
| Shadows | +20 | 
| Whites | -40 | 
| Blacks | -30 | 

**Color** 
| Setting | Value | 
|---|---| 
| Temp | Slightly cooler (-10) | 
| Tint | Neutral | 
| Vibrance | -10 | 
| Saturation | -15 | 

**Tone Curve** 
- Lift the blacks (bottom left point up slightly) 
- Pull highlights down 
- Creates that **matte/film look** 

**Detail** 
- Clarity: +20 
- Texture: +15 

**Color Grading** 
- Shadows: Push slightly **teal/blue** 
- Midtones: Neutral 
- Highlights: Slight **warm gold** 

--- 

## The Secret Weapon 

Crop it **tighter on the hand and watch** — eliminate the seat clutter. The rings + Apple Watch is the story. Frame it like jewelry editorial. 

> *The details you wear tell the world who you're becoming before you say a word.*

Here's your edited version. Applied: 

- **-1 stop exposure** — darker, moodier 
- **Crushed highlights** — no blown-out whites 
- **Lifted shadows** — film-style matte blacks 
- **Teal/blue shadow grade** + **warm gold highlights** 
- **Desaturated** — pulls it away from phone-camera look 
- **Cropped tighter** — hand, rings, and Apple Watch are the story now 
- **Matte black floor** — that signature cinematic grade 

> *Same hand, different frequency. Edit the image, edit the perception.*
