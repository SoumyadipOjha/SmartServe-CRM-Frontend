# SmartServe CRM Platform

A comprehensive CRM platform built for the Xeno SDE Internship Assignment 2025, featuring customer segmentation, campaign delivery, and AI-powered insights.

---

## 🔧 Folder Structure

### 📁 Backend (Express.js, MongoDB, Passport, OpenAI)

```
backend/
├── config/                    # Config files (e.g., DB, passport)
├── controllers/              # All route controllers
├── middleware/               # Middlewares (auth, validation, error)
├── models/                   # Mongoose models
├── routes/                   # REST API routes
├── services/                 # AI and vendor logic
├── .env                      # Environment variables
├── index.js                  # App entry point
└── package.json              # Backend dependencies
```

### 🖥 Frontend (React + TypeScript + Vite + Tailwind)

```
frontend/
├── public/                   # Static assets
├── src/
│   ├── components/           # Layout, Navbar, IconWrapper
│   ├── context/              # AuthContext
│   ├── pages/                # Pages (Dashboard, Orders, Campaigns...)
│   ├── services/             # API services (auth, orders, campaigns)
│   ├── types/                # TypeScript models & interfaces
│   └── utils/                # Utility helpers
├── .env                      # Vite env config
├── App.tsx                   # App root component
├── main.tsx                  # App entry point
└── package.json              # Frontend dependencies
```

---

## 🧠 Architecture Diagram

```
┌────────────────────┐
│   Frontend (React) │
│  Vercel + Netlify  │
└───────┬────────────┘
        │ REST APIs
        ▼
┌────────────────────┐
│  Backend (Express) │ ◄──────────────┐
│  Render Hosted     │                │
└───────┬────────────┘                │
        ▼                             │
┌────────────────────┐     ┌─────────▼─────────┐
│ MongoDB Atlas      │     │ Google Gen AI API │
└────────────────────┘     └───────────────────┘
```

---

## 🌐 Hosted Links

* 🔗 **Backend API**: [https://smartserve-crm-backend.onrender.com](https://smartserve-crm-backend.onrender.com)
* 🔗 **Live Demo**: Postman Mock: [https://smart-serve-crm-frontend.vercel.app/in](https://smart-serve-crm-frontend.vercel.app/in)

---

## 📦 Local Setup Instructions

### Prerequisites

* Node.js 18+
* MongoDB (local or Atlas)
* Google Cloud credentials (OAuth + Gemini)

### Backend Setup

```bash
git clone https://github.com/your-username/xeno-crm.git
cd xeno-crm/backend
npm install
```

### Create `.env`

```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://smartserve-crm-backend.onrender.com/api/auth/google/callback
CLIENT_URL=https://smart-serve-crm.netlify.app
GEMINI_API_KEY=...
```

### Run Backend

```bash
npm run dev
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

---

## 📋 API Endpoints (Postman-Ready)

### 🔐 Auth (Google OAuth)

```
GET /api/auth/google
GET /api/auth/google/callback
GET /api/auth/me
```

### 👥 Customers

```
POST   /api/customers
GET    /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### 🧾 Orders

```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
GET    /api/orders/customer/:customerId
PATCH  /api/orders/:id/status
```

### 📢 Campaigns

```
POST   /api/campaigns
GET    /api/campaigns
POST   /api/campaigns/preview
GET    /api/campaigns/:id/stats
POST   /api/campaigns/:id/activate
GET    /api/campaigns/:id
```

### 🤖 AI

```
POST   /api/ai/convert-rules
POST   /api/ai/generate-message
```

---

## 🧠 AI Capabilities Summary

* Natural language to rule conversion ("high spenders in last 30 days")
* AI-generated campaign message suggestions
* Performance summary using Generative AI
* Multimodal fallback (Gemini 2.0 Flash → 1.5 Flash → 1.5 Pro)

---

## ⚠️ Known Limitations

* Campaign delivery is synchronous
* No image support in campaign messages
* Vendor delivery simulation (90% success)

## 🔮 Future Scope

* Mobile app version
* Email & rich template support
* Drag & drop template designer
* A/B testing for campaign performance
* Real-time analytics dashboard

---

## 📄 License

MIT License. See `LICENSE` file.
