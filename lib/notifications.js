import Notification from '@/models/Notification';
import Task from '@/models/Task';
import nodemailer from 'nodemailer';
import dbConnect from './mongoose';

// Check for tasks that are due soon and create notifications
export async function checkAndCreateReminders() {
  await dbConnect();
  
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(now.getDate() + 1);
  
  // Find tasks due in the next 3 days that don't already have reminders
  const upcomingTasks = await Task.find({
    dueDate: { 
      $gte: now,
      $lte: threeDaysFromNow
    },
    status: { $ne: 'completed' }
  }).populate('owner', 'email name');
  
  for (const task of upcomingTasks) {
    // Check if notification already exists for this task
    const existingNotification = await Notification.findOne({
      'relatedTo.model': 'Task',
      'relatedTo.id': task._id,
      type: 'reminder',
      scheduledFor: { $gte: now }
    });
    
    if (!existingNotification) {
      // Create notification based on due date proximity
      const isDueSoon = task.dueDate <= oneDayFromNow;
      
      await Notification.create({
        user: task.owner._id,
        type: 'reminder',
        title: isDueSoon ? 'Urgent: Task Due Soon' : 'Upcoming Task Reminder',
        message: isDueSoon 
          ? `Your task "${task.title}" is due in less than 24 hours.`
          : `Your task "${task.title}" is due in ${Math.ceil((task.dueDate - now) / (1000 * 60 * 60 * 24))} days.`,
        relatedTo: {
          model: 'Task',
          id: task._id
        },
        isRead: false,
        deliveryMethod: ['app', 'email'],
        deliveryStatus: 'pending',
        scheduledFor: now
      });
    }
  }
  
  return upcomingTasks.length;
}

// Send email notifications
export async function sendEmailNotifications() {
  await dbConnect();
  
  // Find pending email notifications
  const pendingNotifications = await Notification.find({
    deliveryMethod: 'email',
    deliveryStatus: 'pending',
    scheduledFor: { $lte: new Date() }
  }).populate('user', 'email name');
  
  if (pendingNotifications.length === 0) {
    return 0;
  }
  
  // Configure email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });
  
  let sentCount = 0;
  
  for (const notification of pendingNotifications) {
    try {
      // Send email
      await transporter.sendMail({
        from: `"Academic Organizer" <${process.env.EMAIL_FROM}>`,
        to: notification.user.email,
        subject: notification.title,
        text: notification.message,
        html: `<div>
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p>Log in to your account to view more details.</p>
        </div>`
      });
      
      // Update notification status
      notification.deliveryStatus = 'sent';
      await notification.save();
      
      sentCount++;
    } catch (error) {
      console.error(`Failed to send email notification: ${error.message}`);
      notification.deliveryStatus = 'failed';
      await notification.save();
    }
  }
  
  return sentCount;
}

// Mark tasks as overdue
export async function updateTaskStatuses() {
  await dbConnect();
  
  const now = new Date();
  
  // Find tasks that are overdue but not marked as overdue
  const result = await Task.updateMany(
    { 
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'overdue'] }
    },
    { 
      $set: { status: 'overdue' }
    }
  );
  
  return result.modifiedCount;
}
