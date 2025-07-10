import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['document', 'video', 'link', 'book', 'article', 'other'],
    required: [true, 'Please specify the resource type']
  },
  url: {
    type: String,
    required: false
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number, // in bytes
    required: false
  },
  subject: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: false
  },
  tags: [{
    type: String
  }],
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
ResourceSchema.index({ owner: 1 });
ResourceSchema.index({ course: 1 });
ResourceSchema.index({ tags: 1 });

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
