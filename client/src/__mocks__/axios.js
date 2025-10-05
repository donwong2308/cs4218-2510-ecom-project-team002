const mock = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// axios.create should return an instance with the same methods
const create = jest.fn(() => mock);

module.exports = Object.assign(mock, { create });
