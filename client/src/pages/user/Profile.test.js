import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";

// Mocks must be set up before importing the component under test
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/UserMenu", () => () => <div>UserMenu</div>);

const mockSetAuth = jest.fn();
const initialUser = {
  name: "John",
  email: "john@example.com",
  phone: "123456",
  address: "Old Address",
};
jest.mock("../../context/auth", () => ({
  useAuth: () => [{ user: initialUser, token: "tok" }, mockSetAuth],
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("axios");
import axios from "axios";

import Profile from "./Profile";

describe("Profile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure there is an auth entry in localStorage as the component's submit relies on it
    localStorage.setItem("auth", JSON.stringify({ user: initialUser }));
  });

  test("loads user data into inputs on mount", async () => {
    render(<Profile />);

    // inputs should be populated from the mocked auth.user
    expect(screen.getByPlaceholderText(/Enter Your Name/i)).toHaveValue(initialUser.name);
    expect(screen.getByPlaceholderText(/Enter Your Email/i)).toHaveValue(initialUser.email);
    expect(screen.getByPlaceholderText(/Enter Your Phone/i)).toHaveValue(initialUser.phone);
    expect(screen.getByPlaceholderText(/Enter Your Address/i)).toHaveValue(initialUser.address);
  });

  test("submitting form updates profile on success", async () => {
    const updatedUser = {
      name: "Jane",
      email: "john@example.com",
      phone: "999999",
      address: "New Address",
    };

    axios.put.mockResolvedValueOnce({ data: { updatedUser } });

  render(<Profile />);

  // change some fields
  userEvent.clear(screen.getByPlaceholderText(/Enter Your Name/i));
  userEvent.type(screen.getByPlaceholderText(/Enter Your Name/i), updatedUser.name);
  userEvent.clear(screen.getByPlaceholderText(/Enter Your Phone/i));
  userEvent.type(screen.getByPlaceholderText(/Enter Your Phone/i), updatedUser.phone);
  userEvent.clear(screen.getByPlaceholderText(/Enter Your Address/i));
  userEvent.type(screen.getByPlaceholderText(/Enter Your Address/i), updatedUser.address);

  // submit
  userEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      // setAuth should be called with updated user
      expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
      // localStorage should be updated
      const ls = JSON.parse(localStorage.getItem("auth"));
      expect(ls.user).toEqual(updatedUser);
    });
  });

  test("shows server error when response contains errro flag", async () => {
    const toast = require("react-hot-toast");
    axios.put.mockResolvedValueOnce({ data: { errro: true, error: "Server failure" } });

  render(<Profile />);

  userEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server failure");
      expect(mockSetAuth).not.toHaveBeenCalled();
    });
  });

  test("shows toast on axios.put rejection (catch branch)", async () => {
    const toast = require("react-hot-toast");
    axios.put.mockRejectedValueOnce(new Error("network"));

  render(<Profile />);

  userEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("input change handlers update state and email is disabled", async () => {
    render(<Profile />);

    const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter Your Password/i);
    const phoneInput = screen.getByPlaceholderText(/Enter Your Phone/i);
    const addressInput = screen.getByPlaceholderText(/Enter Your Address/i);

    // email should be disabled
    expect(emailInput).toBeDisabled();

    // change password, phone, address and assert values update
    userEvent.clear(passwordInput);
    userEvent.type(passwordInput, "p@ssword1");
    expect(passwordInput).toHaveValue("p@ssword1");

    userEvent.clear(phoneInput);
    userEvent.type(phoneInput, "555-0000");
    expect(phoneInput).toHaveValue("555-0000");

    userEvent.clear(addressInput);
    userEvent.type(addressInput, "123 New St");
    expect(addressInput).toHaveValue("123 New St");
  });

  test("programmatic change on disabled email input triggers onChange (covers line 78)", () => {
    render(<Profile />);
    const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
    expect(emailInput).toBeDisabled();

    // programmatically dispatch change to exercise onChange handler even though input is disabled
    act(() => {
      fireEvent.change(emailInput, { target: { value: "changed@example.com" } });
    });

    // value should reflect the state update
    expect(emailInput).toHaveValue("changed@example.com");
  });
});
