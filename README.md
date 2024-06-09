This project represents a simple Telegram bot API with a backend for authentication.


- [Dependencies](#dependencies)
- [Setup Project Locally](#setup-project-locally)
- [CI/CD Process](#cicd-process)
- [Check the Bot and Web](#check-the-bot-and-web)
- [TODO](#todo)

## Dependencies

To run this project locally, you will need the following dependencies:

- **nvm (Node Version Manager)**: Used to manage Node.js versions.
  - [nvm Installation Guide](https://github.com/nvm-sh/nvm#installing-and-updating)
- **dbmate**: A database migration tool.
  - [dbmate Installation Guide](https://github.com/amacneil/dbmate#installing)
- **sqlc**: Generate type-safe Go from SQL.
  - [sqlc Installation Guide](https://docs.sqlc.dev/en/latest/overview/install.html)
- **docker**: Container platform to run the database.
  - [Docker Installation Guide](https://docs.docker.com/get-docker/)

## Setup Project Locally

1. Clone the repository:
    ```bash
    git clone git@github.com:rexemtoxa/tg-bot.git
    cd tg-bot
    ```

2. Install the dependencies listed above.

3. **Frontend Setup**:
    - Navigate to the frontend folder:
      ```bash
      cd frontend
      ```
    - Switch to the correct Node.js version:
      ```bash
      nvm use
      ```
    - Install Node.js dependencies:
      ```bash
      npm ci
      ```
    - Build the frontend:
      ```bash
      npm run build
      ```

4. **Backend Setup**:
    - Navigate to the backend folder:
      ```bash
      cd backend
      ```
    - Switch to the correct Node.js version:
      ```bash
      nvm use
      ```
    - Install Node.js dependencies:
      ```bash
      npm ci
      ```
    - Copy the example environment variables file and adjust values if necessary:
      ```bash
      cp .env.example .env
      ```

5. Start the database container:
    ```bash
    make start-dev-env
    ```

6. Enjoy! Do not forget to generate the bot token from the [BotFather](https://t.me/BotFather).

For additional commands, please check the `scripts` section in the `package.json` files in both the frontend and backend folders.

## CI/CD Process

- **Continuous Integration (CI)**:
  - Runs tests on PRs and pushes.
  - Executes linters to ensure code quality.

- **Continuous Deployment (CD)**:
  - After each commit to the main branch, deployment to DigitalOcean starts.
  - The bot is deployed as a separate worker to avoid scaling problems since only one bot with one token can exist at a time.
  - The backend is deployed separately to facilitate scaling.
  - Before each deployment, a migration job attempts to apply migrations to the database instance.
  - If something goes wrong during the build or deployment process, a rollback to the previous version is initiated.

## Check the Bot and Web

- **Bot**: [TestAssessmentAntonRehemae_bot](https://t.me/TestAssessmentAntonRehemae_bot)
- **Web**: [plankton-app-luud8.ondigitalocean.app](https://plankton-app-luud8.ondigitalocean.app/)

## TODO

- Cover all backend handlers with types.
- Generate OpenAPI schema from backend handlers.
- Validate all requests by JSON schema at runtime.
- Generate web client from OpenAPI schema.
- Extract dependencies like DB queries from the backend server to some dependency injection to facilitate testing.
- Write a few integration tests using Playwright or a similar tool and include these steps in the CI pipeline.
- Move handling of temp tokens/sessions to Redis.
- Improve logging.