# 🌿 CleanCity — AI-Powered Waste Management

CleanCity is a modern, responsive web application designed to streamline waste management using AI and interactive maps. It features a "Zero-Setup" LocalStorage backend, making it easy to run locally or deploy to static hosting.

## ✨ Features

- **👤 Citizen Dashboard**: Schedule pickups, track volunteers, and earn Green Points.
- **🏛️ Authority Dashboard**: Manage requests, view waste heatmaps, and optimize routes.
- **🤖 AI Waste Scanner**: Scan waste using Teachable Machine to get segregation advice.
- **📍 Interactive Maps**: Powered by Leaflet.js and OSRM for live tracking and route optimization.
- **🎨 Neo-Brutalism Design**: Clean, high-contrast, and modern UI.

## 🚀 Getting Started

### Prerequisites
- Python (for the local development server)

### Installation & Run
1. Clone the repository:
   ```bash
   git clone https://github.com/Sherwin-ru/cleancity-web.git
   ```
2. Navigate to the project directory:
   ```bash
   cd cleancity-web
   ```
3. Start the local server:
   ```bash
   python -m http.server 8080
   ```
4. Open your browser and visit: `http://localhost:8080`

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS (Style.css), Vanilla JavaScript.
- **Maps**: Leaflet.js, OpenStreetMap, OSRM.
- **AI**: Google Teachable Machine.
- **Backend**: Browser LocalStorage (No external database required).

## 📄 License
MIT License
