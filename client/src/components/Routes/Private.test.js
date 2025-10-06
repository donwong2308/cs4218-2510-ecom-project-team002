import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Private from "./Private";
import { useAuth } from "../../context/auth";
import axios from "axios";

// Mock the dependencies
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  Outlet: jest.fn(() => <div data-testid="outlet" />),
}));

jest.mock("../Spinner", () => {
  return function DummySpinner() {
    return <div data-testid="spinner" />;
  };
});

// Mock mongoose module
jest.mock("mongoose", () => {
  return {
    set: jest.fn(),
  };
});

describe("Private Route Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Outlet when user is authenticated", async () => {
    // Mock useAuth to return token
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);

    // Mock axios to return successful response
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(<Private />);

    // Initially it should show spinner
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    // After API response, it should show outlet
    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  test("renders Spinner when auth check fails", async () => {
    // Mock useAuth to return token
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);

    // Mock axios to return failed response
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    render(<Private />);

    // Initially it should show spinner
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    // After API response, it should still show spinner
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
  });

  test("does not call auth check when token is missing", () => {
    // Mock useAuth to return no token
    useAuth.mockReturnValue([{ token: null }, jest.fn()]);

    render(<Private />);

    // It should show spinner without calling the API
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("handles error during auth check", async () => {
    // Mock useAuth to return token
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);

    // Mock axios to reject the promise
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    // Spy on console.error to verify it's called
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Private />);

    // Initially it should show spinner
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    // After error, it should still show spinner
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
