import dbConnect from '@/lib/mongoose';
import Student from '@/models/Student';

export const GET = async (req, { params }) => {
  try {
    await dbConnect();
    const student = await Student.findById(params.id);
    
    if (!student) {
      return Response.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return Response.json({ success: true, data: student }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
};

export const PUT = async (req, { params }) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    const student = await Student.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    
    if (!student) {
      return Response.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return Response.json({ success: true, data: student }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
};

export const DELETE = async (req, { params }) => {
  try {
    await dbConnect();
    const deletedStudent = await Student.findByIdAndDelete(params.id);
    
    if (!deletedStudent) {
      return Response.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return Response.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
};
