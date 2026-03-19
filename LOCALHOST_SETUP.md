# Jak spustit My Car Garage na localhost

## Požadavky
- Node.js (verze 18+)
- Python 3.9+
- MongoDB (musí běžet na localhost:27017)

## 1. Nastavení Backend

### Přejdi do složky backend:
```bash
cd backend
```

### Nainstaluj závislosti:
```bash
pip install -r requirements.txt
```

### Vytvoř/uprav soubor `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=car_garage_db
CORS_ORIGINS=*
JWT_SECRET=super-secret-jwt-key-for-car-garage-2024
```

### Spusť backend:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend poběží na: http://localhost:8001

## 2. Nastavení Frontend

### Přejdi do složky frontend:
```bash
cd frontend
```

### Nainstaluj závislosti:
```bash
yarn install
# nebo
npm install
```

### Uprav soubor `.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Spusť frontend:
```bash
yarn start
# nebo
npm start
```

Frontend poběží na: http://localhost:3000

## 3. MongoDB

MongoDB musí běžet na localhost:27017.

### macOS (Homebrew):
```bash
brew services start mongodb-community
```

### Windows:
Spusť MongoDB z Services nebo:
```bash
mongod
```

### Linux:
```bash
sudo systemctl start mongod
```

## Testování

1. Otevři http://localhost:3000
2. Klikni na "Registrace"
3. Vyplň jméno, email a heslo
4. Klikni "Zaregistrovat se"

## Časté problémy

### "The string did not match the expected pattern"
- Backend neběží nebo frontend se nemůže připojit
- Zkontroluj, že backend běží na portu 8001
- Zkontroluj, že v frontend/.env máš správnou URL

### "Failed to fetch" nebo "Network Error"
- MongoDB neběží
- Backend neběží
- Špatná URL v frontend/.env

### CORS chyby
- Ujisti se, že backend má CORS_ORIGINS=* v .env
