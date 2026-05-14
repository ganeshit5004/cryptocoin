# Crypto Market Data & Analytics Application

This is a complete Full-Stack application designed to ingest real-time cryptocurrency market data, manage historical price data, perform analytical computations, and execute a rule-based trading strategy. It features a robust Python/FastAPI backend and a sleek, responsive React/Vite frontend using modern MUI X Line Charts.

## Full Project Cycle Overview

This application operates in a continuous cycle, updating data and visualizing trading strategies in real-time.

### 1. Data Ingestion & Storage (Backend)
- **Live Polling**: A background job (APScheduler) runs every 10 seconds within the FastAPI process. It fetches live market prices for the top 10 cryptocurrencies via the **CoinGecko API**.
- **Historical Seeding**: When a new asset is tracked, the system automatically calls the **Binance Public API** (`/klines`) to fetch 50 historical 5-minute data points (Open, High, Low, Close, Volume) to instantly populate the database.
- **Storage**: All data is stored in a lightweight SQLite database using SQLAlchemy ORM.

### 2. Strategy Engine (Backend)
- The strategy engine calculates a **Simple Moving Average (SMA) Crossover Strategy**.
- It queries the database for the recent history of an asset and computes a **Short-Term SMA (3-period)** and a **Long-Term SMA (5-period)**.
- It compares the latest values to generate actionable trading signals (`BUY`, `SELL`, or `HOLD`).

### 3. API Reference (Backend)
The FastAPI application serves as the central nervous system, exposing several RESTful endpoints that the frontend utilizes:

- `GET /markets`
  - **Purpose**: Returns a list of all supported cryptocurrency assets currently tracked in the system.
  - **Usage**: Used by the frontend sidebar to populate the "Available Assets" list.
- `GET /prices?symbol={symbol}`
  - **Purpose**: Returns the absolute latest tracked OHLC (Open, High, Low, Close) price entry for a specific symbol.
- `GET /history?symbol={symbol}&limit={limit}`
  - **Purpose**: Retrieves the most recent historical OHLC price ticks from the local database. This includes both the 10-second polling data and the initial 5-minute seed data from Binance.
  - **Usage**: The core endpoint used to render the real-time MUI X Line Chart.
- `GET /history/daily?symbol={symbol}&days={days}`
  - **Purpose**: Proxies an external API call to CoinGecko to fetch the true 24-hour daily interval historical price data for the past N days. Features an in-memory cache to respect API rate limits.
  - **Usage**: Used to populate the "Daily Price History" pop-up modal on the frontend.
- `GET /analytics?symbol={symbol}`
  - **Purpose**: Calculates the percentage change in price and volume over the recent local historical dataset.
  - **Usage**: Feeds the "Price Change" and "Volume Change" statistic cards in the dashboard header.
- `POST /strategy/run?symbol={symbol}`
  - **Purpose**: Runs the SMA Crossover Strategy Engine against the local history. It calculates the Short-Term SMA (3-period) and Long-Term SMA (5-period) and compares them.
  - **Usage**: Returns the calculated `BUY`, `SELL`, or `HOLD` signal to the frontend's Strategy Panel in real-time.
### 4. Interactive Visualization (Frontend)
- **Dashboard**: A React (Vite) frontend with a sleek Glassmorphism design and dark-mode gradients.
- **Real-time Auto-Refresh**: The dashboard polls the backend every 5 seconds to keep the UI perfectly synced with the latest database records without requiring page reloads.
- **MUI X Charts**: A beautiful, sparse-time-scale Line Chart seamlessly overlays the **Asset Price** with the **Short SMA (3)** and **Long SMA (5)** lines, allowing users to visually see the crossover events that trigger the trading signals.

---

## The Trading Strategy Explained

The application implements a **Simple Moving Average (SMA) Crossover Strategy**. 

### How it works
The strategy uses historical closing prices to calculate two moving averages:
1.  **Short-Term SMA (3-period)**: Reacts quickly to recent price changes.
2.  **Long-Term SMA (5-period)**: Represents the longer-term trend.

### Signal Generation Rules:
-   **BUY Signal**: Triggered when the Short-Term SMA crosses *above* the Long-Term SMA. This indicates a potential upward momentum (bullish trend).
-   **SELL Signal**: Triggered when the Short-Term SMA crosses *below* the Long-Term SMA. This indicates a potential downward momentum (bearish trend).
-   **HOLD Signal**: If no crossover occurs on the latest data point, or the lines have not distinctly crossed, the signal remains HOLD.

### Visualizing the Strategy
When you select an asset on the Dashboard, the **MUI X Chart** plots the Price alongside the Short SMA (Yellow) and Long SMA (Purple). Whenever the Yellow line crosses the Purple line on the graph, you will see the corresponding Signal box update to `BUY` or `SELL`.

---

## Local Setup & Execution

Follow these steps to run the application locally.

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    *   Windows: `venv\Scripts\activate`
    *   Mac/Linux: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Run the FastAPI application:
    ```bash
    uvicorn main:app --reload
    ```
    The backend will start at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install Node dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend will start at `http://localhost:5173`.

---

## Assumptions & Limitations

-   **Database**: SQLite is used for simplicity and ease of local testing. In a production environment, PostgreSQL should be used.
-   **Rate Limiting**: Public APIs (CoinGecko/Binance) have strict rate limits. The background ingestion job is configured to respect basic limits, but heavy usage might result in temporary blocks.
-   **Strategy**: The SMA strategy is purely rule-based and educational. It does not account for slippage, trading fees, or advanced risk management. Do not use it for real financial trading.

## Built With
- **FastAPI** & **SQLAlchemy**
- **React 18** & **Vite**
- **MUI X Charts** (`@mui/x-charts`)
- **APScheduler** & **Pandas**
