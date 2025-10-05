import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCategory from "../../pages/admin/CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";
import '@testing-library/jest-dom/extend-expect';

// Mock axios and toast
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock components
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/Form/CategoryForm", () => ({ handleSubmit, value, setValue }) => (
  <form onSubmit={handleSubmit}>
    <input
      placeholder="Category Name"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <button type="submit">Submit</button>
  </form>
));

describe("CreateCategory Component", () => {
  const categoriesMock = [
    { _id: "1", name: "Electronics" },
    { _id: "2", name: "Books" },
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: { success: true, category: categoriesMock } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders categories fetched from API", async () => {
    render(<CreateCategory />);
    for (const category of categoriesMock) {
      await waitFor(() => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    }
  });

  test("handles create category successfully", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Category Name"), { target: { value: "Toys" } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "Toys" });
      expect(toast.success).toHaveBeenCalledWith("Toys is created");
    });
  });

  test("shows toast error if create category fails", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: "Create failed" } });

    render(<CreateCategory />);

    const input = screen.getByPlaceholderText(/Category Name/i);
    fireEvent.change(input, { target: { value: "New Cat" } });

    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Create failed");
    });
  });

  test("handles create category failure (error path)", async () => {
    axios.post.mockRejectedValue(new Error("Network Error"));

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Category Name"), { target: { value: "Toys" } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("somthing went wrong in input form");
    });
  });

  test("fetches categories successfully", async () => {
    const categoriesMock = [{ _id: "1", name: "Electronics" }];

    axios.get.mockResolvedValue({ data: { success: true, category: categoriesMock } });

    render(<CreateCategory />);

    // Wait for categories to appear in the table
    const row = await screen.findByText("Electronics");
    expect(row).toBeInTheDocument();
  });
  test("handles getAllCategory failure", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
    });
  });

  test("deletes a category successfully", async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });

    render(<CreateCategory />);
    await waitFor(() => expect(screen.getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });

  test("shows toast error if delete category fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: "1", name: "Electronics" }] } });
    axios.delete.mockResolvedValueOnce({ data: { success: false, message: "Delete failed" } });

    render(<CreateCategory />);

    fireEvent.click(await screen.findByText("Delete"));

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  test("handles delete category error path", async () => {
    axios.delete.mockRejectedValue(new Error("Network Error"));

    render(<CreateCategory />);
    await waitFor(() => expect(screen.getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("updates a category successfully", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });

    render(<CreateCategory />);
    await waitFor(() => expect(screen.getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Edit")[0]);

    const modalInput = screen.getAllByPlaceholderText("Category Name").find((i) => i.value === "Electronics");
    const submitButton = screen.getAllByText("Submit").find((btn) => btn.closest("form")?.contains(modalInput));

    fireEvent.change(modalInput, { target: { value: "Gadgets" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", { name: "Gadgets" });
      expect(toast.success).toHaveBeenCalledWith("Gadgets is updated");
    });
  });

  test("shows toast error if update category fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: "1", name: "Electronics" }] } });
    axios.put.mockResolvedValueOnce({ data: { success: false, message: "Update failed" } });

    render(<CreateCategory />);

    // Open edit modal
    fireEvent.click(await screen.findByText("Edit"));

    const input = screen.getByDisplayValue("Electronics");
    fireEvent.change(input, { target: { value: "Updated Cat" } });

    const submitButtons = screen.getAllByText("Submit");
    fireEvent.click(submitButtons[1]);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
});

  test("handles update category error path", async () => {
    axios.put.mockRejectedValue(new Error("Network Error"));

    render(<CreateCategory />);
    await waitFor(() => expect(screen.getByText("Electronics")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Edit")[0]);

    const modalInput = screen.getAllByPlaceholderText("Category Name").find((i) => i.value === "Electronics");
    const submitButton = screen.getAllByText("Submit").find((btn) => btn.closest("form")?.contains(modalInput));

    fireEvent.change(modalInput, { target: { value: "Gadgets" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("closes modal when onCancel is clicked", async () => {
    render(<CreateCategory />);
    await waitFor(() => expect(screen.getByText("Electronics")).toBeInTheDocument());

    // Open modal
    fireEvent.click(screen.getAllByText("Edit")[0]);

    // Modal should be in the DOM and visible
    const modal = document.querySelector(".ant-modal-wrap");
    expect(modal).toHaveStyle("display: block");

    // Click cancel button
    const cancelButton = screen.getByLabelText("Close");
    fireEvent.click(cancelButton);

    // Wait for modal to be hidden
    await waitFor(() => {
        expect(modal).toHaveStyle("display: none");
    });
  });
});
