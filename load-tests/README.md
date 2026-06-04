# Load Testing with k6

## Install k6
- Windows: `winget install k6`
- Mac: `brew install k6`
- Linux: `sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6`

## Run Flash Sale Test
1. Create a test user: `loadtest@ticketforge.com` / `LoadTest123!`
2. Get a real event ID and pricing ID from your database
3. Replace `REPLACE_WITH_REAL_EVENT_ID` and `REPLACE_WITH_REAL_PRICING_ID` in `flash-sale.js`
4. Run: `k6 run load-tests/flash-sale.js`

## Expected Results
- 95% of requests under 2 seconds
- Less than 10% error rate
- Redis distributed locks should prevent overselling