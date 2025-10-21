import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ProductDetails from "../ProductDetails";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "../../context/cart";
import { act } from "react-dom/test-utils";

// ---- Mocks ----
jest.mock("axios");

// Keep Layout simple and visible
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// CSS
jest.mock("../../styles/ProductDetailsStyles.css", () => ({}));

// PARTIAL mock: only override useNavigate, keep real router params
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---- Render helpers wrapped in act ----
const renderWithAct = async (ui) => {
  let utils;
  await act(async () => {
    utils = render(ui);
  });
  return utils;
};

// Helpers: always use real router params via <Routes/>
const renderAtPath = async (path = "/product/test-slug") =>
  renderWithAct(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <Routes>
          {/* route with slug param */}
          <Route path="/product/:slug" element={<ProductDetails />} />
          {/* route without slug, to hit the "no-slug" branch */}
          <Route path="/product" element={<ProductDetails />} />
        </Routes>
      </CartProvider>
    </MemoryRouter>
  );

// Flexible text matcher helper
const hasText = (node, expected) =>
  node?.textContent?.replace(/\s+/g, " ").trim() === expected;

describe("ProductDetails Integration with Cart Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders no-slug container when params.slug is missing", async () => {
    await renderAtPath("/product");

    expect(await screen.findByTestId("no-slug")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("fetches product and related items, then renders product details", async () => {
    const slug = "super-gadget";
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

    // URL-based mock (resilient to call order / duplication)
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
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

    await renderAtPath(`/product/${slug}`);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${slug}`
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      );
    });

    // Header
    expect(await screen.findByText("Product Details")).toBeInTheDocument();

    // Name / Description / Category (robust matchers)
    expect(
      await screen.findByText(
        (_, node) =>
          node?.tagName === "H6" && hasText(node, "Name : Super Gadget")
      )
    ).toBeInTheDocument();
    await expect(
      screen.getByText(
        (_, node) =>
          node?.tagName === "H6" &&
          hasText(node, "Description : All-new shiny gadget")
      )
    ).toBeInTheDocument();
    expect(
      await screen.getByText(
        (_, node) =>
          node?.tagName === "H6" && hasText(node, "Category : Gadgets")
      )
    ).toBeInTheDocument();

    // Price tolerant to spaces/locale
    expect(screen.getByText(/Price\s*:\s*\$?249\.99/)).toBeInTheDocument();

    // Main image
    const heroImg = screen.getByAltText(product.name);
    expect(heroImg).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${product._id}`
    );

    // Add to cart button present (not wired yet)
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });

  test("renders 'No Similar Products found' when related list is empty", async () => {
    const slug = "thing";
    const product = {
      _id: "p1",
      name: "Thing",
      description: "Desc",
      price: 10,
      category: { _id: "c1", name: "Cat" },
    };

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
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

    await renderAtPath(`/product/${slug}`);

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();
  });

  test("renders related product card and navigates on 'More Details'", async () => {
    const user = userEvent.setup();

    const slug = "widget";
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

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
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

    await renderAtPath(`/product/${slug}`);

    expect(await screen.findByText("Similar Products ➡️")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${product._id}/${product.category._id}`
      );
    });

    const title = await screen.findByText((_, node) => {
      const text = node?.textContent?.replace(/\s+/g, " ").trim();
      return node?.tagName === "H5" && text === "Widget Pro";
    });
    expect(title).toBeInTheDocument();

    expect(await screen.findByText(/\$?\s*199\.99/)).toBeInTheDocument();

    const relImg = await screen.findByAltText("Widget Pro");
    expect(relImg).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${related[0]._id}`
    );

    const moreBtn = await screen.findByRole("button", {
      name: /more details/i,
    });
    await user.click(moreBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/product/${related[0].slug}`);
    });
  });

  // Error paths (kept simple)
  test("handles product fetch error gracefully", async () => {
    const slug = "bad-one";
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network down"));

    await renderAtPath(`/product/${slug}`);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${slug}`
      )
    );
    expect(await screen.getByTestId("layout")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("handles related fetch error gracefully", async () => {
    const slug = "with-related-error";
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

    await renderAtPath(`/product/${slug}`);

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

//
// -------- Second suite: route-level tests sharing the same helpers --------
//

const renderRouteOnly = async (initialEntry = "/product/super-gadget") =>
  renderWithAct(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/product" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("Product route integration with ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("visiting /product/:slug renders details on success", async () => {
    const slug = "super-gadget";
    const product = {
      _id: "p123",
      slug,
      name: "Super Gadget",
      description: "All-new shiny gadget",
      price: 249.99,
      category: { _id: "c9", name: "Gadgets" },
    };
    const related = [
      {
        _id: "r1",
        name: "Case",
        description: "Protective case",
        price: 19.99,
        slug: "case",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
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

    await renderRouteOnly(`/product/${slug}`);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${slug}`
      );
    });

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(
      await screen.findByText(
        (_, node) =>
          node?.tagName === "H6" && hasText(node, "Name : Super Gadget")
      )
    ).toBeInTheDocument();

    const heroImg = screen.getByAltText("Super Gadget");
    expect(heroImg).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${product._id}`
    );

    expect(await screen.findByText("Similar Products ➡️")).toBeInTheDocument();
    expect(screen.getByText("Case")).toBeInTheDocument();
    expect(screen.getByText(/\$?\s*19\.99/)).toBeInTheDocument();
  });

  test("visiting unknown /product/:slug logs error and keeps layout (current behavior)", async () => {
    const slug = "does-not-exist";
    const err = new Error("Not found");
    err.response = { status: 404 };
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    axios.get.mockRejectedValueOnce(err); // product fetch fails

    await renderRouteOnly(`/product/${slug}`);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${slug}`
      );
    });

    // The component still renders the page structure (current behavior)
    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test("renders empty similar-products message when related is empty", async () => {
    const slug = "thing";
    const product = {
      _id: "p1",
      slug,
      name: "Thing",
      description: "Desc",
      price: 10,
      category: { _id: "c1", name: "Cat" },
    };

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
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

    await renderRouteOnly(`/product/${slug}`);

    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();
  });
});
