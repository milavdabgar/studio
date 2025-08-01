// Script to update faculty data with missing fields for better display
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://milavdabgar:mMy9M2rDZMHVTl7L@cluster0.ks5sj.mongodb.net/studio?retryWrites=true&w=majority&appName=Cluster0';

async function updateFacultyData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('studio');
    const facultyCollection = db.collection('faculties');
    
    // Update the Civil Engineering faculty member with rich data
    const updateResult = await facultyCollection.updateOne(
      { 
        "department": "Civil Engineering", 
        "gtuName": { $regex: "RAJGOR", $options: "i" }
      },
      {
        $set: {
          "subjects": [
            "Design of RCC Structures",
            "Structural Analysis", 
            "Building Materials & Construction",
            "Concrete Technology"
          ],
          "specializations": [
            "Structural Design",
            "Concrete Technology", 
            "Building Construction"
          ],
          "researchInterests": [
            "High Performance Concrete",
            "Structural Optimization",
            "Sustainable Construction"
          ],
          "achievements": [
            {
              "id": "ach_1",
              "title": "Industry consultant for construction projects",
              "description": "Provided technical consultancy for major construction projects",
              "category": "professional",
              "date": "2023-01-01"
            },
            {
              "id": "ach_2", 
              "title": "Published research papers on concrete technology",
              "description": "Published multiple papers in reputed journals",
              "category": "academic",
              "date": "2022-01-01"
            },
            {
              "id": "ach_3",
              "title": "Faculty development program coordinator",
              "description": "Organized and coordinated faculty development programs",
              "category": "professional", 
              "date": "2023-06-01"
            }
          ],
          "qualifications": [
            {
              "degree": "M.E.",
              "field": "Structural Engineering",
              "institution": "Gujarat Technological University",
              "year": 2018
            },
            {
              "degree": "B.E.",
              "field": "Civil Engineering", 
              "institution": "Gujarat Technological University",
              "year": 2015
            }
          ],
          "experienceYears": "8+ years",
          "designation": "Lecturer & Faculty Coordinator"
        }
      }
    );
    
    console.log('Update result:', updateResult);
    
    // Let's also check if we can find any other Civil Engineering faculty to update
    const civilFaculty = await facultyCollection.find({ 
      "department": "Civil Engineering" 
    }).toArray();
    
    console.log(`Found ${civilFaculty.length} Civil Engineering faculty members:`);
    civilFaculty.forEach((faculty, index) => {
      console.log(`${index + 1}. ${faculty.gtuName || faculty.fullName} - ${faculty.designation}`);
    });
    
  } catch (error) {
    console.error('Error updating faculty data:', error);
  } finally {
    await client.close();
  }
}

updateFacultyData();
