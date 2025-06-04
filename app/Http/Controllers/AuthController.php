<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('username', 'password');

        $student = Student::where('login', $credentials['username'])->first();

        if ($student && Hash::check($credentials['password'], $student->password)) {
            Session::put('student_id', $student->id);
            Session::put('login_name', $student->login);

            Session::put('student_name', $student->name);
            Session::put('student_lastname', $student->lastname);


            $student->status = 1;
            $student->save();
            return redirect('/students');
        }

        return back()->withErrors(['login' => 'Invalid username or password.'])->withInput();
    }



}