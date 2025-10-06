import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import AdminOrders from "./AdminOrders";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [{ token: "mock-token" }, jest.fn()]),
}));
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div title={title}>{children}</div>
));

// Properly mock antd components
jest.mock("antd", () => {
  const Select = ({ children, defaultValue, onChange, bordered }) => (
    <select
      data-testid="select"
      defaultValue={defaultValue}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});

jest.mock("moment", () => () => ({ fromNow: () => "a few seconds ago" }));

describe("AdminOrders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with orders", async () => {
    // Mock axios response for getOrders
    const mockOrders = [
      {
        _id: "1",
        status: "Not Process",
        buyer: { name: "John Doe" },
        createAt: new Date(),
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "Description 1",
            price: 100,
          },
        ],
      },
    ];

    // Setup axios mock to resolve with mock data
    axios.get.mockResolvedValue({ data: mockOrders });

    render(<AdminOrders />);

    // First check that the component renders its initial state
    expect(screen.getByText("All Orders")).toBeInTheDocument();

    // Wait for the async operations to complete and component to update
    await waitFor(
      () => {
        return screen.findByText("John Doe");
      },
      { timeout: 3000 }
    );

    // Now check the rendered content
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Price : 100")).toBeInTheDocument();

    // Verify axios.get was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
  });

  it("updates order status when handleChange is called", async () => {
    // Mock axios responses
    const mockOrders = [
      {
        _id: "1",
        status: "Not Process",
        buyer: { name: "John Doe" },
        createAt: new Date(),
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "Description 1",
            price: 100,
          },
        ],
      },
    ];

    // Setup initial get request
    axios.get.mockResolvedValue({ data: mockOrders });

    // Setup put request for status update
    axios.put.mockResolvedValue({
      data: { message: "Status updated successfully" },
    });

    // Render the component
    render(<AdminOrders />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Get reference to the Select component
    const selectComponent = screen.getByTestId("select");

    // Trigger the change event
    fireEvent.change(selectComponent, { target: { value: "Processing" } });

    // Wait for the status update call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/1", {
        status: "Processing",
      });
    });

    // Verify get orders was called again to refresh the data
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  // New test to cover error handling in getOrders
  it("handles error in getOrders function", async () => {
    // Mock console.log to verify it's called with the error
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    // Setup axios to reject with an error
    const errorMessage = "Failed to fetch orders";
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    render(<AdminOrders />);

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(console.log).toHaveBeenCalled();
    });

    // Verify error was logged
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));

    // Restore original console.log
    console.log = originalConsoleLog;
  });

  // New test to cover error handling in handleChange
  it("handles error in handleChange function", async () => {
    // Mock console.log to verify it's called with the error
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    // Setup initial get request to succeed
    const mockOrders = [
      {
        _id: "1",
        status: "Not Process",
        buyer: { name: "John Doe" },
        createAt: new Date(),
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "Description 1",
            price: 100,
          },
        ],
      },
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    // Setup put request to fail
    const errorMessage = "Failed to update order status";
    axios.put.mockRejectedValueOnce(new Error(errorMessage));

    render(<AdminOrders />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Get reference to the Select component
    const selectComponent = screen.getByTestId("select");

    // Trigger the change event
    fireEvent.change(selectComponent, { target: { value: "Processing" } });

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(console.log).toHaveBeenCalled();
    });

    // Verify error was logged
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));

    // Restore original console.log
    console.log = originalConsoleLog;
  });

  // Test for when auth token is not present
  it("does not fetch orders when auth token is not present", () => {
    // Mock useAuth to return null token
    jest.clearAllMocks();
    require("../../context/auth").useAuth.mockImplementation(() => [
      { token: null },
      jest.fn(),
    ]);

    // Setup axios.get spy
    render(<AdminOrders />);

    // Verify getOrders was not called
    expect(axios.get).not.toHaveBeenCalled();
  });

  // Test for displaying failed payment status
  it("displays failed payment status for orders with unsuccessful payments", async () => {
    // Mock axios response with an order that has failed payment
    const mockOrders = [
      {
        _id: "1",
        status: "Not Process",
        buyer: { name: "John Doe" },
        createAt: new Date(),
        payment: { success: false }, // Set payment success to false
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "Description 1",
            price: 100,
          },
        ],
      },
    ];

    // Clear previous mocks
    jest.clearAllMocks();

    // Restore the useAuth mock to return a token
    require("../../context/auth").useAuth.mockImplementation(() => [
      { token: "mock-token" },
      jest.fn(),
    ]);

    // Setup axios mock to resolve with mock data
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    // Wait for orders to be fetched and rendered
    await waitFor(
      () => {
        return screen.findByText("John Doe");
      },
      { timeout: 3000 }
    );

    // Check that "Failed" is displayed for payment status
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
