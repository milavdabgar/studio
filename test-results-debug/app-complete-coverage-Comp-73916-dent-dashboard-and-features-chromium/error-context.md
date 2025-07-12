# Page snapshot

```yaml
- alert: GP Palanpur
- button "Open Next.js Dev Tools":
  - img
- img "GP Palanpur Logo"
- text: Welcome Back! Enter your credentials and select your role to access GP Palanpur.
- form:
  - text: Email
  - textbox "Email": admin@gppalanpur.in
  - text: Password
  - textbox "Password": Admin@123
  - text: Login as
  - combobox "Login as": Administrator
  - button "Login":
    - img
    - text: Login
- button "Clear API Stores (Dev)"
- link "Forgot password?":
  - /url: "#"
- paragraph:
  - text: Don't have an account?
  - link "Sign Up":
    - /url: /signup
- region "Notifications (F8)":
  - list
```