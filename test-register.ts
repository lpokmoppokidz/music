// Test script to debug registration
import axios from 'axios';

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'debug@example.com',
      password: 'password123',
      displayName: 'Debug User'
    }, {
      withCredentials: true
    });
    console.log('Success:', response.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testRegister();
