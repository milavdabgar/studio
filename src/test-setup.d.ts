/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | string[] | number): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeRequired(): R;
      toBePartiallyChecked(): R;
      toBeChecked(): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}