# Vantage Personal Finance Manager

A premium, modern full-stack web application designed to track and manage personal finances. It combines a robust double-entry bookkeeping Spring Boot backend with a high-fidelity glassmorphic React dashboard.

---

## 🌟 Key Features

- **Double-Entry Bookkeeping**: Transactions automatically adjust associated account balances (e.g., expenses subtract balance, incomes add balance, transfers shift funds atomically).
- **Multi-Account Tracking**: Grid views of user accounts categorized by Cash, Bank, Credit Cards, and Investments.
- **Budget Alerts & Limit Tracking**: Category-level thresholds with real-time status gauges (safe, 80%+ usage warning, and red-highlighted limit overflow flags).
- **Interactive Visual Analytics**: Line/area trends tracking Daily Income vs. Expense activity and category spending distributions powered by Recharts.
- **Reports Exports**: One-click downloads of formatted PDF tables or raw Excel spreadsheets (.xlsx).
- **JWT Authorization Guards**: Clean password encryption and stateless JSON Web Token filters guarding API paths.
- **Auto-Seeding**: Automatic injection of default categories (Salary, Food, Rent, Entertainment, utilities) at startup.

---

## 🛠 Tech Stack

### Backend
- **Framework**: Spring Boot 3.3.2 (Java 21)
- **Security**: Spring Security & signed JSON Web Tokens (`jjwt-api`)
- **Data Access**: Spring Data JPA & Hibernate
- **Database**: H2 (In-memory, default for quick starts) or MySQL (Configured, ready for persistent environments)
- **API Documentation**: SpringDoc OpenAPI (Swagger-UI)
- **Exporting Libraries**: Apache POI (Excel) & OpenPDF (PDF tables)

### Frontend
- **Framework**: React 18 (Vite template builder)
- **Styling**: Vanilla CSS (Premium glassmorphic tokens system)
- **Charts**: Recharts (Responsive vector SVGs)
- **Icons**: Lucide React
- **API Client**: Axios (With interceptors to automatically append JWT bearer headers)

---

## 📁 Repository Structure

```
Personal Finance manager/
├── backend/
│   ├── src/main/java/com/personalfinance/manager/
│   │   ├── config/          # Startup seeder, Security configuration
│   │   ├── controller/      # Auth, Accounts, Transactions, Budgets, Reports REST APIs
│   │   ├── dto/             # Validation request/response payloads
│   │   ├── exception/       # Global exception interceptor
│   │   ├── model/           # JPA entities & enums
│   │   ├── repository/      # Custom SQL & JPA query methods
│   │   ├── security/        # JWT validator filter, loading user details
│   │   └── service/         # Double-entry logic, exports generation
│   ├── src/main/resources/  # application.properties (Switch H2 / MySQL here)
│   ├── src/test/            # Unit testing integrations (TransactionServiceTest)
│   └── pom.xml              # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Glassmorphic Modal, Sidebar, Navigation
│   │   ├── context/         # AuthContext JWT session holder
│   │   ├── pages/           # Auth, Dashboard, Accounts, Transactions, Budgets
│   │   ├── services/        # api.js axios wrapper
│   │   ├── App.jsx          # Protected route switcher
│   │   └── index.css        # Premium custom variables & styling themes
│   └── package.json         # NPM libraries
└── README.md
```

---

## 🚀 Local Quickstart Guide

### Prerequisite: Set Java Home (Windows)
Ensure you set your environment's Java Home directory pointing to JDK 21 before launching Spring Boot:
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
```

### 1. Launch the Backend Server
Default database is H2 in-memory, requiring no external installations:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
- **Port:** `8080`
- **Swagger Documentation:** `http://localhost:8080/swagger-ui.html`

*(To switch to MySQL database, open `backend/src/main/resources/application.properties`, uncomment the MySQL lines, and comment out the H2 lines).*

### 2. Launch the React Frontend Client
Ensure you have Node.js installed:
```powershell
cd frontend
npm install
npm run dev
```
- **Port:** `5173`
- **Url:** `http://localhost:5173/`

---

## 🧪 E2E Integration Testing
The project contains an automated integration verification script testing JWT signup, double-entry adjustment constraints, and export downloads. Run:
```powershell
node "C:\Users\MY LENOVO\.gemini\antigravity-ide\brain\3f33e446-9a93-43ea-b886-931dc25fb0eb\scratch\verify_endpoints.js"
```
Output:
`E2E API INTEGRATION TEST SUCCESSFUL!`
