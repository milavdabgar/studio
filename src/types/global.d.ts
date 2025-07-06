// Global type declarations for test environments
import type { Student, User, Course, Department, Batch, Program } from './entities';

declare global {
  // Jest global mock stores for API testing
  // eslint-disable-next-line no-var
  var __API_STUDENTS_STORE__: Student[];
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: User[];
  // eslint-disable-next-line no-var
  var __API_COURSES_STORE__: Course[];
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[];
  // eslint-disable-next-line no-var
  var __API_BATCHES_STORE__: Batch[];
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[];
  
  // Extend NodeJS global to include test stores
  namespace NodeJS {
    interface Global {
      __API_STUDENTS_STORE__?: Student[];
      __API_USERS_STORE__?: User[];
      __API_COURSES_STORE__?: Course[];
      __API_DEPARTMENTS_STORE__?: Department[];
      __API_BATCHES_STORE__?: Batch[];
      __API_PROGRAMS_STORE__?: Program[];
    }
  }
}

export {};