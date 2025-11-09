# Step 2: Containerization & Serverless Deployment

We containerized both services using **Docker**: the backend runs via **Uvicorn workers**, the frontend is served through **Nginx**. Both are deployed as **Cloud Run services** with **GitHub Actions CI/CD** pipelines pushing to **Artifact Registry**, enabling automated deployment on every commit.
