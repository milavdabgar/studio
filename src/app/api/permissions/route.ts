import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { z } from 'zod';
import type { Permission } from '@/types/entities';

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
  conditions: z.any().optional(),
});

async function applyRateLimiting(request: NextRequest): Promise<RateLimiterRes | null> {
  const ipAddress = request.ip || 'unknown';
  try {
    return await rateLimiter.consume(ipAddress);
  } catch (error) {
    return null;
  }
}

// In-memory storage for demonstration purposes
// In a real application, this would be a database interaction
const permissions: Permission[] = [
  {
    id: 'perm_1',
    name: 'View Student Profile',
    code: 'view_student_profile',
    description: 'Allows viewing student profiles.',
    resource: 'student_profile',
    action: 'read',
  },
  {
    id: 'perm_2',
    name: 'Create Course',
    code: 'create_course',
    description: 'Allows creating new courses.',
    resource: 'course',
    action: 'create',
  },
];

export async function GET(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
 return getPermission(id);
  } else {
    return NextResponse.json(permissions);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }
  const body = await request.json();

  const validationResult = permissionSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.errors }, { status: 400 });
  }

  return createPermission(validationResult.data);
}

export async function PUT(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

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
}

export async function DELETE(request: NextRequest) {
  const rateLimitResult = await applyRateLimiting(request);
  if (!rateLimitResult) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'Permission ID is required' }, { status: 400 });
  }
  return deletePermission(id);
}

async function createPermission(data: z.infer<typeof permissionSchema>) {
  const newPermission: Permission = { id: `permission_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, ...data };
  permissions.push(newPermission);
  return NextResponse.json(newPermission, { status: 201 });
}

async function getPermission(id: string) {
  const permission = permissions.find((permission) => permission.id === id);
  if (!permission) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }
  return NextResponse.json(permission);
}

async function getAllPermissions() {
  return NextResponse.json(permissions);
}

async function updatePermission(id: string, data: z.infer<typeof permissionSchema>) {
  const permissionIndex = permissions.findIndex((permission) => permission.id === id);
  if (permissionIndex === -1) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }
  permissions[permissionIndex] = { ...permissions[permissionIndex], ...data };
  return NextResponse.json(permissions[permissionIndex]);
}

async function deletePermission(id: string) {
  const permissionIndex = permissions.findIndex((permission) => permission.id === id);
  if (permissionIndex === -1) {
    return NextResponse.json({ message: 'Permission not found' }, { status: 404 });
  }
  const deletedPermission = permissions.splice(permissionIndex, 1);
  return NextResponse.json(deletedPermission[0]);
}