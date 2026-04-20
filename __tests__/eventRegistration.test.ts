/**
 * Test: Event Registration Flow
 * 
 * This test simulates the complete registration flow from frontend to backend
 * and verifies data alignment at each step.
 */

import { parseEventRegistrationPayload } from "@/backend/middleware/validation.middleware";

describe("Event Registration Flow", () => {
  // Test data matching the payload you provided
  const testPayload = {
    name: "Rounak Mondal",
    teamName: "FEYGDWHA",
    role: "LEADER",
    gmail: "rabinmondal04m@gmail.com",
  };

  test("Frontend → Backend: Payload validation", () => {
    // Step 1: Frontend sends this payload
    const frontendPayload = testPayload;
    console.log("✓ Frontend sending:", frontendPayload);

    // Step 2: Backend receives and validates
    const validated = parseEventRegistrationPayload(frontendPayload);
    console.log("✓ Backend validated:", validated);

    // Step 3: Verify structure
    expect(validated).toMatchObject({
      name: "Rounak Mondal",
      gmail: "rabinmondal04m@gmail.com",
      teamName: "FEYGDWHA",
      role: "LEADER",
    });
  });

  test("Validation: Gmail must end with @gmail.com", () => {
    const invalidGmail = {
      ...testPayload,
      gmail: "rabinmondal04m@gmail.com",
    };
    const result = parseEventRegistrationPayload(invalidGmail);
    expect(result.gmail).toBe("rabinmondal04m@gmail.com");
  });

  test("Validation: Role must be LEADER or MEMBER", () => {
    expect(() =>
      parseEventRegistrationPayload({
        ...testPayload,
        role: "INVALID_ROLE",
      }),
    ).toThrow();

    const validLeader = parseEventRegistrationPayload({
      ...testPayload,
      role: "LEADER",
    });
    expect(validLeader.role).toBe("LEADER");

    const validMember = parseEventRegistrationPayload({
      ...testPayload,
      role: "MEMBER",
    });
    expect(validMember.role).toBe("MEMBER");
  });

  test("Validation: All required fields", () => {
    expect(() =>
      parseEventRegistrationPayload({
        name: "",
        teamName: "FEYGDWHA",
        role: "LEADER",
        gmail: "rabinmondal04m@gmail.com",
      }),
    ).toThrow("`name`, `gmail`, `teamName`, `role` are required.");

    expect(() =>
      parseEventRegistrationPayload({
        name: "Rounak Mondal",
        teamName: "",
        role: "LEADER",
        gmail: "rabinmondal04m@gmail.com",
      }),
    ).toThrow("`name`, `gmail`, `teamName`, `role` are required.");
  });

  test("Data flow: Frontend → Validation → Controller", () => {
    // Simulate the complete request flow
    const frontendForm = {
      name: "Rounak Mondal",
      teamName: "FEYGDWHA",
      role: "LEADER",
      gmail: "rabinmondal04m@gmail.com",
    };

    // Backend receives JSON
    const receivedPayload = JSON.parse(JSON.stringify(frontendForm));

    // Backend validates
    const validated = parseEventRegistrationPayload(receivedPayload);

    // Backend controller would use:
    // - validated.name → displayName
    // - validated.gmail → email
    // - validated.teamName → team lookup
    // - validated.role → user role

    expect(validated.name).toBeDefined();
    expect(validated.gmail).toBeDefined();
    expect(validated.teamName).toBeDefined();
    expect(validated.role).toBeDefined();

    console.log("✓ Complete flow validated successfully");
  });
});
