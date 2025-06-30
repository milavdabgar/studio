import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
    }
  }
}