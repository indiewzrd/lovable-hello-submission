# Deployment Guide for Stakedriven

## Environment Variables Required

For the application to work properly, you need to set the following environment variables in Vercel:

### Required:
- `DATABASE_URL` - PostgreSQL connection string (e.g., from Supabase, Neon, or any PostgreSQL provider)
- `NEXT_PUBLIC_PRIVY_APP_ID` - Your Privy application ID for wallet authentication
- `NEXT_PUBLIC_USDC_ADDRESS` - USDC contract address (Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- `NEXT_PUBLIC_POLL_FACTORY_ADDRESS` - Poll Factory contract address (Base Sepolia: `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6`)

### Optional:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID if using WalletConnect

## Database Setup

The application requires a PostgreSQL database. Without a database connection:
- The dashboard will show empty/no polls
- Poll creation will deploy to blockchain but won't save to database
- Poll statistics won't be displayed

### Quick Setup with Supabase:
1. Create a free account at https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add it as `DATABASE_URL` in Vercel environment variables

### Database Schema:
Run the migrations after setting up your database:
```bash
npx drizzle-kit push
```

## Vercel Deployment Steps

1. Import the repository to Vercel
2. Add all required environment variables
3. Deploy

## Troubleshooting

### "Module not found" errors
- Make sure Vercel is using the latest commit
- Clear build cache in Vercel project settings

### Polls not showing on dashboard
- Check if `DATABASE_URL` is set correctly
- Verify database connection is working
- Check browser console for API errors

### Poll creation not working
- Ensure wallet is connected
- Check that user has Base Sepolia ETH for gas
- Verify contract addresses are correct