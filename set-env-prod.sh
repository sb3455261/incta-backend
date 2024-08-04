#!/bin/bash


export AUTH_MONGODB_URI=mongodb+srv://sbbs8668:4FPZl4rvWmkbuEqZ@incta.l25thzz.mongodb.net
export AUTH_JWT_SECRET=e9b7e1f3c8a5d2b6f0e4a7c1d8b3f6a2e5c9d7b0f4a2e8c6d1b3f7a9e0c5d2b4
export USERS_JWT_SECRET=e9b7e1f3c8a5d2b6f0e4a7c1d8b3f6a2e5c9d7b0f4a2e8c6d1b3f7a9e0c5d2b4

export SMTP_AUTHENTICATION_USERNAME=incta.team
export SMTP_AUTHENTICATION_PASSWORD=Str0ngP@ssword
export SMTP_SERVER_HOST=80.211.200.56
export SMTP_SERVER_PORT=8025

export USERS_DATABASE_URL=postgresql://incta_owner:3CMFrD9LfkEV@ep-square-lab-a21mu0u6.eu-central-1.aws.neon.tech/incta.users.prod?sslmode=require

echo "AUTH_MONGODB_URI is set to: $AUTH_MONGODB_URI"
echo "USERS_DATABASE_URL is set to: $USERS_DATABASE_URL"

exec "$@"
