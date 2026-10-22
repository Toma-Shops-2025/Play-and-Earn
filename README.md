# Play & Earn Arcade

A mobile-first **play-to-earn style demo** inspired by reward gaming apps. It includes a payouts dashboard, four mini-games, daily rewards, and profile customization. Balances are stored in the browser only — **this is not real money** and does not connect to PayPal or payment processors.

## Features

- Payouts tab matching the reference layout: coin timer, cash balance, wallet card, cashout, and game grid
- Mini-games: Lucky Spin, Lucky Slot, Scratch Card, Flip Card
- Rewards tab with a 7-day check-in streak
- Games and Custom tabs for full game list and avatar/theme picks
- Local persistence via `localStorage`

## Run locally

```bash
npm install
npm run dev -- --port 43123
```

Open [http://localhost:43123](http://localhost:43123). Use a narrow viewport or your phone’s browser for the intended layout.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
