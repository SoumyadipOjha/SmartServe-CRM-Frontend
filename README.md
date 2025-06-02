# SmartServe CRM Platform

A full-stack AI-powered CRM solution designed for the Xeno SDE Internship Assignment 2025. Built with Google OAuth, segmentation, automated messaging, and campaign analytics.

---

## 🚀 Features

### ✅ Core Modules

* **Authentication**: Google OAuth 2.0 + JWT
* **Customer Management**: CRUD operations with validations
* **Order Management**: Create, retrieve, and update orders
* **Campaigns**:

  * Segment builder with AND/OR logic
  * Audience preview + activation
  * Message delivery simulation with 90% success
* **AI Tools**:

  * Natural language to rule conversion
  * Smart message generator
  * Fallback model strategy

---

## 🛠️ Tech Stack

### 🧩 Backend

* Node.js, Express.js
* MongoDB (with Mongoose ODM)
* Passport.js (Google OAuth)
* JWT Authentication
* Gemini API (Google Generative AI)

### 🎨 Frontend

* React.js with TypeScript
* Chakra UI
* React Query Builder
* Chart.js
* Axios

### Dev Tools

* Nodemon, ESLint, Prettier
* Postman (for testing APIs)


---

## 🧭 Architecture Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │◄────►│   Backend   │◄────►│  Database   │
│ React + TS  │      │ Node + JWT  │      │  MongoDB    │
└─────────────┘      └─────────────┘      └─────────────┘
                           ▲
                           │
                     ┌─────┴─────┐
                     │   AI API  │
