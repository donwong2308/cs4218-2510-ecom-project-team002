import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import { act } from "react-dom/test-utils";

jest.mock("axios");

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("../styles/ProductDetailsStyles.css", () => ({}), { virtual: true });

// ---- act-wrapped render (drop-in fix) ----
const renderWithAct = async (ui) => {
  let utils;
  await act(async () => {
    utils = render(ui);
  });
  return utils;
};

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

describe("ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation(async (url) => {
      return { data: {} };
    });
  });

  it("Loads product by slug, shows details, renders related products", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
            category: { _id: "c1", name: "Gadgets" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          products: [
            {
              _id: "rp1",
              name: "Tablet",
              slug: "tablet-1",
              price: 499,
              description: "A handy tablet",
            },
            {
              _id: "rp2",
              name: "Watch",
              slug: "watch-2",
              price: 199,
              description: "A smart watch",
            },
          ],
        },
      });

    await renderWithAct(
      <MemoryRouter initialEntries={["/product/phone-1"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/phone-1"
      )
    );

    expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();
    expect(await screen.findByText(/Name\s*:\s*Phone/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Description\s*:\s*A very smart phone/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Price\s*:\s*\$999\.00/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Category\s*:\s*Gadgets/i)
    ).toBeInTheDocument();

    const mainImg = await screen.findByRole("img", { name: /Phone/i });
    expect(mainImg).toHaveAttribute("src", "/api/v1/product/product-photo/p1");

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/c1"
      )
    );

    expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();
    expect(screen.getByText("Watch")).toBeInTheDocument();
    expect(screen.getByText("$499.00")).toBeInTheDocument();
    expect(screen.getByText("$199.00")).toBeInTheDocument();

    const imgs = screen.getAllByRole("img");
    const relatedImgs = imgs.filter((el) =>
      el.getAttribute("src")?.includes("product-photo")
    );
    expect(
      relatedImgs.some(
        (el) => el.getAttribute("src") === "/api/v1/product/product-photo/rp1"
      )
    ).toBe(true);
    expect(
      relatedImgs.some(
        (el) => el.getAttribute("src") === "/api/v1/product/product-photo/rp2"
      )
    ).toBe(true);
  });

  it("More details", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
            category: { _id: "c1", name: "Gadgets" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          products: [
            {
              _id: "rp1",
              name: "Tablet",
              slug: "tablet-1",
              price: 499,
              description: "A handy tablet",
            },
          ],
        },
      });

    await renderWithAct(
      <MemoryRouter initialEntries={["/product/phone-1"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Tablet");
    const moreBtns = screen.getAllByRole("button", { name: /more details/i });

    expect(moreBtns[0]).toBeInTheDocument();
    fireEvent.click(moreBtns[0]);
  });

  it("Slug missing: Does not fetch", async () => {
    await renderWithAct(
      <MemoryRouter initialEntries={["/product"]}>
        <Routes>
          <Route path="/product" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.queryByText(/Product Details/i)).not.toBeInTheDocument();
  });

  it("logs error and still renders layout when get-product fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("network down"));

    await renderWithAct(
      <MemoryRouter initialEntries={["/product/phone-1"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(logSpy).toHaveBeenCalled();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    logSpy.mockRestore();
  });

  it("Shows fallback message if no related products", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
            category: { _id: "c1", name: "Gadgets" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { products: [] },
      });

    await renderWithAct(
      <MemoryRouter initialEntries={["/product/phone-1"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/Product Details/i);
    await screen.findByText("Similar Products ➡️");
    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  it("Logs error if related products fetch fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "Phone",
            slug: "phone-1",
            price: 999,
            description: "A very smart phone",
            category: { _id: "c1", name: "Gadgets" },
          },
        },
      })
      .mockRejectedValueOnce(new Error("related down"));

    await renderWithAct(
      <MemoryRouter initialEntries={["/product/phone-1"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // ensure product loaded
    expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();

    // related fetch attempted, then failed
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/c1"
      )
    );
    expect(logSpy).toHaveBeenCalled();

    // fallback UI when relatedProducts remains []
    expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();

    logSpy.mockRestore();
  });
});
