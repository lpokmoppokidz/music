import axios from "axios";

async function testStream() {
  const songId = "69890c656654140d25a28336"; // From logs
  const url = `http://localhost:3001/api/convert/${songId}/stream`;

  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: {
        // No token yet, should fail with 401
      },
    });
    console.log("Status:", response.status);
  } catch (error: any) {
    console.log(
      "Failing as expected (no token):",
      error.response?.status,
      error.response?.data,
    );
  }
}

testStream();
