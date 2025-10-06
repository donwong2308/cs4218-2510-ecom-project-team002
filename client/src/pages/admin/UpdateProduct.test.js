import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import UpdateProduct from './UpdateProduct';

jest.mock('axios');

const mockNavigate = jest.fn();
const mockUseParams = { slug: 'product-slug' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams,
}));

// Simplify Layout and AdminMenu
jest.mock('./../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock('./../../components/AdminMenu', () => () => (
  <div data-testid="admin-menu">admin menu</div>
));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

// Mock antd Select
jest.mock('antd', () => {
  const React = require('react');
  const Option = ({ children, value }) => <option value={value}>{children}</option>;
  const Select = ({ children, onChange, value, ...rest }) => (
    <select data-testid="select" value={value} onChange={(e) => onChange && onChange(e.target.value)} {...rest}>
      {children}
    </select>
  );
  Select.Option = Option;
  return { Select };
});

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads product and categories and shows existing photo', async () => {
  // mock single product GET and categories GET
  const product = {
    _id: 'p1',
    name: 'Prod 1',
    description: 'desc',
    price: 10,
    quantity: 5,
    shipping: 1,
    category: { _id: 'cat1' },
  };
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] } });
    return Promise.resolve({ data: {} });
  });

  render(<UpdateProduct />);

  // wait for product fields to be populated from API
  await waitFor(() => expect(screen.getByDisplayValue('Prod 1')).toBeInTheDocument());

  // existing product photo should point to the product-photo endpoint (id should be set)
  const img = screen.getByAltText('product_photo');
  expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${product._id}`);

  // category option present
  await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());
});


test('getAllCategory error shows toast', async () => {
  const toast = require('react-hot-toast').default;
  // make category GET fail
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'p' } } });
    if (url === '/api/v1/category/get-category') return Promise.reject(new Error('network'));
    return Promise.resolve({ data: {} });
  });

  render(<UpdateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something wwent wrong in getting catgeory'));
});

test('getAllCategory sets categories when API returns success true (covers if branch at line 49)', async () => {
  // mock product GET (can be empty) and categories GET returning success true
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p-empty', name: '' } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [{ _id: 'c1', name: 'Cat A' }, { _id: 'c2', name: 'Cat B' }] } });
    return Promise.resolve({ data: {} });
  });

  render(<UpdateProduct />);

  // wait for category options to show up
  await waitFor(() => expect(screen.getByText('Cat A')).toBeInTheDocument());
  expect(screen.getByText('Cat B')).toBeInTheDocument();
});

test('handleUpdate navigates on successful update (data.success === false path)', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod', description: '', price: 1, quantity: 1, shipping: 0, category: { _id: 'cat1' } } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  // axios.put returns a plain object (component destructures without await)
  axios.put.mockReturnValueOnce({ data: { success: false } });

  render(<UpdateProduct />);

  await waitFor(() => expect(screen.getByDisplayValue('Prod')).toBeInTheDocument());

  userEvent.click(screen.getByRole('button', { name: /update product/i }));

  await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
});

test('handleUpdate shows error toast when API returns success=true', async () => {
  const toast = require('react-hot-toast').default;
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod', description: '', price: 1, quantity: 1, shipping: 0, category: { _id: 'cat1' } } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  axios.put.mockReturnValueOnce({ data: { success: true, message: 'Invalid' } });

  render(<UpdateProduct />);

  await waitFor(() => expect(screen.getByDisplayValue('Prod')).toBeInTheDocument());

  userEvent.click(screen.getByRole('button', { name: /update product/i }));

  await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('handleDelete prompts and deletes product when confirmed', async () => {
  const toast = require('react-hot-toast').default;
  // product GET and categories GET
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod' } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  // simulate user confirming prompt
  jest.spyOn(window, 'prompt').mockImplementation(() => 'yes');

  axios.delete.mockResolvedValueOnce({ data: { ok: true } });

  render(<UpdateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  userEvent.click(screen.getByRole('button', { name: /delete product/i }));

  await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Product DEleted Succfully'));
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
});


test('handleUpdate shows toast when axios.put throws (catch branch)', async () => {
  const toast = require('react-hot-toast').default;
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod', description: '', price: 1, quantity: 1, shipping: 0, category: { _id: 'cat1' } } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  axios.put.mockImplementationOnce(() => { throw new Error('update-failed'); });

  render(<UpdateProduct />);

  await waitFor(() => expect(screen.getByDisplayValue('Prod')).toBeInTheDocument());

  userEvent.click(screen.getByRole('button', { name: /update product/i }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('something went wrong'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('handleDelete does nothing when prompt cancelled', async () => {
  // product GET and categories GET
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod' } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  // simulate user cancelling prompt
  jest.spyOn(window, 'prompt').mockImplementation(() => null);

  render(<UpdateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  userEvent.click(screen.getByRole('button', { name: /delete product/i }));

  // delete should not be called and navigation should not happen
  await waitFor(() => expect(axios.delete).not.toHaveBeenCalled());
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('handleDelete shows toast when axios.delete throws (catch branch)', async () => {
  const toast = require('react-hot-toast').default;
  // product GET and categories GET
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: 'Prod' } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
    return Promise.resolve({ data: {} });
  });

  // simulate user confirming prompt
  jest.spyOn(window, 'prompt').mockImplementation(() => 'yes');

  // make delete throw
  axios.delete.mockRejectedValueOnce(new Error('delete-failed'));

  render(<UpdateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  userEvent.click(screen.getByRole('button', { name: /delete product/i }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('fills inputs, includes photo, and sends FormData via axios.put', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/get-product/')) return Promise.resolve({ data: { product: { _id: 'p1', name: '', description: '', price: '', quantity: '', shipping: 0, category: { _id: '' } } } });
    if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] } });
    return Promise.resolve({ data: {} });
  });

  // capture the FormData passed to axios.put
  const putMock = jest.fn(() => ({ data: { success: false } }));
  axios.put.mockImplementationOnce((url, formData) => {
    // expose the formData to the test via mock
    putMock(url, formData);
    return { data: { success: false } };
  });

  render(<UpdateProduct />);

  // wait for category to load
  await waitFor(() => expect(screen.getByText('Category 1')).toBeInTheDocument());

  // fill inputs
  await userEvent.type(screen.getByPlaceholderText(/write a name/i), 'New Name');
  await userEvent.type(screen.getByPlaceholderText(/write a description/i), 'New Desc');
  await userEvent.type(screen.getByPlaceholderText(/write a Price/i), '123');
  await userEvent.type(screen.getByPlaceholderText(/write a quantity/i), '7');

  // select category (first select)
  const selects = screen.getAllByTestId('select');
  userEvent.selectOptions(selects[0], 'cat1');

  // set shipping to Yes (second select)
  userEvent.selectOptions(selects[1], '1');

  // upload a photo
  const fileInput = document.querySelector('input[type=file]');
  const file = new File(['abc'], 'photo.png', { type: 'image/png' });
  await userEvent.upload(fileInput, file);

  // click update
  userEvent.click(screen.getByRole('button', { name: /update product/i }));

  await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));

  const [calledUrl, fd] = putMock.mock.calls[0];
  expect(calledUrl).toContain('/api/v1/product/update-product/');
  // FormData inspection: use get() to read values
  expect(fd.get('name')).toBe('New Name');
  expect(fd.get('description')).toBe('New Desc');
  expect(fd.get('price')).toBe('123');
  expect(fd.get('quantity')).toBe('7');
  expect(fd.get('category')).toBe('cat1');
  // photo should be appended
  const photoVal = fd.get('photo');
  expect(photoVal).toBeInstanceOf(File);
  expect(photoVal.name).toBe('photo.png');
});
