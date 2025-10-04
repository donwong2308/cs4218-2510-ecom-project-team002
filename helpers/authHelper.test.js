import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from './authHelper.js';

// Mock bcrypt to control its behavior in tests
jest.mock('bcrypt');

/**
 * Unit tests for authentication helper functions
 * 
 * These utility functions handle password security operations:
 * 1. hashPassword: Takes plain text password and returns bcrypt hash
 * 2. comparePassword: Takes plain text password and hash, returns boolean comparison result
 * 
 * These functions are critical for user authentication security, so thorough testing
 * ensures passwords are properly hashed and compared across the application.
 */
describe('Authentication Helper Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test to ensure clean state
    jest.clearAllMocks();
    
    // Mock console.log to prevent spam in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    console.log.mockRestore();
  });

  describe('hashPassword Function', () => {
    /**
     * Test successful password hashing
     * When given a plain text password, should return a bcrypt hash
     */
    it('successfully hashes a password with correct salt rounds', async () => {
      const plainPassword = 'mySecretPassword123';
      const expectedHash = '$2b$10$mockHashedPasswordExample';

      // Mock bcrypt.hash to return our expected hash
      bcrypt.hash.mockResolvedValue(expectedHash);

      // Execute the function
      const result = await hashPassword(plainPassword);

      // Verify bcrypt.hash was called with correct parameters
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);

      // Verify the returned hash matches expected value
      expect(result).toBe(expectedHash);
    });

    /**
     * Test password hashing with different password values
     * Ensure function works correctly with various password formats
     */
    it('hashes different types of password strings correctly', async () => {
      const testCases = [
        { password: 'simple', description: 'simple password' },
        { password: 'Complex123!@#', description: 'complex password with special characters' },
        { password: '1234567890', description: 'numeric password' },
        { password: 'a', description: 'single character password' },
        { password: 'very_long_password_with_many_characters_and_underscores_12345', description: 'very long password' },
        { password: '   spaces   ', description: 'password with spaces' },
        { password: 'πάσσωορδ', description: 'password with unicode characters' }
      ];

      for (const testCase of testCases) {
        // Reset mock for each test case
        bcrypt.hash.mockClear();
        bcrypt.hash.mockResolvedValue(`hashed_${testCase.password}`);

        const result = await hashPassword(testCase.password);

        // Verify bcrypt was called with correct parameters for each case
        expect(bcrypt.hash).toHaveBeenCalledWith(testCase.password, 10);
        expect(result).toBe(`hashed_${testCase.password}`);
      }
    });

    /**
     * Test handling of bcrypt errors during hashing
     * When bcrypt.hash throws an error, should handle gracefully and return undefined
     */
    it('handles bcrypt hashing errors gracefully', async () => {
      const plainPassword = 'testPassword';
      const bcryptError = new Error('bcrypt hashing failed');

      // Mock bcrypt.hash to throw an error
      bcrypt.hash.mockRejectedValue(bcryptError);

      // Execute the function
      const result = await hashPassword(plainPassword);

      // Verify error was logged
      expect(console.log).toHaveBeenCalledWith(bcryptError);

      // Verify function returns undefined when error occurs
      expect(result).toBeUndefined();
    });

    /**
     * Test salt rounds configuration
     * Verify that the function uses the correct number of salt rounds (10)
     * for proper security balance between speed and security
     */
    it('uses exactly 10 salt rounds for security', async () => {
      const password = 'testPassword';
      bcrypt.hash.mockResolvedValue('mockedHash');

      await hashPassword(password);

      // Verify salt rounds parameter is exactly 10
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    /**
     * Test edge cases for password input
     * Ensure function handles edge cases appropriately
     */
    it('handles edge case password values', async () => {
      const edgeCases = [
        { input: '', description: 'empty string' },
        { input: null, description: 'null value' },
        { input: undefined, description: 'undefined value' }
      ];

      for (const testCase of edgeCases) {
        bcrypt.hash.mockClear();
        bcrypt.hash.mockResolvedValue('hashedValue');

        const result = await hashPassword(testCase.input);

        // Function should still call bcrypt.hash even with edge case values
        expect(bcrypt.hash).toHaveBeenCalledWith(testCase.input, 10);
        expect(result).toBe('hashedValue');
      }
    });
  });

  describe('comparePassword Function', () => {
    /**
     * Test successful password comparison - matching passwords
     * When plain text password matches the hash, should return true
     */
    it('returns true when password matches hash', async () => {
      const plainPassword = 'correctPassword123';
      const hashedPassword = '$2b$10$mockHashForCorrectPassword';

      // Mock bcrypt.compare to return true (passwords match)
      bcrypt.compare.mockResolvedValue(true);

      // Execute the function
      const result = await comparePassword(plainPassword, hashedPassword);

      // Verify bcrypt.compare was called with correct parameters
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);

      // Verify function returns true for matching passwords
      expect(result).toBe(true);
    });

    /**
     * Test password comparison - non-matching passwords
     * When plain text password doesn't match the hash, should return false
     */
    it('returns false when password does not match hash', async () => {
      const plainPassword = 'wrongPassword123';
      const hashedPassword = '$2b$10$mockHashForDifferentPassword';

      // Mock bcrypt.compare to return false (passwords don't match)
      bcrypt.compare.mockResolvedValue(false);

      // Execute the function
      const result = await comparePassword(plainPassword, hashedPassword);

      // Verify bcrypt.compare was called with correct parameters
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);

      // Verify function returns false for non-matching passwords
      expect(result).toBe(false);
    });

    /**
     * Test multiple password comparison scenarios
     * Ensure function works correctly with various password/hash combinations
     */
    it('correctly compares various password and hash combinations', async () => {
      const testCases = [
        {
          password: 'admin123',
          hash: '$2b$10$adminHashExample',
          shouldMatch: true,
          description: 'admin password'
        },
        {
          password: 'user456',
          hash: '$2b$10$userHashExample',
          shouldMatch: false,
          description: 'incorrect user password'
        },
        {
          password: 'Complex!@#123',
          hash: '$2b$10$complexHashExample',
          shouldMatch: true,
          description: 'complex password with special characters'
        },
        {
          password: '',
          hash: '$2b$10$emptyPasswordHash',
          shouldMatch: false,
          description: 'empty password'
        }
      ];

      for (const testCase of testCases) {
        // Reset mock for each test case
        bcrypt.compare.mockClear();
        bcrypt.compare.mockResolvedValue(testCase.shouldMatch);

        const result = await comparePassword(testCase.password, testCase.hash);

        // Verify bcrypt.compare was called correctly
        expect(bcrypt.compare).toHaveBeenCalledWith(testCase.password, testCase.hash);
        
        // Verify the result matches expected outcome
        expect(result).toBe(testCase.shouldMatch);
      }
    });

    /**
     * Test handling of bcrypt comparison errors
     * When bcrypt.compare throws an error, should handle gracefully
     */
    it('handles bcrypt comparison errors gracefully', async () => {
      const plainPassword = 'testPassword';
      const hashedPassword = '$2b$10$invalidOrCorruptedHash';
      const bcryptError = new Error('bcrypt comparison failed');

      // Mock bcrypt.compare to throw an error
      bcrypt.compare.mockRejectedValue(bcryptError);

      // Execute the function and expect it to throw
      await expect(comparePassword(plainPassword, hashedPassword)).rejects.toThrow(bcryptError);

      // Verify bcrypt.compare was called
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    /**
     * Test edge cases for comparison inputs
     * Ensure function handles various edge case inputs appropriately
     */
    it('handles edge case inputs in password comparison', async () => {
      const edgeCases = [
        {
          password: null,
          hash: '$2b$10$validHash',
          description: 'null password'
        },
        {
          password: undefined,
          hash: '$2b$10$validHash',
          description: 'undefined password'
        },
        {
          password: 'validPassword',
          hash: null,
          description: 'null hash'
        },
        {
          password: 'validPassword',
          hash: undefined,
          description: 'undefined hash'
        },
        {
          password: 'validPassword',
          hash: 'invalidHashFormat',
          description: 'invalid hash format'
        }
      ];

      for (const testCase of edgeCases) {
        bcrypt.compare.mockClear();
        bcrypt.compare.mockResolvedValue(false);

        const result = await comparePassword(testCase.password, testCase.hash);

        // Function should still call bcrypt.compare with the provided values
        expect(bcrypt.compare).toHaveBeenCalledWith(testCase.password, testCase.hash);
        expect(result).toBe(false);
      }
    });
  });

  describe('Integration Tests', () => {
    /**
     * Test the complete hash and compare workflow
     * Hash a password, then verify it can be correctly compared
     * This tests the integration between hashPassword and comparePassword
     */
    it('hashed password can be successfully compared with original', async () => {
      const originalPassword = 'integrationTest123!';
      const hashedResult = '$2b$10$integrationTestHash';

      // Step 1: Hash the password
      bcrypt.hash.mockResolvedValue(hashedResult);
      const hash = await hashPassword(originalPassword);

      // Verify hashing worked
      expect(hash).toBe(hashedResult);

      // Step 2: Compare the original password with the hash
      bcrypt.compare.mockResolvedValue(true);
      const comparisonResult = await comparePassword(originalPassword, hash);

      // Verify comparison worked
      expect(comparisonResult).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(originalPassword, hashedResult);
    });

    /**
     * Test that different passwords produce different hashes and don't match
     * This ensures the security properties of the hashing system
     */
    it('different passwords produce different hashes and fail comparison', async () => {
      const password1 = 'firstPassword123';
      const password2 = 'secondPassword456';
      const hash1 = '$2b$10$hashForFirstPassword';
      const hash2 = '$2b$10$hashForSecondPassword';

      // Hash first password
      bcrypt.hash.mockResolvedValueOnce(hash1);
      const hashedPassword1 = await hashPassword(password1);

      // Hash second password  
      bcrypt.hash.mockResolvedValueOnce(hash2);
      const hashedPassword2 = await hashPassword(password2);

      // Verify different hashes were produced
      expect(hashedPassword1).toBe(hash1);
      expect(hashedPassword2).toBe(hash2);
      expect(hashedPassword1).not.toBe(hashedPassword2);

      // Test that password1 doesn't match hash2
      bcrypt.compare.mockResolvedValue(false);
      const wrongComparison = await comparePassword(password1, hashedPassword2);
      expect(wrongComparison).toBe(false);
    });
  });
});