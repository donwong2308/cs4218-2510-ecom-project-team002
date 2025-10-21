// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Polyfill userEvent.setup for environments where it's not defined as a function
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const userEvent = require('@testing-library/user-event');
	const defaultExport = userEvent && userEvent.default ? userEvent.default : userEvent;
	if (defaultExport && typeof defaultExport.setup !== 'function') {
		defaultExport.setup = function () {
			return defaultExport;
		};
	}
} catch {}
