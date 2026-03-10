# StockPilot

StockPilot is a comprehensive inventory and sales management dashboard built for small businesses and retail shops. Streamline your operations with real-time inventory tracking, seamless sales recording, and actionable business insights—all in one clean, intuitive interface.

---

## Features

- Inventory Management: Add, update, and track products with automatic quantity     adjustments
- Sales Recording: Multi-item cart support with customer details and payment tracking
- Business Analytics: Revenue, profit, and sales trend visualizations
- Customer Tracking: Maintain customer profiles and order history
- Low-Stock Alerts: Get notified when inventory runs low
- Secure Authentication: User registration and login with JWT tokens
- Responsive Design: Works seamlessly on desktop and mobile devices

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18+, Vite, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **Styling** | CSS Modules, Custom Design System |

---

## Getting Started

### Prerequisites

Before running StockPilot, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StockPilot
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Copy the example environment file and configure your settings:

   ```bash
   # In backend directory
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your-super-secret-jwt-key-here
   DB_HOST=localhost
   DB_USER=your-db-username
   DB_PASSWORD=your-db-password
   DB_DATABASE=stockpilot_db
   DB_PORT=5432
   ```

5. **Database Setup**

   Create a PostgreSQL database and run the initial migrations:

   ```sql
   CREATE DATABASE stockpilot_db;
   ```

   *(Include any schema setup scripts if available)*

---

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application**

   Open your browser and navigate to `http://localhost:5173` to start using StockPilot!

---

## 📡 API Documentation

StockPilot provides a RESTful API for all operations. Key endpoints include:

- `POST /api/auth/login` - User authentication
- `GET /api/products` - Retrieve product inventory
- `POST /api/sales` - Record new sales
- `GET /api/dashboard/summary` - Get business metrics

---

## 📈 Project Status

StockPilot is actively maintained and under continuous development. Current focus areas:

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Multi-store support
- [x] Real-time inventory updates
- [x] Customer management
- [x] Sales analytics

---

## 🆘 Support

If you encounter any issues or have questions:

- Check the [Issues](https://github.com/RashelAkhtar/StockPilot/issues) page
- Create a new issue with detailed information
- Contact the maintainers

---

Built with ❤️ for small business owners everywhere.