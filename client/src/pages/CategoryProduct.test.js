import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";

// Mock axios
jest.mock("axios");

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Silence CSS import
jest.mock("../styles/CategoryProductStyles.css", () => ({}), { virtual: true });

// Browser APIs (match Login test style)
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Loads by slug and renders the category/products", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        category: { _id: "c1", name: "Gadgets", slug: "cat-slug" },
        products: [
          {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
          },
          {
            _id: "p2",
            name: "Tablet",
            slug: "tablet-2",
            price: 499,
            description: "A handy tablet",
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/cat-slug"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/cat-slug"
      )
    );

    expect(
      await screen.findByText(/Category\s*-\s*Gadgets/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/2 result found/i)).toBeInTheDocument();

    // Product names
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();

    // Prices (assuming formatted with $ and 2 decimals)
    expect(screen.getByText("$999.00")).toBeInTheDocument();
    expect(screen.getByText("$499.00")).toBeInTheDocument();

    // Images
    const imgs = screen.getAllByRole("img");
    expect(imgs[0]).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
    expect(imgs[1]).toHaveAttribute("src", "/api/v1/product/product-photo/p2");
  });

  it("More Details", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        category: { _id: "c1", name: "Gadgets", slug: "cat-slug" },
        products: [
          {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/cat-slug"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
          <Route
            path="/product/:slug"
            element={<div>Product Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Phone");

    const moreButtons = screen.getAllByRole("button", {
      name: /more details/i,
    });
    fireEvent.click(moreButtons[0]);

    expect(await screen.findByText("Product Detail Page")).toBeInTheDocument();
  });

  it("Does not fetech when slug missing, renders correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/category"]}>
        <Routes>
          <Route path="/category" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.queryByText(/Category -/i)).not.toBeInTheDocument();
  });

  it("logs error and still renders layout on fetch failure", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("network down"));

    render(
      <MemoryRouter initialEntries={["/category/cat-slug"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(logSpy).toHaveBeenCalled();
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    logSpy.mockRestore();
  });
});
