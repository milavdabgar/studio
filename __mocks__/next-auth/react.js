// NextAuth React mock
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
  },
  expires: '2025-12-31T23:59:59.999Z',
};

const mockSessionProvider = ({ children }) => children;

module.exports = {
  signIn: jest.fn().mockResolvedValue({ ok: true, url: '/', error: null }),
  signOut: jest.fn().mockResolvedValue({ ok: true, url: '/' }),
  useSession: jest.fn().mockReturnValue({
    data: mockSession,
    status: 'authenticated',
    update: jest.fn(),
  }),
  getSession: jest.fn().mockResolvedValue(mockSession),
  SessionProvider: mockSessionProvider,
};
