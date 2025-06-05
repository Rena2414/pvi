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
        $csrfToken = csrf_token();
        $studentId = session('student_id');
        $studentName = session('student_name');
        $studentLastname = session('student_lastname');
        return view('students.index', compact('students', 'loginName', 'csrfToken', 'studentId', 'studentName', 'studentLastname'));
    }


    public function store(Request $request)
{
   $mode = $request->input('mode', 'register');

     $validated = $request->validate([
    'username' => [
        'required',
        'string',
        'max:255',
        'unique:students,login',
        'regex:/^[a-zA-Z0-9_.]{4,}$/'
    ],
    'password' => [
        'required',
        'string',
        'min:8',
        'regex:/^.{8,}$/'
    ],
    'group' => 'required|string',
    'first-name' => [
        'required',
        'string',
        'max:255',
        'regex:/^[A-Z][a-zA-Z\'\-]*$/'
    ],
    'last-name' => [
        'required',
        'string',
        'max:255',
        'regex:/^[A-Z][a-zA-Z\'\-]*$/'
    ],
    'gender' => 'required|in:M,F',
    'birthday' => 'required|date',
    ], [
    'username.unique' => 'This username is already taken. Please choose another.',
    'username.regex' => 'Username must be at least 4 characters and contain only letters, numbers, underscores, or dots.',
    'password.regex' => 'Password must be at least 8 characters long.',
    'first-name.regex' => 'First name must start with a capital letter and contain only letters, apostrophes, or hyphens.',
    'last-name.regex' => 'Last name must start with a capital letter and contain only letters, apostrophes, or hyphens.',
    ]);

    $groupMap = [
        'PZ-21' => 1,
        'PZ-22' => 2,
        'PZ-23' => 3,
        'PZ-24' => 4,
        'PZ-25' => 5,
        'PZ-26' => 6,
        'PZ-27' => 7,
    ];

    $genderMap = [
        'M' => 0,
        'F' => 1,
    ];

     $existingStudent = Student::where('name', $validated['first-name'])
        ->where('lastname', $validated['last-name'])
        ->where('group', $groupMap[$validated['group']] ?? null)
        ->first();

    if ($existingStudent) {
        return redirect()->back()
            ->withErrors(['register' => 'A student with the same name, last name, and group already exists.'])
            ->withInput();
    }
     try {
        $student = new Student();
        $student->login = strtolower($validated['username']);
        $student->password = bcrypt($validated['password']);
        $student->group = $groupMap[$validated['group']] ?? null;
        $student->name = $validated['first-name'];
        $student->lastname = $validated['last-name'];
        $student->gender = $genderMap[$validated['gender']] ?? null;
        $student->birthday = $validated['birthday'];
        if ($mode === 'register') {
            $student->status = 1;
        }else{
            $student->status = 0;
        }
        $student->save();

    } catch (\Exception $e) {
        dd("Error saving student: " . $e->getMessage());
        return redirect()->back()
            ->withErrors(['register' => 'A student with the same name, last name, and group already exists.'])
            ->withInput();
    }
       if ($mode === 'register') {
        Session::put('login_name', $student->login);
        Session::put('student_id', $student->id);
        Session::put('student_name', $student->name);     // Use 'student_name'
        Session::put('student_lastname', $student->lastname);
    }


    return redirect()->route('students.index')->with('success', 'Student added successfully!');
}


public function update(Request $request, $id)
{
    $validated = $request->validate([
        'group' => 'required|string',
        'first-name' => [
            'required',
            'string',
            'max:255',
            'regex:/^[A-Z][a-zA-Z\'\-]*$/'
        ],
        'last-name' => [
            'required',
            'string',
            'max:255',
            'regex:/^[A-Z][a-zA-Z\'\-]*$/'
        ],
        'gender' => 'required|in:M,F',
        'birthday' => 'required|date',
    ], [
        'first-name.regex' => 'First name must start with a capital letter and contain only letters, apostrophes, or hyphens.',
        'last-name.regex' => 'Last name must start with a capital letter and contain only letters, apostrophes, or hyphens.',
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

    $existingStudent = Student::where('name', $validated['first-name'])
        ->where('lastname', $validated['last-name'])
        ->where('group', $groupMap[$validated['group']] ?? null)
        ->where('id', '!=', $id)
        ->first();

    if ($existingStudent) {
        return redirect()->back()
            ->withErrors(['register' => 'A student with the same name, last name, and group already exists.'])
            ->withInput([
                'mode' => 'edit',
                'id' => $id,
                'group_text' => $validated['group'],
                'name' => $validated['first-name'],
                'lastname' => $validated['last-name'],
                'gender_text' => $validated['gender'],
                'birthday' => $validated['birthday'],
            ]);
    }

    try {
        $student = Student::findOrFail($id);
        $student->group = $groupMap[$validated['group']] ?? 1;
        $student->name = $validated['first-name'];
        $student->lastname = $validated['last-name'];
        $student->gender = $genderMap[$validated['gender']];
        $student->birthday = $validated['birthday'];
        $student->save();
    } catch (\Exception $e) {
        return redirect()->back()
            ->withErrors(['register' => 'An unexpected error occurred while updating the student.'])
            ->withInput([
                'mode' => 'edit',
                'id' => $id,
                'group_text' => $validated['group'],
                'name' => $validated['first-name'],
                'lastname' => $validated['last-name'],
                'gender_text' => $validated['gender'],
                'birthday' => $validated['birthday'],
            ]);
    }

    return redirect()->route('students.index')->with('success', 'Student updated successfully!');
}



public function destroy($id)
{
    $student = Student::findOrFail($id);
    $student->delete();

    return redirect()->back()->with('success', 'Student deleted successfully!');
}





}

