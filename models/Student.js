import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the student'],
    maxlength: [60, 'Name cannot be more than 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email for the student'],
    unique: true
  },
  grade: {
    type: String,
    required: [true, 'Please provide a grade']
  },
  course: {
    type: String,
    required: [true, 'Please provide a course']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
