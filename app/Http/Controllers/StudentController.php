<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\Session;

class StudentController extends Controller
{




        public function index()
    {
        $students = Student::orderBy("created_at","desc")->paginate(4);
        $loginName = Session::get('login_name');
        return view('students.index', compact('students', 'loginName'));
    }


    public function store(Request $request)
{
   
    // Validate inputs
     $validated = $request->validate([
        'username' => 'required|string|max:255|unique:students,login',
        'password' => 'required|string|min:8',
        'group' => 'required|string',
        'first-name' => 'required|string|max:255',
        'last-name' => 'required|string|max:255',
        'gender' => 'required|in:M,F',
        'birthday' => 'required|date',
    ]);

    // Map group string to integer (e.g., "PZ-21" → 1)
    $groupMap = [
        'PZ-21' => 1,
        'PZ-22' => 2,
        'PZ-23' => 3,
        'PZ-24' => 4,
        'PZ-25' => 5,
        'PZ-26' => 6,
        'PZ-27' => 7,
    ];

    // Map gender to integer
    $genderMap = [
        'M' => 0,
        'F' => 1,
    ];

     try {
        $student = new Student();
        $student->login = strtolower($validated['username']);
        $student->password = bcrypt($validated['password']);
        $student->group = $groupMap[$validated['group']] ?? null;
        $student->name = $validated['first-name'];
        $student->lastname = $validated['last-name'];
        $student->gender = $genderMap[$validated['gender']] ?? null;
        $student->birthday = $validated['birthday'];
        $student->status = 0;
        $student->save();

    } catch (\Exception $e) {
        dd("Error saving student: " . $e->getMessage());
    }

    // Create and save student

     Session::put('login_name', $student->login);

    return redirect()->route('students.index')->with('success', 'Student added successfully!');
}



public function update(Request $request, $id)
{
    $validated = $request->validate([
        'group' => 'required|string',
        'first-name' => 'required|string|max:255',
        'last-name' => 'required|string|max:255',
        'gender' => 'required|in:M,F',
        'birthday' => 'required|date',
    ]);

    $groupMap = [
        'PZ-21' => 1,
        'PZ-22' => 2,
        'PZ-23' => 3,
        'PZ-24' => 4,
        'PZ-25' => 5,
        'PZ-26' => 6,
    ];
    $genderMap = ['M' => 0, 'F' => 1];

    $student = Student::findOrFail($id);
    $student->group = $groupMap[$validated['group']] ?? 1;
    $student->name = $validated['first-name'];
    $student->lastname = $validated['last-name'];
    $student->gender = $genderMap[$validated['gender']];
    $student->birthday = $validated['birthday'];
    $student->save();

    return redirect()->route('students.index')->with('success', 'Student updated successfully!');
}


public function destroy($id)
{
    $student = Student::findOrFail($id);
    $student->delete();

    return redirect()->back()->with('success', 'Student deleted successfully!');
}





}

