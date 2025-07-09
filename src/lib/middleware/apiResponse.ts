// API Response middleware
import { NextResponse } from 'next/server';

export class ApiResponse {
  static success(data: unknown, status: number = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(message: string, status: number = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
  }

  static notFound(message: string = 'Resource not found') {
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }

  static unauthorized(message: string = 'Unauthorized') {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  static forbidden(message: string = 'Forbidden') {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
