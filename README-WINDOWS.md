# Snapstreak Restore - Windows Quick Start

## 🚀 Quick Start (Double-Click & Go!)

1. **Download & Extract** - Extract the ZIP file to any folder
2. **Double-Click** `start.bat` - That's it!
3. **First Run** - Will install dependencies automatically (takes 1-2 minutes)
4. **Subsequent Runs** - Opens instantly

The app will automatically open in your browser at `http://localhost:5000`

---

## 📖 How to Use

### Step 1: Add Friends
- Click "Add Your First Friend"
- Enter Snapchat usernames (one or multiple)
- Or import from a text file (one username per line)

### Step 2: Configure Settings
- Click the settings icon (⚙️) in the top right
- Enter **your** Snapchat details:
  - Your username
  - Your email
  - Your phone number
- These details are used to fill the form automatically

### Step 3: Start Processing
1. Select the friends you want to restore streaks for
2. Click "Start Processing"
3. A Chrome window will open automatically
4. **You'll see the Snapchat form being filled automatically**

### Step 4: Solve CAPTCHA (If Needed)
- If Cloudflare CAPTCHA appears, simply click the checkbox in the Chrome window
- The automation will detect when you've solved it
- Cookies are saved automatically
- **Next time, CAPTCHA might be skipped entirely!**

### Step 5: Watch It Work!
- Form fills automatically
- Submits automatically
- Processes all selected friends
- Real-time status updates on the dashboard

---

## ⚡ Features

✅ **Automatic Form Filling** - Human-like typing with random delays  
✅ **CAPTCHA Cookie Persistence** - Solve once, benefit forever  
✅ **Batch Processing** - Process multiple friends in sequence  
✅ **Real-time Status** - See what's happening as it happens  
✅ **Error Recovery** - Handles failures gracefully  

---

## 🛑 Stop Processing

Click "Stop Processing" button to halt automation at any time. The browser will close automatically.

---

## 💡 Tips

- **First Friend**: Will likely show CAPTCHA - just solve it once
- **Subsequent Friends**: Often skip CAPTCHA thanks to saved cookies
- **Keep Browser Open**: Don't close the Chrome window manually during processing
- **One at a Time**: Let current processing finish before starting new ones

---

## ⚙️ Requirements

- **Windows 10/11**
- **Node.js 18+** (Download from https://nodejs.org)
- **Chrome Browser** (Usually pre-installed on Windows)

---

## 🔧 Troubleshooting

### "Node.js is not recognized"
- Install Node.js from https://nodejs.org
- Choose LTS (Long Term Support) version
- Restart your computer after installation

### "Port 5000 already in use"
- Close any other apps using port 5000
- Or restart your computer

### Chrome doesn't open
- Make sure Chrome is installed
- Try restarting the app

### Processing gets stuck
- Click "Stop Processing"
- Wait 5 seconds
- Start again

---

## 📁 Project Structure

```
snapstreak-restore/
├── start.bat              # ← Double-click this to run!
├── README-WINDOWS.md      # ← You are here
├── client/                # Frontend code
├── server/                # Backend automation
└── shared/                # Shared types
```

---

## 🎯 How It Works

1. **Browser Automation**: Uses Puppeteer to control Chrome
2. **Form Detection**: Finds and fills Snapchat form fields
3. **CAPTCHA Detection**: Detects Cloudflare Turnstile challenges
4. **Cookie Management**: Saves cookies after CAPTCHA solve
5. **Smart Retry**: Handles failures and edge cases

---

## ⚠️ Important Notes

- **Data Storage**: All data (friends, settings, cookies) is stored in-memory
- **Server Restart**: Restarting the app clears all data
- **Single Session**: Only one automation can run at a time
- **For Personal Use**: This tool is for restoring your own streaks

---

## 🆘 Need Help?

If something isn't working:
1. Close the app completely
2. Delete the `node_modules` folder
3. Run `start.bat` again (will reinstall dependencies)

---

**Made with ❤️ for Snapchat streak restoration**
