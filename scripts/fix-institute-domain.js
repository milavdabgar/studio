const mongoose = require('mongoose');

// Define the Institute schema directly
const InstituteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  domain: { type: String },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  establishmentYear: { type: Number },
  administrators: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const InstituteModel = mongoose.model('Institute', InstituteSchema);

async function fixInstituteDomain() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
    
    console.log('Connected to MongoDB');
    
    // First, let's see what institutes exist
    const allInstitutes = await InstituteModel.find({});
    console.log('All institutes in database:');
    allInstitutes.forEach(inst => {
      console.log(`   ID: ${inst.id}, Code: ${inst.code}, Domain: ${inst.domain}, Name: ${inst.name}`);
    });
    
    // Find and update the institute with the correct domain
    const result = await InstituteModel.findOneAndUpdate(
      { 
        $or: [
          { id: "inst1" },
          { code: "GPP" },
          { code: "626" },
          { name: { $regex: /government polytechnic palanpur/i } }
        ]
      },
      { 
        domain: "gppalanpur.ac.in",
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Successfully updated institute domain:');
      console.log(`   ID: ${result.id}`);
      console.log(`   Name: ${result.name}`);
      console.log(`   Code: ${result.code}`);
      console.log(`   Domain: ${result.domain}`);
    } else {
      console.log('❌ Institute not found with the expected criteria');
    }
    
  } catch (error) {
    console.error('Error fixing institute domain:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixInstituteDomain();