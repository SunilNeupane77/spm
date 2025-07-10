import dbConnect from '@/lib/mongoose';
import Student from '@/models/Student';

export const GET = async (req) => {
  try {
    await dbConnect();
    const students = await Student.find({});
    return Response.json({ success: true, data: students }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
