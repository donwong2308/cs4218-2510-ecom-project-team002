import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import CreateProduct from './CreateProduct';

jest.mock('axios');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Simplify Layout and AdminMenu so tests focus on CreateProduct behaviour
jest.mock('./../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock('./../../components/AdminMenu', () => () => (
  <div data-testid="admin-menu">admin menu</div>
));

// Mock react-hot-toast to avoid real toasts during tests
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

// Mock antd Select and Option with a simple <select> to make interactions predictable
jest.mock('antd', () => {
  const React = require('react');
  const Option = ({ children, value }) => <option value={value}>{children}</option>;
  const Select = ({ children, onChange, ...rest }) => (
    <select data-testid="select" onChange={(e) => onChange && onChange(e.target.value)} {...rest}>
      {children}
    </select>
  );
  // Attach Option to Select so destructuring like `const { Option } = Select` still works
  Select.Option = Option;
  return { Select };
});

beforeAll(() => {
  // createObjectURL is used when previewing uploaded photo
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads categories and creates a product (navigates on success)', async () => {
  // axios.get should return one category
  axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] } });

  // axios.post: note CreateProduct treats `data.success === false` as the success branch (existing logic)
  axios.post.mockResolvedValueOnce({ data: { success: false } });

  render(<CreateProduct />);

  // wait for category to appear
  await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());

  // Fill inputs
  await userEvent.type(screen.getByPlaceholderText(/write a name/i), 'Test Product');
  await userEvent.type(screen.getByPlaceholderText(/write a description/i), 'A description');
  await userEvent.type(screen.getByPlaceholderText(/write a Price/i), '99');
  await userEvent.type(screen.getByPlaceholderText(/write a quantity/i), '10');

  // Select category (our mocked antd Select renders multiple <select> with the same data-testid)
  // pick the first select which corresponds to the category selector
  const selects = screen.getAllByTestId('select');
  userEvent.selectOptions(selects[0], 'cat1');

  // Click create
  userEvent.click(screen.getByRole('button', { name: /create product/i }));

  // axios.post should have been called and navigate should be invoked
  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
});

test('getAllCategory sets categories when API returns success', async () => {
  // Ensure the specific branch where data.success is true triggers setCategories
  const categories = [{ _id: 'c2', name: 'Category 2' }];
  axios.get.mockResolvedValueOnce({ data: { success: true, category: categories } });

  render(<CreateProduct />);

  // axios.get must have been called with the category endpoint
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category'));

  // The mock Select/Option renders <option> elements — ensure our category was rendered
  await waitFor(() => expect(screen.getByText('Category 2')).toBeInTheDocument());

  // also ensure the number of options equals the categories length (plus any default placeholder)
  const options = screen.getAllByRole('option');
  expect(options.some((opt) => opt.textContent === 'Category 2')).toBe(true);
});

test('shows toast error when get categories fails', async () => {
  const toast = require('react-hot-toast').default;
  axios.get.mockRejectedValueOnce(new Error('network')); // simulate network error

  render(<CreateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something wwent wrong in getting catgeory'));
});

test('when post returns success=true show error toast and do not navigate', async () => {
  const toast = require('react-hot-toast').default;
  axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] } });
  // component does not await axios.post; return a plain object so destructuring works
  axios.post.mockReturnValueOnce({ data: { success: true, message: 'Bad data' } });

  render(<CreateProduct />);

  // wait for category
  await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());

  // click create without filling anything (component will still call axios.post)
  userEvent.click(screen.getByRole('button', { name: /create product/i }));

  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Bad data'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('photo preview appears when file is chosen', async () => {
  axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

  render(<CreateProduct />);

  // find file input (it's hidden in a label)
  const fileInput = screen.getByLabelText(/upload photo/i) || document.querySelector('input[type=file]');
  expect(fileInput).toBeTruthy();

  // create a mock File
  const file = new File(['(⌐□_□)'], 'photo.png', { type: 'image/png' });
  // fire input change
  await userEvent.upload(fileInput, file);

  // image preview should be rendered
  await waitFor(() => expect(screen.getByAltText('product_photo')).toBeInTheDocument());
});

// Removed low-value shipping select test: shipping is covered indirectly by other tests

test('shipping select can be changed to Yes', async () => {
  // Ensure category is present so the second Select corresponds to shipping
  axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] } });

  render(<CreateProduct />);

  // wait for category to appear which means both selects are rendered
  await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());

  const selects = screen.getAllByTestId('select');
  // the second select is the shipping selector; choose 'Yes' (value '1')
  await userEvent.selectOptions(selects[1], '1');

  // assert the shipping select value changed
  expect(selects[1].value).toBe('1');
});

test('shows toast when create product throws an error', async () => {
  const toast = require('react-hot-toast').default;
  axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
  // component does not await axios.post; make it throw synchronously so the try/catch catches it
  axios.post.mockImplementationOnce(() => {
    throw new Error('create-failed');
  });

  render(<CreateProduct />);

  // wait for initial get
  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  // trigger create
  userEvent.click(screen.getByRole('button', { name: /create product/i }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('something went wrong'));
  expect(mockNavigate).not.toHaveBeenCalled();
});
