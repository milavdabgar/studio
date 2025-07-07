import { NextResponse, type NextRequest } from 'next/server';
import { allPermissions } from '@/lib/api/roles';
import { connectMongoose } from '@/lib/mongodb';
import { RoleModel } from '@/lib/models';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { z } from 'zod';

const createRoleSchema = z.object({
    name: z.string().min(1, "Role Name cannot be empty.").trim(),
    code: z.string().min(1, "Role Code cannot be empty.").trim(),
    description: z.string().optional().nullable(),
    permissions: z.array(z.string()).optional(),
    isSystemRole: z.boolean().optional(),
    isCommitteeRole: z.boolean().optional(),
    committeeId: z.string().optional(),
    committeeCode: z.string().optional().nullable(),
});

const updateRoleSchema = z.object({
    name: z.string().min(1, "Role Name cannot be empty.").trim().optional(),
    description: z.string().optional().nullable(),
    permissions: z.array(z.string()).optional(),
});

const rateLimiter = new RateLimiterMemory({
    points: 10, 
    duration: 1, 
});

const rateLimiterMiddleware = async (req: NextRequest) => {
    try {
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
        await rateLimiter.consume(clientIP);
    } catch (_rejRes) {
        throw new Error('Too Many Requests');
    }
};

const _generateId = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(_request: NextRequest) {
  try {
    await connectMongoose();
    
    const roles = await RoleModel.find({}).lean();
    const rolesWithId = roles.map(role => ({
      ...role,
      id: (role as { _id: { toString(): string } })._id.toString()
    }));
    
    return NextResponse.json(rolesWithId);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ 
      message: 'Internal server error during role fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await rateLimiterMiddleware(request);
    await connectMongoose();
    
    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    // Check if role code already exists
    const existingRole = await RoleModel.findOne({ 
      code: { $regex: new RegExp(`^${validatedData.code}$`, 'i') } 
    });
    
    if (existingRole) {
      return NextResponse.json({ 
        message: `Role with code '${validatedData.code}' already exists.` 
      }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newRoleData = {
      name: validatedData.name,
      code: validatedData.code,
      description: validatedData.description || "",
      permissions: validatedData.permissions || [],
      isSystemRole: validatedData.isSystemRole || false,
      isCommitteeRole: validatedData.isCommitteeRole || false,
      committeeId: validatedData.committeeId,
      committeeCode: validatedData.committeeCode,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      scope: {
        level: validatedData.isSystemRole ? 'system' : 'institute'
      }
    };

    const newRole = new RoleModel(newRoleData);
    await newRole.save();

    const roleToReturn = newRole.toJSON();
    return NextResponse.json(roleToReturn, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message === 'Too Many Requests') {
      return NextResponse.json({ 
        message: 'Too many requests. Please try again later.' 
      }, { status: 429 });
    }

    console.error('Error creating role:', error);
    return NextResponse.json({ 
      message: 'Error creating role', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await rateLimiterMiddleware(request);
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');
    
    if (!roleId) {
      return NextResponse.json({ 
        message: 'Role ID is required for updating.' 
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    const existingRole = await RoleModel.findById(roleId);
    if (!existingRole) {
      return NextResponse.json({ 
        message: 'Role not found.' 
      }, { status: 404 });
    }

    // Update fields
    if (validatedData.name) existingRole.name = validatedData.name;
    if (validatedData.description !== undefined) existingRole.description = validatedData.description || "";
    if (validatedData.permissions) existingRole.permissions = validatedData.permissions;
    existingRole.updatedAt = new Date().toISOString();

    await existingRole.save();

    const roleToReturn = existingRole.toJSON();
    return NextResponse.json(roleToReturn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation error', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message === 'Too Many Requests') {
      return NextResponse.json({ 
        message: 'Too many requests. Please try again later.' 
      }, { status: 429 });
    }

    console.error('Error updating role:', error);
    return NextResponse.json({ 
      message: 'Error updating role', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await rateLimiterMiddleware(request);
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');
    
    if (!roleId) {
      return NextResponse.json({ 
        message: 'Role ID is required for deletion.' 
      }, { status: 400 });
    }

    const existingRole = await RoleModel.findById(roleId);
    if (!existingRole) {
      return NextResponse.json({ 
        message: 'Role not found.' 
      }, { status: 404 });
    }

    // Prevent deletion of system roles
    if (existingRole.isSystemRole) {
      return NextResponse.json({ 
        message: 'Cannot delete system roles.' 
      }, { status: 400 });
    }

    await RoleModel.findByIdAndDelete(roleId);

    return NextResponse.json({ 
      message: 'Role deleted successfully.' 
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Too Many Requests') {
      return NextResponse.json({ 
        message: 'Too many requests. Please try again later.' 
      }, { status: 429 });
    }

    console.error('Error deleting role:', error);
    return NextResponse.json({ 
      message: 'Error deleting role', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
