// Validate Request middleware
import { NextRequest, NextResponse } from 'next/server';

interface ValidationSchema {
  validate: (data: any) => Promise<any>;
}

export const validateRequest = (schema: ValidationSchema) => {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      await schema.validate(body);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
  };
};
