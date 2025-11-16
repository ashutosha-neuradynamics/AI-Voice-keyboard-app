// Load environment variables for tests
require('dotenv').config({ path: '.env.test' })

// Increase timeout for database operations
jest.setTimeout(10000)
