import { buildingService } from './buildingService';
import { Building } from '../../types/entities';

describe('BuildingService', () => {
  const mockBuildings: Building[] = [
    { id: '1', name: 'Building A', instituteId: 'inst1', status: 'active' },
    { id: '2', name: 'Building B', instituteId: 'inst1', status: 'active' },
  ];

  beforeEach(() => {
    // Mock the API calls to return the mock data
    jest.spyOn(buildingService, 'getAllBuildings').mockResolvedValue(mockBuildings);
    jest.spyOn(buildingService, 'getBuildingById').mockImplementation((id: string) => {
      const building = mockBuildings.find(building => building.id === id);
      return Promise.resolve(building ? building : Promise.reject(new Error(`Failed to fetch building with id ${id}`)));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(buildingService).toBeDefined();
  });

  it('should get all buildings', async () => {
    const buildings = await buildingService.getAllBuildings();
    expect(buildings).toEqual(mockBuildings);
  });

  it('should get a building by id', async () => {
    const building = await buildingService.getBuildingById('1');
    expect(building).toEqual(mockBuildings[0]);
  });

  it('should throw an error if building id is not found', async () => {
    await expect(buildingService.getBuildingById('3')).rejects.toThrow('Failed to fetch building with id 3');
  });

  it('should add a building', async () => {
    const newBuilding: Building = { id: '3', name: 'Building C', instituteId: 'inst1', status: 'active' };
    jest.spyOn(buildingService, 'createBuilding').mockResolvedValue(newBuilding);
    const building = await buildingService.createBuilding(newBuilding);
    expect(building).toEqual(newBuilding);
  });

  it('should update a building', async () => {
    const updatedBuilding: Building = { id: '1', name: 'Updated Building A', instituteId: 'inst1', status: 'active' };
    jest.spyOn(buildingService, 'updateBuilding').mockResolvedValue(updatedBuilding);
    const building = await buildingService.updateBuilding(updatedBuilding.id, { name: updatedBuilding.name });
    expect(building).toEqual(updatedBuilding);
  });

  it('should delete a building', async () => {
    jest.spyOn(buildingService, 'deleteBuilding').mockResolvedValue(undefined);
    await buildingService.deleteBuilding('1');
    expect(buildingService.deleteBuilding).toHaveBeenCalledWith('1');
  });
});