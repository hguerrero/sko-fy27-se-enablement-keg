# 🟢 Matrix UI - Kong Event Gateway Demo

A Matrix-themed web interface for the Kong Event Gateway demonstration, providing real-time visualization and monitoring capabilities without requiring terminal access.

## 🎯 Features

### 📊 Dashboard Overview
- **Real-time system status** - Live monitoring of Kafka cluster, KEG gateway, and AI agents
- **Architecture visualization** - Interactive view of virtual clusters and data flow
- **Metrics display** - Events per second, topic counts, anomaly detection stats

### 🌊 Data Streams
- **Live data visualization** - Real-time charts showing NYC taxi dispatches, LA EV charging, and subway density
- **Topic monitoring** - Complete overview of Kafka topics with schema information
- **Sample event inspection** - Live JSON samples from each data stream

### 🛡️ Anomaly Detection
- **AI-powered analysis** - LLM-based anomaly detection with confidence scoring
- **Processing pipeline** - Visual representation of Kafka → LLM → Kafka enrichment
- **Alert management** - Resolve and investigate detected anomalies
- **Real-time metrics** - Live charts showing normal vs anomalous event patterns

### 👁️ Sentinel Agent
- **AI monitoring** - Continuous threat detection using Volcano SDK
- **Custom prompts** - Configure custom queries for the AI agent
- **Scan history** - Complete log of all agent scans and responses
- **Interactive controls** - Start/stop agent and trigger manual scans

### 🌐 Virtual Clusters
- **Multi-tenant overview** - Visual representation of NY 1999, LA 2024, and Machine City Core
- **ACL management** - Access control policies and security configuration
- **Cluster metrics** - Real-time connection and throughput monitoring
- **Topic namespaces** - Organized view of topics per virtual cluster

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- The main Kong Event Gateway demo running (Kafka cluster, agents)

### Installation

1. **Navigate to the UI directory:**
   ```bash
   cd matrix-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to access the Matrix UI

## 🎨 UI Features

### Matrix-Themed Design
- **Authentic Matrix aesthetics** - Green text on black background with terminal styling
- **Animated background** - Falling Matrix rain effect
- **Terminal windows** - All components styled as retro terminal interfaces
- **Responsive design** - Works on desktop, tablet, and mobile devices

### Real-Time Capabilities
- **Live updates** - Data refreshes every 1-3 seconds depending on the component
- **Interactive controls** - Start/stop agents, trigger scans, resolve anomalies
- **Animated indicators** - Status lights and progress indicators
- **Sound effects** - (Optional) Matrix-themed audio feedback

### Data Visualization
- **Recharts integration** - Professional charts and graphs
- **Multiple chart types** - Line charts, bar charts, scatter plots
- **Interactive tooltips** - Detailed information on hover
- **Responsive layouts** - Charts adapt to screen size

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `matrix-ui` directory:

```env
# Backend API configuration
REACT_APP_API_URL=http://localhost:3001

# Kafka broker endpoints (for display purposes)
REACT_APP_NY_BROKER=localhost:19192
REACT_APP_LA_BROKER=localhost:19292
REACT_APP_MACHINE_BROKER=localhost:19092

# Update intervals (milliseconds)
REACT_APP_DATA_UPDATE_INTERVAL=2000
REACT_APP_METRICS_UPDATE_INTERVAL=5000
```

### Customization
- **Theme colors** - Modify `tailwind.config.js` to change the Matrix green theme
- **Update intervals** - Adjust refresh rates in component state
- **Chart types** - Swap Recharts components for different visualizations
- **Matrix rain** - Configure character sets and animation speeds

## 📁 Project Structure

```
matrix-ui/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx   # Main overview dashboard
│   │   ├── DataStreams.tsx # Real-time data visualization
│   │   ├── AnomalyDetector.tsx # AI anomaly detection
│   │   ├── SentinelAgent.tsx   # AI monitoring agent
│   │   ├── VirtualClusters.tsx # Multi-tenant overview
│   │   └── MatrixBackground.tsx # Animated background
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and data services
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── index.css          # Global styles and Matrix theme
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎮 Usage Guide

### Navigation
- Use the **sidebar menu** to switch between different views
- **System status** indicators show real-time health of components
- **Terminal-style windows** contain all functionality

### Dashboard
- **Overview cards** show key metrics at a glance
- **Architecture diagram** displays virtual cluster relationships
- **Activity feed** shows recent system events

### Data Streams
- **Play/Pause button** controls real-time data flow
- **Interactive charts** show live event streams
- **Topic table** provides detailed Kafka topic information
- **Sample events** display actual JSON payloads

### Anomaly Detection
- **Start/Stop controls** manage the AI detection agent
- **Live metrics** show processing rates and confidence levels
- **Anomaly list** displays detailed AI analysis
- **Resolution actions** allow marking anomalies as resolved

### Sentinel Agent
- **Activation controls** start/stop the monitoring agent
- **Custom prompts** configure AI queries
- **Scan history** shows all previous agent responses
- **Manual scans** trigger immediate analysis

### Virtual Clusters
- **Cluster selection** allows detailed inspection of each tenant
- **Real-time metrics** show connections and throughput
- **ACL overview** displays security policies
- **Topic lists** show namespace organization

## 🔄 Integration with Main Demo

The UI connects to the existing Kong Event Gateway demo components:

1. **Kafka Cluster** - Reads topic and partition information
2. **Virtual Clusters** - Displays KEG configuration and metrics
3. **AI Agents** - Shows status and can trigger operations
4. **Data Generators** - Visualizes the generated event streams

### API Endpoints
The UI expects the following backend endpoints (implement as needed):

```
GET /api/status          # System health and status
GET /api/topics          # Kafka topic information
GET /api/clusters        # Virtual cluster configuration
GET /api/anomalies       # Current anomalies
GET /api/agent-status    # AI agent status
POST /api/agent/scan     # Trigger manual scan
```

## 🛠️ Development

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Technologies Used
- **React 18** - User interface framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

## 🎭 Matrix Theme

The UI faithfully recreates the Matrix aesthetic:

- **Color Scheme** - Classic green-on-black terminal colors
- **Typography** - Fira Code monospace font throughout
- **Animations** - Falling Matrix rain, glowing text effects
- **Terminal Windows** - Authentic retro computer interface styling
- **Sound Design** - Matrix-inspired audio feedback (optional)

---

*"Unfortunately, no one can be told what the Matrix is. You have to see it for yourself."* - **Morpheus**

Experience the Kong Event Gateway through the Matrix UI and see the data streams, AI agents, and virtual clusters in a whole new light! 🟢