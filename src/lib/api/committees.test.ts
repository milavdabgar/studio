import {
  createCommittee,
  deleteCommittee,
  getCommitteeById,
  getCommittees,
  updateCommittee,
  importCommittees,
} from './committees';
import { server } from '../../mocks/server';
import { rest } from 'msw';

jest.mock('../utils', () => ({
  handleApiError: jest.fn((e) => e),
  handleApiResponse: jest.fn((e) => e),
}));

describe('Committee API', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should create a committee', async () => {
    const mockCommittee = {
      name: 'Test Committee',
      description: 'Test Description',
      instituteId: '123',
      status: 'active',
    };

    server.use(
      rest.post('/api/committees', (req, res, ctx) => {
        return res(ctx.json({ ...mockCommittee, id: 'new-committee-id' }));
      }),
    );

    const result = await createCommittee(mockCommittee);
    expect(result).toEqual({ ...mockCommittee, id: 'new-committee-id' });
  });

  it('should get a committee by ID', async () => {
    const mockCommittee = {
      id: 'committee-id',
      name: 'Test Committee',
      description: 'Test Description',
      instituteId: '123',
      status: 'active',
    };

    server.use(
      rest.get('/api/committees/committee-id', (req, res, ctx) => {
        return res(ctx.json(mockCommittee));
      }),
    );

    const result = await getCommitteeById('committee-id');
    expect(result).toEqual(mockCommittee);
  });

  it('should get all committees', async () => {
    const mockCommittees = [
      {
        id: 'committee-id-1',
        name: 'Test Committee 1',
        description: 'Test Description 1',
        instituteId: '123',
        status: 'active',
      },
      {
        id: 'committee-id-2',
        name: 'Test Committee 2',
        description: 'Test Description 2',
        instituteId: '456',
        status: 'inactive',
      },
    ];

    server.use(
      rest.get('/api/committees', (req, res, ctx) => {
        return res(ctx.json(mockCommittees));
      }),
    );

    const result = await getCommittees();
    expect(result).toEqual(mockCommittees);
  });

  it('should update a committee', async () => {
    const mockCommittee = {
      id: 'committee-id',
      name: 'Updated Committee',
      description: 'Updated Description',
      instituteId: '123',
      status: 'active',
    };

    server.use(
      rest.put('/api/committees/committee-id', (req, res, ctx) => {
        return res(ctx.json(mockCommittee));
      }),
    );

    const result = await updateCommittee('committee-id', {
      name: 'Updated Committee',
      description: 'Updated Description',
      instituteId: '123',
      status: 'active',
    });
    expect(result).toEqual(mockCommittee);
  });

  it('should delete a committee', async () => {
    server.use(
      rest.delete('/api/committees/committee-id', (req, res, ctx) => {
        return res(ctx.json({ id: 'committee-id', message: 'Committee deleted successfully' }));
      }),
    );

    const result = await deleteCommittee('committee-id');
    expect(result).toEqual({ id: 'committee-id', message: 'Committee deleted successfully' });
  });

  it('should import committees', async () => {
    const mockCommittees = [
      {
        name: 'Test Committee 1',
        description: 'Test Description 1',
        instituteId: '123',
        status: 'active',
      },
      {
        name: 'Test Committee 2',
        description: 'Test Description 2',
        instituteId: '456',
        status: 'inactive',
      },
    ];

    server.use(
      rest.post('/api/committees/import', (req, res, ctx) => {
        return res(ctx.json({message:'success'}));
      }),
    );

    const result = await importCommittees(mockCommittees);
    expect(result).toEqual({message:'success'});
  });

  it('should handle api error', async () => {
     server.use(
      rest.post('/api/committees', (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );
    try {
      await createCommittee({ name: 'Test Committee', description: 'Test Description', instituteId: '123', status: 'active' });
    } catch (error) {
      expect(error.status).toEqual(500);
    }
  });
});