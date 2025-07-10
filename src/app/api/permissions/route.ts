import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongodb';
import { PermissionModel } from '@/lib/models';

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const permissionSchema = z.object({
  name: z.string().min(3).max(255),
  code: z.string().min(3).max(255),
  description: z.string().min(3).max(1000),
  resource: z.string().min(3).max(255),
  action: z.string().min(3).max(255),
  conditions: z.unknown().optional(),
});

async function applyRateLimiting(request: NextRequest): Promise<RateLimiterRes | null> {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  try {
    return await rateLimiter.consume(ipAddress);
  } catch {
    return null;
  }
}

const generatePermissionId = (): string => `perm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      return getPermission(id);
    } else {
      const permissions = await PermissionModel.find({}).lean();
      
      // Format permissions to ensure proper id field
      const permissionsWithId = permissions.map(permission => ({
        ...permission,
        id: permission.id || (permission as { _id: { toString(): string } })._id.toString()
      }));
      
      return NextResponse.json(permissionsWithId);
    }
  } catch (error) {
    console.error("Error in GET /api/permissions:", error);
    return NextResponse.json({ message: 'Internal server error processing permissions request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectMongoose();
    
    const body = await request.json();

    const validationResult = permissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.errors }, { status: 400 });
    }

    return createPermission(validationResult.data);
  } catch (error) {
    console.error("Error in POST /api/permissions:", error);
    return NextResponse.json({ message: 'Internal server error creating permission.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Permission ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = permissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.errors }, { status: 400 });
    }

    return updatePermission(id, validationResult.data);
  } catch (error) {
    console.error("Error in PUT /api/permissions:", error);
    return NextResponse.json({ message: 'Internal server error updating permission.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Permission ID is required' }, { status: 400 });
    }
    
    return deletePermission(id);
  } catch (error) {
    console.error("Error in DELETE /api/permissions:", error);
    return NextResponse.json({ message: 'Internal server error deleting permission.' }, { status: 500 });
  }
}

async function createPermission(data: z.infer<typeof permissionSchema>) {
  // Check for existing permission with same code
  const existingPermission = await PermissionModel.findOne({ code: data.code });
  
  if (existingPermission) {
    return NextResponse.json({ message: `Permission with code '${data.code}' already exists.` }, { status: 409 });
  }
  
  const newPermissionData = {
    id: generatePermissionId(),
    ...data
  };
  
  const newPermission = new PermissionModel(newPermissionData);
  await newPermission.save();
  
  return NextResponse.json(newPermission.toJSON(), { status: 201 });
}

async function getPermission(id: string) {
  // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
  let permission;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    permission = await PermissionModel.findById(id);
  } else {
    permission = await PermissionModel.findOne({ id });
  }
  
  if (!permission) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }
  
  return NextResponse.json(permission.toJSON());
}


async function updatePermission(id: string, data: z.infer<typeof permissionSchema>) {
  // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
  let permission;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    permission = await PermissionModel.findById(id);
  } else {
    permission = await PermissionModel.findOne({ id });
  }
  
  if (!permission) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }

  // Check for duplicate code if code is being updated
  if (data.code && data.code !== permission.code) {
    const existingPermission = await PermissionModel.findOne({ 
      code: data.code,
      _id: { $ne: permission._id }
    });
    if (existingPermission) {
      return NextResponse.json({ message: `Permission with code '${data.code}' already exists.` }, { status: 409 });
    }
  }

  const updatedPermission = await PermissionModel.findByIdAndUpdate(
    permission._id,
    data,
    { new: true }
  );

  return NextResponse.json(updatedPermission.toJSON());
}

async function deletePermission(id: string) {
  // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
  let permission;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    permission = await PermissionModel.findById(id);
  } else {
    permission = await PermissionModel.findOne({ id });
  }
  
  if (!permission) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }

  const deletedPermission = permission.toJSON();
  await PermissionModel.findByIdAndDelete(permission._id);
  
  return NextResponse.json(deletedPermission);
}