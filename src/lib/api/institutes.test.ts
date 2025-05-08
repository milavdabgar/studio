import { getInstitutes, getInstitute, createInstitute, updateInstitute, deleteInstitute } from './institutes';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const mockInstitutes = [
  { id: '1', name: 'Institute 1', code: 'INS1' },
  { id: '2', name: 'Institute 2', code: 'INS2' },
];

const server = setupServer(
  rest.get('/api/institutes', (req, res, ctx) => {
    return res(ctx.json(mockInstitutes));
  }),
  rest.get('/api/institutes/1', (req, res, ctx) => {
    return res(ctx.json(mockInstitutes[0]));
  }),
  rest.get('/api/institutes/3', (req, res, ctx) => {
    return res(ctx.status(404));
  }),
  rest.post('/api/institutes', async (req, res, ctx) => {
    const newInstitute = await req.json();
    return res(ctx.status(201), ctx.json({ ...newInstitute, id: '3' }));
  }),
  rest.put('/api/institutes/1', async (req, res, ctx) => {
    const updatedInstitute = await req.json();
    return res(ctx.json({ ...updatedInstitute, id: '1' }));
  }),
  rest.put('/api/institutes/3', async (req, res, ctx) => {
    return res(ctx.status(404));
  }),
  rest.delete('/api/institutes/1', (req, res, ctx) => {
    return res(ctx.status(204));
  }),
  rest.delete('/api/institutes/3', (req, res, ctx) => {
    return res(ctx.status(404));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Institutes API', () => {
  it('should fetch all institutes', async () => {
    const institutes = await getInstitutes();
    expect(institutes).toEqual(mockInstitutes);
  });

  it('should fetch a single institute by id', async () => {
    const institute = await getInstitute('1');
    expect(institute).toEqual(mockInstitutes[0]);
  });

  it('should return an error if institute not found', async () => {
      await expect(getInstitute('3')).rejects.toThrow('Request failed with status code 404')
  });

  it('should create a new institute', async () => {
    const newInstituteData = { name: 'New Institute', code: 'NEW' };
    const institute = await createInstitute(newInstituteData);
    expect(institute).toEqual({ ...newInstituteData, id: '3' });
  });

  it('should update an existing institute', async () => {
    const updatedInstituteData = { name: 'Updated Institute', code: 'UPD' };
    const institute = await updateInstitute('1', updatedInstituteData);
    expect(institute).toEqual({ ...updatedInstituteData, id: '1' });
  });

  it('should return an error when updating not existing institute', async () => {
    const updatedInstituteData = { name: 'Updated Institute', code: 'UPD' };
    await expect(updateInstitute('3', updatedInstituteData)).rejects.toThrow('Request failed with status code 404')
  });

  it('should delete an institute', async () => {
    const result = await deleteInstitute('1');
    expect(result).toBeUndefined();
  });

  it('should return an error when deleting not existing institute', async () => {
      await expect(deleteInstitute('3')).rejects.toThrow('Request failed with status code 404')
  });
});