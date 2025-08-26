# Air Dome Monitoring & Control System

This project is a full-stack application that provides a comprehensive dashboard for monitoring and controlling an Air Dome structure in real-time. It visualizes sensor data, allows for remote operation of equipment like fans and lights, and features a configurable alert system.

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** InfluxDB (for time-series metrics) & SQLite (for relational data)
- **Real-time Communication:** MQTT (for sensor data) & WebSockets (for live dashboard updates)
- **Deployment:** Docker, Nginx, AWS S3 & CloudFront

---

## Features

### Sensor Data API

For sensors or systems that can send data over HTTP, the backend provides an API endpoint to receive data and forward it to the MQTT broker.

-   **Endpoint:** `POST /api/v1/sensor-data`
-   **Request Body:** A JSON object containing the sensor data.
-   **Action:** The server publishes the entire JSON body as a message to the `air-dome/sensors` MQTT topic.
-   **Response:** Returns a `202 Accepted` status on success.

**Example using cURL:**

```bash
curl -X POST http://localhost:3001/api/v1/sensor-data \
-H "Content-Type: application/json" \
-d '{
  "sensorId": "temp-sensor-01",
  "value": 23.5,
  "unit": "Celsius",
  "timestamp": "2024-08-26T10:00:00Z"
}'
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later recommended)
- **Docker** and **Docker Compose**
- **Git**
- Create an `.env` file in the project root. Copy the contents from `.env.example` and the InfluxDB credentials from `docker-compose.dev.yml` and fill in the values. It should look like this:

```env
# Frontend & General
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
MQTT_CONFIG_UPDATE_TOPIC=air-dome/config/update
MQTT_SENSORS_TOPIC=air-dome/sensors
GEMINI_API_KEY=your_gemini_api_key_here

# MQTT Broker Credentials
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# InfluxDB Credentials (from docker-compose.dev.yml)
DOCKER_INFLUXDB_INIT_USERNAME=my-dev-user
DOCKER_INFLUXDB_INIT_PASSWORD=my-dev-password
DOCKER_INFLUXDB_INIT_ORG=my-dev-org
DOCKER_INFLUXDB_INIT_BUCKET=my-dev-bucket
DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-local-dev-influx-token
```

### Running Locally

The local environment is fully containerized and supports hot-reloading for the backend.

1.  **Start Backend Services:** Launch the backend, databases, and MQTT broker using the development docker-compose file.
    ```bash
    docker-compose -f docker-compose.dev.yml up -d --build
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Frontend:** Start the Vite development server for the frontend.
    ```bash
    npm run dev
    ```

4.  **Run Sensor Simulator (Optional):** To generate sample sensor data for the dashboard, run the MQTT simulator in a separate terminal. The simulator will periodically send random values for pressure, temperature, and fan speed.
    ```bash
    cd mqtt-simulator
    node index.js
    ```

The application should now be running at `http://localhost:5173`.

---

## Deployment

The application is designed to be deployed with a containerized backend and a static frontend.

### Frontend (S3 & CloudFront)

1.  **Build the Static Files:**
    ```bash
    npm run build
    ```
2.  **Deploy to S3:** Upload the contents of the `dist/` directory to your designated S3 bucket.
3.  **Serve via CloudFront:** Configure a CloudFront distribution to serve the files from the S3 bucket.

### Backend (Docker)

The entire backend infrastructure runs as a set of Docker containers, orchestrated by the `docker-compose.yml` file. This includes the Node.js application, InfluxDB, the Mosquitto MQTT broker, and the Nginx reverse proxy.

Deployment is handled via a staging-to-production Git workflow.

1.  **Run the Deployment Script:** Execute the `deploy.sh` script. This script copies the necessary backend files (`backend/`, `nginx/`, `docker-compose.yml`, `mosquitto.conf`) to the deployment staging directory defined within the script.
    ```bash
    ./deploy.sh
    ```
2.  **Commit and Push:** Navigate to the staging directory, commit the updated files, and push them to your production branch.
    ```bash
    cd /path/to/your/staging-directory
    git add .
    git commit -m "Deploy latest backend changes"
    git push origin main
    ```
