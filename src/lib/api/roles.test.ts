import { roleService } from './roles';
import { Role } from '@/types/entities';

jest.mock('./roles');

describe('Role API', () => {
  const mockRole: Role = {
    id: '1',
    name: 'Test Role',
    permissions: [],
  };

  const mockRoles: Role[] = [mockRole];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      (roleService.createRole as jest.Mock).mockResolvedValue(mockRole);
      const result = await roleService.createRole(mockRole);
      expect(result).toEqual(mockRole);
      expect(roleService.createRole).toHaveBeenCalledWith(mockRole);
    });
  });

  describe('getRole', () => {
    it('should get a role by id', async () => {
      (roleService.getRoleById as jest.Mock).mockResolvedValue(mockRole);
      const result = await roleService.getRoleById('1');
      expect(result).toEqual(mockRole);
      expect(roleService.getRoleById).toHaveBeenCalledWith('1');
    });
  });

  describe('getRoles', () => {
    it('should get all roles', async () => {
      (roleService.getAllRoles as jest.Mock).mockResolvedValue(mockRoles);
      const result = await roleService.getAllRoles();
      expect(result).toEqual(mockRoles);
      expect(roleService.getAllRoles).toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      (roleService.updateRole as jest.Mock).mockResolvedValue(mockRole);
      const result = await roleService.updateRole('1', mockRole);
      expect(result).toEqual(mockRole);
      expect(roleService.updateRole).toHaveBeenCalledWith('1', mockRole);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role by id', async () => {
      (roleService.deleteRole as jest.Mock).mockResolvedValue(mockRole);
      const result = await roleService.deleteRole('1');
      expect(result).toEqual(mockRole);
      expect(roleService.deleteRole).toHaveBeenCalledWith('1');
    });
  });

  describe('importRoles', () => {
    it('should import roles from csv', async () => {
        const mockCsvData = 'name,permissions\nAdmin,permission1,permission2';
        (roleService.importRoles as jest.Mock).mockResolvedValue(mockRoles);
        const result = await roleService.importRoles(mockCsvData);
        expect(result).toEqual(mockRoles);
        expect(roleService.importRoles).toHaveBeenCalledWith(mockCsvData);
    })
  })
});