// pages/__tests__/ProductDetails.integration.test.js
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import ProductDetails from "../ProductDetails";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../../context/cart";

// ---- Mocks ----
jest.mock("axios");

// Keep Layout simple
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// CSS
jest.mock("../../styles/ProductDetailsStyles.css", () => ({}));

// Router hooks
const mockNavigate = jest.fn();
let mockSlug = "test-slug";
jest.mock("react-router-dom", () => {
  const rrd = jest.requireActual("react-router-dom");
  return {
    ...rrd,
    useNavigate: () => mockNavigate,
    useParams: () => (mockSlug ? { slug: mockSlug } : {}),
  };
});

// Helper
const renderWithProviders = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <ProductDetails />
      </CartProvider>
    </MemoryRouter>
  );

describe("ProductDetails Integration (robust)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSlug = "test-slug";
  });

  test("renders no-slug container when params.slug is missing", async () => {
    mockSlug = ""; // simulate missing slug
    renderWithProviders();

    expect(await screen.findByTestId("no-slug")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("fetches product and related items, then renders product details", async () => {
    const product = {
      _id: "p123",
      name: "Super Gadget",
      description: "All-new shiny gadget",
      price: 249.99,
      category: { _id: "c9", name: "Gadgets" },
    };
    const related = [
      {
        _id: "r1",
        name: "Gadget Case",
        description: "Protective case for your gadget",
        price: 19.99,
        slug: "gadget-case",
      },
      {
        _id: "r2",
        name: "Gadget Charger",
        description: "Fast charger",
        price: 29.99,
        slug: "gadget-charger",
      },
    ];

    // Robust axios mock: respond based on URL (tolerates duplicate calls / different order)
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${mockSlug}`) {
        return Promise.resolve({ data: { product } });
      }
      if (
        url ===
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      ) {
        return Promise.resolve({ data: { products: related } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    renderWithProviders();

    // Assert it called the product endpoint at least once
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    // Assert it called the related endpoint at least once
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      );
    });

    // Product details
    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    // Product details displayed
    expect(await screen.findByText("Product Details")).toBeInTheDocument();

    // Name
    const nameH6 = await screen.findByText((content, node) => {
      const text = node?.textContent?.replace(/\s+/g, " ").trim();
      return node?.tagName === "H6" && text === "Name : Super Gadget";
    });
    expect(nameH6).toBeInTheDocument();

    // Description
    const descH6 = await screen.findByText((content, node) => {
      const text = node?.textContent?.replace(/\s+/g, " ").trim();
      return (
        node?.tagName === "H6" && text === "Description : All-new shiny gadget"
      );
    });
    expect(descH6).toBeInTheDocument();

    // Category
    const catH6 = await screen.findByText((content, node) => {
      const text = node?.textContent?.replace(/\s+/g, " ").trim();
      return node?.tagName === "H6" && text === "Category : Gadgets";
    });
    expect(catH6).toBeInTheDocument();

    // Price (stay regex to be locale/space tolerant)
    expect(screen.getByText(/Price\s*:\s*\$?249\.99/)).toBeInTheDocument();

    // Price (regex to avoid whitespace brittleness)
    expect(screen.getByText(/Price\s*:\s*\$?249\.99/)).toBeInTheDocument();

    // Main image
    const heroImg = screen.getByAltText(product.name);
    expect(heroImg).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${product._id}`
    );

    // Add to cart button present (your component has it, but not wired)
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });

  test("renders 'No Similar Products found' when related list is empty", async () => {
    const product = {
      _id: "p1",
      name: "Thing",
      description: "Desc",
      price: 10,
      category: { _id: "c1", name: "Cat" },
    };

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${mockSlug}`) {
        return Promise.resolve({ data: { product } });
      }
      if (
        url ===
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      ) {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    renderWithProviders();

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();
  });

  test("renders related product card and navigates on 'More Details'", async () => {
    const product = {
      _id: "pid",
      name: "Widget",
      description: "Desc",
      price: 50,
      category: { _id: "cid", name: "Widgets" },
    };
    const related = [
      {
        _id: "r1",
        name: "Widget Pro",
        slug: "widget-pro",
        description: "Pro desc text that is fairly long…",
        price: 199.99,
      },
    ];

    // URL-based mock so duplicate calls/order won’t break the test
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${mockSlug}`) {
        return Promise.resolve({ data: { product } });
      }
      if (
        url ===
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      ) {
        return Promise.resolve({ data: { products: related } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    renderWithProviders();

    // Header shows immediately (fine), but cards may not be ready yet
    expect(await screen.findByText("Similar Products ➡️")).toBeInTheDocument();

    // Wait until the related endpoint has been called at least once
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      );
    });

    // Now wait for the card title to appear (don’t use getByText)
    const title = await screen.findByText((_, node) => {
      const text = node?.textContent?.replace(/\s+/g, " ").trim();
      return node?.tagName === "H5" && text === "Widget Pro";
    });
    expect(title).toBeInTheDocument();

    // Price (tolerant to spaces/locale)
    expect(await screen.findByText(/\$?\s*199\.99/)).toBeInTheDocument();

    // Image
    const relImg = await screen.findByAltText("Widget Pro");
    expect(relImg).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${related[0]._id}`
    );

    // Find & click the button *after* it’s in the DOM
    const moreBtn = await screen.findByRole("button", {
      name: /more details/i,
    });
    fireEvent.click(moreBtn);

    expect(mockNavigate).toHaveBeenCalledWith(`/product/${related[0].slug}`);
  });


  // Error paths (kept simple)
  test("handles product fetch error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network down"));

    renderWithProviders();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      )
    );
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("handles related fetch error gracefully", async () => {
    const product = {
      _id: "p",
      name: "N",
      description: "D",
      price: 1,
      category: { _id: "c", name: "C" },
    };
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    axios.get
      .mockResolvedValueOnce({ data: { product } }) // product ok
      .mockRejectedValueOnce(new Error("related failed")); // related fails

    renderWithProviders();

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
