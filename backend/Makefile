start-dev-env:
	docker compose up -d

migrate-up:
	dbmate -d ./db/migrations -e DATABASE_URL up

generate-queries:
	sqlc generate