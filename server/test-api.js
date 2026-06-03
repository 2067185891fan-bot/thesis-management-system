// Simple API test script
const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('Testing API endpoints...\n');

  // Test health check
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✓ Health check:', data);
  } catch (error) {
    console.log('✗ Health check failed:', error.message);
  }

  // Test login
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'STUD-2024081', password: 'password123' })
    });
    const data = await response.json();
    console.log('✓ Login:', data.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('✗ Login failed:', error.message);
  }

  // Test get topics
  try {
    const response = await fetch(`${API_BASE}/topics`);
    const data = await response.json();
    console.log('✓ Get topics:', data.topics?.length || 0, 'topics found');
  } catch (error) {
    console.log('✗ Get topics failed:', error.message);
  }

  console.log('\nTests completed!');
}

testAPI();
