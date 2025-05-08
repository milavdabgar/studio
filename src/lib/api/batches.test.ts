import {
  createBatch,
  getBatch,
  getBatches,
  updateBatch,
  deleteBatch,
  importBatches,
} from './batches';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Batch API', () => {
  const mockBatch = {
    id: '1',
    name: 'Batch 1',
    description: 'Description for Batch 1',
    programId: "program1"
  };

  const mockBatches = [mockBatch];

  it('should create a batch', async () => {
    server.use(
      rest.post('/api/batches', (req, res, ctx) => {
        return res(ctx.json(mockBatch));
      })
    );

    const newBatch = await createBatch(mockBatch);
    expect(newBatch).toEqual(mockBatch);
  });

  it('should get a batch', async () => {
    server.use(
      rest.get('/api/batches/1', (req, res, ctx) => {
        return res(ctx.json(mockBatch));
      })
    );

    const batch = await getBatch('1');
    expect(batch).toEqual(mockBatch);
  });

  it('should get all batches', async () => {
    server.use(
      rest.get('/api/batches', (req, res, ctx) => {
        return res(ctx.json(mockBatches));
      })
    );

    const batches = await getBatches();
    expect(batches).toEqual(mockBatches);
  });

  it('should update a batch', async () => {
    server.use(
      rest.put('/api/batches/1', (req, res, ctx) => {
        return res(ctx.json({ ...mockBatch, name: 'Updated Batch' }));
      })
    );

    const updatedBatch = await updateBatch('1', { name: 'Updated Batch' });
    expect(updatedBatch).toEqual({ ...mockBatch, name: 'Updated Batch' });
  });

  it('should delete a batch', async () => {
    server.use(
      rest.delete('/api/batches/1', (req, res, ctx) => {
        return res(ctx.json(mockBatch));
      })
    );

    const deletedBatch = await deleteBatch('1');
    expect(deletedBatch).toEqual(mockBatch);
  });

  it('should import batches', async () => {
    server.use(
      rest.post('/api/batches/import', (req, res, ctx) => {
          return res(ctx.json({ message: 'Batches imported successfully' }));
      })
    );
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await importBatches(mockFile);
    expect(result).toEqual({ message: 'Batches imported successfully' });
  });
  
  it('should handle errors when creating a batch', async () => {
    server.use(
      rest.post('/api/batches', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(createBatch(mockBatch)).rejects.toThrow('Failed to create batch');
  });

  it('should handle errors when getting a batch', async () => {
    server.use(
      rest.get('/api/batches/1', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ error: 'Batch not found' }));
      })
    );

    await expect(getBatch('1')).rejects.toThrow('Failed to get batch');
  });

  it('should handle errors when getting all batches', async () => {
    server.use(
      rest.get('/api/batches', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(getBatches()).rejects.toThrow('Failed to get batches');
  });

  it('should handle errors when updating a batch', async () => {
    server.use(
      rest.put('/api/batches/1', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(updateBatch('1', { name: 'Updated Batch' })).rejects.toThrow('Failed to update batch');
  });

  it('should handle errors when deleting a batch', async () => {
    server.use(
      rest.delete('/api/batches/1', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(deleteBatch('1')).rejects.toThrow('Failed to delete batch');
  });

  it('should handle errors when importing batches', async () => {
    server.use(
      rest.post('/api/batches/import', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    await expect(importBatches(mockFile)).rejects.toThrow('Failed to import batches');
  });
});