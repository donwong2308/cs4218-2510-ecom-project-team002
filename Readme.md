# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## 6. GitHub Workflow:

**CI Link:** https://github.com/cs4218/cs4218-2510-ecom-project-team002/actions/runs/18268970548/job/52008103051

## 7. Scope of Members:

- Donavon:

  - **Milestone 1 - Features:** Contact, Login, Payment, Policy, Registration, and Protected Routes
  - **Milestone 1 - Client related Files:** pages/Contact.js, pages/Auth/Login.js, pages/Policy.js, context/auth.js, pages/Auth/Register.js
  - **Milestone 1 - Server Related Files:**

    - controllers/productController.js
      1.  braintreeTokenController
      2.  brainTreePaymentController
    - helpers/authHelper.js
    - middlewares/authMiddleware.js
    - controllers/authController.js
      1.  registerController
      2.  loginController
      3.  forgotPasswordController
      4.  testController

  - **Milestone 2 - Integration Testing:**

    - **Phase 1: Foundation Layer (37 tests)** - Bottom-up integration testing

      - Contact Component Integration (5 tests) - Layout, Header, Footer, SEO metadata integration
      - Policy Component Integration (5 tests) - Cross-page navigation, content display
      - authHelper Utility Integration (12 tests) - Real bcrypt integration for password hashing/comparison
      - Database Configuration Integration (14 tests) - MongoDB connection, error handling, environment config
      - Files: `client/src/pages/__integration__/Contact.integration.test.js`, `client/src/pages/__integration__/Policy.integration.test.js`, `helpers/__integration__/authHelper.integration.test.js`, `config/__integration__/db.integration.test.js`

    - **Phase 2: Security & Navigation Layer (42 tests)** - Top-down integration testing

      - Protected Routes Integration (8 tests) - PrivateRoute, AdminRoute, authentication gates
      - Authentication Controller Integration (11 tests) - Register, login, forgot password flows
      - Middleware Chain Integration (11 tests) - JWT verification, admin authorization
      - Navigation Guards Integration (12 tests) - Header, AdminMenu, UserMenu role-based access
      - Files: `client/src/components/Routes/__integration__/ProtectedRoutes.integration.test.js`, `controllers/__integration__/authController.integration.test.js`, `middlewares/__integration__/authMiddleware.integration.test.js`, `client/src/components/__integration__/Navigation.integration.test.js`

    - **Phase 3: Business Logic Layer (113 tests)** - Middle-layer integration testing

      - Login Component Integration (18 tests) - Complete login flow, form validation, error handling
      - Register Component Integration (21 tests) - Registration workflow, security answer integration
      - ForgotPassword Component Integration (22 tests) - Password reset flow, security question validation (coverage: 36.84% → 100%)
      - CartPage Component Integration (26 tests) - Payment processing, Braintree integration, cart management (7 critical bugs found and fixed)
      - Auth Context Integration (24 tests) - Context provider/consumer, localStorage persistence, axios header sync
      - Files: `client/src/pages/Auth/__integration__/Login.integration.test.js`, `client/src/pages/Auth/__integration__/Register.integration.test.js`, `client/src/pages/Auth/__integration__/ForgotPassword.integration.test.js`, `client/src/pages/__integration__/CartPage.integration.test.js`, `client/src/context/__integration__/auth.integration.test.js`

    - **Bugs Found:** 11 critical bugs discovered and fixed through integration testing
    - **Code Coverage:** Backend 87.66%, Frontend components 94-100%
    - **Documentation:** `COMPREHENSIVE_INTEGRATION_TESTS_REPORT.md` (2,850+ lines of test code with 53% inline documentation)

  - **Milestone 2 - End-to-End Testing with Playwright (20 tests):**

    - **Suite 1: Authentication & User Journey (8 tests, 50.5s)** - Black box testing

      - New user registration flow, login flow, invalid credentials handling
      - Forgot password workflow, session persistence, logout flow
      - Multiple user types (regular vs admin) navigation
      - **Bug Found:** Missing Forgot Password page (discovered and fixed)
      - File: `playwright/e2e/auth-registration-login.spec.js`

    - **Suite 2: Payment & Checkout Flow (4 tests, 108s)** - Braintree integration testing

      - Guest user cart operations, login requirement for checkout
      - Complete payment with Braintree Drop-in UI (iframe-based card input)
      - Payment failure handling with declined test cards
      - **CRITICAL BUG Found:** Invalid payment processing vulnerability - system was accepting declined cards and creating orders without valid payment (discovered and fixed)
      - File: `playwright/e2e/payment-checkout.spec.js`

    - **Suite 3: Static Pages & Navigation (4 tests, 27.2s)** - Content verification

      - Contact page navigation and content display
      - Privacy policy page navigation and content
      - Cross-page navigation flow (Home → Contact → Policy → Home)
      - Header/footer consistency across all pages
      - File: `playwright/e2e/static-pages-navigation.spec.js`

    - **Suite 4: Protected Routes & Authorization (4 tests, 49.0s)** - Access control testing

      - Unauthenticated user access restrictions
      - Regular user vs admin authorization
      - Session timeout and re-authentication
      - Logout access clearing
      - File: `playwright/e2e/protected-routes.spec.js`

    - **Test Approach:** Black box testing - no knowledge of internal code, only user-visible UI elements and actions
    - **Browsers Tested:** Chromium
    - **Critical Security Findings:** Payment validation vulnerability (products shipped without valid payment)

- Hao Wen

  - Milestone 1 - Unit testing
    - Features: Admin Actions, Admin Dashboard, Admin View Products, Profile
    - Client related Files:
      - components/Form/CategoryForm.js
      - pages/admin/CreateCategory.js
      - pages/admin/CreateProduct.js
      - pages/admin/UpdateProduct.js
      - components/AdminMenu.js
      - pages/admin/AdminDashboard.js
      - pages/admin/Products.js
      - pages/user/Profile.js
    - Server Related Files:
      - controllers/categoryController.js
        1.  createCategoryController
        2.  updateCategoryController
        3.  deleteCategoryController
      - controllers/productController.js
        1.  createProductController
        2.  deleteProductController
        3.  updateProductController
  - Milestone 2 - Integration testing

    - Integration Suites Added (8 files):

      1.  DeletedProductNotInCart.integration.test.js
      2.  OrderSnapshotVsLiveProduct.integration.test.js
      3.  ProductImageUploadAndList.integration.test.js
      4.  Profile.integration.test.js
      5.  ProtectedAdminRoutes.integration.test.js
      6.  SearchAndFilterReflectsUpdates.integration.test.js
      7.  UpdateCategoryReflectsOnHome.integration.test.js
      8.  UpdateProduct.integration.test.js

    - E2E Suites Enhanced (2 files):
      - category-product.spec.js
        – Admin Category & Product CRUD (create/update/delete), UI validations (invalid price, duplicate handling), and image upload fallback
      - admin-permissions.spec.js
        – Admin-only dashboard/menu validation, non-admin redirection, and profile accessibility

- Shenghan

  - **Milestone 1 - Features:** Admin View Orders, Admin View Users, General, Home, Order
  - **Milestone 1 - Client related Files:**
    - pages/admin/AdminOrders.js
    - pages/admin/Users.js
    - components/Routes/Private.js
    - components/UserMenu.js
    - pages/user/Dashboard.js
    - pages/Homepage.js
    - pages/user/Orders.js
  - **Milestone 1 - Server Related Files:**

    - models/userModel.js
    - controllers/authController.js
      1.  updateProfileController
      2.  getOrdersController
      3.  getAllOrdersController
      4.  orderStatusController
    - models/orderModel.js

  - **Milestone 2 – Integration Testing (Backend):**

    - **Phase 1 – Database Models & User/Order Management** – Real in-memory MongoDB (MongoMemoryServer)

      - **User Model Tests** _(~16 tests)_: User creation with validation, email uniqueness enforcement, role assignment (default/admin), profile updates, deletion operations, authentication helper integration
        - Validates `name`, `email`, `password`, `phone`, `address` fields with proper defaults
        - Tests role-based access control (role 0 = user, role 1 = admin)
        - Verifies `createdAt` and `updatedAt` timestamps
        - Tests user queries by email/ID and update workflows
        - **File:** `models/__integration__/userModel.integration.test.js` _(~16 tests)_
      - **Order Model Tests** _(~16 tests)_: Order creation with products/payment/buyer info, status workflow (Not Process → Processing → Shipped → deliverd → cancel), payment tracking, order deletion
        - Validates order structure: `products[]`, `payment{}`, `buyer`, `status`, timestamps
        - Tests status transitions and order history retrieval
        - Verifies buyer-to-orders relationships
        - Tests payment information persistence and updates
        - **File:** `models/__integration__/orderModel.integration.test.js` _(~16 tests)_

    - **Phase 2 – Controller Layer** – Top-down request/response cycle with mocked models
      - Order and user management endpoints (`getOrders`, `getAllOrders`, `orderStatus`, `updateProfile`)
      - Request validation, error handling, and response formatting
      - **File:** (tested via E2E coverage)

  - **Milestone 2 – Integration Testing (Frontend):**

    - **Phase 1 – User Context & Authentication State Management** _(~10 tests)_

      - **Private Component** _(~11 tests)_: Route protection, authentication flow, Spinner integration, unauthenticated redirect handling
        - Validates authenticated user → protected content flow
        - Tests unauthenticated user → `/login` redirect with Spinner countdown
        - Verifies API call to verify token (GET `/api/v1/auth/user-auth`)
        - Confirms Outlet renders protected content only for authenticated users
        - Tests cleanup on unmount
        - **File:** `client/src/components/Routes/__integration__/Private.integration.test.js`
      - **Dashboard Component** _(~10 tests)_: User info display from auth context, Layout/UserMenu integration, auth hook integration
        - Validates user data display (name, email, address)
        - Tests Layout presence with correct page title
        - Verifies UserMenu navigation component rendering
        - Confirms auth context provides user information
        - **File:** `client/src/pages/user/__integration__/Dashboard.integration.test.js`
      - **UserMenu Component** _(~10 tests)_: Navigation links (Profile/Orders), React Router NavLink integration, active route highlighting
        - Validates Profile link (`/dashboard/user/profile`) and Orders link (`/dashboard/user/orders`)
        - Tests NavLink active state based on current route
        - Verifies accessibility attributes
        - Confirms Router context compatibility
        - **File:** `client/src/components/__integration__/UserMenu.integration.test.js`

    - **Phase 2 – Order Management & User Data Display**

      - **Orders Component** _(~12 tests)_: User order history retrieval, order detail display, date formatting with Moment.js
        - Tests GET `/api/v1/auth/user-orders` API integration
        - Validates order card rendering with product info, total, status, date
        - Confirms empty order state handling
        - Tests Moment.js date formatting for display
        - **File:** `client/src/pages/user/__integration__/Orders.integration.test.js`
      - **AdminOrders Component** _(~16 tests)_: Admin order listing, status update with Antd Select, payment/product info display
        - Tests GET `/api/v1/auth/all-orders` for admin (requires admin role)
        - Validates order list rendering with seller/buyer info
        - Tests status update workflow (dropdown → POST `/api/v1/auth/order-status/:orderId`)
        - Confirms Antd Select component integration for status changes
        - Verifies error handling and loading states
        - **File:** `client/src/pages/admin/__integration__/AdminOrders.integration.test.js`
      - **Users Component** _(~5 tests)_: Admin route protection, Users page structure, extensibility for future user management
        - Tests admin authentication requirement (role = 1)
        - Validates Layout and AdminMenu presence
        - Confirms page renders without errors
        - **File:** `client/src/pages/admin/__integration__/Users.integration.test.js`

    - **Phase 3 – Product Filtering & Homepage UX**

      - **HomePage Integration** _(~6 tests)_: Product display, category filtering, add-to-cart flow, Layout/Header/Footer integration
        - Tests product grid rendering from API
        - Validates cart context integration for add-to-cart
        - Tests category filter interactions
        - **File:** `client/src/pages/__integration__/HomePage.integration.test.js`

    - **Bugs Found:** N/A (backend/frontend integration stable)
    - **Code Coverage:** Backend (user/order models) ~95%, Frontend components ~90-100%
    - **Documentation:** Inline test documentation with phase breakdown and integration points

  - **Milestone 2 – End-to-End Testing with Playwright (3 new test suites, 21+ tests):**

    - **Suite 1: User Profile & Address Management (user-profile-integration.spec.js)** — Complete shopping workflow

      - User login with david@gmail.com
      - Browse homepage products
      - Add product to cart
      - Navigate to cart page
      - Update delivery address (street, apartment, city, state, zip)
      - Verify address persistence when returning to cart
      - **Status:** ✅ PASSING (6/6 phases)
      - **File:** `playwright/e2e/user-profile-integration.spec.js`

    - **Suite 2: User Order History Viewing (user-orders.spec.js)** — Order management workflow

      - User login and dashboard navigation
      - Navigate to orders page
      - View order history with order details
      - Check order pagination and filters
      - Verify order status and total display
      - **Status:** ✅ PASSING (6/6 phases)
      - **File:** `playwright/e2e/user-orders.spec.js`

    - **Suite 3: Product Details Page (product-details.spec.js)** — Product exploration workflow

      - User login and homepage browsing
      - Click product to view details
      - Verify product information display (name, price, description, images)
      - Check quantity selector functionality
      - View related products section
      - Add to cart from product details page
      - **Status:** ✅ PASSING (7/7 phases)
      - **File:** `playwright/e2e/product-details.spec.js`

    - **Suite 4: Homepage Filters (homepage.filters.spec.js)** — Filter & sorting workflow

      - Category filtering (single/multiple categories)
      - Price range filtering
      - Combined category + price filtering
      - Filter removal and list restoration
      - Reset filters functionality
      - **Status:** ✅ PASSING (6/6 tests)
      - **File:** `playwright/e2e/homepage.filters.spec.js`

    - **Test Approach:** Black box testing with real-world user workflows (login → browse → add → checkout)
    - **Browsers Tested:** Chromium
    - **Test Coverage:** User journey, order management, product details, and filtering workflows
    - **Overall E2E Pass Rate:** 90.2% (129/143 tests passing across all suites)

- Zoe

  - Features: Product retrieval, Cart
  - Client related Files:
    - context/cart.js
    - pages/CartPage.js
    - pages/ProductDetails.js
    - pages/CategoryProduct.js
  - Server Related Files:
    - controllers/productController.js
      1. getProductController
      2. getSingleProductController
      3. productPhotoController
      4. productFiltersController
      5. productCountController
      6. productListController
      7. searchProductController
      8. realtedProductController
      9. productCategoryController
      - models/productModel.js
    - models/productModel.js

- Zoebelle:

  - **Milestone 1 – Features:** Category Listing & Single-Category View, Site Layout, Spinner UX, Static Pages, Global Search

  - **Milestone 1 – Client Related Files:**

    - hooks/useCategory.js
    - pages/Categories.js
    - components/Header.js
    - components/Footer.js
    - components/Layout.js
    - components/Spinner.js
    - pages/About.js
    - pages/Pagenotfound.js
    - components/Form/SearchInput.js
    - context/search.js
    - pages/Search.js

  - **Milestone 1 – Server Related Files:**

    - controllers/categoryController.js
      1. categoryController
      2. singleCategoryController
    - models/categoryModel.js
    - config/db.js

  - **Milestone 2 – Integration Testing (Backend):**

    - **Phase 1 – Database Configuration & Model Layer** – real in-memory MongoDB (MongoMemoryServer)
      - Validates `connectDB()` via `MONGO_URL`; confirms connection (readyState=1) and boot log
      - Verifies `categoryModel` persistence (create/find), slug normalization, unique-index behaviour
      - **Files:**
        - `config/__integration__/db.integration.test.js` _(~3 tests)_
        - `models/__integration__/categoryModel.integration.test.js` _(~3 tests)_
    - **Phase 2 – Controller Layer** – isolated controller tests (mocked model + `slugify`)
      - `createCategoryController` (401/200/201/500), `updateCategoryController` (200/500), `deleteCategoryController` (200/500)
      - `categoryController` (list 200 / err 500), `singleCategoryController` (by slug 200 / err 500)
      - **File:** `controllers/__integration__/categoryController.integration.test.js` _(~12 tests)_
    - **Bugs Found:** N/A (backend integration stable)
    - **Code Coverage:** Backend (category modules) high; see coverage report
    - **Documentation:** `COMPREHENSIVE_INTEGRATION_TESTS_REPORT.md` (backend section complete)

  - **Milestone 2 – Integration Testing (Frontend):**

    - **Phase 1 – Data Hook & API Integration (useCategory)** _(~13 tests)_
      - `useState`/`useEffect` flow; single-run via empty deps; async/await; strict-mode resilience
      - Axios endpoint `/api/v1/category/get-category`; success + failure paths
      - Handles `[]`, `null`, `undefined`, minimal/full records; multiple instances; unmount/cleanup safety
      - **File:** `client/src/hooks/__integration__/useCategory.integration.test.js`
    - **Phase 2 – Frame/Layout & Shared Context**
      - **Header** _(~12 tests)_: Navbar + routing (`/`, `/cart`, categories dropdown), auth states (guest/user/admin), logout (localStorage + toast), cart badge, responsive classes  
        **File:** `client/src/components/__integration__/Header.integration.test.js`
      - **Footer** _(~11 tests)_: Structure, links (`/about`, `/contact`, `/policy`), separators, accessibility, standalone render  
        **File:** `client/src/components/__integration__/Footer.integration.test.js`
      - **Layout** _(~13 tests)_: Header/Footer composition, `<main>` semantics, Helmet metadata (default/custom/partial), Toaster, providers wiring  
        **File:** `client/src/components/__integration__/Layout.integration.test.js`
      - **Search Context** _(~3 tests)_: Provides/syncs state across consumers; supports partial updates; **no localStorage side-effects**  
        **File:** `client/src/context/__integration__/search.context.integration.test.js`
    - **Phase 3 – Pages & UX Flows**
      - **Categories page** _(~5 tests)_: Works with `useCategory`; header/footer present; buttons link `/category/<slug>`; grid classes; safe empty state  
        **File:** `client/src/pages/__integration__/Categories.integration.test.js`
      - **Spinner redirect** _(~14 tests)_: Countdown (3→0), `useNavigate` + `useLocation`; custom `path`; lifecycle cleanup; ARIA; responsive classes  
        **File:** `client/src/components/__integration__/Spinner.integration.test.js`
      - **About page** _(~4 tests)_: Layout present; image (100% width) left, text right (`.col-md-6` / `.col-md-4`), Helmet OK, nav links OK  
        **File:** `client/src/pages/__integration__/About.integration.test.js`
      - **PageNotFound (404)** _(~5 tests)_: Layout present; `404` + “Oops ! Page Not Found”; **Go Back** → `/`; Helmet OK; nav links OK  
        **File:** `client/src/pages/__integration__/Pagenotfound.integration.test.js`
      - **Search Results page** _(~12 tests)_: Layout present; headline “Search Resuts”; empty state “No Products Found”; results container structure; nav links OK  
        **File:** `client/src/pages/__integration__/Search.integration.test.js`
      - **SearchInput component** _(behaviour covered via Header tests)_: Prevents empty API call; updates search context; navigates `/search`  
        **Source:** `client/src/components/Form/SearchInput.js`
    - **Bugs Found:** N/A (frontend integration stable)
    - **Code Coverage:** Frontend components/hooks high (to be merged in final report)
    - **Documentation:** `COMPREHENSIVE_INTEGRATION_TESTS_REPORT.md` (frontend section in progress)

  - **Milestone 2 – End-to-End Testing with Playwright:**

    - **Suite 1: Search Functionality (~20+ tests, ~stable) – SearchInput + Search Results + Context + Resilience**
      - **SearchInput (navbar):** form renders (placeholder/aria), value typing/clearing, submit via button/Enter, empty-search navigates to `/search`
      - **Search Results page:** title set to “Search results”, main heading “Search Resuts” _(typo validated as-is)_, empty state “No Products Found”, result count (“Found X”|empty), product-card structure (image/title/desc/buttons)
      - **Interactions:** “More Details”/“ADD TO CART” buttons visible & styled when cards exist
      - **Context & Navigation:** state across sessions (home → search → home), multiple sequential searches
      - **Network control (route interception):** force 200 with [] (no results), force 200 with mocked results, verify render & counters
      - **Robust error handling:** simulate 404/500/502/503/504 responses; app remains stable (no blank screen), navbar/footer/search still visible & usable; user stays on current page for server errors; input value persists; retry remains functional; no unexpected alert popups
      - **File:** `playwright/e2e/search-functionality.spec.js`
    - **Suite 2: Header · Footer · Spinner · Layout (24+ tests)** — Frame + Navigation + Helmet + Resilience

      - **Header (logged out):** branding/brand link, Home/Register/Login/Cart links, Categories dropdown points to `/categories`, search input visible & submits (Enter/button), mobile navbar toggler.
      - **Header (logged in):** registers user if needed, shows username dropdown (Dashboard/Logout), hides Register/Login, cart badge visible.
      - **Categories dropdown UX:** includes **All Categories**; items link to `/category/:slug`; names match Categories page; selecting a category navigates correctly; safe when no categories (dropdown still opens with All Categories).
      - **Footer:** copyright text (“All Rights Reserved © TestingComp”), About/Contact/Privacy links present and navigate.
      - **Spinner (restricted routes):** appears when hitting `/dashboard/user` unauthenticated; countdown starts at 3 and decrements; auto-redirects to `/login`; page remains stable during countdown.
      - **Layout:** persists across refresh; Helmet titles change per page (Home/About/Contact); consistent frame on `/, /about, /contact, /policy, /categories`; 404 page integrates Header/Footer and correct tab title; no blank screens or error popups.
      - **Utilities:** robust `navigateWithRetry`, test user bootstrap (`loginUser` with unique email).
      - **File:** `playwright/e2e/header-footer.spec.js`

    - **Suite 3: Database Error Handling (5 tests)** — Resilience to backend failures
      - **Homepage graceful degradation (503 on products & categories):** app renders, no crash; optional error UI detected; navbar usable.
      - **Search fallback (500 on `/api/v1/product/search/**`):** submit search → still lands on `/search`; shows “No Products Found” or an error message.
      - **Auth fallback (503 on `/api/v1/auth/**`):\*\* login attempt shows visible error feedback; page stays stable.
      - **Product details fallback (500 on `/api/v1/product/get-product/**`):** clicking **More Details\*\* handles error/404 gracefully (no crash).
      - **Recovery path:** start with 503 on products → remove route → reload → product cards appear if API recovers.
      - **File:** `playwright/e2e/database-error.spec.js`
    - **Suite 4: Database Connectivity (7 tests)** — Verifies live DB-backed flows and graceful behavior

      - **Homepage loads products (sanity):** waits for products grid/cards; validates first card, name, and (if present) price format.
      - **Categories load:** confirms categories render (any of `[data-testid="category"], .category, .ant-checkbox-wrapper`).
      - **Auth path (negative):** login with bad creds yields visible error feedback (proves API/DB responded).
      - **Search path:** submit search → lands on `/search` with “Search Resuts” heading (DB-backed search).
      - **Product details:** “More Details” opens `/product/:slug|id`; verifies title/content present.
      - **Injected DB error handling:** intercept `/api/v1/product/**` with 500; page remains stable (no crash/blank screen).
      - **Performance check:** measures homepage → product area readiness (<10s target) as coarse DB perf signal.
      - **File:** `playwright/e2e/database-connectivity.spec.js`

    - **Suite 5: Category Functionality (8 tests)** — Verifies Categories page UX, hook wiring, API contracts, and navigation

      - **Categories page loads:** header/footer present; heading visible; basic layout sanity.
      - **Lists categories:** waits for `.btn-primary` buttons; validates text presence and `/category/:slug` hrefs.
      - **useCategory hook integration:** observes `GET /api/v1/category/get-category` request; asserts response is rendered.
      - **categoryController endpoint:** confirms 200 + `application/json` on `/api/v1/category/get-category`; checks UI renders list.
      - **Data integrity:** spot-checks first N categories (non-empty label, valid slug link, clickable).
      - **singleCategoryController navigation:** clicking a category navigates to `/category/:slug`; detects `GET /api/v1/category/single-category/:slug` if issued.
      - **Single category page content:** verifies page chrome; products or a “no products” message; title is present.
      - **Invalid slug handling:** visit `/category/nonexistent-...`; confirms graceful UX (404 / error message) with header/footer intact.
      - **Navigation & responsiveness:** multiple category clicks complete without console/errors; app remains interactive post-nav.
      - **File:** `playwright/e2e/category-functionality.spec.js`

    - **Suite 6: 404 Page Not Found (8 tests)** — Verifies error page UX, layout frame, navigation recovery, and a11y

      - **Browser tab title:** visiting an invalid route shows `"go back- page not found"`.
      - **Layout frame:** header (`.navbar` / brand “🛒 Virtual Vault”) and footer (`.footer`) render consistently.
      - **Main content structure:** `.pnf` container with `.pnf-title` (“404”) and `.pnf-heading` (“Oops ! Page Not Found”).
      - **Error messaging:** correct classes and copy for title/heading.
      - **Go Back CTA:** `.pnf-btn` is visible, has `href="/"`, and navigates home on click.
      - **Nav links from 404:** header and footer links (Home, Categories → All Categories, About, etc.) work as escape routes.
      - **Responsive checks:** page remains readable/structured at desktop (1200×800), tablet (768×1024), and mobile (375×667).
      - **Multiple invalid URLs:** common bad paths all resolve to the same 404 UI.
      - **Accessibility:** `h1.pnf-title` and `h2.pnf-heading` present; “Go Back” link has accessible text.
      - **File:** `playwright/e2e/404-page.spec.js`

    - **Suite 7: About Page Component (8 tests)** — Verifies content layout, brand consistency, and responsive behavior
      - **Browser tab title:** confirms `"About us - Ecommerce app"` displays correctly.
      - **Layout frame:** header (`.navbar-brand` 🛒 Virtual Vault) and footer (`.footer`) render; copyright visible.
      - **Main content structure:** `.row.contactus` container with `.col-md-6` image and `.col-md-4` text columns.
      - **Image display:** `img[alt="contactus"]` visible with `src="/images/about.jpeg"` and `width:100%` styling.
      - **Text content:** `.text-justify.mt-2` visible and non-empty (“Add text”), verifies style classes.
      - **Navigation links:** header (Home, Categories → All Categories) and footer (Contact) routes function.
      - **Responsive design:** desktop (1200×800), tablet (768×1024), mobile (375×667) views preserve layout.
      - **Error-free render:** no console errors, blank screens, or alert pop-ups after load.
      - **File:** `playwright/e2e/about-page.spec.js`

  Test Approach: Black-box (UI-visible behaviours only; no internal code access)
  Browsers Tested: Chromium (primary), Firefox (compatibility check), WebKit (optional regression)
  Critical Security Findings:

### AI Usage Declaration:

- Donavon: AI tools were used to generate unit test cases, refine comments for the unit tests and documentation.
- Hao Wen: AI tools were used to generate unit test cases, refine comments for the unit tests and documentation.
- David: AI tools were used to generate unit test cases, refine comments for the unit tests and documentation.
- Zoe: AI tools were used to generate unit test cases, mostly mocks
- Zoebelle: AI tools were used to generate unit test cases, refine comments for the unit tests and documentation.
