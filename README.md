# GuudScore

Community analytics and reputation scoring platform for the DeFi/crypto ecosystem. GuudScore tracks on-chain behavior across multiple blockchains, assigns reputation scores, and provides gamified community engagement features.

> **[docs.guud.fun](https://docs.guud.fun)** — Full documentation, API references, and guides.

---

## Overview

GuudScore analyzes wallet activity, NFT holdings, protocol interactions, and community engagement across supported networks to generate a comprehensive reputation score. Users can customize profiles, mint GuudCard NFTs, compete on leaderboards, and engage through vouching, bribing, and arena challenges.

## Supported Networks

- **Avalanche** (AVAX)
- **Solana**
- **Base**
- **Arbitrum**
- **Monad**

## Features

### Multi-Chain Analytics
- Real-time community AUM, tracked wallets, and portfolio analytics
- Protocol interaction tracking across networks
- NFT collection analysis with holder statistics
- Score distribution visualizations

### Reputation Scoring
- On-chain behavior-based scoring system
- Per-network and aggregate scores
- Historical score tracking
- Seasonal badges and achievements

### User Dashboard
- Portfolio overview and asset tracking
- Detailed score breakdown
- NFT collection management
- Referral stats and tracking
- Arena Yapping (Twitter/X activity integration)
- GuudFriends social network

### GuudCard NFTs
- Customizable NFT profile cards
- Multiple visual themes — guud, avax, desci, gta, coq, no-chillio
- Mint, share, and export cards

### Vouch System
- Like/dislike other users to validate or challenge their reputation
- Twitter account age verification — accounts younger than 6 months cannot vouch (anti-sybil)
- Vouch history visible on user profiles
- Vouches directly affect reputation score and leaderboard ranking

### Bribe System
- Users can create bribes to incentivize others to vouch for them
- Set a bribe wallet with custom token rewards
- Bribe campaigns visible on profile — attracts engagement and vouches
- Strategic tool for climbing the leaderboard

### Leaderboard
- Global ranking by GuudScore
- Filter by tier, time window, network, and collection
- Separate agent leaderboard for AI agents
- Seasonal competition with badge rewards

### Referral System
- Unique referral links per user
- Track referred users and earned rewards
- Referral stats visible on dashboard

### AI Agent Tracking
- Agent leaderboards and profiles
- Agent-specific analytics and portfolio tracking

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | React 19, TypeScript, Vite 6 |
| **Routing** | TanStack Router (file-based) |
| **Server State** | TanStack Query v5 |
| **Styling** | Tailwind CSS v4, Shadcn UI (New York), OKLCH colors, Glassmorphism |
| **EVM Wallets** | Wagmi v2, Viem v2, RainbowKit |
| **Solana Wallets** | Solana Wallet Adapter |
| **Charts** | Recharts |
| **Animation** | GSAP, Motion |
| **Forms** | React Hook Form, Zod |
| **Auth** | JWT (access + httpOnly refresh tokens) |

## Project Structure

```
src/
├── routes/            # File-based pages (TanStack Router)
├── services/          # API integration layer
├── hooks/             # Custom React hooks (barrel export via index.ts)
├── components/
│   ├── ui/            # Shadcn UI primitives
│   └── theme/         # Visual theme variants
├── contexts/          # React contexts (auth, chain, wallet)
├── types/             # TypeScript type definitions
├── lib/               # Utilities (token store, wagmi config, etc.)
└── main.tsx           # Entry point with providers

All rights reserved.
