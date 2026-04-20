#!/bin/bash

echo "Spouštím My Car Garage..."

# Spuštění MongoDB
mkdir -p ~/data/db
mongod --dbpath ~/data/db &
sleep 2

# Spuštění Backendu
cd backend
source venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd ..
sleep 2

# Spuštění Frontendu
cd frontend
yarn start