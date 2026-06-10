---
title: data center guardian
emoji: 💽
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

> **warning:** the YAML metadata block at the very top of this file is absolutely required for hugging face deployment. it configures the docker SDK and binds the container to port 7860. do not remove it!

# data center guardian

an enterprise-grade predictive maintenance MLOps platform focused on forecasting HDD remaining useful life (RUL) using survival analysis on the backblaze hard drive dataset.

## architecture

this platform is completely decoupled and runs on a fully automated, zero-cost pipeline.

### 1. frontend UI (vercel)
- a fast react dashboard built with vite and typescript.
- accepts user inputs for SMART drive telemetry.
- sends an HTTP POST request containing a JSON payload directly to the inference API.

### 2. backend API (hugging face spaces)
- a fastapi python server hosted in a custom docker container.
- loads a native xgboost model trained with the `survival:aft` objective.
- calculates the exact time-to-failure (TTF) in days.
- configured with CORS to accept traffic from the frontend.

### 3. continuous training (github actions)
- a CI/CD pipeline scheduled to run quarterly.
- automatically runs an ETL pipeline to scrape and process the latest backblaze CSV data.
- retrains the xgboost model natively and commits the updated `.json` weights back to the repository.
- triggers a hot-reload on the hugging face backend to serve the new model.
