import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";

// Mock dependencies with different configurations
jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../components/UserMenu", () => () => <div>UserMenu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));
jest.mock("moment", () => {
  const mockMoment = jest.fn(() => ({
    fromNow: () => "2 days ago",
  }));
  mockMoment.tz = jest.fn();
  return mockMoment;
});

describe("Orders Component", () => {
  const mockOrdersData = [
    {
      _id: "order123",
      status: "Delivered",
      buyer: { name: "Alice Johnson" },
      createAt: "2023-10-01T14:30:00Z",
      payment: { success: true },
      products: [
        {
          _id: "product456",
          name: "Wireless Headphones",
          description:
            "High-quality wireless headphones with noise cancellation technology for premium audio experience",
          price: 299.99,
        },
        {
          _id: "product789",
          name: "Smartphone Case",
          description: "Durable protective case",
          price: 29.99,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //
  // 🔹 Initial Conditions & State Transitions
  //
  describe("Initial Conditions & State Transitions", () => {
    it("should render with initial empty state when no token provided", () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );
      expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/UserMenu/i)).toBeInTheDocument();
    });

    it("should fetch orders automatically when valid auth token exists", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrdersData });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders")
      );
    });

    it("should not trigger API call when auth token is undefined", async () => {
      useAuth.mockReturnValue([{ token: undefined }, jest.fn()]);

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  //
  // 🔹 Rendered Output & Data Presentation
  //
  describe("Rendered Output & Data Presentation", () => {
    it("should display complete order information when orders are successfully loaded", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrdersData });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      // Check order status and buyer information
      expect(await screen.findByText("Delivered")).toBeInTheDocument();
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // quantity of products

      // Check product information is displayed
      expect(
        await screen.findByText("Wireless Headphones")
      ).toBeInTheDocument();
      expect(screen.getByText(/Price : 299.99/)).toBeInTheDocument();
      expect(screen.getByText("Smartphone Case")).toBeInTheDocument();
      expect(screen.getByText(/Price : 29.99/)).toBeInTheDocument();
    });

    it("should display 'Failed' status for unsuccessful payment transactions", async () => {
      const failedPaymentOrder = [
        {
          _id: "order456",
          status: "Cancelled",
          buyer: { name: "Bob Wilson" },
          createAt: "2023-09-28T09:15:00Z",
          payment: { success: false },
          products: [
            {
              _id: "product321",
              name: "Gaming Keyboard",
              description: "Mechanical gaming keyboard with RGB lighting",
              price: 159.99,
            },
          ],
        },
      ];

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: failedPaymentOrder });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      expect(await screen.findByText("Failed")).toBeInTheDocument();
      expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      expect(screen.getByText("Gaming Keyboard")).toBeInTheDocument();
      expect(screen.getByText(/Price : 159.99/)).toBeInTheDocument();
    });

    it("should truncate long product descriptions to 30 characters", async () => {
      const orderWithLongDescription = [
        {
          _id: "order789",
          status: "Shipped",
          buyer: { name: "Carol Davis" },
          createAt: "2023-10-05T16:45:00Z",
          payment: { success: true },
          products: [
            {
              _id: "product654",
              name: "Professional Camera",
              description:
                "This is an extremely detailed and comprehensive description of a professional camera with advanced features and capabilities that exceed thirty characters",
              price: 1299.99,
            },
          ],
        },
      ];

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: orderWithLongDescription });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      // Check that description is truncated
      expect(
        await screen.findByText("This is an extremely detailed")
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "This is an extremely detailed and comprehensive description"
        )
      ).not.toBeInTheDocument();
    });
  });

  //
  // 🔹 Integration & Interaction Checks
  //
  describe("Integration & Interaction Checks", () => {
    it("should properly integrate Layout and UserMenu components", () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout.getAttribute("data-title")).toBe("Your Orders");
      expect(screen.getByText("UserMenu")).toBeInTheDocument();
    });

    it("should make correct API call with proper endpoint configuration", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrdersData });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders")
      );
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("should display correct image sources for product photos", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrdersData });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByRole("img")).toHaveLength(2);
      });

      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/product456"
      );
      expect(images[0]).toHaveAttribute("alt", "Wireless Headphones");
      expect(images[1]).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/product789"
      );
      expect(images[1]).toHaveAttribute("alt", "Smartphone Case");
    });
  });

  //
  // 🔹 Failure & Exception Handling
  //
  describe("Failure & Exception Handling", () => {
    it("should gracefully handle API errors and log them appropriately", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockRejectedValue(new Error("Server Unavailable"));

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      expect(consoleSpy).toHaveBeenCalledWith(new Error("Server Unavailable"));

      consoleSpy.mockRestore();
    });

    it("should prevent API calls when authentication token is absent", async () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should handle empty orders array gracefully", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      expect(screen.getByText("All Orders")).toBeInTheDocument();
      // Should not render any order tables or product information
      expect(screen.queryByText("Delivered")).not.toBeInTheDocument();
    });

    it("should handle orders with missing or undefined properties", async () => {
      const incompleteOrders = [
        {
          _id: "incomplete-order",
          status: "Processing",
          buyer: null,
          createAt: "2023-10-10T12:00:00Z",
          payment: { success: true },
          products: [],
        },
      ];

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: incompleteOrders });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });

      expect(screen.getByText("0")).toBeInTheDocument(); // no products
    });
  });

  //
  // 🔹 Edge Cases & Boundary Testing
  //
  describe("Edge Cases & Boundary Testing", () => {
    it("should handle multiple orders with varying data structures", async () => {
      const multipleOrders = [
        {
          _id: "multi-order-1",
          status: "Pending",
          buyer: { name: "David Chen" },
          createAt: "2023-10-12T10:30:00Z",
          payment: { success: true },
          products: [
            {
              _id: "multi-prod-1",
              name: "Laptop Stand",
              description: "Adjustable laptop stand",
              price: 79.99,
            },
          ],
        },
        {
          _id: "multi-order-2",
          status: "Completed",
          buyer: { name: "Eva Martinez" },
          createAt: "2023-10-11T15:20:00Z",
          payment: { success: false },
          products: [
            {
              _id: "multi-prod-2",
              name: "USB Cable",
              description:
                "High-speed USB-C cable for data transfer and charging purposes",
              price: 19.99,
            },
            {
              _id: "multi-prod-3",
              name: "Mouse Pad",
              description: "Gaming mouse pad",
              price: 24.99,
            },
          ],
        },
      ];

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: multipleOrders });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      // Check first order
      expect(await screen.findByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("David Chen")).toBeInTheDocument();

      // Check second order
      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByText("Eva Martinez")).toBeInTheDocument();

      // Check quantities using more specific selectors
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(2);

      // Check both Success and Failed payment statuses are displayed
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("should properly handle moment date formatting", async () => {
      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrdersData });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("2 days ago")).toBeInTheDocument();
      });
    });

    it("should handle products with exactly 30 character descriptions", async () => {
      const exactLengthOrder = [
        {
          _id: "exact-order",
          status: "Delivered",
          buyer: { name: "Frank Thompson" },
          createAt: "2023-10-13T08:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "exact-prod",
              name: "Tablet",
              description: "This description is exactly 30", // exactly 30 characters
              price: 399.99,
            },
          ],
        },
      ];

      useAuth.mockReturnValue([{ token: "auth-token-12345" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: exactLengthOrder });

      render(
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      );

      expect(
        await screen.findByText("This description is exactly 30")
      ).toBeInTheDocument();
    });
  });
});
