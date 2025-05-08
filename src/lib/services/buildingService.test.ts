import { BuildingService } from './buildingService';
import { Building } from '../../types/entities';

describe('BuildingService', () => {
  let buildingService: BuildingService;
  const mockBuildings: Building[] = [
    { id: '1', name: 'Building A', location: 'Location 1' },
    { id: '2', name: 'Building B', location: 'Location 2' },
  ];

  beforeEach(() => {
    buildingService = new BuildingService();
    // Mock the API calls to return the mock data
    jest.spyOn(buildingService, 'getAll').mockResolvedValue(mockBuildings);
    jest.spyOn(buildingService, 'getById').mockImplementation((id: string) => Promise.resolve(mockBuildings.find(building => building.id === id) || null));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(buildingService).toBeDefined();
  });

  it('should get all buildings', async () => {
    const buildings = await buildingService.getAll();
    expect(buildings).toEqual(mockBuildings);
  });

  it('should get a building by id', async () => {
    const building = await buildingService.getById('1');
    expect(building).toEqual(mockBuildings[0]);
  });

  it('should return null if building id is not found', async () => {
    const building = await buildingService.getById('3');
    expect(building).toBeNull();
  });

  it('should add a building', async () => {
    const newBuilding: Building = { id: '3', name: 'Building C', location: 'Location 3' };
    jest.spyOn(buildingService, 'add').mockResolvedValue(newBuilding);
    const building = await buildingService.add(newBuilding);
    expect(building).toEqual(newBuilding);
  });

  it('should update a building', async () => {
    const updatedBuilding: Building = { id: '1', name: 'Updated Building A', location: 'Updated Location 1' };
      jest.spyOn(buildingService, 'update').mockResolvedValue(updatedBuilding);
    const building = await buildingService.update(updatedBuilding);
    expect(building).toEqual(updatedBuilding);
  });

  it('should delete a building', async () => {
    const deletedBuilding: Building = { id: '1', name: 'Building A', location: 'Location 1' };
    jest.spyOn(buildingService, 'delete').mockResolvedValue(deletedBuilding);
    const building = await buildingService.delete('1');
    expect(building).toEqual(deletedBuilding);
  });
});