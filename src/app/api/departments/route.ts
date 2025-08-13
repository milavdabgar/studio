
import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { DepartmentModel, UserModel } from '@/lib/models';
import { withAPIRoleAccess, type APIAccessContext } from '@/lib/auth/api-middleware';


async function handleGetDepartments(request: NextRequest, context: APIAccessContext) {
  try {
    await connectMongoose();
    
    let query = {};
    
    // For non-admin users, filter to only their assigned department
    if (!context.canViewAllDepartments && context.departmentFilter) {
      query = { 
        $or: [
          { id: context.departmentFilter },
          { _id: context.departmentFilter }
        ]
      };
    }
    
    const departments = await DepartmentModel.find(query).lean();
    const departmentsWithId = departments.map(dept => ({
      ...dept,
      id: dept.id || (dept as { _id: unknown })._id?.toString()
    }));
    
    return NextResponse.json(departmentsWithId);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ 
      message: 'Error fetching departments',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 500 });
  }
}

async function handleCreateDepartment(request: NextRequest, context: APIAccessContext) {
  try {
    await connectMongoose();
    
    // Only admins can create departments - this is institute-level management
    if (!context.canEditAllDepartments) {
      return NextResponse.json({
        message: 'Access denied. Only system administrators can create departments.'
      }, { status: 403 });
    }
    
    const departmentData = await request.json() as Omit<Department, 'id' | 'createdAt' | 'updatedAt'>;

    if (!departmentData.name || !departmentData.name.trim()) {
      return NextResponse.json({ message: 'Department Name cannot be empty.' }, { status: 400 });
    }
    if (!departmentData.code || !departmentData.code.trim()) {
      return NextResponse.json({ message: 'Department Code cannot be empty.' }, { status: 400 });
    }
    if (!departmentData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    
    // Check for duplicate department code within the institute
    const existingDepartment = await DepartmentModel.findOne({ 
      code: { $regex: new RegExp(`^${departmentData.code.trim()}$`, 'i') },
      instituteId: departmentData.instituteId 
    });
    
    if (existingDepartment) {
      return NextResponse.json({ message: `Department with code '${departmentData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    
    if (departmentData.establishmentYear && (isNaN(departmentData.establishmentYear) || departmentData.establishmentYear < 1900 || departmentData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    
    const newDepartment = new DepartmentModel({
      name: departmentData.name.trim(),
      code: departmentData.code.trim().toUpperCase(),
      description: departmentData.description?.trim() || undefined,
      instituteId: departmentData.instituteId,
      hodId: departmentData.hodId || undefined,
      establishmentYear: departmentData.establishmentYear ? Number(departmentData.establishmentYear) : undefined,
      status: departmentData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const savedDepartment = await newDepartment.save();

    // Add 'hod' role to new HOD if specified
    if (departmentData.hodId) {
      try {
        const newHod = await UserModel.findById(departmentData.hodId);
        if (newHod && !newHod.roles.includes('hod')) {
          const updatedRoles = [...newHod.roles, 'hod'];
          await UserModel.findByIdAndUpdate(departmentData.hodId, { 
            roles: updatedRoles,
            updatedAt: new Date().toISOString()
          });
          console.log(`[POST Department] Added 'hod' role to user ${departmentData.hodId} for new department ${savedDepartment.name}`);
        }
      } catch (error) {
        console.error(`[POST Department] Error adding hod role to ${departmentData.hodId}:`, error);
        // Don't fail the department creation if this fails, just log it
      }
    }

    return NextResponse.json(savedDepartment, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ 
      message: 'Error creating department',
      error: error instanceof Error ? error.message : 'Database save failed'
    }, { status: 500 });
  }
}

// Export wrapped functions for API routes
// Departments are critical organizational data - restrict access appropriately
export const GET = withAPIRoleAccess(handleGetDepartments, ['admin', 'super_admin', 'hod', 'principal']);
export const POST = withAPIRoleAccess(handleCreateDepartment, ['admin', 'super_admin']);
