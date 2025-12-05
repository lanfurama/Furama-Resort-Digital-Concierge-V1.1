// Script to check if API server is running before starting dev server
import http from 'http';

const API_URL = 'http://localhost:3000/health';
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

function checkAPI(retries = 0) {
  return new Promise((resolve, reject) => {
    const req = http.get(API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ API server is running!');
        resolve(true);
      } else {
        reject(new Error(`API returned status ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      if (retries < MAX_RETRIES) {
        console.log(`⏳ Waiting for API server... (${retries + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkAPI(retries + 1).then(resolve).catch(reject);
        }, RETRY_DELAY);
      } else {
        console.error('❌ API server is not running!');
        console.error('Please run "npm run dev:api" first in another terminal.');
        reject(new Error('API server not available'));
      }
    });

    req.setTimeout(2000, () => {
      req.destroy();
      if (retries < MAX_RETRIES) {
        console.log(`⏳ Waiting for API server... (${retries + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkAPI(retries + 1).then(resolve).catch(reject);
        }, RETRY_DELAY);
      } else {
        console.error('❌ API server is not running!');
        console.error('Please run "npm run dev:api" first in another terminal.');
        reject(new Error('API server not available'));
      }
    });
  });
}

checkAPI()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
