import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Users from "./Users";

// Mock the useCategory hook directly
jest.mock("../../hooks/useCategory", () => {
  return jest.fn(() => []); // Return empty array of categories
});

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [{ token: "mockToken" }, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

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

describe("Users Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders users page correctly", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("All Users")).toBeInTheDocument();
  });

  it("renders admin menu", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if the admin menu is rendered (it should be in a column with col-md-3 class)
    const adminMenuColumn = container.querySelector(".col-md-3");
    expect(adminMenuColumn).toBeInTheDocument();
  });

  it("renders main content area", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if the main content area is rendered (it should be in a column with col-md-9 class)
    const mainContentColumn = container.querySelector(".col-md-9");
    expect(mainContentColumn).toBeInTheDocument();
  });

  it("has correct container structure", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if the container has the correct classes
    const containerFluid = container.querySelector(".container-fluid.m-3.p-3");
    expect(containerFluid).toBeInTheDocument();

    // Check if the row is present
    const row = container.querySelector(".row");
    expect(row).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    expect(() => {
      render(
        <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
          <Routes>
            <Route path="/dashboard/admin/users" element={<Users />} />
          </Routes>
        </MemoryRouter>
      );
    }).not.toThrow();
  });
});
