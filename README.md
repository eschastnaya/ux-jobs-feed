# UX Jobs Feed

Remote UX/Product Designer jobs from Europe & USA — no middlemen, no fees.

## Sources
- **Remotive** — remote-first job board API
- **Arbeitnow** — European remote jobs API  
- **AI Search** — Claude web search for fresh listings

## Deploy to Vercel (5 min)

### 1. Create GitHub repo
Go to github.com → New repository → name it `ux-jobs-feed` → Create

### 2. Push this folder
```bash
cd ux-jobs
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/ux-jobs-feed.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to vercel.com → Sign up with GitHub (free)
2. Click "Add New Project" → Import your `ux-jobs-feed` repo
3. Before deploying, add Environment Variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
4. Click Deploy → done ✓

Your feed will be live at `ux-jobs-feed.vercel.app`

## Local dev
```bash
npm install
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local
npm run dev
```
Open http://localhost:3000
