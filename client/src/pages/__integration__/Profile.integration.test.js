import React from "react";
import axios from "axios";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

// mock auth hook to control auth state and setter
jest.mock("../../context/auth", () => ({ useAuth: jest.fn() }));

// minimal Layout to avoid rendering full header/footer
jest.mock("../../components/Layout", () => ({ children, title }) => require("react").createElement("div", null, children));

/**
 * Profile.integration.test.js
 * 
 * Lgin/Registration -> Profile 
 *
 * Purpose:
 * - Simulate a login/registration flow and verify the Profile page reflects
 *   the authenticated user's data. Then simulate a profile update and assert
 *   the auth context and localStorage are updated accordingly.
 *
 * Scope:
 * - Uses mocked `axios` and a mocked `useAuth` hook to run in JSDOM without
 *   network access. Focused on front-end data flow and localStorage update.
 */

describe("Profile page integration (mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset localStorage for each test
    localStorage.clear();
  });

  test("login/registration -> profile displays auth data and updates persist", async () => {
    const { useAuth } = require("../../context/auth");
    const Profile = require("../../pages/user/Profile").default;

    // initial auth (user logged in via prior login/registration)
    const initialUser = { id: "u1", name: "Alice", email: "alice@example.com", phone: "123", address: "Old St" };
    const authState = [{ user: initialUser, token: "tok-1" }, jest.fn()];
    // mock useAuth to return the auth state and a spy setter
    useAuth.mockReturnValue(authState);

    // axios.put will simulate profile update response
    const updatedUser = { ...initialUser, name: "Alice Updated", phone: "999", address: "New St" };
    axios.put.mockImplementation((url, body) => {
      if (url === "/api/v1/auth/profile") {
        return Promise.resolve({ data: { updatedUser } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    // pre-seed localStorage with auth as the app would after login
    localStorage.setItem("auth", JSON.stringify({ user: initialUser, token: "tok-1" }));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

  // fields populated from auth.user via useEffect
  const nameInput = await screen.findByPlaceholderText(/Enter Your Name/i);
  expect(nameInput).toHaveValue("Alice");
  const emailInput = screen.getByDisplayValue("alice@example.com");
  expect(emailInput).toBeInTheDocument();

    // change the name, phone and address
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), { target: { value: "Alice Updated" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), { target: { value: "999" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Address/i), { target: { value: "New St" } });

    // submit the profile form
    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    // wait for axios.put to have been called and for localStorage to be updated
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", expect.any(Object)));

    // ensure setAuth was called to update the context (useAuth setter is the second element)
    const setAuth = authState[1];
    expect(setAuth).toHaveBeenCalled();

    // localStorage should contain updated user
    const ls = JSON.parse(localStorage.getItem("auth"));
    expect(ls.user.name).toBe("Alice Updated");
    expect(ls.user.phone).toBe("999");
    expect(ls.user.address).toBe("New St");
  });
});
