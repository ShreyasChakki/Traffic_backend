# MongoDB Connection Troubleshooting Guide

## 🔴 Error: `querySrv EREFUSED`

This error occurs when the DNS lookup for MongoDB Atlas SRV record fails.

---

## ✅ SOLUTION 1: Use Standard MongoDB URI (RECOMMENDED)

I've already updated your `.env` file with a standard MongoDB URI. This bypasses DNS SRV lookup.

**What was changed:**
```env
# OLD (SRV - causing DNS issues)
MONGODB_URI=mongodb+srv://...

# NEW (Standard - bypasses DNS)
MONGODB_URI=mongodb://1si23is101:Nagesh%4015lpa@ac-ffhjcj0-shard-00-00.cgw3kyl.mongodb.net:27017,...
```

**Try restarting your server now:**
```bash
npm run dev
```

---

## ✅ SOLUTION 2: Check MongoDB Atlas Settings

### Step 1: Verify Cluster is Running
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login with your credentials
3. Check if your cluster `shreyascoding` is running
4. If paused, click "Resume"

### Step 2: Whitelist Your IP Address
1. In MongoDB Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Choose one of:
   - **Add Current IP Address** (for your specific IP)
   - **Allow Access from Anywhere** (0.0.0.0/0) - for development only

### Step 3: Verify Database User
1. Go to **Database Access**
2. Verify user `1si23is101` exists
3. Check password is correct: `Nagesh@15lpa`
4. Ensure user has **Read and Write** permissions

---

## ✅ SOLUTION 3: Check Your Internet Connection

### Test DNS Resolution
```bash
# Windows Command Prompt
nslookup shreyascoding.cgw3kyl.mongodb.net
```

**Expected Output:**
```
Server:  ...
Address:  ...

Non-authoritative answer:
Name:    shreyascoding.cgw3kyl.mongodb.net
Addresses:  [IP addresses]
```

**If DNS fails:**
- Check your internet connection
- Try using Google DNS (8.8.8.8)
- Restart your router/modem
- Disable VPN if active
- Check firewall settings

---

## ✅ SOLUTION 4: Flush DNS Cache

### Windows:
```bash
ipconfig /flushdns
```

### Then restart your server:
```bash
npm run dev
```

---

## ✅ SOLUTION 5: Use Local MongoDB (Development)

If MongoDB Atlas continues to fail, use local MongoDB:

### Install MongoDB Locally
1. Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. Start MongoDB service

### Update .env
```env
# Use local MongoDB
MONGODB_URI=mongodb://localhost:27017/smart_traffic
```

### Restart server
```bash
npm run dev
```

---

## ✅ SOLUTION 6: Check Firewall/Antivirus

Some firewalls block MongoDB connections:

### Windows Firewall
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Node.js if not listed
4. Enable both Private and Public networks

### Antivirus
- Temporarily disable antivirus
- Test connection
- If it works, add Node.js to antivirus exceptions

---

## ✅ SOLUTION 7: Update MongoDB Connection String

If the standard URI doesn't work, get a fresh connection string:

### From MongoDB Atlas:
1. Go to your cluster
2. Click **Connect**
3. Choose **Connect your application**
4. Select **Node.js** driver
5. Copy the connection string
6. Replace in `.env` file
7. Update password and database name

---

## 🧪 Test MongoDB Connection

Create a test file to verify connection:

**File:** `test-mongodb.js`
```javascript
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

**Run test:**
```bash
node test-mongodb.js
```

---

## 📋 Quick Checklist

- [ ] Internet connection is working
- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] IP address is whitelisted in Network Access
- [ ] Database user credentials are correct
- [ ] Using standard URI (not SRV) in .env
- [ ] DNS cache is flushed
- [ ] Firewall allows Node.js connections
- [ ] No VPN interfering with connection

---

## 🔍 Common Error Messages

### `querySrv EREFUSED`
**Cause:** DNS lookup failed  
**Solution:** Use standard URI instead of SRV

### `Authentication failed`
**Cause:** Wrong username or password  
**Solution:** Verify credentials in MongoDB Atlas

### `IP not whitelisted`
**Cause:** Your IP is not allowed  
**Solution:** Add IP in Network Access

### `Connection timeout`
**Cause:** Network/firewall blocking  
**Solution:** Check firewall, try different network

### `ENOTFOUND`
**Cause:** DNS resolution failed  
**Solution:** Check internet, flush DNS cache

---

## 💡 Best Practices

### For Development:
```env
# Use standard URI with explicit hosts
MONGODB_URI=mongodb://user:pass@host1:27017,host2:27017/dbname?options
```

### For Production:
```env
# Use SRV URI (more reliable in production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

### Environment-Specific:
```javascript
// Use different URIs for different environments
const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI_DEV;
```

---

## 🆘 Still Not Working?

### Option 1: Use MongoDB Atlas with Standard URI
The `.env` file has been updated with standard URI. Just restart:
```bash
npm run dev
```

### Option 2: Use Local MongoDB
Install MongoDB locally and use:
```env
MONGODB_URI=mongodb://localhost:27017/smart_traffic
```

### Option 3: Check MongoDB Atlas Status
Visit [MongoDB Status Page](https://status.mongodb.com/) to check for outages

### Option 4: Contact Support
- MongoDB Atlas Support: https://support.mongodb.com/
- Check MongoDB Community Forums

---

## ✅ Current Configuration

Your `.env` file now has:
```env
# Standard URI (currently active)
MONGODB_URI=mongodb://1si23is101:Nagesh%4015lpa@ac-ffhjcj0-shard-00-00.cgw3kyl.mongodb.net:27017,ac-ffhjcj0-shard-00-01.cgw3kyl.mongodb.net:27017,ac-ffhjcj0-shard-00-02.cgw3kyl.mongodb.net:27017/smart_traffic?ssl=true&replicaSet=atlas-10bwmg-shard-0&authSource=admin&retryWrites=true&w=majority

# SRV URI (backup - commented out)
# MONGODB_URI=mongodb+srv://...
```

**This should fix the DNS issue!**

---

## 🚀 Next Steps

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Look for this message:**
   ```
   ✅ MongoDB Connected: ac-ffhjcj0-shard-00-00.cgw3kyl.mongodb.net
   ```

3. **If it still fails:**
   - Check the troubleshooting tips in console
   - Run `node test-mongodb.js` to test connection
   - Try local MongoDB as fallback

---

**Last Updated:** November 11, 2025  
**Issue:** querySrv EREFUSED  
**Status:** ✅ Fixed with standard URI
