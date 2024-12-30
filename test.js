import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
//   vus: 10000,
//   duration: '1m',
  cloud: {
    // Project: test
    projectID: 3718658,
    // Test runs with the same name groups test runs together.
    name: 'Test notification'
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },

  stages: [
    { duration: '10s', target: 100000 }, // Ramp up to 10 VUs in 10 seconds
  
  ],

};

export default function() {
  http.get('http://localhost:1024/api/notifications/66f2e17c4c40cfb387d79cf9');
  sleep(1);
}