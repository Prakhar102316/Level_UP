# LEVEL UP

**LEVEL UP** is a mobile-first progressive web app that turns fitness and daily self-improvement into a real-life RPG.

Instead of only tracking workouts, the app gives the user XP, levels, ranks, streaks, character stats, achievements, and daily quests. The goal is simple: make healthy habits feel rewarding, visible, and fun.

## Live App

```text
https://prakhar102316.github.io/Level_Up/
```

## What The App Does

LEVEL UP helps users stay consistent by turning everyday actions into game progress.

Users can:

- Complete daily fitness and lifestyle quests
- Earn XP for healthy actions
- Level up over time
- Climb through football-inspired ranks
- Track streaks and daily progress
- See a live 24-hour countdown showing time left in the day
- Log meals manually
- Track water intake
- Automatically move to a new day after midnight
- Reset the weekly boss automatically every week
- Improve character stats like Strength, Health, Discipline, Knowledge, and Consistency
- Unlock achievements
- Fight a weekly boss called Laziness
- View recent progress with a 30-day XP chart
- Install the app on a phone from the browser

## Core Idea

Most fitness apps feel like spreadsheets.

LEVEL UP is designed to feel like **career mode for real life**.

Every workout, meal, walk, and healthy choice becomes part of your character's growth. The app is built around motivation, consistency, and identity rather than just numbers.

## Main Features

### Daily Quests

Users complete daily quests such as:

- Gym Check-In
- Complete Workout
- Healthy Meal
- Drink 3L Water
- Walk 8000 Steps
- Sleep 8 Hours

Each quest gives XP and improves a related character stat.

### XP And Levels

Every completed action gives XP. As XP increases, the user levels up and progresses like a game character.

### Rank System

The app uses a football-inspired rank system:

- Sunday League
- District Player
- Academy Player
- Semi-Pro
- Professional
- National Team
- Legend

### Character Stats

The user's real-life actions improve character attributes:

- Health
- Strength
- Discipline
- Knowledge
- Consistency

### Weekly Boss

The app includes a weekly boss named **Laziness**.

Gym activity damages the boss, giving the user a fun visual reason to stay consistent.

The boss resets to 100 HP every new week.

### Meals And Water

Users can manually log meals with calories and protein, and track daily water intake.

### Achievements

Achievements act like an inventory system. Users unlock badges for milestones such as first XP, streaks, meal logging, and gym consistency.

### Installable PWA

LEVEL UP is a Progressive Web App. This means it can be opened in a mobile browser and installed to the home screen like an app.

No app store is required.

## Tech Stack

- HTML
- CSS
- JavaScript
- Progressive Web App Manifest
- Service Worker for offline support
- LocalStorage for saving user progress

## How To Run Locally

Open `index.html` in your browser.

For full PWA behavior such as install support and offline caching, run the project through a local server or deploy it on GitHub Pages.

## How To Deploy On GitHub Pages

1. Create a new GitHub repository.
2. Upload all project files.
3. Go to repository **Settings**.
4. Open **Pages**.
5. Set source to **Deploy from a branch**.
6. Select the `main` branch.
7. Select `/root`.
8. Save.
9. Open the generated GitHub Pages link on your phone.
10. In Chrome, tap **Install app** or **Add to Home screen**.

## Project Structure

```text
level-up-pwa/
|-- index.html
|-- styles.css
|-- app.js
|-- manifest.webmanifest
|-- sw.js
`-- assets/
    |-- icon.svg
    |-- icon-192.png
    `-- icon-512.png
```

## Future Improvements

Planned features for future versions:

- Camera-based meal scanner
- AI calorie estimation
- Workout generator
- Google Fit integration
- Smartwatch sync
- AI coach
- Custom quests
- Monthly seasons
- Leaderboards
- Cloud accounts and backup

## Vision

LEVEL UP is not just a gym tracker.

It is an attempt to make self-improvement feel like a game where the player is you.

The long-term vision is to build an RPG for real life: one app where fitness, discipline, learning, health, and consistency all contribute to your personal character growth.

## Status

This is an MVP version focused on the core gameplay loop:

```text
Complete quests -> earn XP -> improve stats -> unlock achievements -> stay consistent
```

The current version is simple, lightweight, and fully usable in a mobile browser.
