import { NextResponse, type NextRequest } from 'next/server';
import type { FacultyProfile } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';

type FacultyLean = Omit<FacultyProfile, 'id'> & { 
  _id: string; 
  id?: string; 
  __v?: number; 
};


const generateId = (): string => `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  try {
    await connectMongoose();
    
    const faculty = await FacultyModel.find({}).lean() as FacultyLean[];
    const facultyWithId = faculty.map(f => ({
      ...f,
      id: f.id || f._id?.toString(),
      fullName: `${f.firstName || ''} ${f.middleName || ''} ${f.lastName || ''}`.replace(/\s+/g, ' ').trim(),
      email: f.instituteEmail || f.personalEmail || ''
    } as FacultyProfile & { fullName: string; email: string }));
    
    return NextResponse.json(facultyWithId);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json({ 
      message: 'Internal server error during faculty fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const facultyData = await request.json() as Omit<FacultyProfile, 'id' | 'userId'> & { userId?: string, instituteId: string };

    if (!facultyData.staffCode || !facultyData.staffCode.trim()) {
      return NextResponse.json({ message: 'Staff Code is required.' }, { status: 400 });
    }
    if ((!facultyData.firstName || !facultyData.firstName.trim()) || (!facultyData.lastName || !facultyData.lastName.trim())) {
      return NextResponse.json({ message: 'First Name and Last Name are required.' }, { status: 400 });
    }
    if (!facultyData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required for creating staff.' }, { status: 400 });
    }
    
    const instituteDomain = 'gpp.ac.in'; // Default domain
    // Skip institute service call temporarily as it causes timeouts
    // TODO: Fix institute service timeout issue
    // try {
    //     const institute = await instituteService.getInstituteById(facultyData.instituteId);
    //     if (institute && institute.domain) {
    //         instituteDomain = institute.domain;
    //     }
    // } catch (error) {
    //     console.warn(`Error fetching institute ${facultyData.instituteId} for domain: ${(error as Error).message}. Using default domain '${instituteDomain}'.`);
    // }
        
    const instituteEmail = facultyData.instituteEmail?.trim() || generateInstituteEmailForFaculty(facultyData.firstName, facultyData.lastName, instituteDomain);

    // Check for existing faculty
    const existingStaffCodeFaculty = await FacultyModel.findOne({ 
      staffCode: facultyData.staffCode.trim() 
    });
    if (existingStaffCodeFaculty) {
      return NextResponse.json({ message: `Staff with staff code '${facultyData.staffCode.trim()}' already exists.` }, { status: 409 });
    }
    
    const existingEmailFaculty = await FacultyModel.findOne({ 
      instituteEmail: { $regex: new RegExp(`^${instituteEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingEmailFaculty) {
      return NextResponse.json({ message: `Staff with institute email '${instituteEmail}' already exists.` }, { status: 409 });
    }
    
    if (facultyData.personalEmail && !/\S+@\S+\.\S+/.test(facultyData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    
    // Ensure fullName is set if not provided
    const fullName = facultyData.fullName || `${facultyData.title || ''} ${facultyData.firstName || ''} ${facultyData.middleName || ''} ${facultyData.lastName || ''}`.replace(/\s+/g, ' ').trim();
    
    const newFacultyData = {
      id: generateId(),
      userId: facultyData.userId,
      staffCode: facultyData.staffCode,
      employeeId: facultyData.employeeId,
      title: facultyData.title,
      firstName: facultyData.firstName,
      middleName: facultyData.middleName,
      lastName: facultyData.lastName,
      fullName: fullName,
      gtuName: facultyData.gtuName,
      gtuFacultyId: facultyData.gtuFacultyId,
      personalEmail: facultyData.personalEmail,
      instituteEmail,
      contactNumber: facultyData.contactNumber,
      address: facultyData.address,
      department: facultyData.department,
      designation: facultyData.designation,
      jobType: facultyData.jobType,
      staffCategory: facultyData.staffCategory || facultyData.category || 'Teaching',
      category: facultyData.category || facultyData.staffCategory || 'Teaching',
      instType: facultyData.instType,
      specializations: facultyData.specializations,
      specialization: facultyData.specialization,
      qualifications: facultyData.qualifications,
      qualification: facultyData.qualification,
      experience: facultyData.experience,
      dateOfBirth: facultyData.dateOfBirth,
      joiningDate: facultyData.joiningDate,
      gender: facultyData.gender,
      maritalStatus: facultyData.maritalStatus,
      aadharNumber: facultyData.aadharNumber,
      panCardNumber: facultyData.panCardNumber,
      gpfNpsNumber: facultyData.gpfNpsNumber,
      placeOfBirth: facultyData.placeOfBirth,
      nationality: facultyData.nationality,
      knownAs: facultyData.knownAs,
      isHOD: facultyData.isHOD || false,
      isPrincipal: facultyData.isPrincipal || false,
      researchInterests: facultyData.researchInterests,
      status: facultyData.status || 'active',
      instituteId: facultyData.instituteId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    // TODO: Restore user service integration once institute service timeout is fixed
    // For now, create faculty without linked user to avoid timeouts
    
    const newFaculty = new FacultyModel(newFacultyData);
    await newFaculty.save();
    
    // Return faculty with properly formatted id
    const facultyToReturn = newFaculty.toJSON();

    return NextResponse.json(facultyToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json({ message: 'Error creating faculty', error: (error as Error).message }, { status: 500 });
  }
}

const generateInstituteEmailForFaculty = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) return `${fn}.${ln}@${instituteDomain}`;
  return `staff_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
};

