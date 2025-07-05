// Mock for @/lib/models
const createMockModel = () => {
  const mockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-id',
    save: jest.fn().mockResolvedValue({ ...data, _id: 'mock-id' })
  }));
  
  // Add static methods to the mock function
  mockModel.find = jest.fn().mockResolvedValue([]);
  
  mockModel.findOne = jest.fn().mockResolvedValue(null);
  
  mockModel.findById = jest.fn().mockResolvedValue(null);
  
  mockModel.create = jest.fn().mockResolvedValue({ _id: 'mock-id' });
  mockModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'mock-id' });
  mockModel.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'mock-id' });
  mockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.countDocuments = jest.fn().mockResolvedValue(0);
  
  return mockModel;
};

// Create individual model mocks
const CourseModel = createMockModel();
const StudentModel = createMockModel();
const InstituteModel = createMockModel();
const BuildingModel = createMockModel();
const RoomModel = createMockModel();
const CommitteeModel = createMockModel();
const DepartmentModel = createMockModel();
const ProgramModel = createMockModel();
const SessionModel = createMockModel();
const PermissionModel = createMockModel();
const UserModel = createMockModel();
const StaffModel = createMockModel();
const GroupModel = createMockModel();
const RoleModel = createMockModel();
const SubjectModel = createMockModel();
const AssignmentModel = createMockModel();
const TimeSlotModel = createMockModel();
const AttendanceModel = createMockModel();
const TimetableModel = createMockModel();
const ProjectModel = createMockModel();
const ProjectEventModel = createMockModel();
const ProjectTeamModel = createMockModel();
const TeamModel = createMockModel();
const FeedbackModel = createMockModel();
const FeedbackQuestionModel = createMockModel();
const FeedbackResponseModel = createMockModel();
const NotificationModel = createMockModel();
const NewsletterModel = createMockModel();
const EvaluationModel = createMockModel();
const EvaluationCriteriaModel = createMockModel();

module.exports = {
  CourseModel,
  StudentModel,
  InstituteModel,
  BuildingModel,
  RoomModel,
  CommitteeModel,
  DepartmentModel,
  ProgramModel,
  SessionModel,
  PermissionModel,
  UserModel,
  StaffModel,
  GroupModel,
  RoleModel,
  SubjectModel,
  AssignmentModel,
  TimeSlotModel,
  AttendanceModel,
  TimetableModel,
  ProjectModel,
  ProjectEventModel,
  ProjectTeamModel,
  TeamModel,
  FeedbackModel,
  FeedbackQuestionModel,
  FeedbackResponseModel,
  NotificationModel,
  NewsletterModel,
  EvaluationModel,
  EvaluationCriteriaModel
};
