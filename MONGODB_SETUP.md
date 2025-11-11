# MongoDB Atlas Setup (5 Minutes)

## Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/email
3. Choose FREE tier (M0)

## Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "FREE" (M0 Sandbox)
3. Select a cloud provider (AWS recommended)
4. Choose region closest to you
5. Click "Create Cluster"

## Step 3: Create Database User
1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Username: `admin`
4. Password: `admin123` (or create your own)
5. Click "Add User"

## Step 4: Allow Network Access
1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for testing)
4. Click "Confirm"

## Step 5: Get Connection String
1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. It looks like: `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/`

## Step 6: Update .env File
Replace the MONGODB_URI in your .env file:

```env
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.xxxxx.mongodb.net/smart_traffic?retryWrites=true&w=majority
```

**Replace:**
- `admin123` with your password
- `cluster0.xxxxx` with your actual cluster URL
- Add `smart_traffic` as database name

## Done! ✅
Your MongoDB is ready. Continue with testing!
