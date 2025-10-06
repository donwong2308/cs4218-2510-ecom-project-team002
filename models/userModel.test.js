import fs from "fs";

describe("User Model", () => {
  let fileContent;

  beforeAll(() => {
    // Read the userModel.js file
    fileContent = fs.readFileSync("./models/userModel.js", "utf8");
  });

  test("schema has the correct field definitions", () => {
    // Check for name field definition
    expect(fileContent).toMatch(
      /name:\s*{\s*type:\s*String,\s*required:\s*true,\s*trim:\s*true,\s*}/
    );

    // Check for email field definition
    expect(fileContent).toMatch(
      /email:\s*{\s*type:\s*String,\s*required:\s*true,\s*unique:\s*true,\s*}/
    );

    // Check for password field definition
    expect(fileContent).toMatch(
      /password:\s*{\s*type:\s*String,\s*required:\s*true,\s*}/
    );

    // Check for phone field definition
    expect(fileContent).toMatch(
      /phone:\s*{\s*type:\s*String,\s*required:\s*true,\s*}/
    );

    // Check for address field definition
    expect(fileContent).toMatch(
      /address:\s*{\s*type:\s*{},\s*required:\s*true,\s*}/
    );

    // Check for answer field definition
    expect(fileContent).toMatch(
      /answer:\s*{\s*type:\s*String,\s*required:\s*true,\s*}/
    );

    // Check for role field definition
    expect(fileContent).toMatch(
      /role:\s*{\s*type:\s*Number,\s*default:\s*0,\s*}/
    );
  });

  test("schema has timestamps enabled", () => {
    expect(fileContent).toMatch(/{\s*timestamps:\s*true\s*}/);
  });

  test("model is named 'users'", () => {
    expect(fileContent).toMatch(/mongoose\.model\(\s*["']users["']/);
  });
});
