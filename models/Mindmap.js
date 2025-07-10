import mongoose from 'mongoose';

const MindmapSchema = new mongoose.Schema({
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nodes: [{
    id: String,
    type: {
      type: String,
      enum: ['course', 'task', 'resource', 'note', 'custom'],
      default: 'custom'
    },
    label: String,
    data: mongoose.Schema.Types.Mixed, // Can store reference IDs or custom data
    position: {
      x: Number,
      y: Number
    },
    style: mongoose.Schema.Types.Mixed
  }],
  edges: [{
    id: String,
    source: String, // Node ID
    target: String, // Node ID
    label: String,
    style: mongoose.Schema.Types.Mixed
  }],
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
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
MindmapSchema.index({ owner: 1 });

export default mongoose.models.Mindmap || mongoose.model('Mindmap', MindmapSchema);
