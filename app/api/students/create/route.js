import dbConnect from '@/lib/mongoose';
import Student from '@/models/Student';

export const POST = async (req) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    const student = await Student.create(body);
    
    return Response.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
