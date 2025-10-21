/**
 * Test Data Fixtures for E2E Tests
 * Contains test user accounts and payment card details
 */

export const testUsers = {
  // Regular user for general authentication tests
  regular: {
    name: 'E2E Test User',
    email: 'e2etest@playwright.com',
    password: 'TestPass123!',
    phone: '1234567890',
    address: '123 Test Street, Test City, Test Country',
    securityAnswer: 'Blue'
  },
  
  // Admin user for admin route tests
  admin: {
    name: 'E2E Admin User',
    email: 'admin@playwright.com',
    password: 'AdminPass123!',
    phone: '0987654321',
    address: '456 Admin Avenue, Admin City, Admin Country',
    securityAnswer: 'Red'
  },
  
  // User for invalid login tests
  invalid: {
    email: 'nonexistent@playwright.com',
    password: 'WrongPassword123!'
  }
};

// Braintree test cards
export const testCards = {
  // Valid test card that will be approved
  valid: {
    number: '4111111111111111',
    expiry: '12/25',
    cvv: '123',
    postalCode: '12345'
  },
  
  // Test card that will be declined
  declined: {
    number: '4000000000000002',
    expiry: '12/25',
    cvv: '123',
    postalCode: '12345'
  }
};

// Helper function to generate unique email for each test run
export function generateUniqueEmail(prefix = 'test') {
  const timestamp = Date.now();
  return `${prefix}${timestamp}@playwright.com`;
}


export const homePageSelectors = {
  filtersColumn: ".filters",
  productCard: "div.card",
  productTitleInCard: "h5, h3, h2",
  loadMoreBtn: 'button:has-text("Loadmore")',
  productPriceInCard: ".card-price",
};

export const FILTER_LABELS = {
  categories: ["Electronics", "Book", "Clothing"],
  prices: [
    "$0 to 19",
    "$20 to 39",
    "$40 to 59",
    "$60 to 79",
    "$80 to 99",
    "$100 or more",
  ],
};
