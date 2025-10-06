import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

// Helper function to render the component with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("UserMenu Component", () => {
  test("renders Dashboard heading", () => {
    renderWithRouter(<UserMenu />);
    const headingElement = screen.getByText("Dashboard");
    expect(headingElement).toBeInTheDocument();
  });

  test("renders Profile link", () => {
    renderWithRouter(<UserMenu />);
    const profileLink = screen.getByText("Profile");
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.getAttribute("href")).toBe("/dashboard/user/profile");
    expect(profileLink.className).toBe(
      "list-group-item list-group-item-action"
    );
  });

  test("renders Orders link", () => {
    renderWithRouter(<UserMenu />);
    const ordersLink = screen.getByText("Orders");
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink.getAttribute("href")).toBe("/dashboard/user/orders");
    expect(ordersLink.className).toBe("list-group-item list-group-item-action");
  });
});
