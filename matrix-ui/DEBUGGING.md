# 🐛 Debugging Guide for Matrix UI

This guide explains how to debug the Matrix UI project using VS Code's built-in debugging capabilities.

## 🚀 Quick Start

### Debug the Full Stack (Recommended)
1. Open the VS Code debug panel (`Cmd+Shift+D` on Mac, `Ctrl+Shift+D` on Windows/Linux)
2. Select **"Debug Full Stack"** from the dropdown
3. Click the green play button ▶️
4. This will start both the Node.js server and React app with debugging enabled

### Debug Individual Components

#### Frontend Only (React App)
- Configuration: **"Debug React App"**
- Launches Chrome with debugging enabled
- Automatically starts the React dev server if not running
- Sets breakpoints in TypeScript/JavaScript files in the `src` folder

#### Backend Only (Node.js Server)  
- Configuration: **"Debug Node Server"**
- Debugs the Express server in `server/server.js`
- Supports hot restart when files change
- Sets breakpoints in server-side JavaScript

## 🔧 Available Debug Configurations

| Configuration | Description | Use Case |
|--------------|-------------|----------|
| **Debug Full Stack** | Both frontend + backend | Complete application debugging |
| **Debug React App** | Chrome-based React debugging | Frontend issues & UI bugs |
| **Debug Node Server** | Node.js server debugging | Backend API & WebSocket issues |
| **Debug React App (Edge)** | Same as React App but uses Edge | Alternative browser debugging |
| **Attach to React Dev Server** | Attach to running React server | When server already running |

## 💡 Debugging Tips

### Setting Breakpoints
- Click in the gutter (left of line numbers) to set breakpoints
- Red dots = active breakpoints
- Works in `.tsx`, `.ts`, `.js`, and `.jsx` files
- Conditional breakpoints: right-click → "Add Conditional Breakpoint"

### Frontend Debugging
- **React DevTools**: Automatically available in debug Chrome instance
- **Console Output**: Check both VS Code Debug Console and Browser DevTools
- **Hot Reload**: Changes automatically refresh the debug session
- **Source Maps**: Full TypeScript debugging with original source code

### Backend Debugging  
- **Console Logs**: Appear in VS Code's integrated terminal
- **Variable Inspection**: Hover over variables or use the Variables panel
- **Call Stack**: See the complete execution path in the Call Stack panel
- **Watch Expressions**: Add expressions to monitor in the Watch panel

### Common Issues & Solutions

#### "Could not connect to debug target"
- Make sure no other React dev server is running on port 3000
- Kill existing processes: `Terminal → Run Task → kill-dev-servers`
- Restart the debug session

#### Backend won't debug
- Check if port 3001 is free: `lsof -i :3001`
- Verify Node.js version is compatible (18+)
- Check server/package.json dependencies are installed

#### Breakpoints not hitting
- Verify source maps are enabled (they are by default)
- Check file paths in debug configuration match actual files
- Clear browser cache and restart debug session

## 🛠️ Available Tasks

Access via `Terminal → Run Task` or `Cmd/Ctrl+Shift+P → Tasks: Run Task`:

- **start-react-dev-server** - Start frontend only
- **start-node-server** - Start backend only  
- **start-dev-environment** - Run the complete dev setup script
- **kill-dev-servers** - Stop all development servers

## 🌐 URLs During Debugging

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/api/topics

## 📱 Browser DevTools Integration

When debugging with "Debug React App":
- **React DevTools** - Component tree inspection
- **Redux DevTools** - If using Redux (auto-detects)
- **Console** - Combined output from app and debug session
- **Network Tab** - Monitor API calls to backend
- **Sources Tab** - Set additional breakpoints, view compiled code

## 🔄 Workflow Recommendations

1. **Start with Full Stack debugging** for most issues
2. **Use browser DevTools** for styling and DOM issues  
3. **Use VS Code debugging** for logic and data flow issues
4. **Set strategic breakpoints** rather than many small ones
5. **Use the debug console** to execute code in the current context
6. **Leverage hot reload** - save files to see changes immediately

## 🎯 TypeScript-Specific Features

- **Type checking on hover** - See TypeScript types while debugging
- **Go to Definition** - Jump to type/interface definitions
- **Auto imports** - Automatic import suggestions and cleanup
- **Rename refactoring** - Safely rename variables across files

Happy debugging! 🚀