import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'invitation', 'system', 'update'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Task', 'Course', 'Resource', 'Mindmap', 'User'],
      required: false
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  deliveryMethod: {
    type: String,
    enum: ['app', 'email', 'push', 'sms'],
    default: 'app'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  scheduledFor: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ scheduledFor: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
